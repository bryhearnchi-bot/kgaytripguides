import { sql } from "drizzle-orm";
import { 
  pgTable, 
  text, 
  varchar, 
  timestamp, 
  integer, 
  boolean,
  jsonb,
  decimal,
  serial,
  primaryKey,
  index,
  unique
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// ============ PROFILES TABLE (Supabase Auth Integration) ============
export const profiles = pgTable("profiles", {
  id: text("id").primaryKey(), // References auth.profiles.id
  email: text("email").notNull(),
  fullName: text("full_name"),
  username: text("username"),
  phoneNumber: text("phone_number"),
  bio: text("bio"),
  location: jsonb("location"), // { city, state, country }
  communicationPreferences: jsonb("communication_preferences"), // { email, sms }
  tripUpdatesOptIn: boolean("trip_updates_opt_in").default(false),
  marketingEmails: boolean("marketing_emails").default(false),
  lastSignInAt: timestamp("last_sign_in_at"),
  role: text("role").default("viewer"), // super_admin, content_manager, viewer
  accountStatus: text("account_status").default("active"), // active, suspended, pending_verification
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Users table removed - using profiles table exclusively

// ============ INVITATIONS TABLE ============
export const invitations = pgTable("invitations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  role: text("role").notNull(), // super_admin, content_manager, viewer
  invitedBy: text("invited_by").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  tripId: integer("trip_id").references(() => trips.id, { onDelete: "set null" }), // Optional trip-specific invitation
  metadata: jsonb("metadata"), // Additional invitation data
  tokenHash: text("token_hash").notNull(), // Hashed invitation token
  salt: text("salt").notNull(), // Salt used for token hashing
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  used: boolean("used").default(false),
  usedAt: timestamp("used_at"), // When invitation was accepted
  usedBy: text("used_by").references(() => profiles.id, { onDelete: "set null" }), // Who accepted the invitation
}, (table) => ({
  emailIdx: index("invitation_email_idx").on(table.email),
  inviterIdx: index("invitation_inviter_idx").on(table.invitedBy),
  expiresIdx: index("invitation_expires_idx").on(table.expiresAt),
  usedIdx: index("invitation_used_idx").on(table.used),
  tokenHashIdx: index("invitation_token_hash_idx").on(table.tokenHash),
  // Compound index for finding active invitations
  activeInvitationsIdx: index("invitation_active_idx").on(table.email, table.used, table.expiresAt),
}));

// ============ TRIP TYPES TABLE ============
export const tripTypes = pgTable("trip_types", {
  id: serial("id").primaryKey(),
  tripType: varchar("trip_type", { length: 50 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  tripTypeUnique: unique("trip_types_trip_type_unique").on(table.tripType),
}));

// ============ TRIP STATUS TABLE ============
export const tripStatus = pgTable("trip_status", {
  id: serial("id").primaryKey(),
  status: varchar("status", { length: 50 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  statusUnique: unique("trip_status_status_unique").on(table.status),
}));

// ============ SETTINGS TABLE ============
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(), // trip_types, notification_types, etc.
  key: text("key").notNull(), // cruise, hotel, flight, etc.
  label: text("label").notNull(), // Display name for UI
  value: text("value"), // Optional value field
  metadata: jsonb("metadata"), // Additional data like button text, colors, etc.
  isActive: boolean("is_active").default(true),
  orderIndex: integer("order_index").default(0), // For sorting within category
  createdBy: text("created_by").references(() => profiles.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  categoryKeyUnique: unique("settings_category_key_unique").on(table.category, table.key),
  categoryKeyIdx: index("settings_category_key_idx").on(table.category, table.key),
  categoryIdx: index("settings_category_idx").on(table.category),
  activeIdx: index("settings_active_idx").on(table.isActive),
  createdByIdx: index("settings_created_by_idx").on(table.createdBy),
  categoryOrderIdx: index("settings_category_order_idx").on(table.category, table.orderIndex),
}));

// ============ SHIPS TABLE (NEW - Reusable) ============
export const ships = pgTable("ships", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  cruiseLine: varchar("cruise_line", { length: 255 }).notNull(),
  shipCode: varchar("ship_code", { length: 50 }), // Short code like "VL" for Valiant Lady
  capacity: integer("capacity"), // Passenger capacity
  crewSize: integer("crew_size"), // Number of crew
  grossTonnage: integer("gross_tonnage"), // Ship size
  lengthMeters: decimal("length_meters", { precision: 10, scale: 2 }), // Ship length
  beamMeters: decimal("beam_meters", { precision: 10, scale: 2 }), // Ship width
  decks: integer("decks"), // Number of decks
  builtYear: integer("built_year"), // Year built
  refurbishedYear: integer("refurbished_year"), // Last refurbishment
  shipClass: varchar("ship_class", { length: 100 }), // Ship class/series
  flag: varchar("flag", { length: 100 }), // Country of registration
  imageUrl: text("image_url"), // Hero image of the ship
  deckPlans: jsonb("deck_plans"), // Array of deck plan URLs or data
  amenities: jsonb("amenities"), // Ship amenities and features
  diningVenues: jsonb("dining_venues"), // Dining options on board
  entertainmentVenues: jsonb("entertainment_venues"), // Entertainment venues
  stateroomCategories: jsonb("stateroom_categories"), // Room types and counts
  description: text("description"), // Ship description
  highlights: jsonb("highlights"), // Array of highlight features
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  nameIdx: index("ships_name_idx").on(table.name),
  cruiseLineIdx: index("ships_cruise_line_idx").on(table.cruiseLine),
  nameLineUnique: unique("ships_name_cruise_line_unique").on(table.name, table.cruiseLine),
}));

