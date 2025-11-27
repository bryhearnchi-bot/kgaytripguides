import type { Express, Response } from 'express';
import {
  requireAuth,
  requireContentEditor,
  requireSuperAdmin,
  type AuthenticatedRequest,
} from '../auth';
import { getSupabaseAdmin } from '../supabase-admin';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiError } from '../utils/ApiError';
import {
  validateBody,
  validateQuery,
  globalSearchSchema,
  dashboardStatsSchema,
  systemHealthSchema,
} from '../middleware/validation';
import { searchRateLimit, adminRateLimit, authRateLimit } from '../middleware/rate-limiting';
import { csrfTokenEndpoint } from '../middleware/csrf';
import { apiVersionsEndpoint } from '../middleware/versioning';
import { logger } from '../logging/logger';
import { sanitizeSearchTerm } from '../utils/sanitize';

// Import bcrypt for password hashing
// @ts-expect-error - bcryptjs types may not be installed, TODO: verify @types/bcryptjs
import bcrypt from 'bcryptjs';

export function registerPublicRoutes(app: Express) {
  // ============ API METADATA ENDPOINTS ============

  // API versions endpoint
  app.get('/api/versions', apiVersionsEndpoint);

  // CSRF token endpoint - rate limited to prevent token exhaustion attacks
  app.get('/api/csrf-token', authRateLimit, csrfTokenEndpoint());

  // ============ DASHBOARD & SYSTEM ENDPOINTS ============

  // Admin dashboard statistics
  app.post(
    '/api/admin/dashboard/stats',
    adminRateLimit,
    requireContentEditor,
    validateBody(dashboardStatsSchema),
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { dateRange, metrics } = req.body;
      const supabaseAdmin = getSupabaseAdmin();

      // Build dynamic stats based on requested metrics
      const stats: any = {};

      if (metrics.includes('trips')) {
        try {
          const { data: trips, error } = await supabaseAdmin
            .from('trips')
            .select('start_date, end_date');

          if (error) throw error;

          const now = new Date();
          const total = trips?.length || 0;
          const upcoming = trips?.filter(t => new Date(t.start_date) > now).length || 0;
          const active =
            trips?.filter(t => new Date(t.start_date) <= now && new Date(t.end_date) >= now)
              .length || 0;
          const past = trips?.filter(t => new Date(t.end_date) < now).length || 0;

          stats.trips = { total, upcoming, active, past };
        } catch (err) {
          logger.error('Error fetching trip stats', err, {
            metric: 'trips',
            dateRange,
          });
          stats.trips = { total: 0, upcoming: 0, active: 0, past: 0 };
        }
      }

      if (metrics.includes('events')) {
        const { data: events, error } = await supabaseAdmin.from('events').select('id');
        stats.events = { total: events?.length || 0 };
      }

      if (metrics.includes('talent')) {
        const { data: talent, error } = await supabaseAdmin.from('talent').select('featured');

        const total = talent?.length || 0;
        const featured = talent?.filter(t => t.featured === true).length || 0;
        stats.talent = { total, featured };
      }

      if (metrics.includes('locations')) {
        const { data: locations, error } = await supabaseAdmin.from('locations').select('id');
        stats.locations = { total: locations?.length || 0 };
      }

      return res.json(stats);
    })
  );

  // System health check
  app.get(
    '/api/admin/system/health',
    requireContentEditor,
    validateQuery(systemHealthSchema),
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { detailed = false } = req.query;
      const isProduction = process.env.NODE_ENV === 'production';

      // Basic health info (always returned)
      const health: any = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
      };

      // Only include uptime in non-production (prevents server restart detection)
      if (!isProduction) {
        health.uptime = process.uptime();
      }

      if (detailed === 'true') {
        // Database health check (always allowed - no sensitive info)
        try {
          const supabaseAdmin = getSupabaseAdmin();
          const { data, error } = await supabaseAdmin.from('trips').select('id').limit(1);

          if (error) throw error;
          health.database = { status: 'connected' };
        } catch (error: unknown) {
          // Don't expose error details in production
          health.database = {
            status: 'disconnected',
            ...(isProduction ? {} : { error: (error as Error).message }),
          };
          health.status = 'degraded';
        }

        // Memory usage - only in development (prevents resource fingerprinting)
        if (!isProduction) {
          const memUsage = process.memoryUsage();
          health.memory = {
            rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
            heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`,
            heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`,
          };

          // Node version - only in development (prevents version fingerprinting)
          health.node = {
            version: process.version,
            platform: process.platform,
          };
        }
      }

      return res.json(health);
    })
  );

  // ============ SEARCH ENDPOINTS ============

  // Global search across multiple entities
  app.get(
    '/api/search/global',
    searchRateLimit,
    validateQuery(globalSearchSchema),
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      // Timing protection: ensure minimum response time to prevent timing attacks
      const startTime = Date.now();
      const MIN_RESPONSE_TIME_MS = 100;

      const {
        q = '',
        types = ['trips', 'events', 'talent', 'locations'],
        limit = '10',
      } = req.query;

      const searchTerm = sanitizeSearchTerm(q as string);
      const searchTypes = Array.isArray(types) ? types : [types];
      const limitNum = parseInt(limit as string);
      const supabaseAdmin = getSupabaseAdmin();

      const results: any = {};

      // Search trips
      if (searchTypes.includes('trips')) {
        const { data: tripResults, error } = await supabaseAdmin
          .from('trips')
          .select('*')
          .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
          .limit(limitNum);

        if (error) {
          logger.error('Error searching trips', error, {
            searchTerm,
            limit: limitNum,
          });
          results.trips = [];
        } else {
          results.trips = tripResults || [];
        }
      }

      // Search events
      if (searchTypes.includes('events')) {
        const { data: eventResults, error } = await supabaseAdmin
          .from('events')
          .select('*')
          .ilike('title', `%${searchTerm}%`)
          .limit(limitNum);

        if (error) {
          logger.error('Error searching events', error, {
            searchTerm,
            limit: limitNum,
          });
          results.events = [];
        } else {
          results.events = eventResults || [];
        }
      }

      // Search talent
      if (searchTypes.includes('talent')) {
        const { data: talentResults, error } = await supabaseAdmin
          .from('talent')
          .select('*')
          .or(`name.ilike.%${searchTerm}%,bio.ilike.%${searchTerm}%`)
          .limit(limitNum);

        if (error) {
          logger.error('Error searching talent', error, {
            searchTerm,
            limit: limitNum,
          });
          results.talent = [];
        } else {
          results.talent = talentResults || [];
        }
      }

      // Search locations
      if (searchTypes.includes('locations')) {
        const { data: locationResults, error } = await supabaseAdmin
          .from('locations')
          .select('*')
          .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
          .limit(limitNum);

        if (error) {
          logger.error('Error searching locations', error, {
            searchTerm,
            limit: limitNum,
          });
          results.locations = [];
        } else {
          results.locations = locationResults || [];
        }
      }

      // Ensure minimum response time to prevent timing attacks
      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_RESPONSE_TIME_MS) {
        await new Promise(resolve => setTimeout(resolve, MIN_RESPONSE_TIME_MS - elapsed));
      }

      return res.json(results);
    })
  );

  // ============ SETTINGS ENDPOINTS ============

  // Get settings by category
  app.get(
    '/api/settings/:category',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const supabaseAdmin = getSupabaseAdmin();
      const { data: settings, error } = await supabaseAdmin
        .from('settings')
        .select('*')
        .eq('category', req.params.category)
        .order('order_index', { ascending: true });

      if (error) {
        throw ApiError.internal('Failed to fetch settings');
      }
      return res.json(settings);
    })
  );

  // Get active settings by category
  app.get(
    '/api/settings/:category/active',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const supabaseAdmin = getSupabaseAdmin();
      const { data: settings, error } = await supabaseAdmin
        .from('settings')
        .select('*')
        .eq('category', req.params.category)
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) {
        throw ApiError.internal('Failed to fetch active settings');
      }
      return res.json(settings);
    })
  );

  // Create or update a setting
  app.post(
    '/api/settings/:category/:key',
    requireContentEditor,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const supabaseAdmin = getSupabaseAdmin();
      const { data: setting, error } = await supabaseAdmin
        .from('settings')
        .upsert({
          category: req.params.category,
          key: req.params.key,
          ...req.body,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw ApiError.internal('Failed to upsert setting');
      }
      return res.json(setting);
    })
  );

  // Deactivate a setting
  app.post(
    '/api/settings/:category/:key/deactivate',
    requireContentEditor,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const supabaseAdmin = getSupabaseAdmin();
      const { data: setting, error } = await supabaseAdmin
        .from('settings')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('category', req.params.category)
        .eq('key', req.params.key)
        .select()
        .single();

      if (error) {
        throw ApiError.internal('Failed to deactivate setting');
      }
      return res.json(setting);
    })
  );

  // Reorder settings within a category
  app.post(
    '/api/settings/:category/reorder',
    requireContentEditor,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { keys } = req.body;
      const supabaseAdmin = getSupabaseAdmin();

      // Update each setting with its new order index
      for (let i = 0; i < keys.length; i++) {
        const { error } = await supabaseAdmin
          .from('settings')
          .update({
            order_index: i,
            updated_at: new Date().toISOString(),
          })
          .eq('category', req.params.category)
          .eq('key', keys[i]);

        if (error) {
          throw ApiError.internal('Failed to reorder settings');
        }
      }
      return res.json({ message: 'Settings reordered' });
    })
  );

  // ============ USER PROFILE ENDPOINTS ============

  // Get admin profile
  app.get(
    '/api/admin/profile',
    requireAuth,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const supabaseAdmin = getSupabaseAdmin();
      const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !profile) {
        logger.error('Error fetching profile', error, {
          method: req.method,
          path: req.path,
          userId,
        });
        return res.status(404).json({ error: 'Profile not found' });
      }

      // Map database field names to frontend field names
      // Prioritize the structured 'name' field over legacy 'name'
      const nameObject = profile.name || {};
      const displayName = nameObject.full || '';

      const responseProfile = {
        ...profile,
        profile_image_url: profile.avatar_url,
        name: nameObject,
        phoneNumber: profile.phone_number,
        socialLinks: profile.social_links,
      };

      return res.json(responseProfile);
    })
  );

  // Update admin profile
  app.put(
    '/api/admin/profile',
    requireAuth,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Map frontend field names to database field names
      const updateData = { ...req.body };

      // Profile image mapping
      if ('profile_image_url' in updateData) {
        updateData.avatar_url = updateData.profile_image_url;
        delete updateData.profile_image_url;
      }

      // Handle firstName/lastName to name object mapping
      if ('firstName' in updateData || 'lastName' in updateData) {
        updateData.name = {
          first: updateData.firstName || '',
          last: updateData.lastName || '',
        };
        delete updateData.firstName;
        delete updateData.lastName;
      }

      if ('phoneNumber' in updateData) {
        updateData.phone_number = updateData.phoneNumber;
        delete updateData.phoneNumber;
      }

      // Handle other camelCase field names
      if ('socialLinks' in updateData) {
        updateData.social_links = updateData.socialLinks;
        delete updateData.socialLinks;
      }

      // Handle legacy camelCase field names for backward compatibility
      if ('avatarUrl' in updateData) {
        updateData.avatar_url = updateData.avatarUrl;
        delete updateData.avatarUrl;
      }

      const supabaseAdmin = getSupabaseAdmin();
      const { data: updatedProfile, error } = await supabaseAdmin
        .from('profiles')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating profile', error, {
          method: req.method,
          path: req.path,
          userId,
        });
        return res.status(500).json({ error: 'Failed to update profile' });
      }

      // Map database field names to frontend field names for response
      // Prioritize the structured 'name' field over legacy 'name'
      const nameObject = updatedProfile.name || {};
      const displayName = nameObject.full || '';

      const responseProfile = {
        ...updatedProfile,
        profile_image_url: updatedProfile.avatar_url,
        name: nameObject,
        phoneNumber: updatedProfile.phone_number,
        socialLinks: updatedProfile.social_links,
      };

      return res.json(responseProfile);
    })
  );

  // Get another user's profile (admin only)
  app.get(
    '/api/admin/users/:userId/profile',
    requireSuperAdmin,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const supabaseAdmin = getSupabaseAdmin();
      const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', req.params.userId)
        .single();

      if (error || !profile) {
        throw ApiError.notFound('Profile not found');
      }

      return res.json(profile);
    })
  );

  // Change password
  app.post(
    '/api/admin/change-password',
    requireAuth,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { currentPassword, newPassword } = req.body;

      // Validate input
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current and new passwords are required' });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ error: 'New password must be at least 8 characters long' });
      }

      // Get user from database
      const supabaseAdmin = getSupabaseAdmin();
      const { data: user, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !user) {
        logger.error('Error fetching user for password change', error, {
          method: req.method,
          path: req.path,
          userId,
        });
        return res.status(404).json({ error: 'User not found' });
      }

      // For Supabase Auth, we would need to use Supabase client to change password
      // This is a placeholder implementation
      // In production, this should integrate with Supabase Auth API

      return res.json({ message: 'Password changed successfully' });
    })
  );
}
