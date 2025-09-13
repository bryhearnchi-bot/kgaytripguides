var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema-sqlite.ts
var schema_sqlite_exports = {};
__export(schema_sqlite_exports, {
  cruises: () => cruises,
  events: () => events,
  itinerary: () => itinerary,
  media: () => media,
  talent: () => talent,
  trips: () => trips,
  users: () => users
});
import { sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer
} from "drizzle-orm/sqlite-core";
var users, trips, cruises, itinerary, events, talent, media;
var init_schema_sqlite = __esm({
  "shared/schema-sqlite.ts"() {
    "use strict";
    users = sqliteTable("users", {
      id: text("id").primaryKey().default(sql`lower(hex(randomblob(16)))`),
      username: text("username").notNull().unique(),
      password: text("password").notNull(),
      email: text("email").unique(),
      fullName: text("full_name"),
      role: text("role").default("viewer"),
      createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
      updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
      lastLogin: integer("last_login", { mode: "timestamp" }),
      isActive: integer("is_active", { mode: "boolean" }).default(1)
    });
    trips = sqliteTable("trips", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      name: text("name").notNull(),
      slug: text("slug").notNull().unique(),
      description: text("description"),
      shortDescription: text("short_description"),
      heroImageUrl: text("hero_image_url"),
      startDate: text("start_date").notNull(),
      endDate: text("end_date").notNull(),
      status: text("status").default("upcoming"),
      featured: integer("featured", { mode: "boolean" }).default(0),
      createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
      updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`)
    });
    cruises = trips;
    itinerary = sqliteTable("itinerary", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      tripId: integer("trip_id").references(() => trips.id, { onDelete: "cascade" }),
      day: integer("day").notNull(),
      date: text("date").notNull(),
      port: text("port").notNull(),
      country: text("country"),
      arrivalTime: text("arrival_time"),
      departureTime: text("departure_time"),
      description: text("description"),
      imageUrl: text("image_url"),
      isSeaDay: integer("is_sea_day", { mode: "boolean" }).default(0),
      createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
      updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`)
    });
    events = sqliteTable("events", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      tripId: integer("trip_id").references(() => trips.id, { onDelete: "cascade" }),
      name: text("name").notNull(),
      description: text("description"),
      type: text("type"),
      venue: text("venue"),
      date: text("date").notNull(),
      startTime: text("start_time"),
      endTime: text("end_time"),
      imageUrl: text("image_url"),
      featured: integer("featured", { mode: "boolean" }).default(0),
      createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
      updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`)
    });
    talent = sqliteTable("talent", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      name: text("name").notNull(),
      category: text("category"),
      role: text("role"),
      knownFor: text("known_for"),
      bio: text("bio"),
      imageUrl: text("image_url"),
      socialLinks: text("social_links"),
      featured: integer("featured", { mode: "boolean" }).default(0),
      createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
      updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`)
    });
    media = sqliteTable("media", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      tripId: integer("trip_id").references(() => trips.id, { onDelete: "cascade" }),
      type: text("type").notNull(),
      url: text("url").notNull(),
      title: text("title"),
      description: text("description"),
      createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`)
    });
  }
});

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  aiDrafts: () => aiDrafts,
  aiDraftsRelations: () => aiDraftsRelations,
  aiJobs: () => aiJobs,
  aiJobsRelations: () => aiJobsRelations,
  auditLog: () => auditLog,
  cruiseInfoSections: () => cruiseInfoSections,
  cruiseInfoSectionsRelations: () => cruiseInfoSectionsRelations,
  cruiseTalent: () => cruiseTalent2,
  cruiseTalentRelations: () => cruiseTalentRelations,
  cruises: () => cruises2,
  cruisesRelations: () => cruisesRelations,
  events: () => events2,
  eventsRelations: () => eventsRelations,
  insertAiDraftSchema: () => insertAiDraftSchema,
  insertAiJobSchema: () => insertAiJobSchema,
  insertCruiseInfoSectionSchema: () => insertCruiseInfoSectionSchema,
  insertCruiseSchema: () => insertCruiseSchema,
  insertEventSchema: () => insertEventSchema,
  insertItinerarySchema: () => insertItinerarySchema,
  insertMediaSchema: () => insertMediaSchema,
  insertPartyTemplateSchema: () => insertPartyTemplateSchema,
  insertSettingsSchema: () => insertSettingsSchema,
  insertTalentSchema: () => insertTalentSchema,
  insertTripInfoSectionSchema: () => insertTripInfoSectionSchema,
  insertTripSchema: () => insertTripSchema,
  insertUserSchema: () => insertUserSchema,
  itinerary: () => itinerary2,
  itineraryRelations: () => itineraryRelations,
  media: () => media2,
  partyTemplates: () => partyTemplates,
  partyTemplatesRelations: () => partyTemplatesRelations,
  passwordResetTokens: () => passwordResetTokens,
  settings: () => settings2,
  settingsRelations: () => settingsRelations,
  talent: () => talent2,
  talentRelations: () => talentRelations,
  tripInfoSections: () => tripInfoSections,
  tripInfoSectionsRelations: () => tripInfoSectionsRelations,
  tripTalent: () => tripTalent,
  tripTalentRelations: () => tripTalentRelations,
  trips: () => trips2,
  tripsRelations: () => tripsRelations,
  userCruises: () => userCruises,
  userCruisesRelations: () => userCruisesRelations,
  userTrips: () => userTrips,
  userTripsRelations: () => userTripsRelations,
  users: () => users2
});
import { sql as sql2 } from "drizzle-orm";
import {
  pgTable,
  text as text2,
  varchar,
  timestamp,
  integer as integer2,
  boolean,
  jsonb,
  serial,
  primaryKey as primaryKey2,
  index as index2,
  unique
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
var users2, passwordResetTokens, settings2, cruises2, trips2, itinerary2, events2, talent2, cruiseTalent2, tripTalent, media2, userCruises, userTrips, partyTemplates, tripInfoSections, cruiseInfoSections, aiJobs, aiDrafts, auditLog, tripsRelations, cruisesRelations, itineraryRelations, eventsRelations, talentRelations, tripTalentRelations, cruiseTalentRelations, userTripsRelations, userCruisesRelations, partyTemplatesRelations, tripInfoSectionsRelations, cruiseInfoSectionsRelations, aiJobsRelations, aiDraftsRelations, settingsRelations, insertUserSchema, insertTripSchema, insertCruiseSchema, insertItinerarySchema, insertEventSchema, insertTalentSchema, insertMediaSchema, insertPartyTemplateSchema, insertTripInfoSectionSchema, insertCruiseInfoSectionSchema, insertAiJobSchema, insertAiDraftSchema, insertSettingsSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    users2 = pgTable("users", {
      id: varchar("id").primaryKey().default(sql2`gen_random_uuid()`),
      username: text2("username").notNull().unique(),
      password: text2("password").notNull(),
      email: text2("email").unique(),
      fullName: text2("full_name"),
      role: text2("role").default("viewer"),
      // super_admin, trip_admin, content_editor, media_manager, viewer
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow(),
      lastLogin: timestamp("last_login"),
      isActive: boolean("is_active").default(true)
    });
    passwordResetTokens = pgTable("password_reset_tokens", {
      id: varchar("id").primaryKey().default(sql2`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users2.id, { onDelete: "cascade" }),
      token: text2("token").notNull().unique(),
      expiresAt: timestamp("expires_at").notNull(),
      createdAt: timestamp("created_at").defaultNow(),
      usedAt: timestamp("used_at")
      // null if not used yet
    }, (table) => ({
      tokenIdx: index2("password_reset_token_idx").on(table.token),
      userIdx: index2("password_reset_user_idx").on(table.userId),
      expiresIdx: index2("password_reset_expires_idx").on(table.expiresAt)
    }));
    settings2 = pgTable("settings", {
      id: serial("id").primaryKey(),
      category: text2("category").notNull(),
      // trip_types, notification_types, etc.
      key: text2("key").notNull(),
      // cruise, hotel, flight, etc.
      label: text2("label").notNull(),
      // Display name for UI
      value: text2("value"),
      // Optional value field
      metadata: jsonb("metadata"),
      // Additional data like button text, colors, etc.
      isActive: boolean("is_active").default(true),
      orderIndex: integer2("order_index").default(0),
      // For sorting within category
      createdBy: varchar("created_by").references(() => users2.id),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    }, (table) => ({
      categoryKeyUnique: unique("settings_category_key_unique").on(table.category, table.key),
      categoryKeyIdx: index2("settings_category_key_idx").on(table.category, table.key),
      categoryIdx: index2("settings_category_idx").on(table.category),
      activeIdx: index2("settings_active_idx").on(table.isActive)
    }));
    cruises2 = pgTable("cruises", {
      id: serial("id").primaryKey(),
      name: text2("name").notNull(),
      slug: varchar("slug", { length: 255 }).notNull().unique(),
      shipName: text2("ship_name").notNull(),
      cruiseLine: text2("cruise_line"),
      // Virgin, Celebrity, etc.
      tripType: text2("trip_type").default("cruise").notNull(),
      // cruise, hotel, flight, etc. - references settings with category 'trip_types'
      startDate: timestamp("start_date").notNull(),
      endDate: timestamp("end_date").notNull(),
      status: text2("status").default("upcoming"),
      // upcoming, ongoing, past
      heroImageUrl: text2("hero_image_url"),
      description: text2("description"),
      highlights: jsonb("highlights"),
      // Array of highlight strings
      includesInfo: jsonb("includes_info"),
      // What's included in the trip
      pricing: jsonb("pricing"),
      // Pricing tiers and info
      createdBy: varchar("created_by").references(() => users2.id),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    }, (table) => ({
      statusIdx: index2("trip_status_idx").on(table.status),
      slugIdx: index2("trip_slug_idx").on(table.slug),
      tripTypeIdx: index2("trip_trip_type_idx").on(table.tripType)
    }));
    trips2 = cruises2;
    itinerary2 = pgTable("itinerary", {
      id: serial("id").primaryKey(),
      cruiseId: integer2("cruise_id").notNull().references(() => cruises2.id, { onDelete: "cascade" }),
      date: timestamp("date").notNull(),
      day: integer2("day").notNull(),
      // Day number of trip (1, 2, 3, etc.)
      portName: text2("port_name").notNull(),
      country: text2("country"),
      arrivalTime: text2("arrival_time"),
      // Stored as text for flexibility (e.g., "08:00", "—")
      departureTime: text2("departure_time"),
      allAboardTime: text2("all_aboard_time"),
      portImageUrl: text2("port_image_url"),
      description: text2("description"),
      highlights: jsonb("highlights"),
      // Port highlights
      orderIndex: integer2("order_index").notNull(),
      // For sorting
      segment: text2("segment").default("main")
      // pre, main, post
    }, (table) => ({
      cruiseIdx: index2("itinerary_cruise_idx").on(table.cruiseId),
      dateIdx: index2("itinerary_date_idx").on(table.date)
    }));
    events2 = pgTable("events", {
      id: serial("id").primaryKey(),
      cruiseId: integer2("cruise_id").notNull().references(() => cruises2.id, { onDelete: "cascade" }),
      date: timestamp("date").notNull(),
      time: text2("time").notNull(),
      // "14:00", "21:30", etc.
      title: text2("title").notNull(),
      type: text2("type").notNull(),
      // party, show, dining, lounge, fun, club, after
      venue: text2("venue").notNull(),
      deck: text2("deck"),
      description: text2("description"),
      shortDescription: text2("short_description"),
      imageUrl: text2("image_url"),
      themeDescription: text2("theme_description"),
      // For parties
      dressCode: text2("dress_code"),
      capacity: integer2("capacity"),
      requiresReservation: boolean("requires_reservation").default(false),
      talentIds: jsonb("talent_ids"),
      // Array of talent IDs
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    }, (table) => ({
      cruiseIdx: index2("events_cruise_idx").on(table.cruiseId),
      dateIdx: index2("events_date_idx").on(table.date),
      typeIdx: index2("events_type_idx").on(table.type)
    }));
    talent2 = pgTable("talent", {
      id: serial("id").primaryKey(),
      name: text2("name").notNull(),
      category: text2("category").notNull(),
      // Broadway, Drag, Comedy, Music, etc.
      bio: text2("bio"),
      knownFor: text2("known_for"),
      profileImageUrl: text2("profile_image_url"),
      socialLinks: jsonb("social_links"),
      // {instagram: "", twitter: "", etc.}
      website: text2("website"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    }, (table) => ({
      nameIdx: index2("talent_name_idx").on(table.name),
      categoryIdx: index2("talent_category_idx").on(table.category)
    }));
    cruiseTalent2 = pgTable("cruise_talent", {
      cruiseId: integer2("cruise_id").notNull().references(() => cruises2.id, { onDelete: "cascade" }),
      talentId: integer2("talent_id").notNull().references(() => talent2.id, { onDelete: "cascade" }),
      role: text2("role"),
      // Headliner, Special Guest, Host, etc.
      performanceCount: integer2("performance_count"),
      notes: text2("notes"),
      createdAt: timestamp("created_at").defaultNow()
    }, (table) => ({
      pk: primaryKey2({ columns: [table.cruiseId, table.talentId] }),
      cruiseIdx: index2("cruise_talent_cruise_idx").on(table.cruiseId),
      talentIdx: index2("cruise_talent_talent_idx").on(table.talentId)
    }));
    tripTalent = cruiseTalent2;
    media2 = pgTable("media", {
      id: serial("id").primaryKey(),
      url: text2("url").notNull(),
      thumbnailUrl: text2("thumbnail_url"),
      type: text2("type").notNull(),
      // port, party, talent, trip, event, gallery
      associatedType: text2("associated_type"),
      // trip, event, talent, itinerary
      associatedId: integer2("associated_id"),
      caption: text2("caption"),
      altText: text2("alt_text"),
      credits: text2("credits"),
      // Photographer/source credits
      uploadedBy: varchar("uploaded_by").references(() => users2.id),
      uploadedAt: timestamp("uploaded_at").defaultNow(),
      metadata: jsonb("metadata")
      // Additional metadata like dimensions, file size, etc.
    }, (table) => ({
      typeIdx: index2("media_type_idx").on(table.type),
      associatedIdx: index2("media_associated_idx").on(table.associatedType, table.associatedId)
    }));
    userCruises = pgTable("user_cruises", {
      userId: varchar("user_id").notNull().references(() => users2.id, { onDelete: "cascade" }),
      cruiseId: integer2("cruise_id").notNull().references(() => cruises2.id, { onDelete: "cascade" }),
      permissionLevel: text2("permission_level").notNull(),
      // admin, editor, viewer
      assignedBy: varchar("assigned_by").references(() => users2.id),
      assignedAt: timestamp("assigned_at").defaultNow()
    }, (table) => ({
      pk: primaryKey2({ columns: [table.userId, table.cruiseId] }),
      userIdx: index2("user_cruises_user_idx").on(table.userId),
      cruiseIdx: index2("user_cruises_cruise_idx").on(table.cruiseId)
    }));
    userTrips = userCruises;
    partyTemplates = pgTable("party_templates", {
      id: serial("id").primaryKey(),
      name: text2("name").notNull(),
      themeDescription: text2("theme_description"),
      dressCode: text2("dress_code"),
      defaultImageUrl: text2("default_image_url"),
      tags: jsonb("tags"),
      // Array of tags for searching
      defaults: jsonb("defaults"),
      // Default values for events using this template
      createdBy: varchar("created_by").references(() => users2.id),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    }, (table) => ({
      nameIdx: index2("party_templates_name_idx").on(table.name)
    }));
    tripInfoSections = pgTable("trip_info_sections", {
      id: serial("id").primaryKey(),
      cruiseId: integer2("cruise_id").notNull().references(() => trips2.id, { onDelete: "cascade" }),
      title: text2("title").notNull(),
      content: text2("content"),
      // Rich text content
      orderIndex: integer2("order_index").notNull(),
      updatedBy: varchar("updated_by").references(() => users2.id),
      updatedAt: timestamp("updated_at").defaultNow()
    }, (table) => ({
      cruiseIdx: index2("cruise_info_cruise_idx").on(table.cruiseId),
      orderIdx: index2("trip_info_order_idx").on(table.cruiseId, table.orderIndex)
    }));
    cruiseInfoSections = tripInfoSections;
    aiJobs = pgTable("ai_jobs", {
      id: serial("id").primaryKey(),
      cruiseId: integer2("cruise_id").notNull().references(() => trips2.id, { onDelete: "cascade" }),
      sourceType: text2("source_type").notNull(),
      // pdf, url
      sourceRef: text2("source_ref").notNull(),
      // URL or file path
      task: text2("task").notNull(),
      // extract
      status: text2("status").default("queued"),
      // queued, processing, completed, failed
      result: jsonb("result"),
      // Extracted data
      error: text2("error"),
      createdBy: varchar("created_by").references(() => users2.id),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    }, (table) => ({
      cruiseIdx: index2("ai_jobs_cruise_idx").on(table.cruiseId),
      statusIdx: index2("ai_jobs_status_idx").on(table.status)
    }));
    aiDrafts = pgTable("ai_drafts", {
      id: serial("id").primaryKey(),
      cruiseId: integer2("cruise_id").notNull().references(() => trips2.id, { onDelete: "cascade" }),
      draftType: text2("draft_type").notNull(),
      // itinerary, events, info
      payload: jsonb("payload").notNull(),
      // Draft data to be reviewed
      createdFromJobId: integer2("created_from_job_id").references(() => aiJobs.id),
      createdBy: varchar("created_by").references(() => users2.id),
      createdAt: timestamp("created_at").defaultNow()
    }, (table) => ({
      cruiseIdx: index2("ai_drafts_cruise_idx").on(table.cruiseId),
      typeIdx: index2("ai_drafts_type_idx").on(table.draftType)
    }));
    auditLog = pgTable("audit_log", {
      id: serial("id").primaryKey(),
      userId: varchar("user_id").references(() => users2.id),
      action: text2("action").notNull(),
      // create, update, delete
      tableName: text2("table_name").notNull(),
      recordId: text2("record_id"),
      oldValues: jsonb("old_values"),
      newValues: jsonb("new_values"),
      timestamp: timestamp("timestamp").defaultNow(),
      ipAddress: text2("ip_address")
    }, (table) => ({
      userIdx: index2("audit_user_idx").on(table.userId),
      timestampIdx: index2("audit_timestamp_idx").on(table.timestamp)
    }));
    tripsRelations = relations(trips2, ({ many, one }) => ({
      itinerary: many(itinerary2),
      events: many(events2),
      tripTalent: many(tripTalent),
      userTrips: many(userTrips),
      creator: one(users2, {
        fields: [trips2.createdBy],
        references: [users2.id]
      })
    }));
    cruisesRelations = tripsRelations;
    itineraryRelations = relations(itinerary2, ({ one }) => ({
      cruise: one(trips2, {
        fields: [itinerary2.cruiseId],
        references: [trips2.id]
      })
    }));
    eventsRelations = relations(events2, ({ one }) => ({
      cruise: one(trips2, {
        fields: [events2.cruiseId],
        references: [trips2.id]
      })
    }));
    talentRelations = relations(talent2, ({ many }) => ({
      tripTalent: many(tripTalent),
      // Backward compatibility
      cruiseTalent: many(tripTalent)
    }));
    tripTalentRelations = relations(tripTalent, ({ one }) => ({
      cruise: one(trips2, {
        fields: [tripTalent.cruiseId],
        references: [trips2.id]
      }),
      talent: one(talent2, {
        fields: [tripTalent.talentId],
        references: [talent2.id]
      })
    }));
    cruiseTalentRelations = tripTalentRelations;
    userTripsRelations = relations(userTrips, ({ one }) => ({
      user: one(users2, {
        fields: [userTrips.userId],
        references: [users2.id]
      }),
      cruise: one(trips2, {
        fields: [userTrips.cruiseId],
        references: [trips2.id]
      })
    }));
    userCruisesRelations = userTripsRelations;
    partyTemplatesRelations = relations(partyTemplates, ({ one }) => ({
      creator: one(users2, {
        fields: [partyTemplates.createdBy],
        references: [users2.id]
      })
    }));
    tripInfoSectionsRelations = relations(tripInfoSections, ({ one }) => ({
      cruise: one(trips2, {
        fields: [tripInfoSections.cruiseId],
        references: [trips2.id]
      }),
      updater: one(users2, {
        fields: [tripInfoSections.updatedBy],
        references: [users2.id]
      })
    }));
    cruiseInfoSectionsRelations = tripInfoSectionsRelations;
    aiJobsRelations = relations(aiJobs, ({ one, many }) => ({
      cruise: one(trips2, {
        fields: [aiJobs.cruiseId],
        references: [trips2.id]
      }),
      creator: one(users2, {
        fields: [aiJobs.createdBy],
        references: [users2.id]
      }),
      drafts: many(aiDrafts)
    }));
    aiDraftsRelations = relations(aiDrafts, ({ one }) => ({
      cruise: one(trips2, {
        fields: [aiDrafts.cruiseId],
        references: [trips2.id]
      }),
      job: one(aiJobs, {
        fields: [aiDrafts.createdFromJobId],
        references: [aiJobs.id]
      }),
      creator: one(users2, {
        fields: [aiDrafts.createdBy],
        references: [users2.id]
      })
    }));
    settingsRelations = relations(settings2, ({ one }) => ({
      creator: one(users2, {
        fields: [settings2.createdBy],
        references: [users2.id]
      })
    }));
    insertUserSchema = createInsertSchema(users2).pick({
      username: true,
      password: true,
      email: true,
      fullName: true,
      role: true
    });
    insertTripSchema = createInsertSchema(trips2).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertCruiseSchema = insertTripSchema;
    insertItinerarySchema = createInsertSchema(itinerary2).omit({
      id: true
    });
    insertEventSchema = createInsertSchema(events2).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertTalentSchema = createInsertSchema(talent2).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertMediaSchema = createInsertSchema(media2).omit({
      id: true,
      uploadedAt: true
    });
    insertPartyTemplateSchema = createInsertSchema(partyTemplates).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertTripInfoSectionSchema = createInsertSchema(tripInfoSections).omit({
      id: true,
      updatedAt: true
    });
    insertCruiseInfoSectionSchema = insertTripInfoSectionSchema;
    insertAiJobSchema = createInsertSchema(aiJobs).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertAiDraftSchema = createInsertSchema(aiDrafts).omit({
      id: true,
      createdAt: true
    });
    insertSettingsSchema = createInsertSchema(settings2).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
  }
});

