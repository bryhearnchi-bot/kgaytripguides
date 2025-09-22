import { eq, and, desc, asc, ilike, or, inArray } from 'drizzle-orm';

// Load environment variables only for development
if (process.env.NODE_ENV !== 'production') {
  const { config } = await import('dotenv');
  config();
}
import type {
  User,
  InsertUser,
  Trip,
  Cruise, // Backward compatibility
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

      // Warm up caches with frequently accessed data
      if (process.env.NODE_ENV === 'production') {
        await warmUpCaches();
      }
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

export { db, batchQueryBuilder, optimizedConnection };

// Cache warm-up function
export async function warmUpCaches() {
  try {
    console.log('🔥 Warming up caches...');

    // Pre-load active trips
    const activeTrips = await db.select().from(trips)
      .where(eq(trips.status, 'published'))
      .limit(10);

    for (const trip of activeTrips) {
      await cacheManager.set('trips', CacheManager.keys.trip(trip.id), trip);
      if (trip.slug) {
        await cacheManager.set('trips', CacheManager.keys.tripBySlug(trip.slug), trip);
      }
    }

    // Pre-load all locations (rarely change)
    const allLocations = await db.select().from(locations);
    for (const location of allLocations) {
      await cacheManager.set('locations', CacheManager.keys.location(location.id), location);
    }

    console.log('✅ Cache warm-up complete');
  } catch (error) {
    console.error('⚠️ Cache warm-up failed:', error);
  }
}

// Export all schema tables for easy access
export const {
  profiles,
  users,
  trips,
  cruises,
  itinerary,
  events,
  talent,
  talentCategories,
  settings,
  cruiseTalent,
  tripInfoSections,
  locations
} = schema;

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
    const result = await db.select().from(profiles).where(eq(profiles.id, id));
    return result[0];
  }

  async getProfileByEmail(email: string): Promise<schema.Profile | undefined> {
    const result = await db.select().from(profiles).where(eq(profiles.email, email));
    return result[0];
  }

  async createProfile(insertProfile: schema.InsertProfile): Promise<schema.Profile> {
    const result = await db.insert(profiles).values(insertProfile).returning();
    return result[0];
  }

  async updateProfile(id: string, profileData: Partial<schema.Profile>): Promise<schema.Profile | undefined> {
    const result = await db.update(profiles)
      .set({ ...profileData, updatedAt: new Date() })
      .where(eq(profiles.id, id))
      .returning();
    return result[0];
  }
}

// ============ USER OPERATIONS (Legacy) ============
export interface IUserStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserLastLogin(id: string): Promise<void>;
}

