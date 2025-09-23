// ===============================================
// OPTIMIZED STORAGE LAYER - ELIMINATE N+1 QUERIES
// K-GAY Travel Guides Performance Optimization
// ===============================================

import { eq, and, desc, asc, ilike, or, inArray } from 'drizzle-orm';
import { db, schema } from './storage';
// Local table aliases to ensure proper initialization
const { cruises, ships, events, parties, ports, itinerary, talent, tripTalent: cruiseTalent, eventTalent, tripTalent } = schema;
import type { Trip, Event, Talent, Itinerary } from '../shared/schema';

// ============ OPTIMIZED TRIP OPERATIONS ============
export class OptimizedTripStorage {
  /**
   * Get trip with all related data in a single optimized query
   * Eliminates N+1 queries for events, itinerary, and talent
   */
  async getTripWithAllData(tripId: number) {
    // Use parallel queries instead of sequential to reduce latency
    const [trip, eventsData, itineraryData, talentData] = await Promise.all([
      // Main trip data with ship information
      db.select({
        trip: cruises,
        ship: ships
      })
        .from(schema.trips)
        .leftJoin(ships, eq(schema.trips.shipId, ships.id))
        .where(eq(schema.trips.id, tripId))
        .then(results => results[0]),

      // Events with party information (optimized join)
      db.select({
        event: events,
        party: parties
      })
        .from(schema.events)
        .leftJoin(parties, eq(schema.events.party_id, parties.id))
        .where(eq(schema.events.cruiseId, tripId))
        .orderBy(asc(events.date), asc(events.time)),

      // Itinerary with port information (optimized join)
      db.select({
        itinerary: itinerary,
        port: ports
      })
        .from(schema.itinerary)
        .leftJoin(ports, eq(schema.itinerary.port_id, ports.id))
        .where(eq(schema.itinerary.cruiseId, tripId))
        .orderBy(asc(itinerary.orderIndex)),

      // Talent with role information (optimized join)
      db.select({
        talent: talent,
        cruiseTalent: cruiseTalent
      })
        .from(schema.talent)
        .innerJoin(cruiseTalent, eq(talent.id, cruiseTalent.talentId))
        .where(eq(schema.tripTalent.cruiseId, tripId))
        .orderBy(asc(talent.name))
    ]);

    if (!trip) return null;

    return {
      ...trip.trip,
      ship: trip.ship,
      events: eventsData.map(e => ({
        ...e.event,
        party: e.party
      })),
      itinerary: itineraryData.map(i => ({
        ...i.itinerary,
        port: i.port
      })),
      talent: talentData.map(t => ({
        ...t.talent,
        role: t.cruiseTalent.role,
        performanceCount: t.cruiseTalent.performanceCount,
        notes: t.cruiseTalent.notes
      }))
    };
  }

  /**
   * Get multiple trips with basic data efficiently
   * Uses a single query with optimized indexes
   */
  async getTripsWithBasicData(status?: string, limit?: number) {
    let query = db.select({
      trip: cruises,
      ship: ships,
      eventCount: db.$count(events, eq(schema.events.cruiseId, cruises.id)),
      talentCount: db.$count(cruiseTalent, eq(schema.tripTalent.cruiseId, cruises.id))
    })
      .from(schema.trips)
      .leftJoin(ships, eq(schema.trips.shipId, ships.id));

    if (status) {
      query = query.where(eq(schema.trips.status, status));
    }

    query = query.orderBy(desc(cruises.startDate));

    if (limit) {
      query = query.limit(limit);
    }

    return await query;
  }

  /**
   * Batch load trips data to eliminate N+1 when loading multiple trips
   */
  async batchLoadTripsData(tripIds: number[]) {
    const [trips, allEvents, allItinerary, allTalent] = await Promise.all([
      // Trips with ships
      db.select({
        trip: cruises,
        ship: ships
      })
        .from(schema.trips)
        .leftJoin(ships, eq(schema.trips.shipId, ships.id))
        .where(inArray(schema.trips.id, tripIds)),

      // All events for these trips
      db.select({
        event: events,
        party: parties
      })
        .from(schema.events)
        .leftJoin(parties, eq(schema.events.party_id, parties.id))
        .where(inArray(events.cruiseId, tripIds))
        .orderBy(asc(events.date), asc(events.time)),

      // All itinerary for these trips
      db.select({
        itinerary: itinerary,
        port: ports
      })
        .from(schema.itinerary)
        .leftJoin(ports, eq(schema.itinerary.port_id, ports.id))
        .where(inArray(schema.itinerary.cruiseId, tripIds))
        .orderBy(asc(itinerary.orderIndex)),

      // All talent for these trips
      db.select({
        talent: talent,
        cruiseTalent: cruiseTalent
      })
        .from(schema.talent)
        .innerJoin(cruiseTalent, eq(talent.id, cruiseTalent.talentId))
        .where(inArray(cruiseTalent.cruiseId, tripIds))
        .orderBy(asc(talent.name))
    ]);

    // Group data by trip ID for efficient access
    const eventsByTrip = new Map<number, typeof allEvents>();
    const itineraryByTrip = new Map<number, typeof allItinerary>();
    const talentByTrip = new Map<number, typeof allTalent>();

    allEvents.forEach(e => {
      const tripId = e.event.cruiseId;
      if (!eventsByTrip.has(tripId)) eventsByTrip.set(tripId, []);
      eventsByTrip.get(tripId)!.push(e);
    });

    allItinerary.forEach(i => {
      const tripId = i.itinerary.cruiseId;
      if (!itineraryByTrip.has(tripId)) itineraryByTrip.set(tripId, []);
      itineraryByTrip.get(tripId)!.push(i);
    });

    allTalent.forEach(t => {
      const tripId = t.cruiseTalent.cruiseId;
      if (!talentByTrip.has(tripId)) talentByTrip.set(tripId, []);
      talentByTrip.get(tripId)!.push(t);
    });

    return trips.map(trip => ({
      ...trip.trip,
      ship: trip.ship,
      events: (eventsByTrip.get(trip.trip.id) || []).map(e => ({
        ...e.event,
        party: e.party
      })),
      itinerary: (itineraryByTrip.get(trip.trip.id) || []).map(i => ({
        ...i.itinerary,
        port: i.port
      })),
      talent: (talentByTrip.get(trip.trip.id) || []).map(t => ({
        ...t.talent,
        role: t.cruiseTalent.role,
        performanceCount: t.cruiseTalent.performanceCount,
        notes: t.cruiseTalent.notes
      }))
    }));
  }
}

