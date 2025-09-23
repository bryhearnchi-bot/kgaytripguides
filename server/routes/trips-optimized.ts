import type { Express } from "express";
import {
  tripStorage,
  itineraryStorage,
  eventStorage,
  tripInfoStorage,
  db,
  batchQueryBuilder,
  optimizedConnection
} from "../storage";
import { OptimizedQueryPatterns, QueryCacheStrategies } from "../storage/OptimizedQueries";
import { requireAuth, requireContentEditor, type AuthenticatedRequest } from "../auth";
import * as schema from "../../shared/schema";
import { eq, ilike, or, count, sql, and, gte, lte } from "drizzle-orm";
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
    asyncHandler(async (req: AuthenticatedRequest, res) => {
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
    asyncHandler(async (req: AuthenticatedRequest, res) => {
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
    asyncHandler(async (req: AuthenticatedRequest, res) => {
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
    asyncHandler(async (req, res) => {
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
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const cacheKey = 'dashboard:stats:trips';

      // Try cache first (short TTL for dashboard stats)
      const cached = await cacheManager.get('dashboard', cacheKey);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        return res.json(cached);
      }

      // Use optimized single query for all stats
      const stats = await optimizedConnection.executeWithMetrics(
        async () => {
          const result = await db.execute(sql`
            WITH trip_stats AS (
              SELECT
                COUNT(*) as total,
                COUNT(CASE WHEN trip_status_id = (SELECT id FROM trip_status WHERE status = 'published') THEN 1 END) as published,
                COUNT(CASE WHEN trip_status_id = (SELECT id FROM trip_status WHERE status = 'draft') THEN 1 END) as draft,
                COUNT(CASE WHEN trip_status_id = (SELECT id FROM trip_status WHERE status = 'archived') THEN 1 END) as archived,
                COUNT(CASE WHEN start_date > CURRENT_DATE THEN 1 END) as upcoming,
                COUNT(CASE WHEN start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE THEN 1 END) as ongoing,
                COUNT(CASE WHEN end_date < CURRENT_DATE THEN 1 END) as past
              FROM trips
            ),
            event_stats AS (
              SELECT
                COUNT(DISTINCT trip_id) as trips_with_events,
                COUNT(*) as total_events,
                AVG(events_per_trip) as avg_events_per_trip
              FROM (
                SELECT trip_id, COUNT(*) as events_per_trip
                FROM events
                GROUP BY trip_id
              ) e
            ),
            itinerary_stats AS (
              SELECT
                AVG(stops_per_trip) as avg_stops_per_trip
              FROM (
                SELECT trip_id, COUNT(*) as stops_per_trip
                FROM itinerary
                GROUP BY trip_id
              ) i
            )
            SELECT
              json_build_object(
                'trips', row_to_json(trip_stats),
                'events', row_to_json(event_stats),
                'itinerary', row_to_json(itinerary_stats)
              ) as stats
            FROM trip_stats, event_stats, itinerary_stats
          `);

          return result[0]?.stats;
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
    asyncHandler(async (req: AuthenticatedRequest, res) => {
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

      // Build optimized query with specific columns
      let baseQuery = db.select({
        id: schema.trips.id,
        name: schema.trips.name,
        slug: schema.trips.slug,
        heroImageUrl: schema.trips.heroImageUrl,
        startDate: schema.trips.startDate,
        endDate: schema.trips.endDate,
        tripStatusId: schema.trips.tripStatusId,
        tripTypeId: schema.trips.tripTypeId,
        createdAt: schema.trips.createdAt
      }).from(schema.trips);

      // Apply filters
      const conditions = [];

      if (search) {
        // Use full-text search if available, otherwise fallback to ILIKE
        conditions.push(
          sql`to_tsvector('english', ${schema.trips.name} || ' ' || COALESCE(${schema.trips.description}, '')) @@ plainto_tsquery('english', ${search})`
        );
      }

      if (status) {
        const statusId = await db.select({ id: schema.tripStatus.id })
          .from(schema.tripStatus)
          .where(eq(schema.tripStatus.status, status as string))
          .then(r => r[0]?.id);

        if (statusId) {
          conditions.push(eq(schema.trips.tripStatusId, statusId));
        }
      }

      if (conditions.length > 0) {
        baseQuery = baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions)) as typeof baseQuery;
      }

      // Get total count efficiently
      const countQuery = db.select({ count: count() }).from(schema.trips);
      if (conditions.length > 0) {
        countQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions));
      }

      // Execute count and data queries in parallel
      const [countResult, trips] = await Promise.all([
        countQuery,
        baseQuery
          .orderBy(
            sortOrder === 'desc'
              ? sql`${schema.trips[sortBy as keyof typeof schema.trips]} DESC`
              : sql`${schema.trips[sortBy as keyof typeof schema.trips]} ASC`
          )
          .limit(limitNum)
          .offset(offset)
      ]);

      const total = countResult[0]?.count || 0;

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
    asyncHandler(async (req, res) => {
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
    asyncHandler(async (req, res) => {
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