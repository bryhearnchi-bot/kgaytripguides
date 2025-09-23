// ===============================================
// OPTIMIZED QUERY PATTERNS - PERFORMANCE IMPROVEMENTS
// K-GAY Travel Guides Database Optimization
// ===============================================

import { eq, and, desc, asc, ilike, or, inArray, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../../shared/schema';
import { BatchQueryBuilder } from './OptimizedStorage';

/**
 * Optimized query patterns to eliminate N+1 problems and improve performance
 */
export class OptimizedQueryPatterns {
  constructor(
    private db: PostgresJsDatabase<typeof schema>,
    private batchBuilder: BatchQueryBuilder
  ) {}

  /**
   * OPTIMIZED: Duplicate trip with all related data in batch operations
   * Reduces N+1 queries from itinerary/events copying
   */
  async duplicateTripOptimized(
    originalTripId: number,
    newName: string,
    newSlug: string
  ): Promise<schema.Trip> {
    // Start transaction for data consistency
    return await this.db.transaction(async (tx) => {
      // 1. Get original trip
      const [originalTrip] = await tx
        .select()
        .from(schema.trips)
        .where(eq(schema.trips.id, originalTripId));

      if (!originalTrip) {
        throw new Error('Original trip not found');
      }

      // 2. Create new trip
      const [newTrip] = await tx
        .insert(schema.trips)
        .values({
          ...originalTrip,
          id: undefined as any,
          name: newName,
          slug: newSlug,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      if (!newTrip) {
        throw new Error('Failed to create new trip');
      }

      // 3. Batch copy all related data in parallel
      const [itinerary, events, tripTalent, infoSections] = await Promise.all([
        // Get all itinerary items
        tx
          .select()
          .from(schema.itinerary)
          .where(eq(schema.itinerary.tripId, originalTripId)),

        // Get all events
        tx
          .select()
          .from(schema.events)
          .where(eq(schema.events.tripId, originalTripId)),

        // Get all talent assignments
        tx
          .select()
          .from(schema.tripTalent)
          .where(eq(schema.tripTalent.tripId, originalTripId)),

        // Get all info sections
        tx
          .select()
          .from(schema.tripInfoSections)
          .where(eq(schema.tripInfoSections.tripId, originalTripId)),
      ]);

      // 4. Batch insert all related data
      const insertPromises = [];

      // Insert itinerary items if any exist
      if (itinerary.length > 0) {
        const newItinerary = itinerary.map(item => ({
          ...item,
          id: undefined as any,
          tripId: newTrip.id,
        }));
        insertPromises.push(
          tx.insert(schema.itinerary).values(newItinerary)
        );
      }

      // Insert events if any exist
      if (events.length > 0) {
        const newEvents = events.map(event => ({
          ...event,
          id: undefined as any,
          tripId: newTrip.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));
        insertPromises.push(
          tx.insert(schema.events).values(newEvents)
        );
      }

      // Insert talent assignments if any exist
      if (tripTalent.length > 0) {
        const newTalentAssignments = tripTalent.map(assignment => ({
          ...assignment,
          tripId: newTrip.id,
          createdAt: new Date(),
        }));
        insertPromises.push(
          tx.insert(schema.tripTalent).values(newTalentAssignments)
        );
      }

      // Insert info sections if any exist
      if (infoSections.length > 0) {
        const newInfoSections = infoSections.map(section => ({
          ...section,
          id: undefined as any,
          tripId: newTrip.id,
          updatedAt: new Date(),
        }));
        insertPromises.push(
          tx.insert(schema.tripInfoSections).values(newInfoSections)
        );
      }

      // Execute all inserts in parallel
      await Promise.all(insertPromises);

      return newTrip;
    });
  }

  /**
   * OPTIMIZED: Bulk create/update events with single database operation
   */
  async bulkUpsertEvents(
    tripId: number,
    events: Array<Partial<schema.Event> & { id?: number }>
  ): Promise<schema.Event[]> {
    return await this.db.transaction(async (tx) => {
      const toUpdate = events.filter(e => e.id);
      const toInsert = events.filter(e => !e.id);

      const results: schema.Event[] = [];

      // Batch update existing events
      if (toUpdate.length > 0) {
        // Use CASE statements for bulk update
        const updateQuery = sql`
          UPDATE ${schema.events}
          SET
            title = CASE id
              ${sql.join(
                toUpdate.map(e => sql`WHEN ${e.id} THEN ${e.title}`),
                sql` `
              )}
            END,
            date = CASE id
              ${sql.join(
                toUpdate.map(e => sql`WHEN ${e.id} THEN ${e.date}`),
                sql` `
              )}
            END,
            time = CASE id
              ${sql.join(
                toUpdate.map(e => sql`WHEN ${e.id} THEN ${e.time}`),
                sql` `
              )}
            END,
            updated_at = NOW()
          WHERE id IN (${sql.join(toUpdate.map(e => e.id!), sql`, `)})
          RETURNING *
        `;

        const updated = await tx.execute(updateQuery);
        results.push(...(updated as any));
      }

      // Batch insert new events
      if (toInsert.length > 0) {
        const inserted = await tx
          .insert(schema.events)
          .values(
            toInsert.map(event => ({
              tripId,
              date: event.date || new Date(),
              time: event.time || '00:00',
              title: event.title || 'Untitled Event',
              type: event.type || 'social',
              venue: event.venue || 'TBD',
              talentIds: event.talentIds,
              partyThemeId: event.partyThemeId,
              createdAt: new Date(),
              updatedAt: new Date(),
            }))
          )
          .returning();
        results.push(...inserted);
      }

      return results;
    });
  }

  /**
   * OPTIMIZED: Global search with parallel queries and result ranking
   */
  async globalSearchOptimized(
    searchTerm: string,
    types: string[] = ['trips', 'events', 'talent', 'locations'],
    limit: number = 10
  ): Promise<any> {
    // Build all search queries
    const searchPromises: Array<Promise<any>> = [];

    if (types.includes('trips')) {
      searchPromises.push(
        this.db
          .select({
            type: sql`'trip'`.as('type'),
            id: schema.trips.id,
            name: schema.trips.name,
            description: schema.trips.description,
            slug: schema.trips.slug,
            relevance: sql<number>`
              ts_rank(
                to_tsvector('english', ${schema.trips.name} || ' ' || COALESCE(${schema.trips.description}, '')),
                plainto_tsquery('english', ${searchTerm})
              )
            `.as('relevance'),
          })
          .from(schema.trips)
          .where(
            sql`to_tsvector('english', ${schema.trips.name} || ' ' || COALESCE(${schema.trips.description}, '')) @@ plainto_tsquery('english', ${searchTerm})`
          )
          .orderBy(desc(sql`relevance`))
          .limit(limit)
      );
    }

    if (types.includes('events')) {
      searchPromises.push(
        this.db
          .select({
            type: sql`'event'`.as('type'),
            id: schema.events.id,
            title: schema.events.title,
            description: sql`NULL::text`.as('description'), // Events don't have descriptions
            tripId: schema.events.tripId,
            relevance: sql<number>`
              ts_rank(
                to_tsvector('english', ${schema.events.title}),
                plainto_tsquery('english', ${searchTerm})
              )
            `.as('relevance'),
          })
          .from(schema.events)
          .where(
            sql`to_tsvector('english', ${schema.events.title}) @@ plainto_tsquery('english', ${searchTerm})`
          )
          .orderBy(desc(sql`relevance`))
          .limit(limit)
      );
    }

    if (types.includes('talent')) {
      searchPromises.push(
        this.db
          .select({
            type: sql`'talent'`.as('type'),
            id: schema.talent.id,
            name: schema.talent.name,
            bio: schema.talent.bio,
            knownFor: schema.talent.knownFor,
            relevance: sql<number>`
              ts_rank(
                to_tsvector('english', ${schema.talent.name} || ' ' || COALESCE(${schema.talent.bio}, '')),
                plainto_tsquery('english', ${searchTerm})
              )
            `.as('relevance'),
          })
          .from(schema.talent)
          .where(
            sql`to_tsvector('english', ${schema.talent.name} || ' ' || COALESCE(${schema.talent.bio}, '')) @@ plainto_tsquery('english', ${searchTerm})`
          )
          .orderBy(desc(sql`relevance`))
          .limit(limit)
      );
    }

    if (types.includes('locations')) {
      searchPromises.push(
        this.db
          .select({
            type: sql`'location'`.as('type'),
            id: schema.locations.id,
            name: schema.locations.name,
            description: schema.locations.description,
            country: schema.locations.country,
            relevance: sql<number>`
              ts_rank(
                to_tsvector('english', ${schema.locations.name} || ' ' || COALESCE(${schema.locations.description}, '')),
                plainto_tsquery('english', ${searchTerm})
              )
            `.as('relevance'),
          })
          .from(schema.locations)
          .where(
            sql`to_tsvector('english', ${schema.locations.name} || ' ' || COALESCE(${schema.locations.description}, '')) @@ plainto_tsquery('english', ${searchTerm})`
          )
          .orderBy(desc(sql`relevance`))
          .limit(limit)
      );
    }

    // Execute all searches in parallel
    const results = await Promise.all(searchPromises);

    // Flatten and sort by relevance
    const allResults = results
      .flat()
      .sort((a, b) => (b.relevance || 0) - (a.relevance || 0))
      .slice(0, limit);

    // Group by type
    const groupedResults: any = {};
    for (const result of allResults) {
      const type = result.type + 's'; // pluralize
      if (!groupedResults[type]) {
        groupedResults[type] = [];
      }
      groupedResults[type].push(result);
    }

    return groupedResults;
  }

  /**
   * OPTIMIZED: Get trip with all related data using intelligent prefetching
   */
  async getTripCompleteOptimized(slug: string): Promise<any> {
    // Get trip first
    const [trip] = await this.db
      .select()
      .from(schema.trips)
      .where(eq(schema.trips.slug, slug));

    if (!trip) {
      return null;
    }

    // Load all related data in parallel with specific columns
    const [itinerary, events, talent, infoSections, ship] = await Promise.all([
      // Itinerary with location data
      this.db
        .select({
          id: schema.itinerary.id,
          tripId: schema.itinerary.tripId,
          date: schema.itinerary.date,
          day: schema.itinerary.day,
          locationName: schema.itinerary.locationName,
          arrivalTime: schema.itinerary.arrivalTime,
          departureTime: schema.itinerary.departureTime,
          allAboardTime: schema.itinerary.allAboardTime,
          locationImageUrl: schema.itinerary.locationImageUrl,
          description: schema.itinerary.description,
          highlights: schema.itinerary.highlights,
          orderIndex: schema.itinerary.orderIndex,
          segment: schema.itinerary.segment,
          location: schema.locations,
        })
        .from(schema.itinerary)
        .leftJoin(
          schema.locations,
          eq(schema.itinerary.locationId, schema.locations.id)
        )
        .where(eq(schema.itinerary.tripId, trip.id))
        .orderBy(asc(schema.itinerary.orderIndex)),

      // Events with party themes
      this.db
        .select({
          event: schema.events,
          partyTheme: schema.partyThemes,
        })
        .from(schema.events)
        .leftJoin(
          schema.partyThemes,
          eq(schema.events.partyThemeId, schema.partyThemes.id)
        )
        .where(eq(schema.events.tripId, trip.id))
        .orderBy(asc(schema.events.date), asc(schema.events.time)),

      // Talent with categories
      this.db
        .select({
          talent: schema.talent,
          category: schema.talentCategories,
          assignment: schema.tripTalent,
        })
        .from(schema.tripTalent)
        .innerJoin(
          schema.talent,
          eq(schema.tripTalent.talentId, schema.talent.id)
        )
        .leftJoin(
          schema.talentCategories,
          eq(schema.talent.talentCategoryId, schema.talentCategories.id)
        )
        .where(eq(schema.tripTalent.tripId, trip.id)),

      // Info sections
      this.db
        .select()
        .from(schema.tripInfoSections)
        .where(eq(schema.tripInfoSections.tripId, trip.id))
        .orderBy(asc(schema.tripInfoSections.orderIndex)),

      // Ship details if applicable
      trip.shipId
        ? this.db
            .select()
            .from(schema.ships)
            .where(eq(schema.ships.id, trip.shipId))
            .then((res) => res[0])
        : Promise.resolve(null),
    ]);

    return {
      trip: {
        ...trip,
        ship,
      },
      itinerary: itinerary.map((item) => ({
        ...item,
        location: item.location || undefined,
      })),
      events: events.map((e) => ({
        ...e.event,
        partyTheme: e.partyTheme || undefined,
      })),
      talent: talent.map((t) => ({
        ...t.talent,
        category: t.category?.category,
        role: t.assignment.role,
      })),
      tripInfoSections: infoSections,
    };
  }

  /**
   * OPTIMIZED: Admin dashboard stats with single aggregated query
   */
  async getDashboardStatsOptimized(): Promise<any> {
    // Use a single CTE query to get all stats at once
    const statsQuery = sql`
      WITH trip_stats AS (
        SELECT
          COUNT(*) as total_trips,
          COUNT(CASE WHEN start_date > CURRENT_DATE THEN 1 END) as upcoming_trips,
          COUNT(CASE WHEN start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE THEN 1 END) as active_trips,
          COUNT(CASE WHEN end_date < CURRENT_DATE THEN 1 END) as past_trips
        FROM ${schema.trips}
      ),
      event_stats AS (
        SELECT
          COUNT(*) as total_events,
          COUNT(DISTINCT trip_id) as trips_with_events
        FROM ${schema.events}
      ),
      talent_stats AS (
        SELECT
          COUNT(DISTINCT t.id) as total_talent,
          COUNT(DISTINCT tt.trip_id) as trips_with_talent
        FROM ${schema.talent} t
        LEFT JOIN ${schema.tripTalent} tt ON t.id = tt.talent_id
      ),
      location_stats AS (
        SELECT COUNT(*) as total_locations
        FROM ${schema.locations}
      )
      SELECT
        json_build_object(
          'trips', row_to_json(trip_stats),
          'events', row_to_json(event_stats),
          'talent', row_to_json(talent_stats),
          'locations', row_to_json(location_stats),
          'generated_at', NOW()
        ) as stats
      FROM trip_stats, event_stats, talent_stats, location_stats
    `;

    const result = await this.db.execute(statsQuery);
    return result[0]?.stats || {};
  }
}

/**
 * Query result caching strategies
 */
export class QueryCacheStrategies {
  /**
   * Cache key patterns for different query types
   */
  static getCacheKey(queryType: string, params: any): string {
    const patterns: Record<string, (p: any) => string> = {
      trip: (p) => `trip:${p.id || p.slug}`,
      tripComplete: (p) => `trip:complete:${p.slug}`,
      tripItinerary: (p) => `trip:${p.tripId}:itinerary`,
      tripEvents: (p) => `trip:${p.tripId}:events`,
      tripTalent: (p) => `trip:${p.tripId}:talent`,
      globalSearch: (p) => `search:${p.term}:${p.types.join(',')}`,
      dashboardStats: (p) => `dashboard:stats:${p.dateRange || 'all'}`,
    };

    return patterns[queryType]?.(params) || `${queryType}:${JSON.stringify(params)}`;
  }

  /**
   * Cache TTL recommendations by query type (in seconds)
   */
  static getCacheTTL(queryType: string): number {
    const ttls: Record<string, number> = {
      trip: 300, // 5 minutes
      tripComplete: 300, // 5 minutes
      tripItinerary: 600, // 10 minutes
      tripEvents: 300, // 5 minutes
      tripTalent: 600, // 10 minutes
      globalSearch: 60, // 1 minute
      dashboardStats: 30, // 30 seconds
      locations: 3600, // 1 hour (rarely changes)
      talentCategories: 3600, // 1 hour
      settings: 1800, // 30 minutes
    };

    return ttls[queryType] || 300; // Default 5 minutes
  }

  /**
   * Determine if query result should be cached
   */
  static shouldCache(queryType: string, resultSize: number): boolean {
    // Don't cache very large results
    if (resultSize > 1000) return false;

    // Always cache these query types
    const alwaysCache = [
      'trip',
      'tripComplete',
      'locations',
      'talentCategories',
      'settings',
    ];

    return alwaysCache.includes(queryType);
  }
}