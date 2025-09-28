import { getSupabaseAdmin } from '../supabase-admin';
import type { SupabaseClient } from '@supabase/supabase-js';

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

export class OptimizedDatabaseConnection {
  private static instance: OptimizedDatabaseConnection;
  private supabaseAdmin!: SupabaseClient;
  private monitor = new PerformanceMonitor();
  private isHealthy = true;

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): OptimizedDatabaseConnection {
    if (!OptimizedDatabaseConnection.instance) {
      OptimizedDatabaseConnection.instance = new OptimizedDatabaseConnection();
    }
    return OptimizedDatabaseConnection.instance;
  }

  async initialize() {
    try {
      this.supabaseAdmin = getSupabaseAdmin();

      // Test connection
      const { error } = await this.supabaseAdmin
        .from('trips')
        .select('id')
        .limit(1);

      if (error) {
        throw error;
      }

      console.log('✅ Optimized Supabase connection established');

      // Set up connection health monitoring
      this.startHealthMonitoring();

      return this.supabaseAdmin;
    } catch (error) {
      console.error('❌ Failed to initialize Supabase connection:', error);
      throw error;
    }
  }

  private startHealthMonitoring() {
    // Check connection health every 30 seconds
    setInterval(async () => {
      try {
        const start = Date.now();
        const { error } = await this.supabaseAdmin
          .from('trips')
          .select('id')
          .limit(1);

        const duration = Date.now() - start;

        if (duration > 1000) {
          console.warn(`⚠️ Database health check slow (${duration}ms)`);
        }

        this.isHealthy = !error;
      } catch (error) {
        console.error('❌ Health check failed:', error);
        this.isHealthy = false;
      }
    }, 30000);
  }

  getDb() {
    return this.supabaseAdmin;
  }

  getClient() {
    return this.supabaseAdmin;
  }

  // Execute a query with metrics
  async executeWithMetrics<T>(
    queryFn: () => Promise<T>,
    queryName: string
  ): Promise<T> {
    const start = Date.now();
    try {
      const result = await queryFn();
      const duration = Date.now() - start;

      this.monitor.logQuery(queryName, duration);

      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.monitor.logQuery(`${queryName} (failed)`, duration);
      throw error;
    }
  }

  getMetrics() {
    return this.monitor.getMetrics();
  }

  clearMetrics() {
    this.monitor.clearMetrics();
  }

  isConnectionHealthy() {
    return this.isHealthy;
  }

  async close() {
    // Supabase client doesn't need explicit closing
    console.log('🔒 Supabase connection closed');
  }
}

// Batch query builder for optimized operations
export class BatchQueryBuilder {
  private supabaseAdmin: SupabaseClient;
  private monitor = new PerformanceMonitor();

  constructor(supabaseAdmin: SupabaseClient) {
    this.supabaseAdmin = supabaseAdmin;
  }

  // Load multiple trips with all related data
  async loadCompleteTripData(tripIds: number[]) {
    const start = Date.now();

    try {
      // Execute all queries in parallel
      const [trips, events, itinerary, talent, infoSections] = await Promise.all([
        // Load trips
        this.supabaseAdmin
          .from('trips')
          .select('*')
          .in('id', tripIds),

        // Load events
        this.supabaseAdmin
          .from('events')
          .select('*')
          .in('trip_id', tripIds)
          .order('start_time'),

        // Load itinerary
        this.supabaseAdmin
          .from('itinerary')
          .select('*')
          .in('trip_id', tripIds)
          .order('day')
          .order('display_order'),

        // Load talent assignments
        this.supabaseAdmin
          .from('trip_talent')
          .select(`
            *,
            talent(*)
          `)
          .in('trip_id', tripIds),

        // Load info sections
        this.supabaseAdmin
          .from('trip_info_sections')
          .select('*')
          .in('trip_id', tripIds)
          .order('display_order')
      ]);

      const duration = Date.now() - start;
      this.monitor.logQuery(`loadCompleteTripData(${tripIds.length} trips)`, duration);

      // Check for errors
      if (trips.error || events.error || itinerary.error || talent.error || infoSections.error) {
        throw new Error('Failed to load complete trip data');
      }

      // Group data by trip ID
      const tripDataMap = new Map<number, any>();

      trips.data?.forEach(trip => {
        tripDataMap.set(trip.id, {
          ...trip,
          events: [],
          itinerary: [],
          talent: [],
          infoSections: []
        });
      });

      events.data?.forEach(event => {
        const trip = tripDataMap.get(event.trip_id);
        if (trip) {
          trip.events.push(event);
        }
      });

      itinerary.data?.forEach(stop => {
        const trip = tripDataMap.get(stop.trip_id);
        if (trip) {
          trip.itinerary.push(stop);
        }
      });

      talent.data?.forEach(assignment => {
        const trip = tripDataMap.get(assignment.trip_id);
        if (trip) {
          trip.talent.push(assignment.talent);
        }
      });

      infoSections.data?.forEach(section => {
        const trip = tripDataMap.get(section.trip_id);
        if (trip) {
          trip.infoSections.push(section);
        }
      });

      return Array.from(tripDataMap.values());
    } catch (error) {
      const duration = Date.now() - start;
      this.monitor.logQuery(`loadCompleteTripData(failed)`, duration);
      throw error;
    }
  }

