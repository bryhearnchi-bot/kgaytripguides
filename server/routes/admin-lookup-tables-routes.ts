/**
 * Admin Lookup Tables Management Routes
 *
 * Provides comprehensive management functionality for lookup tables used throughout the application.
 * Features:
 * - Manage venue types, trip types, trip status, talent categories, and location types
 * - List, create, and update operations (no delete for data integrity)
 * - Input validation and proper error handling
 * - Role-based access control
 */

import type { Express, Response } from 'express';
import {
  requireAuth,
  requireTripAdmin,
  requireSuperAdmin,
  type AuthenticatedRequest,
} from '../auth';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { auditLogger } from '../logging/middleware';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiError } from '../utils/ApiError';
import { logger } from '../logging/logger';

// Lazy-initialize Supabase Admin Client (to avoid loading before env vars are set)
let supabaseAdminInstance: ReturnType<typeof createClient> | null | undefined = undefined;

function getSupabaseAdmin() {
  if (supabaseAdminInstance === undefined) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      logger.error('Missing Supabase credentials for admin lookup tables', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseServiceKey,
      });
      supabaseAdminInstance = null;
    } else {
      supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    }
  }
  return supabaseAdminInstance;
}

// Validation schemas for each table type
const venueTypeSchema = z.object({
  name: z.string().min(1).max(100).trim(),
});

const tripTypeSchema = z.object({
  trip_type: z.string().min(1).max(100).trim(),
});

const tripStatusSchema = z.object({
  status: z.string().min(1).max(100).trim(),
});

const talentCategorySchema = z.object({
  category: z.string().min(1).max(100).trim(),
});

const locationTypeSchema = z.object({
  type: z.string().min(1).max(100).trim(),
});

const charterCompanySchema = z.object({
  name: z.string().min(1).max(100).trim(),
});

const cruiseLineSchema = z.object({
  name: z.string().min(1).max(100).trim(),
});

const resortCompanySchema = z.object({
  name: z.string().min(1).max(100).trim(),
});

// Table configuration
const TABLES = {
  'venue-types': {
    table: 'venue_types',
    schema: venueTypeSchema,
    nameField: 'name',
    displayName: 'Venue Types',
  },
  'trip-types': {
    table: 'trip_types',
    schema: tripTypeSchema,
    nameField: 'trip_type',
    displayName: 'Trip Types',
  },
  'trip-status': {
    table: 'trip_status',
    schema: tripStatusSchema,
    nameField: 'status',
    displayName: 'Trip Status',
  },
  'talent-categories': {
    table: 'talent_categories',
    schema: talentCategorySchema,
    nameField: 'category',
    displayName: 'Talent Categories',
  },
  'location-types': {
    table: 'location_types',
    schema: locationTypeSchema,
    nameField: 'type',
    displayName: 'Location Types',
  },
  'charter-companies': {
    table: 'charter_companies',
    schema: charterCompanySchema,
    nameField: 'name',
    displayName: 'Charter Companies',
  },
  'cruise-lines': {
    table: 'cruise_lines',
    schema: cruiseLineSchema,
    nameField: 'name',
    displayName: 'Cruise Lines',
  },
  'resort-companies': {
    table: 'resort_companies',
    schema: resortCompanySchema,
    nameField: 'name',
    displayName: 'Resort Companies',
  },
};

