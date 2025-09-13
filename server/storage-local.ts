import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from '../shared/schema';

// Create SQLite database
const sqlite = new Database('cruise-guide.db');
export const db = drizzle(sqlite, { schema });

// Export all schema tables for easy access
export const {
  users,
  trips,
  cruises,
  itinerary,
  events,
  talent,
  tripTalent,
  cruiseTalent,
  media,
  userTrips,
  userCruises,
  auditLog,
  settings,
  passwordResetTokens,
  partyTemplates,
  cruiseInfoSections
} = schema;

// Storage classes (same interface as Neon version)
import {
  UserStorage,
  TripStorage,
  CruiseStorage,
  ItineraryStorage,
  EventStorage,
  TalentStorage,
  MediaStorage,
  SettingsStorage
} from './storage';

// Create storage instances
export const storage = new UserStorage(db);
export const tripStorage = new TripStorage(db);
export const cruiseStorage = new CruiseStorage(db);
export const itineraryStorage = new ItineraryStorage(db);
export const eventStorage = new EventStorage(db);
export const talentStorage = new TalentStorage(db);
export const mediaStorage = new MediaStorage(db);
export const settingsStorage = new SettingsStorage(db);