// ============ TRIPS TABLE (formerly cruises) ============
export const trips = pgTable("trips", {
  id: serial("id").primaryKey(),
  tripTypeId: integer("trip_type_id").notNull().references(() => tripTypes.id),
  name: text("name").notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  shipId: integer("ship_id").references(() => ships.id), // Foreign key to ships table
  resortName: varchar("resort_name", { length: 255 }), // For resort trips
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  tripStatusId: integer("trip_status_id").notNull().references(() => tripStatus.id),
  heroImageUrl: text("hero_image_url"),
  description: text("description"),
  highlights: jsonb("highlights"), // Array of highlight strings
  includesInfo: jsonb("includes_info"), // What's included in the trip
  pricing: jsonb("pricing"), // Pricing tiers and info
  createdBy: text("created_by").references(() => profiles.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  slugIdx: index("trips_slug_idx").on(table.slug),
  tripTypeIdIdx: index("trips_trip_type_id_idx").on(table.tripTypeId),
  tripStatusIdIdx: index("trips_trip_status_id_idx").on(table.tripStatusId),
  shipIdx: index("trips_ship_id_idx").on(table.shipId),
}));


// ============ ITINERARY TABLE ============
export const itinerary = pgTable("itinerary", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull().references(() => trips.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  day: integer("day").notNull(), // Day number of trip (1, 2, 3, etc.)
  locationName: text("location_name").notNull(),
  arrivalTime: text("arrival_time"), // Stored as text for flexibility (e.g., "08:00", "—")
  departureTime: text("departure_time"),
  allAboardTime: text("all_aboard_time"),
  locationImageUrl: text("location_image_url"),
  description: text("description"),
  highlights: jsonb("highlights"), // Port highlights
  orderIndex: integer("order_index").notNull(), // For sorting
  segment: text("segment").default("main"), // pre, main, post
  locationId: integer("location_id").references(() => locations.id), // Foreign key to locations table
  locationTypeId: integer("location_type_id").notNull().references(() => locationTypes.id), // Foreign key to location_types table
}, (table) => ({
  tripIdx: index("itinerary_trip_idx").on(table.tripId),
  locationIdx: index("itinerary_location_idx").on(table.locationId),
  locationTypeIdx: index("itinerary_location_type_id_idx").on(table.locationTypeId),
  dateIdx: index("itinerary_date_idx").on(table.date),
}));

// ============ EVENTS TABLE ============
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull().references(() => trips.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  time: text("time").notNull(), // "14:00", "21:30", etc.
  title: text("title").notNull(),
  type: text("type").notNull(), // party, show, dining, lounge, fun, club, after, social
  venue: text("venue").notNull(),
  talentIds: jsonb("talent_ids"), // Array of talent IDs
  partyThemeId: integer("party_theme_id").references(() => partyThemes.id), // For party type events
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  tripIdx: index("events_trip_idx").on(table.tripId),
  dateIdx: index("events_date_idx").on(table.date),
  typeIdx: index("events_type_idx").on(table.type),
  partyThemeIdx: index("events_party_theme_idx").on(table.partyThemeId),
}));