// server/storage.ts
import { config } from "dotenv";
import { eq, and, desc, asc, ilike, or } from "drizzle-orm";
var db, schema, users3, trips3, cruises3, itinerary3, events3, talent3, media3, UserStorage, TripStorage, CruiseStorage, ItineraryStorage, EventStorage, TalentStorage, MediaStorage, SettingsStorage, storage, tripStorage, cruiseStorage, itineraryStorage, eventStorage, talentStorage, mediaStorage, settingsStorage;
var init_storage = __esm({
  async "server/storage.ts"() {
    "use strict";
    config();
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set, ensure the database is provisioned");
    }
    if (process.env.DATABASE_URL.startsWith("file:")) {
      const { drizzle } = await import("drizzle-orm/better-sqlite3");
      const Database = (await import("better-sqlite3")).default;
      schema = await Promise.resolve().then(() => (init_schema_sqlite(), schema_sqlite_exports));
      const sqlite = new Database(process.env.DATABASE_URL.replace("file:", ""));
      db = drizzle(sqlite, { schema });
    } else {
      const { drizzle } = await import("drizzle-orm/neon-http");
      const { neon } = await import("@neondatabase/serverless");
      schema = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const queryClient = neon(process.env.DATABASE_URL);
      db = drizzle(queryClient, { schema });
    }
    ({
      users: users3,
      trips: trips3,
      cruises: cruises3,
      itinerary: itinerary3,
      events: events3,
      talent: talent3,
      media: media3
    } = schema);
    UserStorage = class {
      async getUser(id) {
        const result = await db.select().from(users3).where(eq(users3.id, id));
        return result[0];
      }
      async getUserByUsername(username) {
        const result = await db.select().from(users3).where(eq(users3.username, username));
        return result[0];
      }
      async createUser(insertUser) {
        const result = await db.insert(users3).values(insertUser).returning();
        return result[0];
      }
      async updateUserLastLogin(id) {
        await db.update(users3).set({ lastLogin: /* @__PURE__ */ new Date() }).where(eq(users3.id, id));
      }
    };
    TripStorage = class {
      async getAllTrips() {
        return await db.select().from(cruises3).orderBy(desc(cruises3.startDate));
      }
      async getTripById(id) {
        const result = await db.select().from(cruises3).where(eq(cruises3.id, id));
        return result[0];
      }
      async getTripBySlug(slug) {
        const result = await db.select().from(cruises3).where(eq(cruises3.slug, slug));
        return result[0];
      }
      async getUpcomingTrips() {
        return await db.select().from(cruises3).where(eq(cruises3.status, "upcoming")).orderBy(asc(cruises3.startDate));
      }
      async getPastTrips() {
        return await db.select().from(cruises3).where(eq(cruises3.status, "past")).orderBy(desc(cruises3.startDate));
      }
      async createTrip(trip) {
        const values = { ...trip };
        if (trip.startDate) {
          if (typeof trip.startDate === "string") {
            values.startDate = new Date(trip.startDate);
          } else {
            values.startDate = trip.startDate;
          }
        }
        if (trip.endDate) {
          if (typeof trip.endDate === "string") {
            values.endDate = new Date(trip.endDate);
          } else {
            values.endDate = trip.endDate;
          }
        }
        const result = await db.insert(cruises3).values(values).returning();
        return result[0];
      }
      async updateTrip(id, trip) {
        const updates = { ...trip, updatedAt: /* @__PURE__ */ new Date() };
        if (trip.startDate) {
          if (typeof trip.startDate === "string") {
            updates.startDate = new Date(trip.startDate);
          } else {
            updates.startDate = trip.startDate;
          }
        }
        if (trip.endDate) {
          if (typeof trip.endDate === "string") {
            updates.endDate = new Date(trip.endDate);
          } else {
            updates.endDate = trip.endDate;
          }
        }
        const result = await db.update(cruises3).set(updates).where(eq(cruises3.id, id)).returning();
        return result[0];
      }
      async deleteTrip(id) {
        await db.delete(cruises3).where(eq(cruises3.id, id));
      }
    };
    CruiseStorage = class {
      tripStorage = new TripStorage();
      async getAllCruises() {
        return await this.tripStorage.getAllTrips();
      }
      async getCruiseById(id) {
        return await this.tripStorage.getTripById(id);
      }
      async getCruiseBySlug(slug) {
        return await this.tripStorage.getTripBySlug(slug);
      }
      async getUpcomingCruises() {
        return await this.tripStorage.getUpcomingTrips();
      }
      async getPastCruises() {
        return await this.tripStorage.getPastTrips();
      }
      async createCruise(cruise) {
        return await this.tripStorage.createTrip(cruise);
      }
      async updateCruise(id, cruise) {
        return await this.tripStorage.updateTrip(id, cruise);
      }
      async deleteCruise(id) {
        return await this.tripStorage.deleteTrip(id);
      }
    };
    ItineraryStorage = class {
      async getItineraryByCruise(cruiseId) {
        if (process.env.DATABASE_URL.startsWith("file:")) {
          return await db.select().from(itinerary3).where(eq(itinerary3.tripId, cruiseId)).orderBy(asc(itinerary3.day));
        } else {
          return await db.select().from(itinerary3).where(eq(itinerary3.cruiseId, cruiseId)).orderBy(asc(itinerary3.orderIndex));
        }
      }
      async createItineraryStop(stop) {
        const values = { ...stop };
        if (stop.date && stop.date !== "" && stop.date !== null) {
          if (typeof stop.date === "string") {
            values.date = new Date(stop.date);
          } else {
            values.date = stop.date;
          }
        } else {
          if ("date" in values) {
            delete values.date;
          }
        }
        const result = await db.insert(itinerary3).values(values).returning();
        return result[0];
      }
      async updateItineraryStop(id, stop) {
        const updates = { ...stop };
        if (stop.date && stop.date !== "" && stop.date !== null) {
          if (typeof stop.date === "string") {
            updates.date = new Date(stop.date);
          } else {
            updates.date = stop.date;
          }
        } else if (stop.hasOwnProperty("date")) {
          if ("date" in updates) {
            delete updates.date;
          }
        }
        const result = await db.update(itinerary3).set(updates).where(eq(itinerary3.id, id)).returning();
        return result[0];
      }
      async deleteItineraryStop(id) {
        await db.delete(itinerary3).where(eq(itinerary3.id, id));
      }
    };
    EventStorage = class {
      async getEventsByCruise(cruiseId) {
        if (process.env.DATABASE_URL.startsWith("file:")) {
          return await db.select().from(events3).where(eq(events3.tripId, cruiseId)).orderBy(asc(events3.date), asc(events3.startTime));
        } else {
          return await db.select().from(events3).where(eq(events3.cruiseId, cruiseId)).orderBy(asc(events3.date), asc(events3.time));
        }
      }
      async getEventsByDate(cruiseId, date) {
        return await db.select().from(events3).where(and(eq(events3.cruiseId, cruiseId), eq(events3.date, date))).orderBy(asc(events3.time));
      }
      async getEventsByType(cruiseId, type) {
        return await db.select().from(events3).where(and(eq(events3.cruiseId, cruiseId), eq(events3.type, type))).orderBy(asc(events3.date), asc(events3.time));
      }
      async createEvent(event) {
        const result = await db.insert(events3).values(event).returning();
        return result[0];
      }
      async updateEvent(id, event) {
        const result = await db.update(events3).set({ ...event, updatedAt: /* @__PURE__ */ new Date() }).where(eq(events3.id, id)).returning();
        return result[0];
      }
      async deleteEvent(id) {
        await db.delete(events3).where(eq(events3.id, id));
      }
    };
    TalentStorage = class {
      async getAllTalent() {
        return await db.select().from(talent3).orderBy(asc(talent3.name));
      }
      async getTalentById(id) {
        const result = await db.select().from(talent3).where(eq(talent3.id, id));
        return result[0];
      }
      async getTalentByCruise(cruiseId) {
        const result = await db.select().from(talent3).orderBy(asc(talent3.name));
        return result;
      }
      async searchTalent(search, performanceType) {
        const conditions = [];
        if (search) {
          conditions.push(
            or(
              ilike(talent3.name, `%${search}%`),
              ilike(talent3.bio, `%${search}%`),
              ilike(talent3.knownFor, `%${search}%`)
            )
          );
        }
        if (performanceType) {
          conditions.push(eq(talent3.category, performanceType));
        }
        const query = conditions.length > 0 ? db.select().from(talent3).where(conditions.length === 1 ? conditions[0] : and(...conditions)) : db.select().from(talent3);
        return await query.orderBy(asc(talent3.name));
      }
      async createTalent(talentData) {
        const result = await db.insert(talent3).values(talentData).returning();
        return result[0];
      }
      async updateTalent(id, talentData) {
        const result = await db.update(talent3).set({ ...talentData, updatedAt: /* @__PURE__ */ new Date() }).where(eq(talent3.id, id)).returning();
        return result[0];
      }
      async deleteTalent(id) {
        await db.delete(talent3).where(eq(talent3.id, id));
      }
      async assignTalentToCruise(cruiseId, talentId, role) {
        await db.insert(cruiseTalent).values({
          cruiseId,
          talentId,
          role
        }).onConflictDoNothing();
      }
      async removeTalentFromCruise(cruiseId, talentId) {
        await db.delete(cruiseTalent).where(and(
          eq(cruiseTalent.cruiseId, cruiseId),
          eq(cruiseTalent.talentId, talentId)
        ));
      }
    };
    MediaStorage = class {
      async getMediaByType(type) {
        return await db.select().from(media3).where(eq(media3.type, type));
      }
      async getMediaByAssociation(associatedType, associatedId) {
        return await db.select().from(media3).where(and(
          eq(media3.associatedType, associatedType),
          eq(media3.associatedId, associatedId)
        ));
      }
      async createMedia(mediaData) {
        const result = await db.insert(media3).values(mediaData).returning();
        return result[0];
      }
      async deleteMedia(id) {
        await db.delete(media3).where(eq(media3.id, id));
      }
    };
    SettingsStorage = class {
      async getSettingsByCategory(category) {
        return await db.select().from(settings).where(eq(settings.category, category)).orderBy(asc(settings.orderIndex), asc(settings.label));
      }
      async getSettingByCategoryAndKey(category, key) {
        const result = await db.select().from(settings).where(and(eq(settings.category, category), eq(settings.key, key)));
        return result[0];
      }
      async getAllActiveSettingsByCategory(category) {
        return await db.select().from(settings).where(and(
          eq(settings.category, category),
          eq(settings.isActive, true)
        )).orderBy(asc(settings.orderIndex), asc(settings.label));
      }
      async createSetting(settingData) {
        const result = await db.insert(settings).values(settingData).returning();
        return result[0];
      }
      async updateSetting(category, key, settingData) {
        const result = await db.update(settings).set({ ...settingData, updatedAt: /* @__PURE__ */ new Date() }).where(and(eq(settings.category, category), eq(settings.key, key))).returning();
        return result[0];
      }
      async deleteSetting(category, key) {
        await db.delete(settings).where(and(eq(settings.category, category), eq(settings.key, key)));
      }
      async deactivateSetting(category, key) {
        const result = await db.update(settings).set({ isActive: false, updatedAt: /* @__PURE__ */ new Date() }).where(and(eq(settings.category, category), eq(settings.key, key))).returning();
        return result[0];
      }
      async reorderSettings(category, orderedKeys) {
        for (let i = 0; i < orderedKeys.length; i++) {
          await db.update(settings).set({ orderIndex: i, updatedAt: /* @__PURE__ */ new Date() }).where(and(eq(settings.category, category), eq(settings.key, orderedKeys[i])));
        }
      }
    };
    storage = new UserStorage();
    tripStorage = new TripStorage();
    cruiseStorage = new CruiseStorage();
    itineraryStorage = new ItineraryStorage();
    eventStorage = new EventStorage();
    talentStorage = new TalentStorage();
    mediaStorage = new MediaStorage();
    settingsStorage = new SettingsStorage();
  }
});

