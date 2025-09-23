import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../shared/schema';
import { eq, and, or, inArray, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

// Performance monitoring
interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: Date;
  rowCount?: number;
}

class PerformanceMonitor {
  private metrics: QueryMetrics[] = [];
  private slowQueryThreshold = 100; // ms

  logQuery(query: string, duration: number, rowCount?: number) {
    const metric: QueryMetrics = {
      query,
      duration,
      timestamp: new Date(),
      rowCount
    };

    this.metrics.push(metric);

    // Log slow queries
    if (duration > this.slowQueryThreshold) {
      console.warn(`⚠️ Slow query detected (${duration}ms):`, query.substring(0, 100));
    }

    // Keep only last 1000 queries in memory
    if (this.metrics.length > 1000) {
      this.metrics.shift();
    }
  }

  getMetrics() {
    return {
      totalQueries: this.metrics.length,
      averageDuration: this.metrics.reduce((sum, m) => sum + m.duration, 0) / this.metrics.length || 0,
      slowQueries: this.metrics.filter(m => m.duration > this.slowQueryThreshold),
      recentQueries: this.metrics.slice(-10)
    };
  }

  clearMetrics() {
    this.metrics = [];
  }
}

// Connection pool configuration for optimal performance
export interface PoolConfig {
  max?: number;              // Maximum connections (default: 20)
  min?: number;              // Minimum connections (default: 5)
  idleTimeout?: number;      // Idle timeout in seconds (default: 300)
  connectTimeout?: number;   // Connect timeout in seconds (default: 15)
  maxLifetime?: number;      // Maximum connection lifetime in seconds (default: 3600)
  statementCacheSize?: number; // Statement cache size (default: 100)
  applicationName?: string;  // Application name for monitoring
}

export class OptimizedDatabaseConnection {
  private static instance: OptimizedDatabaseConnection;
  private db!: PostgresJsDatabase<typeof schema>;
  private client!: postgres.Sql;
  private monitor = new PerformanceMonitor();
  private connectionPool: Map<string, postgres.Sql> = new Map();

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): OptimizedDatabaseConnection {
    if (!OptimizedDatabaseConnection.instance) {
      OptimizedDatabaseConnection.instance = new OptimizedDatabaseConnection();
    }
    return OptimizedDatabaseConnection.instance;
  }

  async initialize(databaseUrl: string, config?: PoolConfig) {
    const poolConfig = {
      max: config?.max || 20,
      min: config?.min || 5,
      idle_timeout: config?.idleTimeout || 300,
      connect_timeout: config?.connectTimeout || 15,
      max_lifetime: config?.maxLifetime || 3600,
      statement_cache_size: config?.statementCacheSize || 100,
      prepare: false, // Better for serverless
      ssl: process.env.NODE_ENV === 'production' ? 'require' as const : 'prefer' as const,
      transform: { undefined: null },
      connection: {
        application_name: config?.applicationName ||
          `kgay-travel-guides-${process.env.NODE_ENV || 'development'}`
      },
      // Advanced pool configuration
      onnotice: (notice: any) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('Database notice:', notice);
        }
      },
      debug: process.env.DEBUG_SQL === 'true',
      // Connection pool callbacks
      onclose: () => {
        console.log('Database connection closed');
      },
      onconnect: () => {
        if (process.env.NODE_ENV === 'development') {
          console.log('New database connection established');
        }
      }
    };

    try {
      this.client = postgres(databaseUrl, poolConfig);
      this.db = drizzle(this.client, {
        schema,
        logger: process.env.DEBUG_SQL === 'true'
      });

      // Test connection
      await this.client`SELECT 1`;

      console.log(`✅ Optimized database connection established (pool: ${poolConfig.min}-${poolConfig.max} connections)`);

      // Set up connection health monitoring
      this.startHealthMonitoring();

      return this.db;
    } catch (error) {
      console.error('❌ Failed to initialize database connection:', error);
      throw error;
    }
  }

  private startHealthMonitoring() {
    // Check connection health every 30 seconds
    setInterval(async () => {
      try {
        const start = Date.now();
        await this.client`SELECT 1`;
        const duration = Date.now() - start;

        if (duration > 1000) {
          console.warn(`⚠️ Database health check slow: ${duration}ms`);
        }
      } catch (error) {
        console.error('❌ Database health check failed:', error);
      }
    }, 30000);
  }

  getDb(): PostgresJsDatabase<typeof schema> {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  async transaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
    const start = Date.now();
    let retries = 3;
    let lastError: any;

    while (retries > 0) {
      try {
        const result = await this.db.transaction(async (tx) => {
          // Set transaction isolation level for better consistency
          await tx.execute(sql`SET TRANSACTION ISOLATION LEVEL READ COMMITTED`);
          return await fn(tx);
        });
        const duration = Date.now() - start;
        this.monitor.logQuery('TRANSACTION', duration);
        return result;
      } catch (error: any) {
        const duration = Date.now() - start;
        lastError = error;

        // Check for serialization errors and deadlocks
        if (error?.code === '40001' || error?.code === '40P01') {
          retries--;
          if (retries > 0) {
            console.log(`Transaction failed with ${error.code}, retrying... (${retries} retries left)`);
            // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, 3 - retries) * 100));
            continue;
          }
        }

        this.monitor.logQuery('TRANSACTION (FAILED)', duration);
        console.error('Transaction failed:', error);
        throw error;
      }
    }

    throw lastError;
  }

  async executeWithMetrics<T>(
    operation: () => Promise<T>,
    queryName: string
  ): Promise<T> {
    const start = Date.now();
    try {
      const result = await operation();
      const duration = Date.now() - start;
      const rowCount = Array.isArray(result) ? result.length : undefined;
      this.monitor.logQuery(queryName, duration, rowCount);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.monitor.logQuery(`${queryName} (FAILED)`, duration);
      throw error;
    }
  }

  getMetrics() {
    return this.monitor.getMetrics();
  }

  async getPoolStats() {
    // Get connection pool statistics
    const stats = await this.client`
      SELECT
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'active') as active,
        count(*) FILTER (WHERE state = 'idle') as idle,
        count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction,
        max(query_start) as last_activity
      FROM pg_stat_activity
      WHERE datname = current_database()
    `;

    return stats[0];
  }

  async closeConnection() {
    if (this.client) {
      await this.client.end();
      console.log('Database connection closed');
    }
  }
}