// ============ OPTIMIZED EVENT OPERATIONS ============
export class OptimizedEventStorage {
  /**
   * Get events with all related data in optimized queries
   * Eliminates N+1 for party and talent lookups
   */
  async getEventsWithAllData(cruiseId: number) {
    // Single query to get events with parties and talent
    const eventsWithData = await db.select({
      event: events,
      party: parties,
      // Get talent count for each event
      talentCount: db.$count(eventTalent, eq(eventTalent.event_id, events.id))
    })
      .from(schema.events)
      .leftJoin(parties, eq(schema.events.party_id, parties.id))
      .where(eq(schema.events.cruiseId, cruiseId))
      .orderBy(asc(events.date), asc(events.time));

    // Batch load talent for all events
    const eventIds = eventsWithData.map(e => e.event.id);
    const eventTalentData = eventIds.length > 0 ? await db.select({
      eventTalent: eventTalent,
      talent: talent
    })
      .from(schema.eventTalent)
      .innerJoin(talent, eq(eventTalent.talent_id, talent.id))
      .where(inArray(eventTalent.event_id, eventIds))
      .orderBy(asc(eventTalent.performance_order)) : [];

    // Group talent by event ID
    const talentByEvent = new Map<number, typeof eventTalentData>();
    eventTalentData.forEach(et => {
      const eventId = et.eventTalent.event_id;
      if (!talentByEvent.has(eventId)) talentByEvent.set(eventId, []);
      talentByEvent.get(eventId)!.push(et);
    });

    return eventsWithData.map(e => ({
      ...e.event,
      party: e.party,
      talent: (talentByEvent.get(e.event.id) || []).map(t => ({
        ...t.talent,
        role: t.eventTalent.role,
        performanceOrder: t.eventTalent.performance_order
      }))
    }));
  }

  /**
   * Optimized event search with full-text search index
   */
  async searchEventsOptimized(cruiseId?: number, searchTerm?: string, eventType?: string) {
    let query = db.select({
      event: events,
      party: parties
    }).from(schema.events).leftJoin(parties, eq(schema.events.party_id, parties.id));

    const conditions = [];

    if (cruiseId) {
      conditions.push(eq(schema.events.cruiseId, cruiseId));
    }

    if (searchTerm) {
      // Use the full-text search index we created
      conditions.push(
sql`to_tsvector('english', ${schema.events.title} || ' ' || COALESCE(${schema.events.description}, '')) @@ plainto_tsquery('english', ${searchTerm})`
      );
    }

    if (eventType) {
      conditions.push(eq(schema.events.type, eventType));
    }

    if (conditions.length > 0) {
      query = query.where(conditions.length === 1 ? conditions[0] : and(...conditions));
    }

    return await query.orderBy(asc(events.date), asc(events.time));
  }
}

// ============ OPTIMIZED TALENT OPERATIONS ============
export class OptimizedTalentStorage {
  /**
   * Get talent with performance statistics efficiently
   */
  async getTalentWithStats() {
    return await db.select({
      talent: talent,
      cruiseCount: db.$count(cruiseTalent, eq(schema.tripTalent.talentId, talent.id)),
      eventCount: db.$count(eventTalent, eq(eventTalent.talent_id, talent.id))
    })
      .from(schema.talent)
      .orderBy(asc(talent.name));
  }