// server/cloudinary.ts
var cloudinary_exports = {};
__export(cloudinary_exports, {
  cloudinary: () => cloudinary,
  createCloudinaryStorage: () => createCloudinaryStorage,
  cruiseImageStorage: () => cruiseImageStorage,
  eventImageStorage: () => eventImageStorage,
  itineraryImageStorage: () => itineraryImageStorage,
  talentImageStorage: () => talentImageStorage
});
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
var createCloudinaryStorage, talentImageStorage, eventImageStorage, itineraryImageStorage, cruiseImageStorage;
var init_cloudinary = __esm({
  "server/cloudinary.ts"() {
    "use strict";
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
      });
    }
    createCloudinaryStorage = (folder) => {
      return new CloudinaryStorage({
        cloudinary,
        params: {
          folder,
          allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
          transformation: [
            { width: 1200, height: 1200, crop: "limit", quality: "auto" }
          ]
        }
      });
    };
    talentImageStorage = createCloudinaryStorage("cruise-app/talent");
    eventImageStorage = createCloudinaryStorage("cruise-app/events");
    itineraryImageStorage = createCloudinaryStorage("cruise-app/itinerary");
    cruiseImageStorage = createCloudinaryStorage("cruise-app/cruises");
  }
});

// server/image-migration.ts
var image_migration_exports = {};
__export(image_migration_exports, {
  downloadImageFromUrl: () => downloadImageFromUrl,
  getAllImagesToMigrate: () => getAllImagesToMigrate,
  migrateAllImages: () => migrateAllImages
});
import fetch2 from "node-fetch";
import { promises as fs2 } from "fs";
import path2 from "path";
function getImageExtension(url) {
  const urlParts = url.split("?")[0];
  const extension = urlParts.split(".").pop()?.toLowerCase();
  if (extension && ["jpg", "jpeg", "png", "webp", "gif"].includes(extension)) {
    return extension;
  }
  return "jpg";
}
function createFilename(type, id, name, extension) {
  const cleanName = name.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
  return `${type}-${id}-${cleanName}.${extension}`;
}
function getImageDirectory(type) {
  switch (type) {
    case "talent":
      return "server/public/talent-images";
    case "event":
      return "server/public/event-images";
    case "itinerary":
      return "server/public/itinerary-images";
    case "cruise":
      return "server/public/cruise-images";
    case "party_template":
      return "server/public/party-images";
    default:
      throw new Error(`Unknown image type: ${type}`);
  }
}
function getPublicPath(type) {
  switch (type) {
    case "talent":
      return "/talent-images";
    case "event":
      return "/event-images";
    case "itinerary":
      return "/itinerary-images";
    case "cruise":
      return "/cruise-images";
    case "party_template":
      return "/party-images";
    default:
      throw new Error(`Unknown image type: ${type}`);
  }
}
async function downloadAndSaveImage(item) {
  try {
    console.log(`Downloading ${item.type} image for ${item.name}...`);
    const response = await fetch2(item.currentUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    const extension = getImageExtension(item.currentUrl);
    const filename = createFilename(item.type, item.id, item.name, extension);
    const directory = getImageDirectory(item.type);
    let adjustedDirectory = directory;
    if (process.cwd().endsWith("/server")) {
      adjustedDirectory = directory.replace("server/", "");
    }
    const filePath = path2.join(process.cwd(), adjustedDirectory, filename);
    console.log(`Saving ${filename} to ${filePath}...`);
    await fs2.writeFile(filePath, buffer);
    const publicPath = getPublicPath(item.type);
    const localUrl = `${publicPath}/${filename}`;
    console.log(`Successfully saved ${filename}`);
    return { filename, localUrl };
  } catch (error) {
    console.error(`Error processing ${item.type} ${item.name}:`, error);
    throw error;
  }
}
async function updateDatabase(item, localUrl) {
  try {
    console.log(`Updating database for ${item.type} ${item.id} with local URL: ${localUrl}`);
    switch (item.type) {
      case "talent":
        await talentStorage.updateTalent(item.id, { profileImageUrl: localUrl });
        break;
      case "event":
        break;
      case "itinerary":
        break;
      case "party_template":
        break;
      default:
        throw new Error(`Unknown type for database update: ${item.type}`);
    }
    console.log(`Database updated for ${item.type} ${item.id}`);
  } catch (error) {
    console.error(`Error updating database for ${item.type} ${item.id}:`, error);
    throw error;
  }
}
async function getAllImagesToMigrate() {
  const imagesToMigrate = [];
  const talent4 = await talentStorage.getAllTalent();
  for (const t of talent4) {
    if (t.profileImageUrl && !t.profileImageUrl.startsWith("/")) {
      imagesToMigrate.push({
        type: "talent",
        id: t.id,
        name: t.name,
        currentUrl: t.profileImageUrl
      });
    }
  }
  return imagesToMigrate;
}
async function migrateAllImages() {
  console.log("Starting comprehensive image migration...");
  const imagesToMigrate = await getAllImagesToMigrate();
  console.log(`Found ${imagesToMigrate.length} images to migrate`);
  for (const item of imagesToMigrate) {
    try {
      const { filename, localUrl } = await downloadAndSaveImage(item);
      await updateDatabase(item, localUrl);
      console.log(`\u2705 Completed migration for ${item.type}: ${item.name}`);
    } catch (error) {
      console.error(`\u274C Failed migration for ${item.type}: ${item.name}:`, error);
    }
  }
  console.log("Comprehensive image migration completed!");
}
async function downloadImageFromUrl(url, type, name) {
  const response = await fetch2(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  const extension = getImageExtension(url);
  const filename = `${type}-${Date.now()}-${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}.${extension}`;
  const directory = getImageDirectory(type);
  const filePath = path2.join(process.cwd(), directory, filename);
  await fs2.writeFile(filePath, buffer);
  const publicPath = getPublicPath(type);
  return `${publicPath}/${filename}`;
}
var init_image_migration = __esm({
  async "server/image-migration.ts"() {
    "use strict";
    await init_storage();
  }
});

// server/index.ts
import express3 from "express";
import cookieParser from "cookie-parser";

// server/routes.ts
await init_storage();
import express from "express";
import { createServer } from "http";

// server/auth.ts
import * as argon2 from "argon2";
import jwt from "jsonwebtoken";
var JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
var JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "your-refresh-secret-change-in-production";
var AuthService = class {
  static async hashPassword(password) {
    return argon2.hash(password);
  }
  static async verifyPassword(hashedPassword, plainPassword) {
    try {
      return await argon2.verify(hashedPassword, plainPassword);
    } catch (error) {
      return false;
    }
  }
  static generateAccessToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" });
  }
  static generateRefreshToken(payload) {
    return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: "7d" });
  }
  static verifyAccessToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return null;
    }
  }
  static verifyRefreshToken(token) {
    try {
      return jwt.verify(token, JWT_REFRESH_SECRET);
    } catch (error) {
      return null;
    }
  }
};
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : req.cookies?.accessToken;
  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }
  const payload = AuthService.verifyAccessToken(token);
  if (!payload) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
  req.user = {
    id: payload.userId,
    username: payload.username,
    role: payload.role
  };
  next();
}
function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (!allowedRoles.includes(req.user.role || "")) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}
function composeAuth(roleCheck) {
  return (req, res, next) => {
    requireAuth(req, res, (error) => {
      if (error) return next(error);
      roleCheck(req, res, next);
    });
  };
}
var requireSuperAdmin = composeAuth(requireRole(["super_admin"]));
var requireTripAdmin = composeAuth(requireRole(["super_admin", "trip_admin"]));
var requireContentEditor = composeAuth(requireRole(["super_admin", "trip_admin", "content_editor"]));
var requireMediaManager = composeAuth(requireRole(["super_admin", "trip_admin", "content_editor", "media_manager"]));

