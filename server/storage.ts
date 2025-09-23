import { eq, and, desc, asc, ilike, or, inArray } from 'drizzle-orm';

// Load environment variables only for development
(async () => {
  if (process.env.NODE_ENV !== 'production') {
    const { config } = await import('dotenv');
    config();
  }
})();
import type {
  Profile,
  InsertProfile,
  Trip,
  Itinerary,
  Event,
  Talent,
  TalentCategory,
  Settings
} from "../shared/schema";

// Debug environment variables in production
if (process.env.NODE_ENV === 'production') {
  console.log('Environment check:');
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  console.log('- DATABASE_URL exists:', !!process.env.DATABASE_URL);
  console.log('- DATABASE_URL length:', process.env.DATABASE_URL?.length || 0);
}

// Database connection with development mock fallback
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../shared/schema';
// Local aliases to avoid long schema prefix and maintain backward compatibility
const talentCategories = schema.talentCategories;
const settings = schema.settings;
const tripInfoSections = schema.tripInfoSections;
const talent = schema.talent;
import { OptimizedDatabaseConnection, BatchQueryBuilder } from './storage/OptimizedStorage';
import { cacheManager, CacheManager, Cacheable, CacheInvalidate } from './cache/CacheManager';

let db: any;
let batchQueryBuilder: BatchQueryBuilder;
let optimizedConnection: OptimizedDatabaseConnection;

// Force mock mode in development only if USE_MOCK_DATA is explicitly true
if (process.env.USE_MOCK_DATA === 'true') {
  console.warn('🔧 Mock mode enabled: Using mock database');
  console.warn('   The app will use static data from client/src/data/');
  console.warn('   To connect to real database, set USE_MOCK_DATA=false in .env');

  // Create a comprehensive mock database that matches drizzle ORM interface
  db = {
    select: (fields?: any) => ({
      from: (table: any) => ({
        where: (condition: any) => ({
          orderBy: (order: any) => Promise.resolve([]),
          returning: () => Promise.resolve([]),
          limit: (count: number) => Promise.resolve([])
        }),
        orderBy: (order: any) => Promise.resolve([]),
        innerJoin: (table: any, condition: any) => ({
          where: (condition: any) => ({
            orderBy: (order: any) => Promise.resolve([])
          })
        }),
        leftJoin: (table: any, condition: any) => ({
          where: (condition: any) => ({
            orderBy: (order: any) => Promise.resolve([])
          })
        }),
        limit: (count: number) => Promise.resolve([])
      })
    }),
    insert: (table: any) => ({
      values: (values: any) => ({
        returning: () => Promise.resolve([{ id: 1, ...values }]),
        onConflictDoNothing: () => Promise.resolve()
      })
    }),
    update: (table: any) => ({
      set: (values: any) => ({
        where: (condition: any) => ({
          returning: () => Promise.resolve([{ id: 1, ...values }])
        })
      })
    }),
    delete: (table: any) => ({
      where: (condition: any) => Promise.resolve()
    })
  };
} else {
  // Real database mode: Use postgres connection
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set");
    }

    // Use standard PostgreSQL connection for all databases
    {
      // Use standard postgres connection for Railway/Neon/other databases
      console.log('🔧 Using standard PostgreSQL connection');

      // Initialize optimized connection with connection pooling
      // Optimized for Supabase transaction pooler (port 6543)
      optimizedConnection = OptimizedDatabaseConnection.getInstance();

      // Wrap async initialization in IIFE
      (async () => {
        try {
          db = await optimizedConnection.initialize(process.env.DATABASE_URL!, {
            max: 10,                   // Reduced for transaction pooler compatibility
            min: 2,                    // Lower minimum to avoid idle connections
            idleTimeout: 60,           // 1 minute idle timeout (shorter for serverless)
            connectTimeout: 10,        // 10 seconds connect timeout
            maxLifetime: 600,          // 10 minutes max connection lifetime
            statementCacheSize: 100,   // Moderate statement cache
            applicationName: `kgay-travel-guides-${process.env.NODE_ENV || 'development'}`
          });

          // Initialize batch query builder for N+1 query prevention
          batchQueryBuilder = new BatchQueryBuilder(db);

          console.log(`✅ Optimized database connected with connection pooling`);
        } catch (initError) {
          console.error('❌ Database initialization failed:', initError);
          throw initError;
        }
      })();

      // Warm up caches with frequently accessed data
      // TODO: Re-enable once schema issue is resolved
      // if (process.env.NODE_ENV === 'production') {
      //   await warmUpCaches();
      // }
    }

  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.error('DATABASE_URL format:', process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':***@'));

    // Fallback to mock mode if connection fails in development
    if (process.env.NODE_ENV !== 'production') {
      console.warn('🔄 Falling back to mock mode due to connection failure');
      console.warn('   Set USE_MOCK_DATA=true to skip this error in the future');
      // Re-export mock db from earlier in the file
      throw error; // Still throw error but provide guidance
    } else {
      throw error;
    }
  }
}

