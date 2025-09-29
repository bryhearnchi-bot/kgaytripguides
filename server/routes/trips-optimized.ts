import type { Express, Response } from "express";
import {
  tripStorage,
  itineraryStorage,
  eventStorage,
  tripInfoStorage,
  batchQueryBuilder,
  optimizedConnection
} from "../storage";
import { OptimizedQueryPatterns, QueryCacheStrategies } from "../storage/OptimizedQueries";
import { requireAuth, requireContentEditor, type AuthenticatedRequest } from "../auth";
import { getSupabaseAdmin } from "../supabase-admin";
import {
  validateBody,
  validateParams,
  idParamSchema,
  slugParamSchema,
  createTripSchema,
  updateTripSchema,
  bulkEventsSchema,
  exportTripSchema,
  importTripSchema
} from "../middleware/validation";
import {
  adminRateLimit,
  bulkRateLimit
} from "../middleware/rate-limiting";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../middleware/errorHandler";
import {
  validateId,
  ensureResourceExists,
  executeDbOperation,
  validateRequiredFields
} from "../utils/errorUtils";
import { cacheManager } from "../cache/CacheManager";

/**
 * OPTIMIZED TRIP ROUTES
 * Implements performance optimizations to eliminate N+1 queries and improve response times
 */
export function registerOptimizedTripRoutes(app: Express) {
  // Initialize optimized query patterns
  const optimizedQueries = new OptimizedQueryPatterns(db, batchQueryBuilder);

  // ============ OPTIMIZED TRIP MANAGEMENT ENDPOINTS ============

  /**
   * OPTIMIZED: Duplicate a trip with batch operations
   * Eliminates N+1 queries when copying related data
   */
  app.post("/api/v2/trips/:id/duplicate",
    requireContentEditor,
    validateParams(idParamSchema),
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const tripId = validateId(req.params.id, 'Trip');
      const { newName, newSlug } = req.body;

      // Validate required fields
      validateRequiredFields(req.body, ['newName', 'newSlug']);

      // Use optimized duplication with transaction
      const duplicatedTrip = await optimizedConnection.executeWithMetrics(
        () => optimizedQueries.duplicateTripOptimized(tripId, newName, newSlug),
        `duplicateTrip(${tripId})`
      );

      // Invalidate cache for trip listings
      await cacheManager.invalidatePattern('trips', 'trips:list:*');

      res.json({
        success: true,
        trip: duplicatedTrip,
        message: 'Trip duplicated successfully with all related data'
      });
    })
  );

  /**
   * OPTIMIZED: Bulk create/update events with single database operation
   * Uses batch upsert to handle multiple events efficiently
   */
  app.post("/api/v2/events/bulk",
    bulkRateLimit,
    requireContentEditor,
    validateBody(bulkEventsSchema),
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { tripId, events } = req.body;

      // Use optimized bulk upsert
      const results = await optimizedConnection.executeWithMetrics(
        () => optimizedQueries.bulkUpsertEvents(tripId, events),
        `bulkUpsertEvents(${tripId}, ${events.length} events)`
      );

      // Invalidate cache for this trip's events
      await cacheManager.delete('events', `trip:${tripId}:events`);

      res.json({
        success: true,
        events: results,
        message: `Successfully processed ${results.length} events`
      });
    })
  );

  /**
   * OPTIMIZED: Export trip data with parallel data fetching
   * Loads all related data in parallel instead of sequentially
   */
  app.post("/api/v2/export/trips/:id",
    requireContentEditor,
    validateParams(idParamSchema),
    validateBody(exportTripSchema),
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const tripId = validateId(req.params.id, 'Trip');
      const { format = 'json', includeRelated = true } = req.body;

      let exportData: any;

      if (includeRelated) {
        // Use batch loading for complete trip data
        const [completeData] = await batchQueryBuilder.loadCompleteTripData([tripId]);
        exportData = completeData;
      } else {
        // Just get the trip
        const trip = await tripStorage.getTripById(tripId);
        ensureResourceExists(trip, 'Trip');
        exportData = { trip };
      }

      if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="trip-${tripId}-export.json"`);
        res.json(exportData);
      } else if (format === 'csv') {
        // CSV export would require additional implementation
        throw ApiError.badRequest('CSV export not yet implemented');
      }
    })
  );

  /**
   * OPTIMIZED: Get complete trip information with intelligent caching
   * Uses batch loading and caching to minimize database queries
   */
  app.get("/api/v2/trips/:slug/complete",
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { slug } = req.params;
      const cacheKey = QueryCacheStrategies.getCacheKey('tripComplete', { slug });

      // Try cache first
      const cached = await cacheManager.get('trips', cacheKey);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        return res.json(cached);
      }

      // Use optimized query with all related data
      const tripData = await optimizedConnection.executeWithMetrics(
        () => optimizedQueries.getTripCompleteOptimized(slug),
        `getTripComplete(${slug})`
      );

      if (!tripData) {
        throw ApiError.notFound('Trip not found');
      }

      // Cache the result
      const ttl = QueryCacheStrategies.getCacheTTL('tripComplete');
      await cacheManager.set('trips', cacheKey, tripData, ttl * 1000);

      res.setHeader('X-Cache', 'MISS');
      res.json(tripData);
    })
  );

  /**
   * OPTIMIZED: Admin dashboard statistics with aggregated query
   * Uses single CTE query instead of multiple separate queries
   */
  app.get("/api/v2/admin/trips/stats",
    requireContentEditor,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const cacheKey = 'dashboard:stats:trips';

      // Try cache first (short TTL for dashboard stats)
      const cached = await cacheManager.get('dashboard', cacheKey);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        return res.json(cached);
      }

      // Use optimized queries with Supabase Admin
      const stats = await optimizedConnection.executeWithMetrics(
        async () => {
          const supabaseAdmin = getSupabaseAdmin();

          // Fetch all data in parallel
          const [tripsData, eventsData, itineraryData, statusData] = await Promise.all([
            supabaseAdmin.from('trips').select('start_date, end_date, trip_status_id'),
            supabaseAdmin.from('events').select('trip_id'),
            supabaseAdmin.from('itinerary').select('trip_id'),
            supabaseAdmin.from('trip_status').select('id, status')
          ]);

          if (tripsData.error || eventsData.error || itineraryData.error || statusData.error) {
            throw new Error('Failed to fetch dashboard stats');
          }

          const trips = tripsData.data || [];
          const events = eventsData.data || [];
          const itinerary = itineraryData.data || [];
          const statuses = statusData.data || [];

          // Build status map
          const statusMap = Object.fromEntries(statuses.map(s => [s.id, s.status]));
          const statusIdMap = Object.fromEntries(statuses.map(s => [s.status, s.id]));

          const now = new Date();

          // Calculate trip stats
          const tripStats = {
            total: trips.length,
            published: trips.filter(t => statusMap[t.trip_status_id] === 'published').length,
            draft: trips.filter(t => statusMap[t.trip_status_id] === 'draft').length,
            archived: trips.filter(t => statusMap[t.trip_status_id] === 'archived').length,
            upcoming: trips.filter(t => new Date(t.start_date) > now).length,
            ongoing: trips.filter(t =>
              new Date(t.start_date) <= now && new Date(t.end_date) >= now
            ).length,
            past: trips.filter(t => new Date(t.end_date) < now).length
          };

          // Calculate event stats
          const eventsByTrip = events.reduce((acc: Record<string, number>, e) => {
            acc[e.trip_id] = (acc[e.trip_id] || 0) + 1;
            return acc;
          }, {});

          const eventStats = {
            trips_with_events: Object.keys(eventsByTrip).length,
            total_events: events.length,
            avg_events_per_trip: Object.keys(eventsByTrip).length ?
              events.length / Object.keys(eventsByTrip).length : 0
          };

          // Calculate itinerary stats
          const stopsByTrip = itinerary.reduce((acc: Record<string, number>, i) => {
            acc[i.trip_id] = (acc[i.trip_id] || 0) + 1;
            return acc;
          }, {});

          const itineraryStats = {
            avg_stops_per_trip: Object.keys(stopsByTrip).length ?
              itinerary.length / Object.keys(stopsByTrip).length : 0
          };

          return {
            trips: tripStats,
            events: eventStats,
            itinerary: itineraryStats
          };
        },
        'getDashboardTripStats'
      );

      // Cache for 30 seconds
      await cacheManager.set('dashboard', cacheKey, stats, 30000);

      res.setHeader('X-Cache', 'MISS');
      res.json(stats);
    })
  );

  /**
   * OPTIMIZED: List trips with pagination and efficient filtering
   * Uses covering indexes and limits data fetched
   */
  app.get("/api/v2/admin/trips",
    requireContentEditor,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const {
        page = '1',
        limit = '20',
        search = '',
        status = '',
        sortBy = 'startDate',
        sortOrder = 'desc'
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = Math.min(parseInt(limit as string), 100); // Cap at 100
      const offset = (pageNum - 1) * limitNum;

      const supabaseAdmin = getSupabaseAdmin();

      // Build query with specific columns
      let query = supabaseAdmin
        .from('trips')
        .select(`
          id,
          name,
          slug,
          hero_image_url,
          start_date,
          end_date,
          trip_status_id,
          trip_type_id,
          created_at
        `, { count: 'exact' });

      // Apply search filter
      if (search) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
      }

      // Apply status filter
      if (status) {
        // First get the status ID
        const { data: statusData, error: statusError } = await supabaseAdmin
          .from('trip_status')
          .select('id')
          .eq('status', status as string)
          .single();

        if (statusData) {
          query = query.eq('trip_status_id', statusData.id);
        }
      }

      // Apply sorting
      const sortColumn = {
        'startDate': 'start_date',
        'endDate': 'end_date',
        'createdAt': 'created_at',
        'name': 'name',
        'slug': 'slug'
      }[sortBy as string] || 'start_date';

      query = query.order(sortColumn, { ascending: sortOrder !== 'desc' });

      // Apply pagination
      query = query.range(offset, offset + limitNum - 1);

      // Execute query
      const { data: trips, error, count: total } = await query;

      if (error) {
        console.error('Error fetching trips:', error);
        throw new Error('Failed to fetch trips');
      }

      res.json({
        trips,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
          hasNext: pageNum < Math.ceil(total / limitNum),
          hasPrev: pageNum > 1
        }
      });
    })
  );

  /**
   * OPTIMIZED: Global search with parallel execution and ranking
   * Uses full-text search indexes and parallel queries
   */
  app.get("/api/v2/search/global",
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const {
        q = '',
        types = 'trips,events,talent,locations',
        limit = '10'
      } = req.query;

      const searchTerm = q as string;
      const searchTypes = (types as string).split(',');
      const limitNum = Math.min(parseInt(limit as string), 50);

      // Check cache
      const cacheKey = QueryCacheStrategies.getCacheKey('globalSearch', {
        term: searchTerm,
        types: searchTypes
      });

      const cached = await cacheManager.get('search', cacheKey);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        return res.json(cached);
      }

      // Use optimized parallel search
      const results = await optimizedConnection.executeWithMetrics(
        () => optimizedQueries.globalSearchOptimized(searchTerm, searchTypes, limitNum),
        `globalSearch(${searchTerm})`
      );

      // Cache for 1 minute
      await cacheManager.set('search', cacheKey, results, 60000);

      res.setHeader('X-Cache', 'MISS');
      res.json(results);
    })
  );

  /**
   * OPTIMIZED: Batch load multiple trips with related data
   * Useful for homepage or listing pages
   */
  app.post("/api/v2/trips/batch",
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { tripIds, includeRelated = false } = req.body;

      if (!Array.isArray(tripIds) || tripIds.length === 0) {
        throw ApiError.badRequest('tripIds must be a non-empty array');
      }

      // Limit batch size to prevent abuse
      const limitedIds = tripIds.slice(0, 20);

      let results;

      if (includeRelated) {
        // Load complete data for all trips
        results = await optimizedConnection.executeWithMetrics(
          () => batchQueryBuilder.loadCompleteTripData(limitedIds),
          `batchLoadTrips(${limitedIds.length} trips with related data)`
        );
      } else {
        // Just load basic trip data
        results = await db.select()
          .from(schema.trips)
          .where(sql`id = ANY(${limitedIds})`);
      }

      res.json({
        trips: results,
        requested: tripIds.length,
        returned: results.length
      });
    })
  );
}