// Batch query utilities for preventing N+1 queries
export class BatchQueryBuilder {
  private db: PostgresJsDatabase<typeof schema>;

  constructor(db: PostgresJsDatabase<typeof schema>) {
    this.db = db;
  }

  // Batch load itinerary items for multiple trips
  async batchLoadItinerary(tripIds: number[]): Promise<Map<number, schema.Itinerary[]>> {
    if (tripIds.length === 0) return new Map();

    // Select only columns that exist in the current DB schema
    const items = await this.db
      .select({
        id: schema.itinerary.id,
        tripId: schema.itinerary.tripId,
        date: schema.itinerary.date,
        day: schema.itinerary.day,
        arrivalTime: schema.itinerary.arrivalTime,
        departureTime: schema.itinerary.departureTime,
        allAboardTime: schema.itinerary.allAboardTime,
        portImageUrl: schema.itinerary.portImageUrl,
        description: schema.itinerary.description,
        highlights: schema.itinerary.highlights,
        orderIndex: schema.itinerary.orderIndex,
        segment: schema.itinerary.segment,
        locationId: schema.itinerary.locationId,
        locationTypeId: schema.itinerary.locationTypeId,
      })
      .from(schema.itinerary)
      .where(inArray(schema.itinerary.tripId, tripIds))
      .orderBy(schema.itinerary.orderIndex);

    // Group by tripId
    const grouped = new Map<number, schema.Itinerary[]>();
    for (const item of items) {
      const tripItems = grouped.get(item.tripId) || [];
      tripItems.push(item);
      grouped.set(item.tripId, tripItems);
    }

    return grouped;
  }

  // Batch load events for multiple trips
  async batchLoadEvents(tripIds: number[]): Promise<Map<number, schema.Event[]>> {
    if (tripIds.length === 0) return new Map();

    const events = await this.db
      .select()
      .from(schema.events)
      .where(inArray(schema.events.tripId, tripIds))
      .orderBy(schema.events.date, schema.events.time);

    // Group by tripId
    const grouped = new Map<number, schema.Event[]>();
    for (const event of events) {
      const tripEvents = grouped.get(event.tripId) || [];
      tripEvents.push(event);
      grouped.set(event.tripId, tripEvents);
    }

    return grouped;
  }