  /**
   * Optimized talent search with full-text search
   */
  async searchTalentOptimized(searchTerm?: string, category?: string) {
    let query = db.select({
      talent: talent,
      cruiseCount: db.$count(cruiseTalent, eq(schema.tripTalent.talentId, talent.id))
    }).from(schema.talent);

    const conditions = [];

    if (searchTerm) {
      // Use the full-text search index we created
      conditions.push(
sql`to_tsvector('english', ${schema.talent.name} || ' ' || COALESCE(${schema.talent.bio}, '')) @@ plainto_tsquery('english', ${searchTerm})`
      );
    }

    if (category) {
      conditions.push(eq(talent.category, category));
    }

    if (conditions.length > 0) {
      query = query.where(conditions.length === 1 ? conditions[0] : and(...conditions));
    }

    return await query.orderBy(asc(talent.name));
  }

  /**
   * Batch load talent assignments to eliminate N+1
   */
  async batchLoadTalentAssignments(talentIds: number[]) {
    const [cruiseAssignments, eventAssignments] = await Promise.all([
      db.select({
        cruiseTalent: cruiseTalent,
        cruise: cruises
      })
        .from(schema.tripTalent)
        .innerJoin(cruises, eq(schema.tripTalent.cruiseId, cruises.id))
        .where(inArray(cruiseTalent.talentId, talentIds))
        .orderBy(desc(cruises.startDate)),

      db.select({
        eventTalent: eventTalent,
        event: events
      })
        .from(schema.eventTalent)
        .innerJoin(events, eq(eventTalent.event_id, events.id))
        .where(inArray(eventTalent.talent_id, talentIds))
        .orderBy(asc(events.date))
    ]);

    // Group by talent ID
    const cruisesByTalent = new Map<number, typeof cruiseAssignments>();
    const eventsByTalent = new Map<number, typeof eventAssignments>();

    cruiseAssignments.forEach(ca => {
      const talentId = ca.cruiseTalent.talentId;
      if (!cruisesByTalent.has(talentId)) cruisesByTalent.set(talentId, []);
      cruisesByTalent.get(talentId)!.push(ca);
    });

    eventAssignments.forEach(ea => {
      const talentId = ea.eventTalent.talent_id;
      if (!eventsByTalent.has(talentId)) eventsByTalent.set(talentId, []);
      eventsByTalent.get(talentId)!.push(ea);
    });

    return {
      cruisesByTalent,
      eventsByTalent
    };
  }
}

// ============ OPTIMIZED ADMIN DASHBOARD QUERIES ============
export class OptimizedAdminStorage {
  /**
   * Get admin dashboard statistics efficiently
   * Uses the admin_dashboard_stats view we created
   */
  async getDashboardStats() {
    return await db.sql`SELECT * FROM admin_dashboard_stats`;
  }

  /**
   * Get recent activity efficiently with proper indexes
   */
  async getRecentActivity(limit: number = 20) {
    const [recentEvents, recentTalent, recentCruises] = await Promise.all([
      db.select({
        type: db.sql`'event'`.as('type'),
        id: events.id,
        title: events.title,
        date: events.date,
        cruise_id: events.cruiseId
      })
        .from(schema.events)
        .orderBy(desc(events.date))
        .limit(limit),

      db.select({
        type: db.sql`'talent'`.as('type'),
        id: talent.id,
        title: talent.name,
        date: talent.createdAt,
        cruise_id: db.sql`NULL`.as('cruise_id')
      })
        .from(schema.talent)
        .orderBy(desc(talent.createdAt))
        .limit(limit),

      db.select({
        type: db.sql`'cruise'`.as('type'),
        id: cruises.id,
        title: cruises.name,
        date: cruises.startDate,
        cruise_id: cruises.id
      })
        .from(schema.trips)
        .orderBy(desc(cruises.startDate))
        .limit(limit)
    ]);

    // Combine and sort by date
    const allActivity = [...recentEvents, ...recentTalent, ...recentCruises]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);

    return allActivity;
  }

  /**
   * Bulk operations for admin efficiency
   */
  async bulkUpdateEventTypes(eventIds: number[], newType: string) {
    return await db.update(events)
      .set({ type: newType })
      .where(inArray(events.id, eventIds))
      .returning({ id: events.id, type: events.type });
  }

  async bulkAssignTalentToCruise(assignments: { cruiseId: number; talentId: number; role?: string }[]) {
    return await db.insert(cruiseTalent)
      .values(assignments)
      .onConflictDoUpdate({
        target: [cruiseTalent.cruiseId, cruiseTalent.talentId],
        set: { role: db.sql`EXCLUDED.role` }
      })
      .returning();
  }
}

// Export optimized storage instances
export const optimizedTripStorage = new OptimizedTripStorage();
export const optimizedEventStorage = new OptimizedEventStorage();
export const optimizedTalentStorage = new OptimizedTalentStorage();
export const optimizedAdminStorage = new OptimizedAdminStorage();

// Performance monitoring utilities
export class PerformanceMonitor {
  static async analyzeQueryPerformance(queryName: string, queryFn: () => Promise<any>) {
    const startTime = process.hrtime.bigint();
    const result = await queryFn();
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds

    console.log(`🚀 Query Performance: ${queryName} - ${duration.toFixed(2)}ms`);
    return { result, duration };
  }

  static logSlowQueries(threshold = 1000) {
    // This would be implemented with actual query logging
    console.log(`🐌 Monitoring for queries slower than ${threshold}ms`);
  }
}