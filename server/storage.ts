import { eq, and, desc, asc, ilike, or } from 'drizzle-orm';

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
  Media,
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

let db: any;

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

      const connectionConfig = {
        prepare: false,
        ssl: process.env.NODE_ENV === 'production' ? 'require' : 'prefer',
        transform: { undefined: null },
        connect_timeout: 15,
        idle_timeout: 300,
        max: 20,
        connection: {
          application_name: `kgay-travel-guides-${process.env.NODE_ENV || 'development'}`
        }
      };

      const client = postgres(process.env.DATABASE_URL!, connectionConfig);
      db = drizzle(client, { schema });
      console.log(`✅ Database connected (${process.env.NODE_ENV || 'development'} mode)`);
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

export { db };

// Export all schema tables for easy access
export const {
  profiles,
  users,
  trips,
  cruises,
  itinerary,
  events,
  talent,
  media,
  settings,
  cruiseTalent,
  tripInfoSections,
  ports,
  parties,
  eventTalent
} = schema;

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
  async getAllTrips(): Promise<Trip[]> {
    return await db.select().from(cruises).orderBy(desc(cruises.startDate));
  }

  async getTripById(id: number): Promise<Trip | undefined> {
    const result = await db.select().from(cruises).where(eq(cruises.id, id));
    return result[0];
  }

  async getTripBySlug(slug: string): Promise<Trip | undefined> {
    const result = await db.select().from(cruises).where(eq(cruises.slug, slug));
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

  async updateTrip(id: number, trip: Partial<Trip>): Promise<Trip | undefined> {
    const updates = { ...trip, updatedAt: new Date() };
    
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

  async deleteTrip(id: number): Promise<void> {
    await db.delete(cruises).where(eq(cruises.id, id));
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
    // For now, just return the itinerary items without port data
    // to avoid circular import issues
    return await db.select()
      .from(itinerary)
      .where(eq(itinerary.cruiseId, cruiseId))
      .orderBy(asc(itinerary.orderIndex));
  }

  async createItineraryStop(stop: Omit<Itinerary, 'id'>): Promise<Itinerary> {
    const values = { ...stop };
    
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
    // For now, just return the events without party data
    // to avoid circular import issues
    return await db.select()
      .from(events)
      .where(eq(events.cruiseId, cruiseId))
      .orderBy(asc(events.date), asc(events.time));
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

  async createEvent(event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<Event> {
    const result = await db.insert(events).values(event).returning();
    return result[0];
  }

  async updateEvent(id: number, event: Partial<Event>): Promise<Event | undefined> {
    const result = await db.update(events)
      .set({ ...event, updatedAt: new Date() })
      .where(eq(events.id, id))
      .returning();
    return result[0];
  }

  async deleteEvent(id: number): Promise<void> {
    await db.delete(events).where(eq(events.id, id));
  }
}

// ============ TALENT OPERATIONS ============
export interface ITalentStorage {
  getAllTalent(): Promise<Talent[]>;
  getTalentById(id: number): Promise<Talent | undefined>;
  getTalentByCruise(cruiseId: number): Promise<Talent[]>;
  searchTalent(search?: string, performanceType?: string): Promise<Talent[]>;
  createTalent(talent: Omit<Talent, 'id' | 'createdAt' | 'updatedAt'>): Promise<Talent>;
  updateTalent(id: number, talent: Partial<Talent>): Promise<Talent | undefined>;
  deleteTalent(id: number): Promise<void>;
  assignTalentToCruise(cruiseId: number, talentId: number, role?: string): Promise<void>;
  removeTalentFromCruise(cruiseId: number, talentId: number): Promise<void>;
}

export class TalentStorage implements ITalentStorage {
  async getAllTalent(): Promise<Talent[]> {
    return await db.select().from(talent).orderBy(asc(talent.name));
  }

  async getTalentById(id: number): Promise<Talent | undefined> {
    const result = await db.select().from(talent).where(eq(talent.id, id));
    return result[0];
  }

  async getTalentByCruise(cruiseId: number): Promise<Talent[]> {
    // Return only talent linked to this specific cruise through cruise_talent junction table
    const result = await db.select({
      id: talent.id,
      name: talent.name,
      category: talent.category,
      bio: talent.bio,
      knownFor: talent.knownFor,
      profileImageUrl: talent.profileImageUrl,
      socialLinks: talent.socialLinks,
      website: talent.website,
      createdAt: talent.createdAt,
      updatedAt: talent.updatedAt
    })
      .from(talent)
      .innerJoin(cruiseTalent, eq(talent.id, cruiseTalent.talentId))
      .where(eq(cruiseTalent.cruiseId, cruiseId))
      .orderBy(asc(talent.name));
    return result;
  }

  async searchTalent(search?: string, performanceType?: string): Promise<Talent[]> {
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

    // Add performance type filter (using category field)
    if (performanceType) {
      conditions.push(eq(talent.category, performanceType));
    }

    // Build the query with optional conditions
    const query = conditions.length > 0 
      ? db.select().from(talent).where(conditions.length === 1 ? conditions[0] : and(...conditions))
      : db.select().from(talent);

    return await query.orderBy(asc(talent.name));
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
}

// ============ MEDIA OPERATIONS ============
export interface IMediaStorage {
  getMediaByType(type: string): Promise<Media[]>;
  getMediaByAssociation(associatedType: string, associatedId: number): Promise<Media[]>;
  createMedia(media: Omit<Media, 'id' | 'uploadedAt'>): Promise<Media>;
  deleteMedia(id: number): Promise<void>;
}

export class MediaStorage implements IMediaStorage {
  async getMediaByType(type: string): Promise<Media[]> {
    return await db.select().from(media).where(eq(media.type, type));
  }

  async getMediaByAssociation(associatedType: string, associatedId: number): Promise<Media[]> {
    return await db.select()
      .from(media)
      .where(and(
        eq(media.associatedType, associatedType),
        eq(media.associatedId, associatedId)
      ));
  }

  async createMedia(mediaData: Omit<Media, 'id' | 'uploadedAt'>): Promise<Media> {
    const result = await db.insert(media).values(mediaData).returning();
    return result[0];
  }

  async deleteMedia(id: number): Promise<void> {
    await db.delete(media).where(eq(media.id, id));
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
}

export class TripInfoStorage implements ITripInfoStorage {
  async getTripInfoSectionsByCruise(cruiseId: number): Promise<schema.TripInfoSection[]> {
    return await db.select()
      .from(tripInfoSections)
      .where(eq(tripInfoSections.cruiseId, cruiseId))
      .orderBy(asc(tripInfoSections.orderIndex));
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
export const mediaStorage = new MediaStorage();
export const settingsStorage = new SettingsStorage();
export const tripInfoStorage = new TripInfoStorage();

// Export new storage classes
export { portStorage, type Port, type NewPort } from './storage/PortStorage';
export { partyStorage, type Party, type NewParty } from './storage/PartyStorage';
export { eventTalentStorage, type EventTalent, type NewEventTalent, type EventTalentWithDetails } from './storage/EventTalentStorage';