// ============ TALENT CATEGORIES TABLE ============
export const talentCategories = pgTable("talent_categories", {
  id: serial("id").primaryKey(),
  category: varchar("category", { length: 50 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  categoryUnique: unique("talent_categories_category_unique").on(table.category),
}));

// ============ TALENT TABLE ============
export const talent = pgTable("talent", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  talentCategoryId: integer("talent_category_id").notNull().references(() => talentCategories.id),
  bio: text("bio"),
  knownFor: text("known_for"),
  profileImageUrl: text("profile_image_url"),
  socialLinks: jsonb("social_links"), // {instagram: "", twitter: "", etc.}
  website: text("website"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  nameIdx: index("talent_name_idx").on(table.name),
  categoryIdx: index("idx_talent_category_id").on(table.talentCategoryId),
}));

// ============ TRIP_TALENT JUNCTION TABLE (formerly cruise_talent) ============
export const tripTalent = pgTable("trip_talent", {
  tripId: integer("trip_id").notNull().references(() => trips.id, { onDelete: "cascade" }),
  talentId: integer("talent_id").notNull().references(() => talent.id, { onDelete: "cascade" }),
  role: text("role"), // Headliner, Special Guest, Host, etc.
  performanceCount: integer("performance_count"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.tripId, table.talentId] }),
  tripIdx: index("trip_talent_trip_idx").on(table.tripId),
  talentIdx: index("trip_talent_talent_idx").on(table.talentId),
}));


// ============ LOCATION TYPES TABLE ============
export const locationTypes = pgTable("location_types", {
  id: serial("id").primaryKey(),
  type: varchar("type", { length: 50 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  typeUnique: unique("location_types_type_unique").on(table.type),
}));

// ============ LOCATIONS TABLE (formerly ports) ============
export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  country: varchar("country", { length: 100 }).notNull(),
  coordinates: jsonb("coordinates"), // { lat: number, lng: number }
  description: text("description"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  nameIdx: unique("locations_name_unique").on(table.name),
}));


// ============ PARTY THEMES TABLE (NEW - Replaces parties) ============
export const partyThemes = pgTable("party_themes", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  longDescription: text("long_description"),
  shortDescription: text("short_description"),
  costumeIdeas: text("costume_ideas"),
  imageUrl: text("image_url"),
  amazonShoppingListUrl: text("amazon_shopping_list_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  nameIdx: unique("party_themes_name_unique").on(table.name),
}));

// ============ TRIP INFO SECTIONS TABLE (formerly cruise_info_sections) ============
export const tripInfoSections = pgTable("trip_info_sections", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull().references(() => trips.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content"), // Rich text content
  orderIndex: integer("order_index").notNull(),
  updatedBy: text("updated_by").references(() => profiles.id),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  tripIdx: index("trip_info_trip_idx").on(table.tripId),
  orderIdx: index("trip_info_order_idx").on(table.tripId, table.orderIndex),
}));



// ============ RELATIONS ============
export const profilesRelations = relations(profiles, ({ many }) => ({
  // Future relations can be added here
}));

export const tripTypesRelations = relations(tripTypes, ({ many }) => ({
  trips: many(trips),
}));

export const tripStatusRelations = relations(tripStatus, ({ many }) => ({
  trips: many(trips),
}));

export const settingsRelations = relations(settings, ({ one }) => ({
  creator: one(profiles, {
    fields: [settings.createdBy],
    references: [profiles.id],
  }),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  inviter: one(profiles, {
    fields: [invitations.invitedBy],
    references: [profiles.id],
  }),
  trip: one(trips, {
    fields: [invitations.tripId],
    references: [trips.id],
  }),
  acceptedBy: one(profiles, {
    fields: [invitations.usedBy],
    references: [profiles.id],
  }),
}));

export const shipsRelations = relations(ships, ({ many }) => ({
  trips: many(trips),
}));

export const tripsRelations = relations(trips, ({ many, one }) => ({
  itinerary: many(itinerary),
  events: many(events),
  tripTalent: many(tripTalent),
  ship: one(ships, {
    fields: [trips.shipId],
    references: [ships.id],
  }),
  tripType: one(tripTypes, {
    fields: [trips.tripTypeId],
    references: [tripTypes.id],
  }),
  tripStatus: one(tripStatus, {
    fields: [trips.tripStatusId],
    references: [tripStatus.id],
  }),
  creator: one(profiles, {
    fields: [trips.createdBy],
    references: [profiles.id],
  }),
}));