// server/auth-routes.ts
await init_storage();
init_schema();
import { eq as eq2 } from "drizzle-orm";

// server/utils/replitmail.ts
import { z } from "zod";
var zSmtpMessage = z.object({
  to: z.union([z.string().email(), z.array(z.string().email())]).describe("Recipient email address(es)"),
  cc: z.union([z.string().email(), z.array(z.string().email())]).optional().describe("CC recipient email address(es)"),
  subject: z.string().describe("Email subject"),
  text: z.string().optional().describe("Plain text body"),
  html: z.string().optional().describe("HTML body"),
  attachments: z.array(
    z.object({
      filename: z.string().describe("File name"),
      content: z.string().describe("Base64 encoded content"),
      contentType: z.string().optional().describe("MIME type"),
      encoding: z.enum(["base64", "7bit", "quoted-printable", "binary"]).default("base64")
    })
  ).optional().describe("Email attachments")
});
function getAuthToken() {
  const xReplitToken = process.env.REPL_IDENTITY ? "repl " + process.env.REPL_IDENTITY : process.env.WEB_REPL_RENEWAL ? "depl " + process.env.WEB_REPL_RENEWAL : null;
  if (!xReplitToken) {
    throw new Error(
      "No authentication token found. Please set REPL_IDENTITY or ensure you're running in Replit environment."
    );
  }
  return xReplitToken;
}
async function sendEmail(message) {
  const authToken = getAuthToken();
  const response = await fetch(
    "https://connectors.replit.com/api/v2/mailer/send",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X_REPLIT_TOKEN": authToken
      },
      body: JSON.stringify({
        to: message.to,
        cc: message.cc,
        subject: message.subject,
        text: message.text,
        html: message.html,
        attachments: message.attachments
      })
    }
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to send email");
  }
  return await response.json();
}

