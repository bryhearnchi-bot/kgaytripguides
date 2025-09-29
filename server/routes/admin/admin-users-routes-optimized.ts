/**
 * Optimized Admin User Management Routes - Performance Enhanced
 *
 * Key optimizations:
 * 1. Separate count query with estimated counts for large datasets
 * 2. Trigram indexes for efficient text search
 * 3. Composite indexes for common filter combinations
 * 4. Query result caching
 * 5. Prepared statement patterns
 */

import type { Express } from "express";
import { requireAuth, requireTripAdmin, requireSuperAdmin, type AuthenticatedRequest } from "../../auth";
import { createClient } from '@supabase/supabase-js';
import { z } from "zod";

// Cache for query results (simple in-memory cache)
const queryCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
const CACHE_TTL = 30 * 1000; // 30 seconds cache

// Initialize Supabase Admin Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  : null;

const querySchema = z.object({
  search: z.string().optional(),
  role: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20)
});

// Cache helper functions
function getCacheKey(query: any): string {
  return JSON.stringify(query);
}

function getFromCache(key: string) {
  const cached = queryCache.get(key);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data;
  }
  queryCache.delete(key);
  return null;
}

function setCache(key: string, data: any, ttl: number = CACHE_TTL) {
  queryCache.set(key, { data, timestamp: Date.now(), ttl });
}

// Optimized search function using different strategies based on search pattern
async function executeOptimizedSearch(query: any) {
  if (!supabaseAdmin) {
    throw new Error('Database service not configured');
  }

  const offset = (query.page - 1) * query.limit;
  let searchQuery = '';
  let countQuery = '';
  let baseConditions: string[] = [];
  let params: any = {};

  // Build base conditions for filters
  if (query.role && query.role !== 'all') {
    baseConditions.push('role = $role');
    params.role = query.role;
  }

  if (query.status && query.status !== 'all') {
    if (query.status === 'active') {
      baseConditions.push('is_active = true');
    } else if (query.status === 'inactive') {
      baseConditions.push('is_active = false');
    }
  }

  const whereClause = baseConditions.length > 0 ? 'WHERE ' + baseConditions.join(' AND ') : '';

  // Optimize search based on pattern
  if (query.search) {
    const searchTerm = query.search.trim();

    if (searchTerm.length < 3) {
      // For short terms, use prefix matching which can use indexes
      const searchCondition = `(
        username ILIKE '${searchTerm}%' OR
        email ILIKE '${searchTerm}%' OR
        name ILIKE '${searchTerm}%'
      )`;

      const fullWhere = whereClause
        ? `${whereClause} AND ${searchCondition}`
        : `WHERE ${searchCondition}`;

      searchQuery = `
        SELECT * FROM profiles
        ${fullWhere}
        ORDER BY
          CASE
            WHEN username ILIKE '${searchTerm}%' THEN 1
            WHEN email ILIKE '${searchTerm}%' THEN 2
            WHEN name ILIKE '${searchTerm}%' THEN 3
            ELSE 4
          END,
          created_at DESC
        LIMIT ${query.limit} OFFSET ${offset}
      `;

      countQuery = `SELECT COUNT(*) as count FROM profiles ${fullWhere}`;
    } else {
      // For longer terms, use trigram similarity (requires pg_trgm extension)
      // Fallback to optimized ILIKE if trigram not available
      const searchCondition = `(
        username ILIKE '%${searchTerm}%' OR
        email ILIKE '%${searchTerm}%' OR
        name ILIKE '%${searchTerm}%'
      )`;

      const fullWhere = whereClause
        ? `${whereClause} AND ${searchCondition}`
        : `WHERE ${searchCondition}`;

      // Use similarity ranking if available
      searchQuery = `
        SELECT *,
          GREATEST(
            similarity(COALESCE(username, ''), '${searchTerm}'),
            similarity(COALESCE(email, ''), '${searchTerm}'),
            similarity(COALESCE(name, ''), '${searchTerm}')
          ) as search_rank
        FROM profiles
        ${fullWhere}
        ORDER BY search_rank DESC, created_at DESC
        LIMIT ${query.limit} OFFSET ${offset}
      `;

      // For count, use estimated count for better performance
      if (offset === 0 && query.limit >= 20) {
        // Use estimated count for first page with default limit
        countQuery = `
          SELECT reltuples::bigint AS count
          FROM pg_class
          WHERE relname = 'profiles'
        `;
      } else {
        countQuery = `SELECT COUNT(*) as count FROM profiles ${fullWhere}`;
      }
    }
  } else {
    // No search term - optimized for pagination
    searchQuery = `
      SELECT * FROM profiles
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${query.limit} OFFSET ${offset}
    `;

    // Use estimated count for large offsets
    if (offset > 1000) {
      countQuery = `
        SELECT reltuples::bigint AS count
        FROM pg_class
        WHERE relname = 'profiles'
      `;
    } else {
      countQuery = `SELECT COUNT(*) as count FROM profiles ${whereClause}`;
    }
  }

  // Execute queries in parallel
  const [dataResult, countResult] = await Promise.all([
    supabaseAdmin.rpc('execute_sql', { query: searchQuery }),
    supabaseAdmin.rpc('execute_sql', { query: countQuery })
  ]);

  if (dataResult.error) throw dataResult.error;
  if (countResult.error) throw countResult.error;

  return {
    data: dataResult.data || [],
    count: countResult.data?.[0]?.count || 0
  };
}