export const locationTypesRelations = relations(locationTypes, ({ many }) => ({
  itineraries: many(itinerary),
}));

export const locationsRelations = relations(locations, ({ many }) => ({
  itineraries: many(itinerary),
}));

export const itineraryRelations = relations(itinerary, ({ one }) => ({
  trip: one(trips, {
    fields: [itinerary.tripId],
    references: [trips.id],
  }),
  location: one(locations, {
    fields: [itinerary.locationId],
    references: [locations.id],
  }),
  locationType: one(locationTypes, {
    fields: [itinerary.locationTypeId],
    references: [locationTypes.id],
  }),
}));

export const eventsRelations = relations(events, ({ one }) => ({
  trip: one(trips, {
    fields: [events.tripId],
    references: [trips.id],
  }),
  partyTheme: one(partyThemes, {
    fields: [events.partyThemeId],
    references: [partyThemes.id],
  }),
}));

export const talentCategoriesRelations = relations(talentCategories, ({ many }) => ({
  talent: many(talent),
}));

export const partyThemesRelations = relations(partyThemes, ({ many }) => ({
  events: many(events),
}));

export const talentRelations = relations(talent, ({ many, one }) => ({
  tripTalent: many(tripTalent),
  talentCategory: one(talentCategories, {
    fields: [talent.talentCategoryId],
    references: [talentCategories.id],
  }),
}));

export const tripTalentRelations = relations(tripTalent, ({ one }) => ({
  trip: one(trips, {
    fields: [tripTalent.tripId],
    references: [trips.id],
  }),
  talent: one(talent, {
    fields: [tripTalent.talentId],
    references: [talent.id],
  }),
}));



export const tripInfoSectionsRelations = relations(tripInfoSections, ({ one }) => ({
  trip: one(trips, {
    fields: [tripInfoSections.tripId],
    references: [trips.id],
  }),
  updater: one(profiles, {
    fields: [tripInfoSections.updatedBy],
    references: [profiles.id],
  }),
}));



// ============ INSERT SCHEMAS ============
export const insertTripTypeSchema = createInsertSchema(tripTypes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTripStatusSchema = createInsertSchema(tripStatus).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProfileSchema = createInsertSchema(profiles).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertShipSchema = createInsertSchema(ships).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// User schema removed - using profiles table exclusively

export const insertInvitationSchema = createInsertSchema(invitations).omit({
  id: true,
  createdAt: true,
});

export const insertTripSchema = createInsertSchema(trips).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});


export const insertItinerarySchema = createInsertSchema(itinerary).omit({
  id: true,
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTalentCategorySchema = createInsertSchema(talentCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTalentSchema = createInsertSchema(talent).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLocationTypeSchema = createInsertSchema(locationTypes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLocationSchema = createInsertSchema(locations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTripInfoSectionSchema = createInsertSchema(tripInfoSections).omit({
  id: true,
  updatedAt: true,
});



// ============ TYPE EXPORTS ============
export type InsertTripType = z.infer<typeof insertTripTypeSchema>;
export type InsertTripStatus = z.infer<typeof insertTripStatusSchema>;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type InsertShip = z.infer<typeof insertShipSchema>;
export type InsertLocationType = z.infer<typeof insertLocationTypeSchema>;
export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type InsertTalentCategory = z.infer<typeof insertTalentCategorySchema>;
export type InsertTalent = z.infer<typeof insertTalentSchema>;
export type InsertInvitation = z.infer<typeof insertInvitationSchema>;
export type TripType = typeof tripTypes.$inferSelect;
export type TripStatus = typeof tripStatus.$inferSelect;
export type Settings = typeof settings.$inferSelect;
export type LocationType = typeof locationTypes.$inferSelect;
export type Location = typeof locations.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type Ship = typeof ships.$inferSelect;
export type Trip = typeof trips.$inferSelect;
export type Itinerary = typeof itinerary.$inferSelect;
export type Event = typeof events.$inferSelect;
export type TalentCategory = typeof talentCategories.$inferSelect;
export type Talent = typeof talent.$inferSelect;
export type PartyTheme = typeof partyThemes.$inferSelect;
export type TripInfoSection = typeof tripInfoSections.$inferSelect;
export type Invitation = typeof invitations.$inferSelect;