// server/auth-routes.ts
import { randomBytes, createHash } from "crypto";
function registerAuthRoutes(app2) {
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }
      const userResults = await db.select().from(users2).where(eq2(users2.username, username)).limit(1);
      const user = userResults[0];
      if (!user || !user.isActive) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      const isValidPassword = await AuthService.verifyPassword(user.password, password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      const tokenPayload = {
        userId: user.id,
        username: user.username,
        role: user.role || "viewer"
      };
      const accessToken = AuthService.generateAccessToken(tokenPayload);
      const refreshToken = AuthService.generateRefreshToken(tokenPayload);
      await db.update(users2).set({ lastLogin: /* @__PURE__ */ new Date() }).where(eq2(users2.id, user.id));
      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 15 * 60 * 1e3
        // 15 minutes
      });
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1e3
        // 7 days
      });
      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role
        },
        accessToken
        // Also return in response for authorization header usage
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/auth/refresh", async (req, res) => {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
      if (!refreshToken) {
        return res.status(401).json({ error: "Refresh token required" });
      }
      const payload = AuthService.verifyRefreshToken(refreshToken);
      if (!payload) {
        return res.status(401).json({ error: "Invalid refresh token" });
      }
      const userResults = await db.select().from(users2).where(eq2(users2.id, payload.userId)).limit(1);
      const user = userResults[0];
      if (!user || !user.isActive) {
        return res.status(401).json({ error: "User not found or inactive" });
      }
      const newTokenPayload = {
        userId: user.id,
        username: user.username,
        role: user.role || "viewer"
      };
      const newAccessToken = AuthService.generateAccessToken(newTokenPayload);
      const newRefreshToken = AuthService.generateRefreshToken(newTokenPayload);
      res.cookie("accessToken", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 15 * 60 * 1e3
      });
      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1e3
      });
      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role
        },
        accessToken: newAccessToken
      });
    } catch (error) {
      console.error("Token refresh error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/auth/logout", (req, res) => {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.json({ message: "Logged out successfully" });
  });
  app2.get("/api/auth/me", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : req.cookies?.accessToken;
      if (!token) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const payload = AuthService.verifyAccessToken(token);
      if (!payload) {
        return res.status(401).json({ error: "Invalid token" });
      }
      const userResults = await db.select().from(users2).where(eq2(users2.id, payload.userId)).limit(1);
      const user = userResults[0];
      if (!user || !user.isActive) {
        return res.status(401).json({ error: "User not found or inactive" });
      }
      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role
        }
      });
    } catch (error) {
      console.error("Get user info error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/auth/users", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : req.cookies?.accessToken;
      if (!token) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const payload = AuthService.verifyAccessToken(token);
      if (!payload) {
        return res.status(401).json({ error: "Invalid or expired token" });
      }
      const userResults = await db.select().from(users2).where(eq2(users2.id, payload.userId)).limit(1);
      const currentUser = userResults[0];
      if (!currentUser || currentUser?.role !== "super_admin") {
        return res.status(403).json({ error: "Only super admins can create users" });
      }
      const allowedRoles = ["viewer", "media_manager", "content_editor", "trip_admin", "super_admin"];
      const userData = req.body;
      if (!userData.username || !userData.password) {
        return res.status(400).json({ error: "Username and password are required" });
      }
      if (userData.role && !allowedRoles.includes(userData.role)) {
        return res.status(400).json({ error: "Invalid role specified" });
      }
      const validatedData = insertUserSchema.parse(userData);
      const hashedPassword = await AuthService.hashPassword(validatedData.password);
      const newUsers = await db.insert(users2).values({
        ...validatedData,
        password: hashedPassword
      }).returning();
      const newUser = newUsers[0];
      res.status(201).json({
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          fullName: newUser.fullName,
          role: newUser.role
        }
      });
    } catch (error) {
      console.error("User creation error:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });
  app2.get("/api/auth/users", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : req.cookies?.accessToken;
      if (!token) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const payload = AuthService.verifyAccessToken(token);
      if (!payload) {
        return res.status(401).json({ error: "Invalid token" });
      }
      const userResults = await db.select().from(users2).where(eq2(users2.id, payload.userId)).limit(1);
      const currentUser = userResults[0];
      if (!currentUser || currentUser?.role !== "super_admin") {
        return res.status(403).json({ error: "Only super admins can view users" });
      }
      const allUsers = await db.select({
        id: users2.id,
        username: users2.username,
        email: users2.email,
        fullName: users2.fullName,
        role: users2.role,
        isActive: users2.isActive,
        createdAt: users2.createdAt,
        lastLogin: users2.lastLogin
      }).from(users2).orderBy(users2.createdAt);
      res.json(allUsers);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });
  app2.put("/api/auth/users/:id", async (req, res) => {
    try {
      const userId = req.params.id;
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : req.cookies?.accessToken;
      if (!token) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const payload = AuthService.verifyAccessToken(token);
      if (!payload) {
        return res.status(401).json({ error: "Invalid token" });
      }
      const userResults = await db.select().from(users2).where(eq2(users2.id, payload.userId)).limit(1);
      const currentUser = userResults[0];
      if (!currentUser || currentUser?.role !== "super_admin") {
        return res.status(403).json({ error: "Only super admins can update users" });
      }
      const updateData = req.body;
      const allowedRoles = ["viewer", "media_manager", "content_editor", "trip_admin", "super_admin"];
      const allowedFields = ["username", "email", "fullName", "role", "isActive", "password"];
      const filteredUpdateData = {};
      for (const field of allowedFields) {
        if (updateData[field] !== void 0) {
          filteredUpdateData[field] = updateData[field];
        }
      }
      if (filteredUpdateData.role && !allowedRoles.includes(filteredUpdateData.role)) {
        return res.status(400).json({ error: "Invalid role specified" });
      }
      if (filteredUpdateData.password) {
        if (filteredUpdateData.password.trim() === "") {
          delete filteredUpdateData.password;
        } else {
          filteredUpdateData.password = await AuthService.hashPassword(filteredUpdateData.password);
        }
      }
      const updatedUsers = await db.update(users2).set({
        ...filteredUpdateData,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq2(users2.id, userId)).returning();
      if (updatedUsers.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      const updatedUser = updatedUsers[0];
      res.json({
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          fullName: updatedUser.fullName,
          role: updatedUser.role,
          isActive: updatedUser.isActive
        }
      });
    } catch (error) {
      console.error("User update error:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });
  app2.delete("/api/auth/users/:id", async (req, res) => {
    try {
      const userId = req.params.id;
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : req.cookies?.accessToken;
      if (!token) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const payload = AuthService.verifyAccessToken(token);
      if (!payload) {
        return res.status(401).json({ error: "Invalid token" });
      }
      const userResults = await db.select().from(users2).where(eq2(users2.id, payload.userId)).limit(1);
      const currentUser = userResults[0];
      if (!currentUser || currentUser?.role !== "super_admin") {
        return res.status(403).json({ error: "Only super admins can delete users" });
      }
      if (userId === payload.userId) {
        return res.status(400).json({ error: "Cannot delete your own account" });
      }
      const deletedUsers = await db.delete(users2).where(eq2(users2.id, userId)).returning();
      if (deletedUsers.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("User deletion error:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });
  app2.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      const userResults = await db.select().from(users2).where(eq2(users2.email, email)).limit(1);
      const user = userResults[0];
      if (!user || !user.isActive) {
        return res.json({ message: "If an account with that email exists, a reset link has been sent." });
      }
      const resetToken = randomBytes(32).toString("hex");
      const hashedToken = createHash("sha256").update(resetToken).digest("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1e3);
      await db.delete(passwordResetTokens).where(eq2(passwordResetTokens.userId, user.id));
      await db.insert(passwordResetTokens).values({
        userId: user.id,
        token: hashedToken,
        expiresAt
      });
      const resetUrl = `${process.env.REPLIT_DEV_DOMAIN || "http://localhost:5000"}/admin/reset-password/${resetToken}`;
      try {
        await sendEmail({
          to: email,
          subject: "Reset Your Admin Password",
          html: `
            <h2>Reset Your Password</h2>
            <p>Hi ${user.fullName || user.username},</p>
            <p>You requested a password reset for your admin account. Click the link below to reset your password:</p>
            <p><a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a></p>
            <p>Or copy and paste this URL into your browser: ${resetUrl}</p>
            <p>This link will expire in 1 hour for security reasons.</p>
            <p>If you didn't request this password reset, you can safely ignore this email.</p>
            <hr>
            <p><small>This is an automated message from the Cruise Guide Admin System.</small></p>
          `,
          text: `
            Reset Your Password
            
            Hi ${user.fullName || user.username},
            
            You requested a password reset for your admin account. Visit the following link to reset your password:
            
            ${resetUrl}
            
            This link will expire in 1 hour for security reasons.
            
            If you didn't request this password reset, you can safely ignore this email.
            
            This is an automated message from the Cruise Guide Admin System.
          `
        });
      } catch (emailError) {
        console.error("Failed to send reset email:", emailError);
      }
      res.json({ message: "If an account with that email exists, a reset link has been sent." });
    } catch (error) {
      console.error("Password reset request error:", error);
      res.status(500).json({ error: "Failed to process password reset request" });
    }
  });
  app2.get("/api/auth/validate-reset-token/:token", async (req, res) => {
    try {
      const { token } = req.params;
      if (!token) {
        return res.status(400).json({ error: "Token is required" });
      }
      const hashedToken = createHash("sha256").update(token).digest("hex");
      const tokenResults = await db.select().from(passwordResetTokens).where(eq2(passwordResetTokens.token, hashedToken)).limit(1);
      const resetToken = tokenResults[0];
      if (!resetToken || resetToken.usedAt || resetToken.expiresAt < /* @__PURE__ */ new Date()) {
        return res.status(400).json({ error: "Invalid or expired token" });
      }
      res.json({ valid: true });
    } catch (error) {
      console.error("Token validation error:", error);
      res.status(500).json({ error: "Failed to validate token" });
    }
  });
  app2.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      if (!token || !password) {
        return res.status(400).json({ error: "Token and password are required" });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long" });
      }
      const hashedToken = createHash("sha256").update(token).digest("hex");
      const tokenResults = await db.select().from(passwordResetTokens).where(eq2(passwordResetTokens.token, hashedToken)).limit(1);
      const resetToken = tokenResults[0];
      if (!resetToken || resetToken.usedAt || resetToken.expiresAt < /* @__PURE__ */ new Date()) {
        return res.status(400).json({ error: "Invalid or expired token" });
      }
      const hashedPassword = await AuthService.hashPassword(password);
      await db.update(users2).set({
        password: hashedPassword,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq2(users2.id, resetToken.userId));
      await db.update(passwordResetTokens).set({
        usedAt: /* @__PURE__ */ new Date()
      }).where(eq2(passwordResetTokens.id, resetToken.id));
      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  });
}

// server/routes.ts
await init_storage();
init_schema();
import { eq as eq3, ilike as ilike2, or as or2 } from "drizzle-orm";
import { z as z2 } from "zod";
import path3 from "path";

// server/image-utils.ts
import multer from "multer";
import { promises as fs } from "fs";
init_cloudinary();
import path from "path";
var storage3 = multer.memoryStorage();
var fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif"
  ];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only image files are allowed."), false);
  }
};
var baseUpload = multer({
  storage: storage3,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024
    // 10MB limit
  }
});
var upload = baseUpload;
async function uploadToCloudinary(file, imageType) {
  const { cloudinary: cloudinary2 } = await Promise.resolve().then(() => (init_cloudinary(), cloudinary_exports));
  return new Promise((resolve, reject) => {
    cloudinary2.uploader.upload_stream(
      {
        folder: `cruise-app/${imageType}`,
        resource_type: "auto",
        transformation: [
          { width: 1200, height: 1200, crop: "limit", quality: "auto" }
        ]
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result.secure_url);
        }
      }
    ).end(file.buffer);
  });
}
async function deleteImage(imageUrl) {
  try {
    const urlPath = new URL(imageUrl, "http://localhost").pathname;
    const segments = urlPath.split("/");
    const filename = segments[segments.length - 1];
    const imageType = segments[segments.length - 2];
    let directory;
    switch (imageType) {
      case "talent-images":
        directory = "server/public/talent-images";
        break;
      case "event-images":
        directory = "server/public/event-images";
        break;
      case "itinerary-images":
        directory = "server/public/itinerary-images";
        break;
      case "cruise-images":
        directory = "server/public/cruise-images";
        break;
      default:
        directory = "server/public/uploads";
    }
    const filePath = path.join(process.cwd(), directory, filename);
    await fs.unlink(filePath);
  } catch (error) {
    console.error("Error deleting image:", error);
  }
}
function isValidImageUrl(url) {
  try {
    const parsedUrl = new URL(url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return false;
    }
    const hostname = parsedUrl.hostname.toLowerCase();
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname.startsWith("192.168.") || hostname.startsWith("10.") || hostname.match(/^172\.(1[6-9]|2[0-9]|3[01])\./)) {
      return false;
    }
    if (hostname.endsWith(".local") || hostname.endsWith(".internal")) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// server/routes.ts
await init_image_migration();
async function registerRoutes(app2) {
  app2.use("/cruise-images", express.static("server/public/cruise-images", {
    maxAge: "24h",
    // Cache for 24 hours
    etag: false
  }));
  app2.use("/talent-images", express.static("server/public/talent-images", {
    maxAge: "24h",
    etag: false
  }));
  app2.use("/event-images", express.static("server/public/event-images", {
    maxAge: "24h",
    etag: false
  }));
  app2.use("/itinerary-images", express.static("server/public/itinerary-images", {
    maxAge: "24h",
    etag: false
  }));
  app2.use("/uploads", express.static("server/public/uploads", {
    maxAge: "24h",
    etag: false
  }));
  app2.post("/api/images/upload/:type", requireAuth, requireContentEditor, (req, res, next) => {
    const imageType = req.params.type;
    if (!["talent", "event", "itinerary", "trip", "cruise"].includes(imageType)) {
      return res.status(400).json({ error: "Invalid image type. Must be one of: talent, event, itinerary, trip, cruise" });
    }
    req.body.imageType = imageType;
    next();
  }, upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }
      const imageType = req.params.type;
      const cloudinaryUrl = await uploadToCloudinary(req.file, imageType);
      res.json({
        success: true,
        imageUrl: cloudinaryUrl,
        filename: path3.basename(cloudinaryUrl),
        originalName: req.file.originalname,
        size: req.file.size,
        cloudinaryUrl
      });
    } catch (error) {
      console.error("Image upload error:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  });
  app2.post("/api/images/download-from-url", requireAuth, requireContentEditor, async (req, res) => {
    try {
      const { url, imageType, name } = req.body;
      if (!url || !isValidImageUrl(url)) {
        return res.status(400).json({ error: "Invalid URL provided" });
      }
      if (!["talent", "event", "itinerary", "trip", "cruise"].includes(imageType)) {
        return res.status(400).json({ error: "Invalid image type. Must be one of: talent, event, itinerary, trip, cruise" });
      }
      const validImageType = imageType;
      const imageName = name || "downloaded-image";
      const localUrl = await downloadImageFromUrl(url, validImageType, imageName);
      res.json({
        success: true,
        imageUrl: localUrl,
        originalUrl: url
      });
    } catch (error) {
      console.error("Image download error:", error);
      res.status(500).json({ error: "Failed to download image from URL" });
    }
  });
  app2.delete("/api/images", requireContentEditor, async (req, res) => {
    try {
      const { imageUrl } = req.body;
      if (!imageUrl) {
        return res.status(400).json({ error: "Image URL required" });
      }
      await deleteImage(imageUrl);
      res.json({ success: true, message: "Image deleted successfully" });
    } catch (error) {
      console.error("Image deletion error:", error);
      res.status(500).json({ error: "Failed to delete image" });
    }
  });
  registerAuthRoutes(app2);
  app2.get("/api/cruises", async (req, res) => {
    try {
      const cruises4 = await cruiseStorage.getAllCruises();
      res.json(cruises4);
    } catch (error) {
      console.error("Error fetching cruises:", error);
      res.status(500).json({ error: "Failed to fetch cruises" });
    }
  });
  app2.get("/api/cruises/upcoming", async (req, res) => {
    try {
      const cruises4 = await cruiseStorage.getUpcomingCruises();
      res.json(cruises4);
    } catch (error) {
      console.error("Error fetching upcoming cruises:", error);
      res.status(500).json({ error: "Failed to fetch upcoming cruises" });
    }
  });
  app2.get("/api/cruises/past", async (req, res) => {
    try {
      const cruises4 = await cruiseStorage.getPastCruises();
      res.json(cruises4);
    } catch (error) {
      console.error("Error fetching past cruises:", error);
      res.status(500).json({ error: "Failed to fetch past cruises" });
    }
  });
  app2.get("/api/cruises/id/:id", async (req, res) => {
    try {
      const cruise = await cruiseStorage.getCruiseById(parseInt(req.params.id));
      if (!cruise) {
        return res.status(404).json({ error: "Cruise not found" });
      }
      res.json(cruise);
    } catch (error) {
      console.error("Error fetching cruise:", error);
      res.status(500).json({ error: "Failed to fetch cruise" });
    }
  });
  app2.get("/api/cruises/:slug", async (req, res) => {
    try {
      const cruise = await cruiseStorage.getCruiseBySlug(req.params.slug);
      if (!cruise) {
        return res.status(404).json({ error: "Cruise not found" });
      }
      res.json(cruise);
    } catch (error) {
      console.error("Error fetching cruise:", error);
      res.status(500).json({ error: "Failed to fetch cruise" });
    }
  });
  app2.post("/api/cruises", requireAuth, requireContentEditor, async (req, res) => {
    try {
      const cruise = await cruiseStorage.createCruise(req.body);
      res.status(201).json(cruise);
    } catch (error) {
      console.error("Error creating cruise:", error);
      res.status(500).json({ error: "Failed to create cruise" });
    }
  });
  app2.put("/api/cruises/:id", requireAuth, requireContentEditor, async (req, res) => {
    try {
      const cruise = await cruiseStorage.updateCruise(parseInt(req.params.id), req.body);
      if (!cruise) {
        return res.status(404).json({ error: "Cruise not found" });
      }
      res.json(cruise);
    } catch (error) {
      console.error("Error updating cruise:", error);
      res.status(500).json({ error: "Failed to update cruise" });
    }
  });
  app2.delete("/api/cruises/:id", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      await cruiseStorage.deleteCruise(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting cruise:", error);
      res.status(500).json({ error: "Failed to delete cruise" });
    }
  });
  app2.get("/api/trips", async (req, res) => {
    try {
      const trips4 = await tripStorage.getAllTrips();
      res.json(trips4);
    } catch (error) {
      console.error("Error fetching trips:", error);
      res.status(500).json({ error: "Failed to fetch trips" });
    }
  });
  app2.get("/api/trips/upcoming", async (req, res) => {
    try {
      const trips4 = await tripStorage.getUpcomingTrips();
      res.json(trips4);
    } catch (error) {
      console.error("Error fetching upcoming trips:", error);
      res.status(500).json({ error: "Failed to fetch upcoming trips" });
    }
  });
  app2.get("/api/trips/past", async (req, res) => {
    try {
      const trips4 = await tripStorage.getPastTrips();
      res.json(trips4);
    } catch (error) {
      console.error("Error fetching past trips:", error);
      res.status(500).json({ error: "Failed to fetch past trips" });
    }
  });
  app2.get("/api/trips/id/:id", async (req, res) => {
    try {
      const trip = await tripStorage.getTripById(parseInt(req.params.id));
      if (!trip) {
        return res.status(404).json({ error: "Trip not found" });
      }
      res.json(trip);
    } catch (error) {
      console.error("Error fetching trip:", error);
      res.status(500).json({ error: "Failed to fetch trip" });
    }
  });
  app2.get("/api/trips/:slug", async (req, res) => {
    try {
      const trip = await tripStorage.getTripBySlug(req.params.slug);
      if (!trip) {
        return res.status(404).json({ error: "Trip not found" });
      }
      res.json(trip);
    } catch (error) {
      console.error("Error fetching trip:", error);
      res.status(500).json({ error: "Failed to fetch trip" });
    }
  });
  app2.post("/api/trips", requireAuth, requireContentEditor, async (req, res) => {
    try {
      const trip = await tripStorage.createTrip(req.body);
      res.status(201).json(trip);
    } catch (error) {
      console.error("Error creating trip:", error);
      res.status(500).json({ error: "Failed to create trip" });
    }
  });
  app2.put("/api/trips/:id", requireAuth, requireContentEditor, async (req, res) => {
    try {
      const trip = await tripStorage.updateTrip(parseInt(req.params.id), req.body);
      if (!trip) {
        return res.status(404).json({ error: "Trip not found" });
      }
      res.json(trip);
    } catch (error) {
      console.error("Error updating trip:", error);
      res.status(500).json({ error: "Failed to update trip" });
    }
  });
  app2.delete("/api/trips/:id", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      await tripStorage.deleteTrip(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting trip:", error);
      res.status(500).json({ error: "Failed to delete trip" });
    }
  });
  app2.get("/api/cruises/:cruiseId/itinerary", async (req, res) => {
    try {
      const itinerary4 = await itineraryStorage.getItineraryByCruise(parseInt(req.params.cruiseId));
      res.json(itinerary4);
    } catch (error) {
      console.error("Error fetching itinerary:", error);
      res.status(500).json({ error: "Failed to fetch itinerary" });
    }
  });
  app2.get("/api/trips/:tripId/itinerary", async (req, res) => {
    try {
      const itinerary4 = await itineraryStorage.getItineraryByCruise(parseInt(req.params.tripId));
      res.json(itinerary4);
    } catch (error) {
      console.error("Error fetching trip itinerary:", error);
      res.status(500).json({ error: "Failed to fetch trip itinerary" });
    }
  });
  app2.post("/api/cruises/:cruiseId/itinerary", requireAuth, requireContentEditor, async (req, res) => {
    try {
      const stop = await itineraryStorage.createItineraryStop({
        ...req.body,
        cruiseId: parseInt(req.params.cruiseId)
      });
      res.status(201).json(stop);
    } catch (error) {
      console.error("Error creating itinerary stop:", error);
      res.status(500).json({ error: "Failed to create itinerary stop" });
    }
  });
  app2.put("/api/itinerary/:id", requireAuth, requireContentEditor, async (req, res) => {
    try {
      const stop = await itineraryStorage.updateItineraryStop(parseInt(req.params.id), req.body);
      if (!stop) {
        return res.status(404).json({ error: "Itinerary stop not found" });
      }
      res.json(stop);
    } catch (error) {
      console.error("Error updating itinerary stop:", error);
      res.status(500).json({ error: "Failed to update itinerary stop" });
    }
  });
  app2.delete("/api/itinerary/:id", requireAuth, requireContentEditor, async (req, res) => {
    try {
      await itineraryStorage.deleteItineraryStop(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting itinerary stop:", error);
      res.status(500).json({ error: "Failed to delete itinerary stop" });
    }
  });
  app2.get("/api/cruises/:cruiseId/events", async (req, res) => {
    try {
      const events4 = await eventStorage.getEventsByCruise(parseInt(req.params.cruiseId));
      res.json(events4);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });
  app2.get("/api/cruises/:cruiseId/events/date/:date", async (req, res) => {
    try {
      const date = new Date(req.params.date);
      const events4 = await eventStorage.getEventsByDate(parseInt(req.params.cruiseId), date);
      res.json(events4);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });
  app2.get("/api/cruises/:cruiseId/events/type/:type", async (req, res) => {
    try {
      const events4 = await eventStorage.getEventsByType(parseInt(req.params.cruiseId), req.params.type);
      res.json(events4);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });
  app2.post("/api/cruises/:cruiseId/events", requireAuth, requireContentEditor, async (req, res) => {
    try {
      const event = await eventStorage.createEvent({
        ...req.body,
        cruiseId: parseInt(req.params.cruiseId)
      });
      res.status(201).json(event);
    } catch (error) {
      console.error("Error creating event:", error);
      res.status(500).json({ error: "Failed to create event" });
    }
  });
  app2.put("/api/events/:id", requireAuth, requireContentEditor, async (req, res) => {
    try {
      const event = await eventStorage.updateEvent(parseInt(req.params.id), req.body);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Error updating event:", error);
      res.status(500).json({ error: "Failed to update event" });
    }
  });
  app2.delete("/api/events/:id", requireAuth, requireContentEditor, async (req, res) => {
    try {
      await eventStorage.deleteEvent(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting event:", error);
      res.status(500).json({ error: "Failed to delete event" });
    }
  });
  app2.get("/api/talent", async (req, res) => {
    try {
      const search = req.query.search;
      const performanceType = req.query.type;
      const talent4 = await talentStorage.searchTalent(search, performanceType);
      res.json(talent4);
    } catch (error) {
      console.error("Error fetching talent:", error);
      res.status(500).json({ error: "Failed to fetch talent" });
    }
  });
  app2.get("/api/talent/:id", async (req, res) => {
    try {
      const talent4 = await talentStorage.getTalentById(parseInt(req.params.id));
      if (!talent4) {
        return res.status(404).json({ error: "Talent not found" });
      }
      res.json(talent4);
    } catch (error) {
      console.error("Error fetching talent:", error);
      res.status(500).json({ error: "Failed to fetch talent" });
    }
  });
  app2.get("/api/cruises/:cruiseId/talent", async (req, res) => {
    try {
      const talent4 = await talentStorage.getTalentByCruise(parseInt(req.params.cruiseId));
      res.json(talent4);
    } catch (error) {
      console.error("Error fetching cruise talent:", error);
      res.status(500).json({ error: "Failed to fetch cruise talent" });
    }
  });
  app2.post("/api/talent", requireAuth, requireContentEditor, async (req, res) => {
    try {
      const talent4 = await talentStorage.createTalent(req.body);
      res.status(201).json(talent4);
    } catch (error) {
      console.error("Error creating talent:", error);
      res.status(500).json({ error: "Failed to create talent" });
    }
  });
  app2.put("/api/talent/:id", requireAuth, requireContentEditor, async (req, res) => {
    try {
      const talent4 = await talentStorage.updateTalent(parseInt(req.params.id), req.body);
      if (!talent4) {
        return res.status(404).json({ error: "Talent not found" });
      }
      res.json(talent4);
    } catch (error) {
      console.error("Error updating talent:", error);
      res.status(500).json({ error: "Failed to update talent" });
    }
  });
  app2.delete("/api/talent/:id", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      await talentStorage.deleteTalent(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting talent:", error);
      res.status(500).json({ error: "Failed to delete talent" });
    }
  });
  app2.post("/api/cruises/:cruiseId/talent/:talentId", requireAuth, requireContentEditor, async (req, res) => {
    try {
      const cruiseId = parseInt(req.params.cruiseId);
      const talentId = parseInt(req.params.talentId);
      const { role } = req.body;
      if (isNaN(cruiseId) || isNaN(talentId)) {
        return res.status(400).json({ error: "Invalid cruise ID or talent ID" });
      }
      await talentStorage.assignTalentToCruise(cruiseId, talentId, role);
      res.status(201).json({ message: "Talent assigned to cruise successfully" });
    } catch (error) {
      console.error("Error assigning talent:", error);
      res.status(500).json({ error: "Failed to assign talent" });
    }
  });
  app2.delete("/api/cruises/:cruiseId/talent/:talentId", requireAuth, requireContentEditor, async (req, res) => {
    try {
      const cruiseId = parseInt(req.params.cruiseId);
      const talentId = parseInt(req.params.talentId);
      if (isNaN(cruiseId) || isNaN(talentId)) {
        return res.status(400).json({ error: "Invalid cruise ID or talent ID" });
      }
      await talentStorage.removeTalentFromCruise(cruiseId, talentId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing talent:", error);
      res.status(500).json({ error: "Failed to remove talent" });
    }
  });
  app2.get("/api/media/type/:type", async (req, res) => {
    try {
      const media4 = await mediaStorage.getMediaByType(req.params.type);
      res.json(media4);
    } catch (error) {
      console.error("Error fetching media:", error);
      res.status(500).json({ error: "Failed to fetch media" });
    }
  });
  app2.get("/api/media/:associatedType/:associatedId", async (req, res) => {
    try {
      const media4 = await mediaStorage.getMediaByAssociation(
        req.params.associatedType,
        parseInt(req.params.associatedId)
      );
      res.json(media4);
    } catch (error) {
      console.error("Error fetching media:", error);
      res.status(500).json({ error: "Failed to fetch media" });
    }
  });
  app2.post("/api/media", requireAuth, requireContentEditor, async (req, res) => {
    try {
      const media4 = await mediaStorage.createMedia(req.body);
      res.status(201).json(media4);
    } catch (error) {
      console.error("Error creating media:", error);
      res.status(500).json({ error: "Failed to create media" });
    }
  });
  app2.delete("/api/media/:id", requireAuth, requireContentEditor, async (req, res) => {
    try {
      await mediaStorage.deleteMedia(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting media:", error);
      res.status(500).json({ error: "Failed to delete media" });
    }
  });
  app2.get("/api/cruises/:slug/complete", async (req, res) => {
    try {
      const cruise = await cruiseStorage.getCruiseBySlug(req.params.slug);
      if (!cruise) {
        return res.status(404).json({ error: "Cruise not found" });
      }
      const [itinerary4, events4, talent4] = await Promise.all([
        itineraryStorage.getItineraryByCruise(cruise.id),
        eventStorage.getEventsByCruise(cruise.id),
        talentStorage.getTalentByCruise(cruise.id)
      ]);
      res.json({
        cruise,
        itinerary: itinerary4,
        events: events4,
        talent: talent4
      });
    } catch (error) {
      console.error("Error fetching complete cruise data:", error);
      res.status(500).json({ error: "Failed to fetch cruise data" });
    }
  });
  app2.get("/api/trips/:slug/complete", async (req, res) => {
    try {
      const trip = await tripStorage.getTripBySlug(req.params.slug);
      if (!trip) {
        return res.status(404).json({ error: "Trip not found" });
      }
      const [itinerary4, events4, talent4] = await Promise.all([
        itineraryStorage.getItineraryByCruise(trip.id),
        eventStorage.getEventsByCruise(trip.id),
        talentStorage.getTalentByCruise(trip.id)
      ]);
      res.json({
        trip,
        itinerary: itinerary4,
        events: events4,
        talent: talent4
      });
    } catch (error) {
      console.error("Error fetching complete trip data:", error);
      res.status(500).json({ error: "Failed to fetch trip data" });
    }
  });
  app2.get("/api/party-templates", requireAuth, async (req, res) => {
    try {
      const search = req.query.search;
      let templates;
      if (search) {
        templates = await db.select().from(partyTemplates).where(
          or2(
            ilike2(partyTemplates.name, `%${search}%`),
            ilike2(partyTemplates.themeDescription, `%${search}%`),
            ilike2(partyTemplates.dressCode, `%${search}%`)
          )
        ).orderBy(partyTemplates.name);
      } else {
        templates = await db.select().from(partyTemplates).orderBy(partyTemplates.name);
      }
      res.json(templates);
    } catch (error) {
      console.error("Error fetching party templates:", error);
      res.status(500).json({ error: "Failed to fetch party templates" });
    }
  });
  app2.post("/api/party-templates", requireAuth, requireContentEditor, async (req, res) => {
    try {
      const partyTemplateSchema = z2.object({
        name: z2.string().min(1, "Name is required").max(255),
        themeDescription: z2.string().max(1e3).optional(),
        dressCode: z2.string().max(255).optional(),
        defaultImageUrl: z2.string().url().optional().or(z2.literal("")),
        tags: z2.array(z2.string()).optional(),
        defaults: z2.record(z2.any()).optional()
      });
      const validationResult = partyTemplateSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid input",
          details: validationResult.error.errors
        });
      }
      const { name, themeDescription, dressCode, defaultImageUrl, tags, defaults } = validationResult.data;
      const newTemplate = await db.insert(partyTemplates).values({
        name,
        themeDescription,
        dressCode,
        defaultImageUrl: defaultImageUrl || null,
        tags,
        defaults,
        createdBy: req.user.id
      }).returning();
      res.status(201).json(newTemplate[0]);
    } catch (error) {
      console.error("Error creating party template:", error);
      res.status(500).json({ error: "Failed to create party template" });
    }
  });
  app2.put("/api/party-templates/:id", requireAuth, requireContentEditor, async (req, res) => {
    try {
      const templateId = parseInt(req.params.id);
      if (isNaN(templateId)) {
        return res.status(400).json({ error: "Invalid template ID" });
      }
      const partyTemplateSchema = z2.object({
        name: z2.string().min(1, "Name is required").max(255),
        themeDescription: z2.string().max(1e3).optional(),
        dressCode: z2.string().max(255).optional(),
        defaultImageUrl: z2.string().url().optional().or(z2.literal("")),
        tags: z2.array(z2.string()).optional(),
        defaults: z2.record(z2.any()).optional()
      });
      const validationResult = partyTemplateSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid input",
          details: validationResult.error.errors
        });
      }
      const { name, themeDescription, dressCode, defaultImageUrl, tags, defaults } = validationResult.data;
      const updatedTemplate = await db.update(partyTemplates).set({
        name,
        themeDescription,
        dressCode,
        defaultImageUrl: defaultImageUrl || null,
        tags,
        defaults,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq3(partyTemplates.id, templateId)).returning();
      if (updatedTemplate.length === 0) {
        return res.status(404).json({ error: "Party template not found" });
      }
      res.json(updatedTemplate[0]);
    } catch (error) {
      console.error("Error updating party template:", error);
      res.status(500).json({ error: "Failed to update party template" });
    }
  });
  app2.delete("/api/party-templates/:id", requireAuth, requireContentEditor, async (req, res) => {
    try {
      const templateId = parseInt(req.params.id);
      if (isNaN(templateId)) {
        return res.status(400).json({ error: "Invalid template ID" });
      }
      const deletedTemplate = await db.delete(partyTemplates).where(eq3(partyTemplates.id, templateId)).returning();
      if (deletedTemplate.length === 0) {
        return res.status(404).json({ error: "Party template not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting party template:", error);
      res.status(500).json({ error: "Failed to delete party template" });
    }
  });
  app2.get("/api/cruises/:cruiseId/info-sections", requireAuth, async (req, res) => {
    try {
      const cruiseId = parseInt(req.params.cruiseId);
      const sections = await db.select().from(cruiseInfoSections).where(eq3(cruiseInfoSections.cruiseId, cruiseId)).orderBy(cruiseInfoSections.orderIndex);
      res.json(sections);
    } catch (error) {
      console.error("Error fetching info sections:", error);
      res.status(500).json({ error: "Failed to fetch info sections" });
    }
  });
  app2.post("/api/cruises/:cruiseId/info-sections", requireAuth, requireContentEditor, async (req, res) => {
    try {
      const cruiseId = parseInt(req.params.cruiseId);
      const { title, content, orderIndex } = req.body;
      const newSection = await db.insert(cruiseInfoSections).values({
        cruiseId,
        title,
        content,
        orderIndex: orderIndex || 0,
        updatedBy: req.user.id
      }).returning();
      res.status(201).json(newSection[0]);
    } catch (error) {
      console.error("Error creating info section:", error);
      res.status(500).json({ error: "Failed to create info section" });
    }
  });
  app2.put("/api/info-sections/:id", requireAuth, requireContentEditor, async (req, res) => {
    try {
      const sectionId = parseInt(req.params.id);
      const { title, content, orderIndex } = req.body;
      const updatedSection = await db.update(cruiseInfoSections).set({
        title,
        content,
        orderIndex,
        updatedAt: /* @__PURE__ */ new Date(),
        updatedBy: req.user.id
      }).where(eq3(cruiseInfoSections.id, sectionId)).returning();
      if (updatedSection.length === 0) {
        return res.status(404).json({ error: "Info section not found" });
      }
      res.json(updatedSection[0]);
    } catch (error) {
      console.error("Error updating info section:", error);
      res.status(500).json({ error: "Failed to update info section" });
    }
  });
  app2.delete("/api/info-sections/:id", requireAuth, requireContentEditor, async (req, res) => {
    try {
      const sectionId = parseInt(req.params.id);
      const deletedSection = await db.delete(cruiseInfoSections).where(eq3(cruiseInfoSections.id, sectionId)).returning();
      if (deletedSection.length === 0) {
        return res.status(404).json({ error: "Info section not found" });
      }
      res.json({ message: "Info section deleted successfully" });
    } catch (error) {
      console.error("Error deleting info section:", error);
      res.status(500).json({ error: "Failed to delete info section" });
    }
  });
  app2.get("/api/settings/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const settings3 = await settingsStorage.getSettingsByCategory(category);
      res.json(settings3);
    } catch (error) {
      console.error("Error fetching settings by category:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });
  app2.get("/api/settings/:category/active", async (req, res) => {
    try {
      const { category } = req.params;
      const settings3 = await settingsStorage.getAllActiveSettingsByCategory(category);
      res.json(settings3);
    } catch (error) {
      console.error("Error fetching active settings:", error);
      res.status(500).json({ error: "Failed to fetch active settings" });
    }
  });
  app2.get("/api/settings/:category/:key", async (req, res) => {
    try {
      const { category, key } = req.params;
      const setting = await settingsStorage.getSettingByCategoryAndKey(category, key);
      if (!setting) {
        return res.status(404).json({ error: "Setting not found" });
      }
      res.json(setting);
    } catch (error) {
      console.error("Error fetching setting:", error);
      res.status(500).json({ error: "Failed to fetch setting" });
    }
  });
  app2.post("/api/settings/:category", requireAuth, requireContentEditor, async (req, res) => {
    try {
      const { category } = req.params;
      const { key, label, value, metadata, orderIndex } = req.body;
      if (!key || !label) {
        return res.status(400).json({ error: "Key and label are required" });
      }
      const existingSetting = await settingsStorage.getSettingByCategoryAndKey(category, key);
      if (existingSetting) {
        return res.status(409).json({ error: "Setting with this key already exists in category" });
      }
      const setting = await settingsStorage.createSetting({
        category,
        key,
        label,
        value,
        metadata,
        orderIndex: orderIndex || 0,
        isActive: true,
        createdBy: req.user.id
      });
      res.status(201).json(setting);
    } catch (error) {
      console.error("Error creating setting:", error);
      res.status(500).json({ error: "Failed to create setting" });
    }
  });
  app2.put("/api/settings/:category/:key", requireAuth, requireContentEditor, async (req, res) => {
    try {
      const { category, key } = req.params;
      const { label, value, metadata, orderIndex, isActive } = req.body;
      const setting = await settingsStorage.updateSetting(category, key, {
        label,
        value,
        metadata,
        orderIndex,
        isActive
      });
      if (!setting) {
        return res.status(404).json({ error: "Setting not found" });
      }
      res.json(setting);
    } catch (error) {
      console.error("Error updating setting:", error);
      res.status(500).json({ error: "Failed to update setting" });
    }
  });
  app2.delete("/api/settings/:category/:key", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const { category, key } = req.params;
      const setting = await settingsStorage.getSettingByCategoryAndKey(category, key);
      if (!setting) {
        return res.status(404).json({ error: "Setting not found" });
      }
      await settingsStorage.deleteSetting(category, key);
      res.json({ message: "Setting deleted successfully" });
    } catch (error) {
      console.error("Error deleting setting:", error);
      res.status(500).json({ error: "Failed to delete setting" });
    }
  });
  app2.post("/api/settings/:category/:key/deactivate", requireAuth, requireContentEditor, async (req, res) => {
    try {
      const { category, key } = req.params;
      const setting = await settingsStorage.deactivateSetting(category, key);
      if (!setting) {
        return res.status(404).json({ error: "Setting not found" });
      }
      res.json(setting);
    } catch (error) {
      console.error("Error deactivating setting:", error);
      res.status(500).json({ error: "Failed to deactivate setting" });
    }
  });
  app2.post("/api/settings/:category/reorder", requireAuth, requireContentEditor, async (req, res) => {
    try {
      const { category } = req.params;
      const { orderedKeys } = req.body;
      if (!Array.isArray(orderedKeys)) {
        return res.status(400).json({ error: "orderedKeys must be an array" });
      }
      await settingsStorage.reorderSettings(category, orderedKeys);
      const settings3 = await settingsStorage.getSettingsByCategory(category);
      res.json({
        message: "Settings reordered successfully",
        settings: settings3
      });
    } catch (error) {
      console.error("Error reordering settings:", error);
      res.status(500).json({ error: "Failed to reorder settings" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express2 from "express";
import fs3 from "fs";
import path5 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path4 from "path";
var vite_config_default = defineConfig({
  plugins: [
    react()
  ],
  resolve: {
    alias: {
      "@": path4.resolve(import.meta.dirname, "client", "src"),
      "@shared": path4.resolve(import.meta.dirname, "shared"),
      "@assets": path4.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path4.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path4.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    },
    proxy: {
      // Proxy static image requests to the backend server
      "^/(itinerary-images|event-images|talent-images|cruise-images)": {
        target: "http://localhost:5000",
        changeOrigin: true
      }
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use((req, res, next) => {
    const p = req.path || req.originalUrl;
    if (p === "/api" || p.startsWith("/api/")) return next();
    return vite.middlewares(req, res, next);
  });
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    if (url === "/api" || url.startsWith("/api/")) {
      return next();
    }
    try {
      const clientTemplate = path5.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs3.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path5.resolve(import.meta.dirname, "public");
  if (!fs3.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express2.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path5.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express3();
app.get("/healthz", (req, res) => {
  try {
    req.setTimeout(5e3);
    res.status(200).json({ status: "healthy", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  } catch (error) {
    res.status(500).json({ status: "unhealthy", error: error.message });
  }
});
app.head("/healthz", (req, res) => {
  res.writeHead(200);
  res.end();
});
app.get("/api", (_req, res) => res.json({ ok: true, message: "API is running" }));
app.head("/api", (_req, res) => res.sendStatus(200));
app.use(express3.json());
app.use(express3.urlencoded({ extended: false }));
app.use(cookieParser());
app.use((req, res, next) => {
  const start = Date.now();
  const path6 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path6.startsWith("/api")) {
      let logLine = `${req.method} ${path6} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.all("/api/*", (_req, res) => res.status(404).json({ error: "API route not found" }));
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(port, "0.0.0.0", async () => {
    log(`\u2705 Server ready and listening on port ${port}`);
    if (process.env.NODE_ENV === "production") {
      setTimeout(async () => {
        try {
          const { migrateAllImages: migrateAllImages2 } = await init_image_migration().then(() => image_migration_exports);
          await migrateAllImages2();
          log("Background migration completed successfully");
        } catch (error) {
          log("Background migration failed: " + error.message);
        }
      }, 1e3);
    }
  });
  process.on("SIGTERM", () => {
    log("SIGTERM received, shutting down gracefully");
    server.close(() => {
      log("Process terminated");
      process.exit(0);
    });
  });
  process.on("SIGINT", () => {
    log("SIGINT received, shutting down gracefully");
    server.close(() => {
      log("Process terminated");
      process.exit(0);
    });
  });
})().catch((error) => {
  console.error("\u{1F4A5} Failed to start server:", error);
  process.exit(1);
});
