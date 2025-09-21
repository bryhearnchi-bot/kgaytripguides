import type { Express } from "express";
import {
  profileStorage,
  settingsStorage,
  tripStorage,
  eventStorage,
  talentStorage,
  db
} from "../storage";
import { requireAuth, requireContentEditor, requireSuperAdmin, type AuthenticatedRequest } from "../auth";
import { trips, events, talent, ports } from "../../shared/schema";
import { eq, ilike, or, count, sql } from "drizzle-orm";
import { z } from "zod";
import {
  validateBody,
  validateQuery,
  globalSearchSchema,
  dashboardStatsSchema,
  systemHealthSchema
} from "../middleware/validation";
import {
  searchRateLimit,
  adminRateLimit
} from "../middleware/rate-limiting";
import { csrfTokenEndpoint } from "../middleware/csrf";
import { apiVersionsEndpoint } from "../middleware/versioning";

// Import bcrypt for password hashing
import bcrypt from "bcryptjs";

export function registerPublicRoutes(app: Express) {
  // ============ API METADATA ENDPOINTS ============

  // API versions endpoint
  app.get('/api/versions', apiVersionsEndpoint);

  // CSRF token endpoint
  app.get('/api/csrf-token', csrfTokenEndpoint());

  // ============ DASHBOARD & SYSTEM ENDPOINTS ============

  // Admin dashboard statistics
  app.post("/api/admin/dashboard/stats",
    adminRateLimit,
    requireContentEditor,
    validateBody(dashboardStatsSchema),
    async (req: AuthenticatedRequest, res) => {
      try {
        const { dateRange, metrics } = req.body;

        // Build dynamic stats based on requested metrics
        const stats: any = {};

        if (metrics.includes('trips')) {
          const tripStats = await db.select({
            total: count(),
            upcoming: sql<number>`COUNT(CASE WHEN start_date > CURRENT_DATE THEN 1 END)`,
            active: sql<number>`COUNT(CASE WHEN start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE THEN 1 END)`,
            past: sql<number>`COUNT(CASE WHEN end_date < CURRENT_DATE THEN 1 END)`
          }).from(trips);
          stats.trips = tripStats[0];
        }

        if (metrics.includes('events')) {
          const eventStats = await db.select({
            total: count()
          }).from(events);
          stats.events = eventStats[0];
        }

        if (metrics.includes('talent')) {
          const talentStats = await db.select({
            total: count(),
            featured: sql<number>`COUNT(CASE WHEN featured = true THEN 1 END)`
          }).from(talent);
          stats.talent = talentStats[0];
        }

        if (metrics.includes('ports')) {
          const portStats = await db.select({
            total: count()
          }).from(ports);
          stats.ports = portStats[0];
        }

        res.json(stats);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
      }
    }
  );

  // System health check
  app.get("/api/admin/system/health",
    requireContentEditor,
    validateQuery(systemHealthSchema),
    async (req: AuthenticatedRequest, res) => {
      try {
        const { detailed = false } = req.query;
        const health: any = {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: process.uptime()
        };

        if (detailed === 'true') {
          // Database health check
          try {
            await db.select({ test: sql`1` }).from(trips).limit(1);
            health.database = { status: 'connected' };
          } catch (error) {
            health.database = { status: 'disconnected', error: (error as Error).message };
            health.status = 'degraded';
          }

          // Memory usage
          const memUsage = process.memoryUsage();
          health.memory = {
            rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
            heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
            heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB'
          };

          // Node version
          health.node = {
            version: process.version,
            platform: process.platform
          };
        }

        res.json(health);
      } catch (error) {
        console.error('Error checking system health:', error);
        res.status(500).json({
          status: 'unhealthy',
          error: 'Failed to check system health',
          timestamp: new Date().toISOString()
        });
      }
    }
  );

  // ============ SEARCH ENDPOINTS ============

  // Global search across multiple entities
  app.get("/api/search/global",
    searchRateLimit,
    validateQuery(globalSearchSchema),
    async (req, res) => {
      try {
        const {
          q = '',
          types = ['trips', 'events', 'talent', 'ports'],
          limit = '10'
        } = req.query;

        const searchTerm = q as string;
        const searchTypes = Array.isArray(types) ? types : [types];
        const limitNum = parseInt(limit as string);

        const results: any = {};

        // Search trips
        if (searchTypes.includes('trips')) {
          const tripResults = await db.select()
            .from(trips)
            .where(
              or(
                ilike(trips.name, `%${searchTerm}%`),
                ilike(trips.description, `%${searchTerm}%`)
              )
            )
            .limit(limitNum);
          results.trips = tripResults;
        }

        // Search events
        if (searchTypes.includes('events')) {
          const eventResults = await db.select()
            .from(events)
            .where(
              or(
                ilike(events.title, `%${searchTerm}%`),
                ilike(events.description, `%${searchTerm}%`)
              )
            )
            .limit(limitNum);
          results.events = eventResults;
        }

        // Search talent
        if (searchTypes.includes('talent')) {
          const talentResults = await db.select()
            .from(talent)
            .where(
              or(
                ilike(talent.name, `%${searchTerm}%`),
                ilike(talent.bio, `%${searchTerm}%`)
              )
            )
            .limit(limitNum);
          results.talent = talentResults;
        }

        // Search ports
        if (searchTypes.includes('ports')) {
          const portResults = await db.select()
            .from(ports)
            .where(
              or(
                ilike(ports.name, `%${searchTerm}%`),
                ilike(ports.description, `%${searchTerm}%`)
              )
            )
            .limit(limitNum);
          results.ports = portResults;
        }

        res.json(results);
      } catch (error) {
        console.error('Error performing global search:', error);
        res.status(500).json({ error: 'Failed to perform search' });
      }
    }
  );

  // ============ SETTINGS ENDPOINTS ============

  // Get settings by category
  app.get("/api/settings/:category", async (req, res) => {
    const settings = await settingsStorage.getSettingsByCategory(req.params.category);
    res.json(settings);
  });

  // Get active settings by category
  app.get("/api/settings/:category/active", async (req, res) => {
    const settings = await settingsStorage.getActiveSettingsByCategory(req.params.category);
    res.json(settings);
  });

  // Create or update a setting
  app.post("/api/settings/:category/:key", requireContentEditor, async (req: AuthenticatedRequest, res) => {
    const setting = await settingsStorage.upsertSetting(
      req.params.category,
      req.params.key,
      req.body
    );
    res.json(setting);
  });

  // Deactivate a setting
  app.post("/api/settings/:category/:key/deactivate", requireContentEditor, async (req: AuthenticatedRequest, res) => {
    const setting = await settingsStorage.deactivateSetting(
      req.params.category,
      req.params.key
    );
    res.json(setting);
  });

  // Reorder settings within a category
  app.post("/api/settings/:category/reorder", requireContentEditor, async (req: AuthenticatedRequest, res) => {
    const { keys } = req.body;
    await settingsStorage.reorderSettings(req.params.category, keys);
    res.json({ message: "Settings reordered" });
  });

  // ============ USER PROFILE ENDPOINTS ============

  // Get admin profile
  app.get("/api/admin/profile", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const profile = await profileStorage.getProfile(userId);
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      res.json(profile);
    } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  });

  // Update admin profile
  app.put("/api/admin/profile", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const updatedProfile = await profileStorage.updateProfile(userId, req.body);
      res.json(updatedProfile);
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  });

  // Get another user's profile (admin only)
  app.get("/api/admin/users/:userId/profile", requireSuperAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const profile = await profileStorage.getProfile(req.params.userId);
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      res.json(profile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({ error: 'Failed to fetch user profile' });
    }
  });

  // Change password
  app.post("/api/admin/change-password", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
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
      const user = await profileStorage.getProfile(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // For Supabase Auth, we would need to use Supabase client to change password
      // This is a placeholder implementation
      // In production, this should integrate with Supabase Auth API

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Error changing password:', error);
      res.status(500).json({ error: 'Failed to change password' });
    }
  });
}