  // Batch insert with conflict handling
  async batchInsert<T>(
    tableName: string,
    records: T[],
    onConflict?: string
  ): Promise<any[]> {
    const start = Date.now();

    try {
      const { data, error } = await this.supabaseAdmin
        .from(tableName)
        .upsert(records, {
          onConflict: onConflict || 'id'
        })
        .select();

      const duration = Date.now() - start;
      this.monitor.logQuery(`batchInsert(${tableName}, ${records.length} records)`, duration);

      if (error) throw error;
      return data || [];
    } catch (error) {
      const duration = Date.now() - start;
      this.monitor.logQuery(`batchInsert(${tableName}, failed)`, duration);
      throw error;
    }
  }

  // Batch update with optimized queries
  async batchUpdate<T>(
    tableName: string,
    updates: Array<{ id: number | string; data: Partial<T> }>
  ): Promise<any[]> {
    const start = Date.now();

    try {
      // Group updates by common data to minimize queries
      const updateGroups = new Map<string, { ids: (number | string)[]; data: Partial<T> }>();

      updates.forEach(update => {
        const key = JSON.stringify(update.data);
        if (!updateGroups.has(key)) {
          updateGroups.set(key, { ids: [], data: update.data });
        }
        updateGroups.get(key)!.ids.push(update.id);
      });

      // Execute grouped updates in parallel
      const updatePromises = Array.from(updateGroups.values()).map(group =>
        this.supabaseAdmin
          .from(tableName)
          .update(group.data)
          .in('id', group.ids)
          .select()
      );

      const results = await Promise.all(updatePromises);
      const duration = Date.now() - start;
      this.monitor.logQuery(`batchUpdate(${tableName}, ${updates.length} records)`, duration);

      // Combine all results
      return results.flatMap(r => r.data || []);
    } catch (error) {
      const duration = Date.now() - start;
      this.monitor.logQuery(`batchUpdate(${tableName}, failed)`, duration);
      throw error;
    }
  }

  // Batch delete with optimized queries
  async batchDelete(
    tableName: string,
    ids: (number | string)[]
  ): Promise<void> {
    const start = Date.now();

    try {
      const { error } = await this.supabaseAdmin
        .from(tableName)
        .delete()
        .in('id', ids);

      const duration = Date.now() - start;
      this.monitor.logQuery(`batchDelete(${tableName}, ${ids.length} records)`, duration);

      if (error) throw error;
    } catch (error) {
      const duration = Date.now() - start;
      this.monitor.logQuery(`batchDelete(${tableName}, failed)`, duration);
      throw error;
    }
  }

  getMetrics() {
    return this.monitor.getMetrics();
  }
}

// Export singleton instances
export const optimizedConnection = OptimizedDatabaseConnection.getInstance();
export let batchQueryBuilder: BatchQueryBuilder;

// Initialize on first import
(async () => {
  try {
    const db = await optimizedConnection.initialize();
    batchQueryBuilder = new BatchQueryBuilder(db);
    console.log('✅ Optimized Supabase storage initialized');
  } catch (error) {
    console.error('❌ Failed to initialize optimized storage:', error);
  }
})();