export function registerAdminLookupTablesRoutes(app: Express) {
  // GET /api/admin/lookup-tables/counts - Get count of items in each table (viewers and above can view)
  // IMPORTANT: This route must be defined BEFORE the /:table route to avoid route matching issues
  app.get(
    '/api/admin/lookup-tables/counts',
    requireAuth,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      // Check if user has viewer role or above
      const userRole = req.user?.role;
      const allowedRoles = ['viewer', 'content_manager', 'admin', 'super_admin'];
      if (!userRole || !allowedRoles.includes(userRole)) {
        throw ApiError.forbidden('Insufficient permissions to view lookup tables');
      }

      const supabaseAdmin = getSupabaseAdmin();
      if (!supabaseAdmin) {
        throw new ApiError(
          503,
          'Database service is not configured. Please set up Supabase credentials.'
        );
      }

      const counts: Record<string, number> = {};

      // Get counts for all tables
      for (const [key, config] of Object.entries(TABLES)) {
        const { count, error } = await supabaseAdmin
          .from(config.table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          logger.error(`Error counting ${config.displayName}`, {
            error,
            table: config.displayName,
          });
          counts[key] = 0;
        } else {
          counts[key] = count || 0;
        }
      }

      return res.json(counts);
    })
  );

  // GET /api/admin/lookup-tables/:table - List all items for a specific table (viewers and above can view)
  app.get(
    '/api/admin/lookup-tables/:table',
    requireAuth,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      // Check if user has viewer role or above
      const userRole = req.user?.role;
      const allowedRoles = ['viewer', 'content_manager', 'admin', 'super_admin'];
      if (!userRole || !allowedRoles.includes(userRole)) {
        throw ApiError.forbidden('Insufficient permissions to view lookup tables');
      }

      const tableKey = req.params.table as keyof typeof TABLES;
      const tableConfig = TABLES[tableKey];

      if (!tableConfig) {
        throw ApiError.notFound('Invalid table type');
      }

      const supabaseAdmin = getSupabaseAdmin();
      if (!supabaseAdmin) {
        throw new ApiError(
          503,
          'Database service is not configured. Please set up Supabase credentials.'
        );
      }

      // Fetch all items from the table
      const { data: items, error } = await supabaseAdmin
        .from(tableConfig.table)
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        logger.error(`Error fetching ${tableConfig.displayName}`, {
          error,
          table: tableConfig.displayName,
        });
        throw ApiError.internal(`Failed to fetch ${tableConfig.displayName.toLowerCase()}`);
      }

      return res.json({
        items: items || [],
        total: items?.length || 0,
      });
    })
  );

  // POST /api/admin/lookup-tables/:table - Create new item (super admin only)
  app.post(
    '/api/admin/lookup-tables/:table',
    requireSuperAdmin,
    auditLogger('admin.lookup_tables.create'),
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const tableKey = req.params.table as keyof typeof TABLES;
      const tableConfig = TABLES[tableKey];

      if (!tableConfig) {
        throw ApiError.notFound('Invalid table type');
      }

      // Validate input data
      let itemData;
      try {
        itemData = tableConfig.schema.parse(req.body);
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw ApiError.badRequest('Invalid item data');
        }
        throw error;
      }

      const supabaseAdmin = getSupabaseAdmin();
      if (!supabaseAdmin) {
        throw new ApiError(
          503,
          'Database service is not configured. Please set up Supabase credentials.'
        );
      }

      // Check if item already exists (case-insensitive)
      const nameValue = itemData[tableConfig.nameField as keyof typeof itemData] as string;
      const { data: existingItem } = await supabaseAdmin
        .from(tableConfig.table)
        .select('*')
        .ilike(tableConfig.nameField, nameValue)
        .single();

      if (existingItem) {
        throw ApiError.conflict(
          `${tableConfig.displayName.slice(0, -1)} with this name already exists`
        );
      }

      // Create new item
      const insertData = {
        ...itemData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: newItem, error: createError } = await supabaseAdmin
        .from(tableConfig.table)
        .insert(insertData)
        .select()
        .single();

      if (createError) {
        logger.error(`Error creating ${tableConfig.displayName.slice(0, -1)}`, {
          error: createError,
          table: tableConfig.displayName,
        });
        throw ApiError.internal(
          `Failed to create ${tableConfig.displayName.slice(0, -1).toLowerCase()}`
        );
      }

      return res.status(201).json({
        item: newItem,
        message: `${tableConfig.displayName.slice(0, -1)} created successfully`,
      });
    })
  );

  // PUT /api/admin/lookup-tables/:table/:id - Update existing item (super admin only)
  app.put(
    '/api/admin/lookup-tables/:table/:id',
    requireSuperAdmin,
    auditLogger('admin.lookup_tables.update'),
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const tableKey = req.params.table as keyof typeof TABLES;
      const itemId = req.params.id;
      const tableConfig = TABLES[tableKey];

      if (!tableConfig) {
        throw ApiError.notFound('Invalid table type');
      }

      // Validate input data
      let itemData;
      try {
        itemData = tableConfig.schema.parse(req.body);
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw ApiError.badRequest('Invalid item data');
        }
        throw error;
      }

      const supabaseAdmin = getSupabaseAdmin();
      if (!supabaseAdmin) {
        throw new ApiError(
          503,
          'Database service is not configured. Please set up Supabase credentials.'
        );
      }

      // Check if item exists
      const { data: existingItem, error: fetchError } = await supabaseAdmin
        .from(tableConfig.table)
        .select('*')
        .eq('id', itemId)
        .single();

      if (fetchError || !existingItem) {
        throw ApiError.notFound(`${tableConfig.displayName.slice(0, -1)} not found`);
      }

      // Check for name conflicts (case-insensitive, excluding current item)
      const nameValue = itemData[tableConfig.nameField as keyof typeof itemData] as string;
      const { data: conflictingItem } = await supabaseAdmin
        .from(tableConfig.table)
        .select('*')
        .ilike(tableConfig.nameField, nameValue)
        .neq('id', itemId)
        .single();

      if (conflictingItem) {
        throw ApiError.conflict(
          `Another ${tableConfig.displayName.slice(0, -1).toLowerCase()} with this name already exists`
        );
      }

      // Update item
      const updateData = {
        ...itemData,
        updated_at: new Date().toISOString(),
      };

      const { data: updatedItem, error: updateError } = await supabaseAdmin
        .from(tableConfig.table)
        .update(updateData)
        .eq('id', itemId)
        .select()
        .single();

      if (updateError) {
        logger.error(`Error updating ${tableConfig.displayName.slice(0, -1)}`, {
          error: updateError,
          table: tableConfig.displayName,
        });
        throw ApiError.internal(
          `Failed to update ${tableConfig.displayName.slice(0, -1).toLowerCase()}`
        );
      }

      return res.json({
        item: updatedItem,
        message: `${tableConfig.displayName.slice(0, -1)} updated successfully`,
      });
    })
  );
}