export class UserStorage implements IUserStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(profiles).where(eq(profiles.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(profiles).where(eq(profiles.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(profiles).values(insertUser).returning();
    return result[0];
  }

  async updateUserLastLogin(id: string): Promise<void> {
    await db.update(profiles).set({ lastSignInAt: new Date() }).where(eq(profiles.id, id));
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
      () => db.select().from(cruises).orderBy(desc(cruises.startDate)),
      'getAllTrips'
    );
  }

  async getTripById(id: number): Promise<Trip | undefined> {
    // Check cache first
    const cacheKey = CacheManager.keys.trip(id);
    const cached = await cacheManager.get<Trip>('trips', cacheKey);
    if (cached) return cached;

    const result = await optimizedConnection.executeWithMetrics(
      () => db.select().from(cruises).where(eq(cruises.id, id)),
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
      () => db.select().from(cruises).where(eq(cruises.slug, slug)),
      `getTripBySlug(${slug})`
    );

    if (result[0]) {
      await cacheManager.set('trips', cacheKey, result[0]);
    }
    return result[0];
  }

  async getUpcomingTrips(): Promise<Trip[]> {
    return await db.select()
      .from(cruises)
      .where(eq(cruises.status, 'upcoming'))
      .orderBy(asc(cruises.startDate));
  }

  async getPastTrips(): Promise<Trip[]> {
    return await db.select()
      .from(cruises)
      .where(eq(cruises.status, 'past'))
      .orderBy(desc(cruises.startDate));
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
    
    const result = await db.insert(cruises).values(values).returning();
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
    
    const result = await db.update(cruises)
      .set(updates)
      .where(eq(cruises.id, id))
      .returning();
    return result[0];
  }

  // @CacheInvalidate('trips') // Invalidate trip cache on delete - temporarily disabled
  async deleteTrip(id: number): Promise<void> {
    // Invalidate specific cache entries
    await cacheManager.delete('trips', CacheManager.keys.trip(id));

    await optimizedConnection.executeWithMetrics(
      () => db.delete(cruises).where(eq(cruises.id, id)),
      `deleteTrip(${id})`
    );
  }
}

// ============ BACKWARD COMPATIBILITY: CRUISE OPERATIONS ============
export interface ICruiseStorage {
  getAllCruises(): Promise<Cruise[]>;
  getCruiseById(id: number): Promise<Cruise | undefined>;
  getCruiseBySlug(slug: string): Promise<Cruise | undefined>;
  getUpcomingCruises(): Promise<Cruise[]>;
  getPastCruises(): Promise<Cruise[]>;
  createCruise(cruise: Omit<Cruise, 'id' | 'createdAt' | 'updatedAt'>): Promise<Cruise>;
  updateCruise(id: number, cruise: Partial<Cruise>): Promise<Cruise | undefined>;
  deleteCruise(id: number): Promise<void>;
}

export class CruiseStorage implements ICruiseStorage {
  private tripStorage = new TripStorage();

  async getAllCruises(): Promise<Cruise[]> {
    return await this.tripStorage.getAllTrips();
  }

  async getCruiseById(id: number): Promise<Cruise | undefined> {
    return await this.tripStorage.getTripById(id);
  }

  async getCruiseBySlug(slug: string): Promise<Cruise | undefined> {
    return await this.tripStorage.getTripBySlug(slug);
  }

  async getUpcomingCruises(): Promise<Cruise[]> {
    return await this.tripStorage.getUpcomingTrips();
  }

  async getPastCruises(): Promise<Cruise[]> {
    return await this.tripStorage.getPastTrips();
  }

  async createCruise(cruise: Omit<Cruise, 'id' | 'createdAt' | 'updatedAt'>): Promise<Cruise> {
    return await this.tripStorage.createTrip(cruise);
  }

  async updateCruise(id: number, cruise: Partial<Cruise>): Promise<Cruise | undefined> {
    return await this.tripStorage.updateTrip(id, cruise);
  }

  async deleteCruise(id: number): Promise<void> {
    return await this.tripStorage.deleteTrip(id);
  }
}

// ============ ITINERARY OPERATIONS ============
export interface IItineraryStorage {
  getItineraryByCruise(cruiseId: number): Promise<Itinerary[]>;
  createItineraryStop(stop: Omit<Itinerary, 'id'>): Promise<Itinerary>;
  updateItineraryStop(id: number, stop: Partial<Itinerary>): Promise<Itinerary | undefined>;
  deleteItineraryStop(id: number): Promise<void>;
}

export class ItineraryStorage implements IItineraryStorage {
  async getItineraryByCruise(cruiseId: number): Promise<Itinerary[]> {
    const cacheKey = CacheManager.keys.itinerary(cruiseId);
    const cached = await cacheManager.get<Itinerary[]>('trips', cacheKey);
    if (cached) return cached;

    const result = await optimizedConnection.executeWithMetrics(
      () => db.select()
        .from(itinerary)
        .where(eq(itinerary.cruiseId, cruiseId))
        .orderBy(asc(itinerary.orderIndex)),
      `getItineraryByCruise(${cruiseId})`
    );

    await cacheManager.set('trips', cacheKey, result);
    return result;
  }

  // @CacheInvalidate('trips', /itinerary:cruise:\d+/) - temporarily disabled
  async createItineraryStop(stop: Omit<Itinerary, 'id'>): Promise<Itinerary> {
    const values = { ...stop };

    // Invalidate specific cruise itinerary cache
    if (stop.cruiseId) {
      await cacheManager.delete('trips', CacheManager.keys.itinerary(stop.cruiseId));
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
    
    const result = await db.insert(itinerary).values(values).returning();
    return result[0];
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
    
    const result = await db.update(itinerary)
      .set(updates)
      .where(eq(itinerary.id, id))
      .returning();
    return result[0];
  }

  async deleteItineraryStop(id: number): Promise<void> {
    await db.delete(itinerary).where(eq(itinerary.id, id));
  }
}

// ============ EVENT OPERATIONS ============
export interface IEventStorage {
  getEventsByCruise(cruiseId: number): Promise<Event[]>;
  getEventsByDate(cruiseId: number, date: Date): Promise<Event[]>;
  getEventsByType(cruiseId: number, type: string): Promise<Event[]>;
  createEvent(event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<Event>;
  updateEvent(id: number, event: Partial<Event>): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<void>;
}

export class EventStorage implements IEventStorage {
  async getEventsByCruise(cruiseId: number): Promise<Event[]> {
    const cacheKey = CacheManager.keys.eventsByCruise(cruiseId);
    const cached = await cacheManager.get<Event[]>('events', cacheKey);
    if (cached) return cached;

    const result = await optimizedConnection.executeWithMetrics(
      () => db.select()
        .from(events)
        .where(eq(events.cruiseId, cruiseId))
        .orderBy(asc(events.date), asc(events.time)),
      `getEventsByCruise(${cruiseId})`
    );

    await cacheManager.set('events', cacheKey, result);
    return result;
  }

  async getEventsByDate(cruiseId: number, date: Date): Promise<Event[]> {
    return await db.select()
      .from(events)
      .where(and(eq(events.cruiseId, cruiseId), eq(events.date, date)))
      .orderBy(asc(events.time));
  }

  async getEventsByType(cruiseId: number, type: string): Promise<Event[]> {
    return await db.select()
      .from(events)
      .where(and(eq(events.cruiseId, cruiseId), eq(events.type, type)))
      .orderBy(asc(events.date), asc(events.time));
  }

  // @CacheInvalidate('events') - temporarily disabled
  async createEvent(event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<Event> {
    // Invalidate specific cruise events cache
    if (event.cruiseId) {
      await cacheManager.delete('events', CacheManager.keys.eventsByCruise(event.cruiseId));
    }

    const result = await optimizedConnection.executeWithMetrics(
      () => db.insert(events).values(event).returning(),
      'createEvent'
    );
    return result[0];
  }

  // @CacheInvalidate('events') - temporarily disabled
  async updateEvent(id: number, event: Partial<Event>): Promise<Event | undefined> {
    // Invalidate event cache
    await cacheManager.delete('events', CacheManager.keys.event(id));

    const result = await optimizedConnection.executeWithMetrics(
      () => db.update(events)
        .set({ ...event, updatedAt: new Date() })
        .where(eq(events.id, id))
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
      () => db.delete(events).where(eq(events.id, id)),
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
  getTalentByCruise(cruiseId: number): Promise<TalentWithCategory[]>;
  searchTalent(search?: string, categoryId?: number): Promise<TalentWithCategory[]>;
  createTalent(talent: Omit<Talent, 'id' | 'createdAt' | 'updatedAt'>): Promise<Talent>;
  updateTalent(id: number, talent: Partial<Talent>): Promise<Talent | undefined>;
  deleteTalent(id: number): Promise<void>;
  assignTalentToCruise(cruiseId: number, talentId: number, role?: string): Promise<void>;
  removeTalentFromCruise(cruiseId: number, talentId: number): Promise<void>;
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
    .from(talent)
    .leftJoin(talentCategories, eq(talent.talentCategoryId, talentCategories.id))
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
    .from(talent)
    .leftJoin(talentCategories, eq(talent.talentCategoryId, talentCategories.id))
    .where(eq(talent.id, id));

    return result[0] as TalentWithCategory | undefined;
  }

  async getTalentByCruise(cruiseId: number): Promise<TalentWithCategory[]> {
    // Return only talent linked to this specific cruise through cruise_talent junction table
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
      .from(talent)
      .innerJoin(cruiseTalent, eq(talent.id, cruiseTalent.talentId))
      .leftJoin(talentCategories, eq(talent.talentCategoryId, talentCategories.id))
      .where(eq(cruiseTalent.cruiseId, cruiseId))
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
      conditions.push(eq(talent.talentCategoryId, categoryId));
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
    .from(talent)
    .leftJoin(talentCategories, eq(talent.talentCategoryId, talentCategories.id));

    if (conditions.length > 0) {
      query = query.where(conditions.length === 1 ? conditions[0] : and(...conditions)) as typeof query;
    }

    const results = await query.orderBy(asc(talent.name));
    return results as TalentWithCategory[];
  }

  async createTalent(talentData: Omit<Talent, 'id' | 'createdAt' | 'updatedAt'>): Promise<Talent> {
    const result = await db.insert(talent).values(talentData).returning();
    return result[0];
  }

  async updateTalent(id: number, talentData: Partial<Talent>): Promise<Talent | undefined> {
    const result = await db.update(talent)
      .set({ ...talentData, updatedAt: new Date() })
      .where(eq(talent.id, id))
      .returning();
    return result[0];
  }

  async deleteTalent(id: number): Promise<void> {
    await db.delete(talent).where(eq(talent.id, id));
  }

  async assignTalentToCruise(cruiseId: number, talentId: number, role?: string): Promise<void> {
    await db.insert(cruiseTalent).values({
      cruiseId,
      talentId,
      role,
    }).onConflictDoNothing();
  }

  async removeTalentFromCruise(cruiseId: number, talentId: number): Promise<void> {
    await db.delete(cruiseTalent)
      .where(and(
        eq(cruiseTalent.cruiseId, cruiseId),
        eq(cruiseTalent.talentId, talentId)
      ));
  }

  // Talent category methods
  async getAllTalentCategories(): Promise<schema.TalentCategories[]> {
    return await db.select()
      .from(talentCategories)
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
      .where(eq(talentCategories.id, id))
      .returning();
    return result[0];
  }

  async deleteTalentCategory(id: number): Promise<void> {
    await db.delete(talentCategories)
      .where(eq(talentCategories.id, id));
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
      .from(settings)
      .where(eq(settings.category, category))
      .orderBy(asc(settings.orderIndex), asc(settings.label));
  }

  async getSettingByCategoryAndKey(category: string, key: string): Promise<Settings | undefined> {
    const result = await db.select()
      .from(settings)
      .where(and(eq(settings.category, category), eq(settings.key, key)));
    return result[0];
  }

  async getAllActiveSettingsByCategory(category: string): Promise<Settings[]> {
    return await db.select()
      .from(settings)
      .where(and(
        eq(settings.category, category), 
        eq(settings.isActive, true)
      ))
      .orderBy(asc(settings.orderIndex), asc(settings.label));
  }

  async createSetting(settingData: Omit<Settings, 'id' | 'createdAt' | 'updatedAt'>): Promise<Settings> {
    const result = await db.insert(settings).values(settingData).returning();
    return result[0];
  }

  async updateSetting(category: string, key: string, settingData: Partial<Settings>): Promise<Settings | undefined> {
    const result = await db.update(settings)
      .set({ ...settingData, updatedAt: new Date() })
      .where(and(eq(settings.category, category), eq(settings.key, key)))
      .returning();
    return result[0];
  }

  async deleteSetting(category: string, key: string): Promise<void> {
    await db.delete(settings)
      .where(and(eq(settings.category, category), eq(settings.key, key)));
  }

  async deactivateSetting(category: string, key: string): Promise<Settings | undefined> {
    const result = await db.update(settings)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(settings.category, category), eq(settings.key, key)))
      .returning();
    return result[0];
  }

  async reorderSettings(category: string, orderedKeys: string[]): Promise<void> {
    // Update order index for each setting in the category
    for (let i = 0; i < orderedKeys.length; i++) {
      await db.update(settings)
        .set({ orderIndex: i, updatedAt: new Date() })
        .where(and(eq(settings.category, category), eq(settings.key, orderedKeys[i])));
    }
  }
}

// ============ TRIP INFO SECTIONS OPERATIONS ============
export interface ITripInfoStorage {
  getTripInfoSectionsByCruise(cruiseId: number): Promise<schema.TripInfoSection[]>;
  getCompleteInfo(slug: string, endpoint: 'cruises' | 'trips'): Promise<any>;
}

export class TripInfoStorage implements ITripInfoStorage {
  // @Cacheable('trips', 1000 * 60 * 10) // Cache for 10 minutes - temporarily disabled
  async getTripInfoSectionsByCruise(cruiseId: number): Promise<schema.TripInfoSection[]> {
    return await optimizedConnection.executeWithMetrics(
      () => db.select()
        .from(tripInfoSections)
        .where(eq(tripInfoSections.tripId, cruiseId))
        .orderBy(asc(tripInfoSections.orderIndex)),
      `getTripInfoSectionsByCruise(${cruiseId})`
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
export const storage = new UserStorage();
export const tripStorage = new TripStorage();
export const cruiseStorage = new CruiseStorage(); // Backward compatibility
export const itineraryStorage = new ItineraryStorage();
export const eventStorage = new EventStorage();
export const talentStorage = new TalentStorage();
export const settingsStorage = new SettingsStorage();
export const tripInfoStorage = new TripInfoStorage();

// Export new storage classes
export { locationStorage, type Location, type NewLocation } from './storage/LocationStorage';