  // Batch load talent for multiple trips
  async batchLoadTalent(tripIds: number[]): Promise<Map<number, any[]>> {
    if (tripIds.length === 0) return new Map();

    const talentData = await this.db
      .select({
        tripId: schema.tripTalent.tripId,
        id: schema.talent.id,
        name: schema.talent.name,
        talentCategoryId: schema.talent.talentCategoryId,
        bio: schema.talent.bio,
        knownFor: schema.talent.knownFor,
        profileImageUrl: schema.talent.profileImageUrl,
        socialLinks: schema.talent.socialLinks,
        website: schema.talent.website,
        createdAt: schema.talent.createdAt,
        updatedAt: schema.talent.updatedAt,
        category: schema.talentCategories.category
      })
      .from(schema.tripTalent)
      .innerJoin(schema.talent, eq(schema.tripTalent.talentId, schema.talent.id))
      .leftJoin(schema.talentCategories, eq(schema.talent.talentCategoryId, schema.talentCategories.id))
      .where(inArray(schema.tripTalent.tripId, tripIds));

    // Group by tripId
    const grouped = new Map<number, any[]>();
    for (const item of talentData) {
      const tripTalent = grouped.get(item.tripId) || [];
      // Extract talent data without tripId
      const { tripId, ...talentInfo } = item;
      tripTalent.push(talentInfo);
      grouped.set(item.tripId, tripTalent);
    }

    return grouped;
  }

  // Batch load locations for itinerary items (updated schema)
  async batchLoadPorts(locationIds: number[]): Promise<Map<number, any>> {
    if (locationIds.length === 0) return new Map();

    const locations = await this.db
      .select()
      .from(schema.locations)
      .where(inArray(schema.locations.id, locationIds));

    const locationMap = new Map<number, any>();
    for (const location of locations) {
      locationMap.set(location.id, location);
    }

    return locationMap;
  }

  // Batch load party themes for events (updated for new schema)
  async batchLoadPartyThemes(partyThemeIds: number[]): Promise<Map<number, any>> {
    if (partyThemeIds.length === 0) return new Map();

    const partyThemes = await this.db
      .select()
      .from(schema.partyThemes)
      .where(inArray(schema.partyThemes.id, partyThemeIds));

    const partyThemeMap = new Map<number, any>();
    for (const partyTheme of partyThemes) {
      partyThemeMap.set(partyTheme.id, partyTheme);
    }

    return partyThemeMap;
  }

  // Load complete trip data with all related entities (optimized)
  async loadCompleteTripData(tripIds: number[]) {
    if (tripIds.length === 0) return [];

    // Execute all queries in parallel
    const [trips, itineraryMap, eventsMap, talentMap, infoSections] = await Promise.all([
      this.db.select().from(schema.cruises).where(inArray(schema.cruises.id, tripIds)),
      this.batchLoadItinerary(tripIds),
      this.batchLoadEvents(tripIds),
      this.batchLoadTalent(tripIds),
      this.db.select().from(schema.tripInfoSections).where(inArray(schema.tripInfoSections.tripId, tripIds))
    ]);

    // Get all unique location and party theme IDs
    const locationIds = new Set<number>();
    const partyThemeIds = new Set<number>();

    itineraryMap.forEach(items => {
      items.forEach(item => {
        if (item.locationId) locationIds.add(item.locationId);
      });
    });

    eventsMap.forEach(events => {
      events.forEach(event => {
        if (event.partyThemeId) partyThemeIds.add(event.partyThemeId);
      });
    });

    // Load locations and party themes
    const [locationsMap, partyThemesMap] = await Promise.all([
      this.batchLoadPorts(Array.from(locationIds)),
      this.batchLoadPartyThemes(Array.from(partyThemeIds))
    ]);

    // Assemble complete trip data
    return trips.map(trip => {
      const itinerary = itineraryMap.get(trip.id) || [];
      const events = eventsMap.get(trip.id) || [];
      const talent = talentMap.get(trip.id) || [];
      const sections = infoSections.filter(s => s.tripId === trip.id);

      // Enrich itinerary with location data and transform fields
      const enrichedItinerary = itinerary.map(item => {
        const location = item.locationId ? locationsMap.get(item.locationId) : undefined;
        return {
          ...item,
          location: location ? {
            ...location,
            imageUrl: location.imageUrl || location.image_url, // Support both naming conventions
            createdAt: location.createdAt || location.created_at,
            updatedAt: location.updatedAt || location.updated_at
          } : undefined
        };
      });

      // Enrich events with party theme data and transform fields
      const enrichedEvents = events.map(event => {
        const partyTheme = event.partyThemeId ? partyThemesMap.get(event.partyThemeId) : undefined;
        return {
          ...event,
          partyTheme: partyTheme ? {
            ...partyTheme,
            imageUrl: partyTheme.imageUrl || partyTheme.image_url, // Support both naming conventions
            createdAt: partyTheme.createdAt || partyTheme.created_at,
            updatedAt: partyTheme.updatedAt || partyTheme.updated_at
          } : undefined
        };
      });

      return {
        trip,
        itinerary: enrichedItinerary,
        events: enrichedEvents,
        talent,
        tripInfoSections: sections // Use consistent naming
      };
    });
  }
}

// Export singleton instance
export const optimizedDb = OptimizedDatabaseConnection.getInstance();