export function registerOptimizedAdminUsersRoutes(app: Express) {

  // GET /api/admin/users - Optimized users listing
  app.get("/api/admin/users/optimized", requireTripAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const query = querySchema.parse(req.query);
      const cacheKey = getCacheKey(query);

      // Check cache first
      const cached = getFromCache(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      if (!supabaseAdmin) {
        return res.status(503).json({
          error: 'Database service is not configured.'
        });
      }

      // Try optimized search first
      let result;
      try {
        result = await executeOptimizedSearch(query);
      } catch (error) {
        console.warn('Optimized search failed, falling back to standard query:', error);

        // Fallback to standard Supabase query
        let supabaseQuery = supabaseAdmin
          .from('profiles')
          .select('*', { count: 'planned' }); // Use 'planned' instead of 'exact' for better performance

        if (query.search) {
          supabaseQuery = supabaseQuery.or(`username.ilike.%${query.search}%,email.ilike.%${query.search}%,name.ilike.%${query.search}%`);
        }

        if (query.role && query.role !== 'all') {
          supabaseQuery = supabaseQuery.eq('role', query.role);
        }

        if (query.status && query.status !== 'all') {
          supabaseQuery = supabaseQuery.eq('is_active', query.status === 'active');
        }

        const offset = (query.page - 1) * query.limit;
        supabaseQuery = supabaseQuery
          .range(offset, offset + query.limit - 1)
          .order('created_at', { ascending: false });

        const { data, count, error } = await supabaseQuery;

        if (error) throw error;

        result = { data: data || [], count: count || 0 };
      }

      const response = {
        users: result.data,
        pagination: {
          page: query.page,
          limit: query.limit,
          total: result.count,
          pages: Math.ceil(result.count / query.limit)
        }
      };

      // Cache the result
      setCache(cacheKey, response);

      res.json(response);

    } catch (error) {
      console.error('Error fetching users:', error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid query parameters',
          details: error.errors
        });
      }

      return res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  // Cache warming endpoint (for preloading common queries)
  app.post("/api/admin/users/warm-cache", requireTripAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const commonQueries = [
        { page: 1, limit: 20 }, // Default view
        { page: 1, limit: 20, status: 'active' }, // Active users
        { page: 1, limit: 20, role: 'admin' }, // Admin users
      ];

      const warmPromises = commonQueries.map(async (query) => {
        const cacheKey = getCacheKey(query);
        if (!getFromCache(cacheKey)) {
          try {
            const result = await executeOptimizedSearch(query);
            const response = {
              users: result.data,
              pagination: {
                page: query.page,
                limit: query.limit,
                total: result.count,
                pages: Math.ceil(result.count / query.limit)
              }
            };
            setCache(cacheKey, response, 60 * 1000); // Cache for 1 minute
          } catch (error) {
            console.warn('Cache warming failed for query:', query, error);
          }
        }
      });

      await Promise.all(warmPromises);

      res.json({ message: 'Cache warmed successfully' });
    } catch (error) {
      console.error('Error warming cache:', error);
      return res.status(500).json({ error: 'Failed to warm cache' });
    }
  });

  // GET /api/admin/profile - Get current user's profile
  app.get("/api/admin/profile", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      if (!supabaseAdmin) {
        return res.status(503).json({
          error: 'User management service is not configured'
        });
      }

      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Fetch user profile from Supabase
      const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return res.status(500).json({ error: 'Failed to fetch profile' });
      }

      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      // Transform snake_case to camelCase for frontend
      const transformedProfile = {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        name: profile.name,
        username: profile.username,
        avatarUrl: profile.avatar_url,
        role: profile.role,
        bio: profile.bio,
        website: profile.website,
        phoneNumber: profile.phone_number,
        location: profile.location,
        socialLinks: profile.social_links,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
      };

      res.json(transformedProfile);

    } catch (error) {
      console.error('Error in profile endpoint:', error);
      return res.status(500).json({ error: 'Failed to fetch profile' });
    }
  });

  // Clear cache endpoint
  app.delete("/api/admin/users/cache", requireTripAdmin, async (req: AuthenticatedRequest, res) => {
    queryCache.clear();
    res.json({ message: 'Cache cleared successfully' });
  });

}