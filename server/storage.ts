import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { eq, and, desc, asc, ilike, or } from 'drizzle-orm';
import * as schema from '../shared/schema';
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

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set, ensure the database is provisioned");
}

const queryClient = neon(process.env.DATABASE_URL);
export const db = drizzle(queryClient, { schema });

// Export all schema tables for easy access
export const {
  users,
  trips,
  cruises, // Backward compatibility alias
  itinerary,
  events,
  talent,
  tripTalent,
  cruiseTalent, // Backward compatibility alias
  media,
  userTrips,
  userCruises, // Backward compatibility alias
  auditLog,
  settings,
} = schema;

// ============ USER OPERATIONS ============
export interface IUserStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserLastLogin(id: string): Promise<void>;
}

export class UserStorage implements IUserStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUserLastLogin(id: string): Promise<void> {
    await db.update(users).set({ lastLogin: new Date() }).where(eq(users.id, id));
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
    const result = await db.select()
      .from(talent)
      .innerJoin(cruiseTalent, eq(talent.id, cruiseTalent.talentId))
      .where(eq(cruiseTalent.cruiseId, cruiseId))
      .orderBy(asc(talent.name));
    return result.map(r => r.talent);
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

// Create storage instances
export const storage = new UserStorage();
export const tripStorage = new TripStorage();
export const cruiseStorage = new CruiseStorage(); // Backward compatibility
export const itineraryStorage = new ItineraryStorage();
export const eventStorage = new EventStorage();
export const talentStorage = new TalentStorage();
export const mediaStorage = new MediaStorage();
export const settingsStorage = new SettingsStorage();