// Wrap db.select to fail fast if any selected field is undefined (development & debug only)
// This will be applied after db is initialized in the async block above
if (process.env.NODE_ENV !== 'production' || process.env.DEBUG_SQL === 'true') {
  // Wait for db to be initialized before monkey-patching
  const patchDbSelect = () => {
    if (db && db.select) {
      // Preserve original
      const originalSelect = db.select.bind(db);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - monkey-patch allowed only in debug mode
      db.select = function(map?: any, ...rest: any[]) {
        if (map && typeof map === 'object') {
          for (const key in map) {
            if (map[key] === undefined) {
              throw new Error(`Undefined field '${key}' in select() map. Check table aliases/imports.`);
            }
          }
        }
        return originalSelect(map as any, ...rest);
      } as any;
    }
  };

  // Try to patch immediately if db is ready, otherwise wait a bit
  if (db && db.select) {
    patchDbSelect();
  } else {
    setTimeout(patchDbSelect, 100);
  }
}

export { db, batchQueryBuilder, optimizedConnection };

// Cache warm-up function
export async function warmUpCaches() {
  try {
    console.log('🔥 Warming up caches...');

    // Verify schema tables are properly initialized
    if (!schema.trips || !schema.locations) {
      console.warn('⚠️ Schema tables not properly initialized, skipping cache warm-up');
      return;
    }

    try {
      // Pre-load active trips
      const activeTrips = await db.select().from(schema.trips)
        .where(eq(schema.trips.status, 'published'))
        .limit(10);

      for (const trip of activeTrips) {
        await cacheManager.set('trips', CacheManager.keys.trip(trip.id), trip);
        if (trip.slug) {
          await cacheManager.set('trips', CacheManager.keys.tripBySlug(trip.slug), trip);
        }
      }
    } catch (tripError) {
      console.error('Failed to warm up trips cache:', tripError);
    }

    try {
      // Pre-load all locations (rarely change)
      const allLocations = await db.select().from(schema.locations);
      for (const location of allLocations) {
        await cacheManager.set('locations', CacheManager.keys.location(location.id), location);
      }
    } catch (locationError) {
      console.error('Failed to warm up locations cache:', locationError);
    }

    console.log('✅ Cache warm-up complete');
  } catch (error: any) {
    console.error('⚠️ Cache warm-up failed:', error);
    // Log more details about the error
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}

// Export schema namespace instead of destructuring to avoid initialization issues
// DO NOT destructure schema tables - it causes initialization errors in production
export { schema };

// Performance monitoring endpoint
export async function getPerformanceMetrics() {
  if (optimizedConnection) {
    return {
      database: await optimizedConnection.getMetrics(),
      pool: await optimizedConnection.getPoolStats(),
      cache: cacheManager.getAllLayersStats()
    };
  }
  return null;
}

// ============ PROFILE OPERATIONS (Supabase Auth Integration) ============
export interface IProfileStorage {
  getProfile(id: string): Promise<schema.Profile | undefined>;
  getProfileByEmail(email: string): Promise<schema.Profile | undefined>;
  createProfile(profile: schema.InsertProfile): Promise<schema.Profile>;
  updateProfile(id: string, profile: Partial<schema.Profile>): Promise<schema.Profile | undefined>;
}

export class ProfileStorage implements IProfileStorage {
  async getProfile(id: string): Promise<schema.Profile | undefined> {
    const result = await db.select().from(schema.profiles).where(eq(schema.profiles.id, id));
    return result[0];
  }

  async getProfileByEmail(email: string): Promise<schema.Profile | undefined> {
    const result = await db.select().from(schema.profiles).where(eq(schema.profiles.email, email));
    return result[0];
  }

  async createProfile(insertProfile: schema.InsertProfile): Promise<schema.Profile> {
    const result = await db.insert(schema.profiles).values(insertProfile).returning();
    return result[0];
  }

  async updateProfile(id: string, profileData: Partial<schema.Profile>): Promise<schema.Profile | undefined> {
    const result = await db.update(schema.profiles)
      .set({ ...profileData, updatedAt: new Date() })
      .where(eq(schema.profiles.id, id))
      .returning();
    return result[0];
  }
}

// ============ TRIP OPERATIONS (formerly cruise operations) ============
export interface ITripStorage {
  getAllTrips(): Promise<Trip[]>;
  getTripById(id: number): Promise<Trip | undefined>;
  getTripBySlug(slug: string): Promise<Trip | undefined>;
  getUpcomingTrips(): Promise<Trip[]>;
  getPastTrips(): Promise<Trip[]>;
  createTrip(trip: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>): Promise<Trip>;
  updateTrip(id: number, trip: Partial<Trip>): Promise<Trip | undefined>;
  deleteTrip(id: number): Promise<void>;
}

export class TripStorage implements ITripStorage {
  // @Cacheable('trips', 1000 * 60 * 5) // Cache for 5 minutes - temporarily disabled
  async getAllTrips(): Promise<Trip[]> {
    return await optimizedConnection.executeWithMetrics(
      () => db.select().from(schema.trips).orderBy(desc(schema.trips.startDate)),
      'getAllTrips'
    );
  }

  async getTripById(id: number): Promise<Trip | undefined> {
    // Check cache first
    const cacheKey = CacheManager.keys.trip(id);
    const cached = await cacheManager.get<Trip>('trips', cacheKey);
    if (cached) return cached;

    const result = await optimizedConnection.executeWithMetrics(
      () => db.select().from(schema.trips).where(eq(schema.trips.id, id)),
      `getTripById(${id})`
    );

    if (result[0]) {
      await cacheManager.set('trips', cacheKey, result[0]);
    }
    return result[0];
  }

  async getTripBySlug(slug: string): Promise<Trip | undefined> {
    // Check cache first
    const cacheKey = CacheManager.keys.tripBySlug(slug);
    const cached = await cacheManager.get<Trip>('trips', cacheKey);
    if (cached) return cached;

    const result = await optimizedConnection.executeWithMetrics(
      () => db.select().from(schema.trips).where(eq(schema.trips.slug, slug)),
      `getTripBySlug(${slug})`
    );

    if (result[0]) {
      await cacheManager.set('trips', cacheKey, result[0]);
    }
    return result[0];
  }

  async getUpcomingTrips(): Promise<Trip[]> {
    return await db.select()
      .from(schema.trips)
      .where(eq(schema.trips.status, 'upcoming'))
      .orderBy(asc(schema.trips.startDate));
  }

  async getPastTrips(): Promise<Trip[]> {
    return await db.select()
      .from(schema.trips)
      .where(eq(schema.trips.status, 'past'))
      .orderBy(desc(schema.trips.startDate));
  }

  // @CacheInvalidate('trips') // Invalidate trip cache on create - temporarily disabled
  async createTrip(trip: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>): Promise<Trip> {
    const values = { ...trip };
    
    // Convert date strings to Date objects for timestamp fields
    if (trip.startDate) {
      if (typeof trip.startDate === 'string') {
        values.startDate = new Date(trip.startDate);
      } else {
        values.startDate = trip.startDate;
      }
    }
    if (trip.endDate) {
      if (typeof trip.endDate === 'string') {
        values.endDate = new Date(trip.endDate);
      } else {
        values.endDate = trip.endDate;
      }
    }
    
    const result = await db.insert(schema.trips).values(values).returning();
    return result[0];
  }

  // @CacheInvalidate('trips') // Invalidate trip cache on update - temporarily disabled
  async updateTrip(id: number, trip: Partial<Trip>): Promise<Trip | undefined> {
    const updates = { ...trip, updatedAt: new Date() };

    // Invalidate specific cache entries
    await cacheManager.delete('trips', CacheManager.keys.trip(id));
    
    // Convert date strings to Date objects for timestamp fields
    if (trip.startDate) {
      if (typeof trip.startDate === 'string') {
        updates.startDate = new Date(trip.startDate);
      } else {
        updates.startDate = trip.startDate;
      }
    }
    if (trip.endDate) {
      if (typeof trip.endDate === 'string') {
        updates.endDate = new Date(trip.endDate);
      } else {
        updates.endDate = trip.endDate;
      }
    }
    
    const result = await db.update(schema.trips)
      .set(updates)
      .where(eq(schema.trips.id, id))
      .returning();
    return result[0];
  }

  // @CacheInvalidate('trips') // Invalidate trip cache on delete - temporarily disabled
  async deleteTrip(id: number): Promise<void> {
    // Invalidate specific cache entries
    await cacheManager.delete('trips', CacheManager.keys.trip(id));

    await optimizedConnection.executeWithMetrics(
      () => db.delete(schema.trips).where(eq(schema.trips.id, id)),
      `deleteTrip(${id})`
    );
  }
}

// ============ BACKWARD COMPATIBILITY: CRUISE OPERATIONS ============
/**
 * @deprecated Use ITripStorage and TripStorage instead - will be removed in Phase 5
 * This is a backward compatibility wrapper that delegates to TripStorage
 */
export interface ICruiseStorage {
  getAllCruises(): Promise<Trip[]>;
  getCruiseById(id: number): Promise<Trip | undefined>;
  getCruiseBySlug(slug: string): Promise<Trip | undefined>;
  getUpcomingCruises(): Promise<Trip[]>;
  getPastCruises(): Promise<Trip[]>;
  createCruise(cruise: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>): Promise<Trip>;
  updateCruise(id: number, cruise: Partial<Trip>): Promise<Trip | undefined>;
  deleteCruise(id: number): Promise<void>;
}

/**
 * @deprecated Use TripStorage instead - will be removed in Phase 5
 * This is a backward compatibility wrapper that delegates to TripStorage
 */
export class CruiseStorage implements ICruiseStorage {
  private tripStorage = new TripStorage();

  async getAllCruises(): Promise<Trip[]> {
    return await this.tripStorage.getAllTrips();
  }

  async getCruiseById(id: number): Promise<Trip | undefined> {
    return await this.tripStorage.getTripById(id);
  }

  async getCruiseBySlug(slug: string): Promise<Trip | undefined> {
    return await this.tripStorage.getTripBySlug(slug);
  }

  async getUpcomingCruises(): Promise<Trip[]> {
    return await this.tripStorage.getUpcomingTrips();
  }

  async getPastCruises(): Promise<Trip[]> {
    return await this.tripStorage.getPastTrips();
  }

  async createCruise(cruise: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>): Promise<Trip> {
    return await this.tripStorage.createTrip(cruise);
  }

  async updateCruise(id: number, cruise: Partial<Trip>): Promise<Trip | undefined> {
    return await this.tripStorage.updateTrip(id, cruise);
  }

  async deleteCruise(id: number): Promise<void> {
    return await this.tripStorage.deleteTrip(id);
  }
}

// ============ ITINERARY OPERATIONS ============
export interface IItineraryStorage {
  getItineraryByTrip(tripId: number): Promise<Itinerary[]>;
  createItineraryStop(stop: Omit<Itinerary, 'id'>): Promise<Itinerary>;
  updateItineraryStop(id: number, stop: Partial<Itinerary>): Promise<Itinerary | undefined>;
  deleteItineraryStop(id: number): Promise<void>;
}

export class ItineraryStorage implements IItineraryStorage {
  async getItineraryByTrip(tripId: number): Promise<Itinerary[]> {
    const cacheKey = CacheManager.keys.itinerary(tripId);
    const cached = await cacheManager.get<Itinerary[]>('trips', cacheKey);
    if (cached) return cached;

    const result = await optimizedConnection.executeWithMetrics(
      () => db.select({
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
        .where(eq(schema.itinerary.tripId, tripId))
        .orderBy(asc(schema.itinerary.orderIndex)),
      `getItineraryByTrip(${tripId})`
    );

    await cacheManager.set('trips', cacheKey, result);
    return result;
  }

  // @CacheInvalidate('trips', /itinerary:cruise:\d+/) - temporarily disabled
  async createItineraryStop(stop: Omit<Itinerary, 'id'>): Promise<Itinerary> {
    const values = { ...stop };

    // Invalidate specific trip itinerary cache
    if ((stop as any).tripId) {
      await cacheManager.delete('trips', CacheManager.keys.itinerary((stop as any).tripId));
    }
    
    // Handle date conversion with better error handling  
    if (stop.date && (stop.date as any) !== '' && stop.date !== null) {
      if (typeof stop.date === 'string') {
        values.date = new Date(stop.date);
      } else {
        values.date = stop.date;
      }
    } else {
      // Remove date field if it's empty/null to avoid sending invalid data
      if ('date' in values) {
        delete (values as any).date;
      }
    }
    
    // Remove legacy/non-existent columns to avoid DB errors
    if ('portName' in values) {
      delete (values as any).portName;
    }

    const result = await db.insert(schema.itinerary).values(values).returning({
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
    });
    return result[0] as any;
  }

  async updateItineraryStop(id: number, stop: Partial<Itinerary>): Promise<Itinerary | undefined> {
    const updates = { ...stop };
    
    // Handle date conversion with better error handling
    if (stop.date && (stop.date as any) !== '' && stop.date !== null) {
      if (typeof stop.date === 'string') {
        updates.date = new Date(stop.date);
      } else {
        updates.date = stop.date;
      }
    } else if (stop.hasOwnProperty('date')) {
      // Remove date field if it's explicitly set to empty/null
      if ('date' in updates) {
        delete (updates as any).date;
      }
    }
    
    // Remove legacy/non-existent columns to avoid DB errors
    if ('portName' in updates) {
      delete (updates as any).portName;
    }

    const result = await db.update(schema.itinerary)
      .set(updates)
      .where(eq(schema.itinerary.id, id))
      .returning({
        id: itinerary.id,
        tripId: itinerary.tripId,
        date: itinerary.date,
        day: itinerary.day,
        arrivalTime: itinerary.arrivalTime,
        departureTime: itinerary.departureTime,
        allAboardTime: itinerary.allAboardTime,
        portImageUrl: itinerary.portImageUrl,
        description: itinerary.description,
        highlights: itinerary.highlights,
        orderIndex: itinerary.orderIndex,
        segment: itinerary.segment,
        locationId: itinerary.locationId,
        locationTypeId: itinerary.locationTypeId,
      });
    return result[0] as any;
  }

  async deleteItineraryStop(id: number): Promise<void> {
    await db.delete(schema.itinerary).where(eq(schema.itinerary.id, id));
  }
}

// ============ EVENT OPERATIONS ============
export interface IEventStorage {
  getEventsByTrip(tripId: number): Promise<Event[]>;
  getEventsByDate(tripId: number, date: Date): Promise<Event[]>;
  getEventsByType(tripId: number, type: string): Promise<Event[]>;
  createEvent(event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<Event>;
  updateEvent(id: number, event: Partial<Event>): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<void>;
}

export class EventStorage implements IEventStorage {
  async getEventsByTrip(tripId: number): Promise<Event[]> {
    const cacheKey = CacheManager.keys.eventsByCruise(tripId);
    const cached = await cacheManager.get<Event[]>('events', cacheKey);
    if (cached) return cached;

    const result = await optimizedConnection.executeWithMetrics(
      () => db.select()
        .from(schema.events)
        .where(eq(schema.events.tripId, tripId))
        .orderBy(asc(events.date), asc(events.time)),
      `getEventsByTrip(${tripId})`
    );

    await cacheManager.set('events', cacheKey, result);
    return result;
  }

  async getEventsByDate(tripId: number, date: Date): Promise<Event[]> {
    return await db.select()
      .from(schema.events)
      .where(and(eq(schema.events.tripId, tripId), eq(schema.events.date, date)))
      .orderBy(asc(events.time));
  }

  async getEventsByType(tripId: number, type: string): Promise<Event[]> {
    return await db.select()
      .from(schema.events)
      .where(and(eq(schema.events.tripId, tripId), eq(schema.events.type, type)))
      .orderBy(asc(events.date), asc(events.time));
  }

  // @CacheInvalidate('events') - temporarily disabled
  async createEvent(event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<Event> {
    // Invalidate specific cruise events cache
    if ((event as any).tripId) {
      await cacheManager.delete('events', CacheManager.keys.eventsByCruise((event as any).tripId));
    }

    const result = await optimizedConnection.executeWithMetrics(
      () => db.insert(schema.events).values(event).returning(),
      'createEvent'
    );
    return result[0];
  }

  // @CacheInvalidate('events') - temporarily disabled
  async updateEvent(id: number, event: Partial<Event>): Promise<Event | undefined> {
    // Invalidate event cache
    await cacheManager.delete('events', CacheManager.keys.event(id));

    const result = await optimizedConnection.executeWithMetrics(
      () => db.update(schema.events)
        .set({ ...event, updatedAt: new Date() })
        .where(eq(schema.events.id, id))
        .returning(),
      `updateEvent(${id})`
    );
    return result[0];
  }

  // @CacheInvalidate('events') - temporarily disabled
  async deleteEvent(id: number): Promise<void> {
    // Invalidate event cache
    await cacheManager.delete('events', CacheManager.keys.event(id));

    await optimizedConnection.executeWithMetrics(
      () => db.delete(schema.events).where(eq(schema.events.id, id)),
      `deleteEvent(${id})`
    );
  }
}

// ============ TALENT OPERATIONS ============
export interface TalentWithCategory extends Talent {
  category?: string;  // Category name from joined table
}

export interface ITalentStorage {
  getAllTalent(): Promise<TalentWithCategory[]>;
  getTalentById(id: number): Promise<TalentWithCategory | undefined>;
  getTalentByTrip(tripId: number): Promise<TalentWithCategory[]>;
  searchTalent(search?: string, categoryId?: number): Promise<TalentWithCategory[]>;
  createTalent(talent: Omit<Talent, 'id' | 'createdAt' | 'updatedAt'>): Promise<Talent>;
  updateTalent(id: number, talent: Partial<Talent>): Promise<Talent | undefined>;
  deleteTalent(id: number): Promise<void>;
  assignTalentToTrip(tripId: number, talentId: number, role?: string): Promise<void>;
  removeTalentFromTrip(tripId: number, talentId: number): Promise<void>;
  getAllTalentCategories(): Promise<schema.TalentCategories[]>;
  createTalentCategory(category: string): Promise<schema.TalentCategories>;
  updateTalentCategory(id: number, category: string): Promise<schema.TalentCategories | undefined>;
  deleteTalentCategory(id: number): Promise<void>;
}

export class TalentStorage implements ITalentStorage {
  async getAllTalent(): Promise<TalentWithCategory[]> {
    const results = await db.select({
      id: talent.id,
      name: talent.name,
      talentCategoryId: talent.talentCategoryId,
      bio: talent.bio,
      knownFor: talent.knownFor,
      profileImageUrl: talent.profileImageUrl,
      socialLinks: talent.socialLinks,
      website: talent.website,
      createdAt: talent.createdAt,
      updatedAt: talent.updatedAt,
      category: talentCategories.category,
    })
    .from(schema.talent)
    .leftJoin(talentCategories, eq(schema.talent.talentCategoryId, talentCategories.id))
    .orderBy(asc(talent.name));

    return results as TalentWithCategory[];
  }

  async getTalentById(id: number): Promise<TalentWithCategory | undefined> {
    const result = await db.select({
      id: talent.id,
      name: talent.name,
      talentCategoryId: talent.talentCategoryId,
      bio: talent.bio,
      knownFor: talent.knownFor,
      profileImageUrl: talent.profileImageUrl,
      socialLinks: talent.socialLinks,
      website: talent.website,
      createdAt: talent.createdAt,
      updatedAt: talent.updatedAt,
      category: talentCategories.category,
    })
    .from(schema.talent)
    .leftJoin(talentCategories, eq(schema.talent.talentCategoryId, talentCategories.id))
    .where(eq(schema.talent.id, id));

    return result[0] as TalentWithCategory | undefined;
  }

  async getTalentByTrip(tripId: number): Promise<TalentWithCategory[]> {
    // Return only talent linked to this specific trip through trip_talent junction table
    const result = await db.select({
      id: talent.id,
      name: talent.name,
      talentCategoryId: talent.talentCategoryId,
      bio: talent.bio,
      knownFor: talent.knownFor,
      profileImageUrl: talent.profileImageUrl,
      socialLinks: talent.socialLinks,
      website: talent.website,
      createdAt: talent.createdAt,
      updatedAt: talent.updatedAt,
      category: talentCategories.category,
    })
      .from(schema.talent)
      .innerJoin(cruiseTalent, eq(schema.talent.id, cruiseTalent.talentId))
      .leftJoin(talentCategories, eq(schema.talent.talentCategoryId, talentCategories.id))
      .where(eq(schema.tripTalent.tripId, tripId))
      .orderBy(asc(talent.name));
    return result as TalentWithCategory[];
  }

  async searchTalent(search?: string, categoryId?: number): Promise<TalentWithCategory[]> {
    const conditions = [];

    // Add search conditions
    if (search) {
      conditions.push(
        or(
          ilike(talent.name, `%${search}%`),
          ilike(talent.bio, `%${search}%`),
          ilike(talent.knownFor, `%${search}%`)
        )
      );
    }

    // Add category filter
    if (categoryId) {
      conditions.push(eq(schema.talent.talentCategoryId, categoryId));
    }

    // Build the query with optional conditions
    let query = db.select({
      id: talent.id,
      name: talent.name,
      talentCategoryId: talent.talentCategoryId,
      bio: talent.bio,
      knownFor: talent.knownFor,
      profileImageUrl: talent.profileImageUrl,
      socialLinks: talent.socialLinks,
      website: talent.website,
      createdAt: talent.createdAt,
      updatedAt: talent.updatedAt,
      category: talentCategories.category,
    })
    .from(schema.talent)
    .leftJoin(talentCategories, eq(schema.talent.talentCategoryId, talentCategories.id));

    if (conditions.length > 0) {
      query = query.where(conditions.length === 1 ? conditions[0] : and(...conditions)) as typeof query;
    }

    const results = await query.orderBy(asc(talent.name));
    return results as TalentWithCategory[];
  }

  async createTalent(talentData: Omit<Talent, 'id' | 'createdAt' | 'updatedAt'>): Promise<Talent> {
    const result = await db.insert(schema.talent).values(talentData).returning();
    return result[0];
  }

  async updateTalent(id: number, talentData: Partial<Talent>): Promise<Talent | undefined> {
    const result = await db.update(schema.talent)
      .set({ ...talentData, updatedAt: new Date() })
      .where(eq(schema.talent.id, id))
      .returning();
    return result[0];
  }

  async deleteTalent(id: number): Promise<void> {
    await db.delete(schema.talent).where(eq(schema.talent.id, id));
  }

  async assignTalentToTrip(tripId: number, talentId: number, role?: string): Promise<void> {
    await db.insert(schema.tripTalent).values({
      tripId,
      talentId,
      role,
    }).onConflictDoNothing();
  }

  async removeTalentFromTrip(tripId: number, talentId: number): Promise<void> {
    await db.delete(schema.tripTalent)
      .where(and(
        eq(schema.tripTalent.tripId, tripId),
        eq(schema.tripTalent.talentId, talentId)
      ));
  }

  // Talent category methods
  async getAllTalentCategories(): Promise<schema.TalentCategories[]> {
    return await db.select()
      .from(schema.talentCategories)
      .orderBy(asc(talentCategories.category));
  }

  async createTalentCategory(category: string): Promise<schema.TalentCategories> {
    const result = await db.insert(talentCategories)
      .values({ category })
      .returning();
    return result[0];
  }

  async updateTalentCategory(id: number, category: string): Promise<schema.TalentCategories | undefined> {
    const result = await db.update(talentCategories)
      .set({ category, updatedAt: new Date() })
      .where(eq(schema.talentCategories.id, id))
      .returning();
    return result[0];
  }

  async deleteTalentCategory(id: number): Promise<void> {
    await db.delete(talentCategories)
      .where(eq(schema.talentCategories.id, id));
  }
}


// ============ SETTINGS OPERATIONS ============
export interface ISettingsStorage {
  getSettingsByCategory(category: string): Promise<Settings[]>;
  getSettingByCategoryAndKey(category: string, key: string): Promise<Settings | undefined>;
  getAllActiveSettingsByCategory(category: string): Promise<Settings[]>;
  createSetting(setting: Omit<Settings, 'id' | 'createdAt' | 'updatedAt'>): Promise<Settings>;
  updateSetting(category: string, key: string, setting: Partial<Settings>): Promise<Settings | undefined>;
  deleteSetting(category: string, key: string): Promise<void>;
  deactivateSetting(category: string, key: string): Promise<Settings | undefined>;
  reorderSettings(category: string, orderedKeys: string[]): Promise<void>;
}

export class SettingsStorage implements ISettingsStorage {
  async getSettingsByCategory(category: string): Promise<Settings[]> {
    return await db.select()
      .from(schema.settings)
      .where(eq(schema.settings.category, category))
      .orderBy(asc(settings.orderIndex), asc(settings.label));
  }

  async getSettingByCategoryAndKey(category: string, key: string): Promise<Settings | undefined> {
    const result = await db.select()
      .from(schema.settings)
      .where(and(eq(schema.settings.category, category), eq(schema.settings.key, key)));
    return result[0];
  }

  async getAllActiveSettingsByCategory(category: string): Promise<Settings[]> {
    return await db.select()
      .from(schema.settings)
      .where(and(
        eq(schema.settings.category, category), 
        eq(schema.settings.isActive, true)
      ))
      .orderBy(asc(settings.orderIndex), asc(settings.label));
  }

  async createSetting(settingData: Omit<Settings, 'id' | 'createdAt' | 'updatedAt'>): Promise<Settings> {
    const result = await db.insert(schema.settings).values(settingData).returning();
    return result[0];
  }

  async updateSetting(category: string, key: string, settingData: Partial<Settings>): Promise<Settings | undefined> {
    const result = await db.update(schema.settings)
      .set({ ...settingData, updatedAt: new Date() })
      .where(and(eq(schema.settings.category, category), eq(schema.settings.key, key)))
      .returning();
    return result[0];
  }

  async deleteSetting(category: string, key: string): Promise<void> {
    await db.delete(settings)
      .where(and(eq(schema.settings.category, category), eq(schema.settings.key, key)));
  }

  async deactivateSetting(category: string, key: string): Promise<Settings | undefined> {
    const result = await db.update(schema.settings)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(schema.settings.category, category), eq(schema.settings.key, key)))
      .returning();
    return result[0];
  }

  async reorderSettings(category: string, orderedKeys: string[]): Promise<void> {
    // Update order index for each setting in the category
    for (let i = 0; i < orderedKeys.length; i++) {
      await db.update(schema.settings)
        .set({ orderIndex: i, updatedAt: new Date() })
        .where(and(eq(schema.settings.category, category), eq(schema.settings.key, orderedKeys[i])));
    }
  }
}

// ============ TRIP INFO SECTIONS OPERATIONS ============
export interface ITripInfoStorage {
  getTripInfoSectionsByTrip(tripId: number): Promise<schema.TripInfoSection[]>;
  getCompleteInfo(slug: string, endpoint: 'cruises' | 'trips'): Promise<any>;
}

export class TripInfoStorage implements ITripInfoStorage {
  // @Cacheable('trips', 1000 * 60 * 10) // Cache for 10 minutes - temporarily disabled
  async getTripInfoSectionsByTrip(tripId: number): Promise<schema.TripInfoSection[]> {
    return await optimizedConnection.executeWithMetrics(
      () => db.select()
        .from(schema.tripInfoSections)
        .where(eq(schema.tripInfoSections.tripId, tripId))
        .orderBy(asc(tripInfoSections.orderIndex)),
      `getTripInfoSectionsByTrip(${tripId})`
    );
  }

  // Optimized method to get complete trip info without N+1 queries
  async getCompleteInfo(slug: string, endpoint: 'cruises' | 'trips'): Promise<any> {
    const cacheKey = `${endpoint}:complete:${slug}`;

    // Try cache first
    const cached = await cacheManager.get('trips', cacheKey);
    if (cached) {
      return cached;
    }

    // Get the trip
    const trip = await tripStorage.getTripBySlug(slug);
    if (!trip) {
      return null;
    }

    // Use batch loading to prevent N+1 queries
    const [completeData] = await batchQueryBuilder.loadCompleteTripData([trip.id]);

    if (completeData) {
      // Cache the result
      await cacheManager.set('trips', cacheKey, completeData, 1000 * 60 * 5); // 5 minutes
      return completeData;
    }

    return null;
  }
}

// Create storage instances
export const profileStorage = new ProfileStorage();
export const storage = new ProfileStorage();
export const tripStorage = new TripStorage();
/**
 * @deprecated Use tripStorage instead - will be removed in Phase 5
 */
export const cruiseStorage = new CruiseStorage();
export const itineraryStorage = new ItineraryStorage();
export const eventStorage = new EventStorage();
export const talentStorage = new TalentStorage();
export const settingsStorage = new SettingsStorage();
export const tripInfoStorage = new TripInfoStorage();

// Export new storage classes
export { locationStorage, type Location, type NewLocation } from './storage/LocationStorage';