var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

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
  cruiseTalent: () => cruiseTalent,
  cruiseTalentRelations: () => cruiseTalentRelations,
  cruises: () => cruises,
  cruisesRelations: () => cruisesRelations,
  events: () => events,
  eventsRelations: () => eventsRelations,
  insertAiDraftSchema: () => insertAiDraftSchema,
  insertAiJobSchema: () => insertAiJobSchema,
  insertCruiseInfoSectionSchema: () => insertCruiseInfoSectionSchema,
  insertCruiseSchema: () => insertCruiseSchema,
  insertEventSchema: () => insertEventSchema,
  insertItinerarySchema: () => insertItinerarySchema,
  insertMediaSchema: () => insertMediaSchema,
  insertPartyTemplateSchema: () => insertPartyTemplateSchema,
  insertTalentSchema: () => insertTalentSchema,
  insertUserSchema: () => insertUserSchema,
  itinerary: () => itinerary,
  itineraryRelations: () => itineraryRelations,
  media: () => media,
  partyTemplates: () => partyTemplates,
  partyTemplatesRelations: () => partyTemplatesRelations,
  passwordResetTokens: () => passwordResetTokens,
  talent: () => talent,
  talentRelations: () => talentRelations,
  userCruises: () => userCruises,
  userCruisesRelations: () => userCruisesRelations,
  users: () => users
});
import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  boolean,
  jsonb,
  serial,
  primaryKey,
  index
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
var users, passwordResetTokens, cruises, itinerary, events, talent, cruiseTalent, media, userCruises, partyTemplates, cruiseInfoSections, aiJobs, aiDrafts, auditLog, cruisesRelations, itineraryRelations, eventsRelations, talentRelations, cruiseTalentRelations, userCruisesRelations, partyTemplatesRelations, cruiseInfoSectionsRelations, aiJobsRelations, aiDraftsRelations, insertUserSchema, insertCruiseSchema, insertItinerarySchema, insertEventSchema, insertTalentSchema, insertMediaSchema, insertPartyTemplateSchema, insertCruiseInfoSectionSchema, insertAiJobSchema, insertAiDraftSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    users = pgTable("users", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      username: text("username").notNull().unique(),
      password: text("password").notNull(),
      email: text("email").unique(),
      fullName: text("full_name"),
      role: text("role").default("viewer"),
      // super_admin, cruise_admin, content_editor, media_manager, viewer
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow(),
      lastLogin: timestamp("last_login"),
      isActive: boolean("is_active").default(true)
    });
    passwordResetTokens = pgTable("password_reset_tokens", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      token: text("token").notNull().unique(),
      expiresAt: timestamp("expires_at").notNull(),
      createdAt: timestamp("created_at").defaultNow(),
      usedAt: timestamp("used_at")
      // null if not used yet
    }, (table) => ({
      tokenIdx: index("password_reset_token_idx").on(table.token),
      userIdx: index("password_reset_user_idx").on(table.userId),
      expiresIdx: index("password_reset_expires_idx").on(table.expiresAt)
    }));
    cruises = pgTable("cruises", {
      id: serial("id").primaryKey(),
      name: text("name").notNull(),
      slug: varchar("slug", { length: 255 }).notNull().unique(),
      shipName: text("ship_name").notNull(),
      cruiseLine: text("cruise_line"),
      // Virgin, Celebrity, etc.
      startDate: timestamp("start_date").notNull(),
      endDate: timestamp("end_date").notNull(),
      status: text("status").default("upcoming"),
      // upcoming, ongoing, past
      heroImageUrl: text("hero_image_url"),
      description: text("description"),
      highlights: jsonb("highlights"),
      // Array of highlight strings
      includesInfo: jsonb("includes_info"),
      // What's included in the cruise
      pricing: jsonb("pricing"),
      // Pricing tiers and info
      createdBy: varchar("created_by").references(() => users.id),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    }, (table) => ({
      statusIdx: index("cruise_status_idx").on(table.status),
      slugIdx: index("cruise_slug_idx").on(table.slug)
    }));
    itinerary = pgTable("itinerary", {
      id: serial("id").primaryKey(),
      cruiseId: integer("cruise_id").notNull().references(() => cruises.id, { onDelete: "cascade" }),
      date: timestamp("date").notNull(),
      day: integer("day").notNull(),
      // Day number of cruise (1, 2, 3, etc.)
      portName: text("port_name").notNull(),
      country: text("country"),
      arrivalTime: text("arrival_time"),
      // Stored as text for flexibility (e.g., "08:00", "—")
      departureTime: text("departure_time"),
      allAboardTime: text("all_aboard_time"),
      portImageUrl: text("port_image_url"),
      description: text("description"),
      highlights: jsonb("highlights"),
      // Port highlights
      orderIndex: integer("order_index").notNull(),
      // For sorting
      segment: text("segment").default("main")
      // pre, main, post
    }, (table) => ({
      cruiseIdx: index("itinerary_cruise_idx").on(table.cruiseId),
      dateIdx: index("itinerary_date_idx").on(table.date)
    }));
    events = pgTable("events", {
      id: serial("id").primaryKey(),
      cruiseId: integer("cruise_id").notNull().references(() => cruises.id, { onDelete: "cascade" }),
      date: timestamp("date").notNull(),
      time: text("time").notNull(),
      // "14:00", "21:30", etc.
      title: text("title").notNull(),
      type: text("type").notNull(),
      // party, show, dining, lounge, fun, club, after
      venue: text("venue").notNull(),
      deck: text("deck"),
      description: text("description"),
      shortDescription: text("short_description"),
      imageUrl: text("image_url"),
      themeDescription: text("theme_description"),
      // For parties
      dressCode: text("dress_code"),
      capacity: integer("capacity"),
      requiresReservation: boolean("requires_reservation").default(false),
      talentIds: jsonb("talent_ids"),
      // Array of talent IDs
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    }, (table) => ({
      cruiseIdx: index("events_cruise_idx").on(table.cruiseId),
      dateIdx: index("events_date_idx").on(table.date),
      typeIdx: index("events_type_idx").on(table.type)
    }));
    talent = pgTable("talent", {
      id: serial("id").primaryKey(),
      name: text("name").notNull(),
      category: text("category").notNull(),
      // Broadway, Drag, Comedy, Music, etc.
      bio: text("bio"),
      knownFor: text("known_for"),
      profileImageUrl: text("profile_image_url"),
      socialLinks: jsonb("social_links"),
      // {instagram: "", twitter: "", etc.}
      website: text("website"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    }, (table) => ({
      nameIdx: index("talent_name_idx").on(table.name),
      categoryIdx: index("talent_category_idx").on(table.category)
    }));
    cruiseTalent = pgTable("cruise_talent", {
      cruiseId: integer("cruise_id").notNull().references(() => cruises.id, { onDelete: "cascade" }),
      talentId: integer("talent_id").notNull().references(() => talent.id, { onDelete: "cascade" }),
      role: text("role"),
      // Headliner, Special Guest, Host, etc.
      performanceCount: integer("performance_count"),
      notes: text("notes"),
      createdAt: timestamp("created_at").defaultNow()
    }, (table) => ({
      pk: primaryKey({ columns: [table.cruiseId, table.talentId] }),
      cruiseIdx: index("cruise_talent_cruise_idx").on(table.cruiseId),
      talentIdx: index("cruise_talent_talent_idx").on(table.talentId)
    }));
    media = pgTable("media", {
      id: serial("id").primaryKey(),
      url: text("url").notNull(),
      thumbnailUrl: text("thumbnail_url"),
      type: text("type").notNull(),
      // port, party, talent, cruise, event, gallery
      associatedType: text("associated_type"),
      // cruise, event, talent, itinerary
      associatedId: integer("associated_id"),
      caption: text("caption"),
      altText: text("alt_text"),
      credits: text("credits"),
      // Photographer/source credits
      uploadedBy: varchar("uploaded_by").references(() => users.id),
      uploadedAt: timestamp("uploaded_at").defaultNow(),
      metadata: jsonb("metadata")
      // Additional metadata like dimensions, file size, etc.
    }, (table) => ({
      typeIdx: index("media_type_idx").on(table.type),
      associatedIdx: index("media_associated_idx").on(table.associatedType, table.associatedId)
    }));
    userCruises = pgTable("user_cruises", {
      userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      cruiseId: integer("cruise_id").notNull().references(() => cruises.id, { onDelete: "cascade" }),
      permissionLevel: text("permission_level").notNull(),
      // admin, editor, viewer
      assignedBy: varchar("assigned_by").references(() => users.id),
      assignedAt: timestamp("assigned_at").defaultNow()
    }, (table) => ({
      pk: primaryKey({ columns: [table.userId, table.cruiseId] }),
      userIdx: index("user_cruises_user_idx").on(table.userId),
      cruiseIdx: index("user_cruises_cruise_idx").on(table.cruiseId)
    }));
    partyTemplates = pgTable("party_templates", {
      id: serial("id").primaryKey(),
      name: text("name").notNull(),
      themeDescription: text("theme_description"),
      dressCode: text("dress_code"),
      defaultImageUrl: text("default_image_url"),
      tags: jsonb("tags"),
      // Array of tags for searching
      defaults: jsonb("defaults"),
      // Default values for events using this template
      createdBy: varchar("created_by").references(() => users.id),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    }, (table) => ({
      nameIdx: index("party_templates_name_idx").on(table.name)
    }));
    cruiseInfoSections = pgTable("cruise_info_sections", {
      id: serial("id").primaryKey(),
      cruiseId: integer("cruise_id").notNull().references(() => cruises.id, { onDelete: "cascade" }),
      title: text("title").notNull(),
      content: text("content"),
      // Rich text content
      orderIndex: integer("order_index").notNull(),
      updatedBy: varchar("updated_by").references(() => users.id),
      updatedAt: timestamp("updated_at").defaultNow()
    }, (table) => ({
      cruiseIdx: index("cruise_info_cruise_idx").on(table.cruiseId),
      orderIdx: index("cruise_info_order_idx").on(table.cruiseId, table.orderIndex)
    }));
    aiJobs = pgTable("ai_jobs", {
      id: serial("id").primaryKey(),
      cruiseId: integer("cruise_id").notNull().references(() => cruises.id, { onDelete: "cascade" }),
      sourceType: text("source_type").notNull(),
      // pdf, url
      sourceRef: text("source_ref").notNull(),
      // URL or file path
      task: text("task").notNull(),
      // extract
      status: text("status").default("queued"),
      // queued, processing, completed, failed
      result: jsonb("result"),
      // Extracted data
      error: text("error"),
      createdBy: varchar("created_by").references(() => users.id),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    }, (table) => ({
      cruiseIdx: index("ai_jobs_cruise_idx").on(table.cruiseId),
      statusIdx: index("ai_jobs_status_idx").on(table.status)
    }));
    aiDrafts = pgTable("ai_drafts", {
      id: serial("id").primaryKey(),
      cruiseId: integer("cruise_id").notNull().references(() => cruises.id, { onDelete: "cascade" }),
      draftType: text("draft_type").notNull(),
      // itinerary, events, info
      payload: jsonb("payload").notNull(),
      // Draft data to be reviewed
      createdFromJobId: integer("created_from_job_id").references(() => aiJobs.id),
      createdBy: varchar("created_by").references(() => users.id),
      createdAt: timestamp("created_at").defaultNow()
    }, (table) => ({
      cruiseIdx: index("ai_drafts_cruise_idx").on(table.cruiseId),
      typeIdx: index("ai_drafts_type_idx").on(table.draftType)
    }));
    auditLog = pgTable("audit_log", {
      id: serial("id").primaryKey(),
      userId: varchar("user_id").references(() => users.id),
      action: text("action").notNull(),
      // create, update, delete
      tableName: text("table_name").notNull(),
      recordId: text("record_id"),
      oldValues: jsonb("old_values"),
      newValues: jsonb("new_values"),
      timestamp: timestamp("timestamp").defaultNow(),
      ipAddress: text("ip_address")
    }, (table) => ({
      userIdx: index("audit_user_idx").on(table.userId),
      timestampIdx: index("audit_timestamp_idx").on(table.timestamp)
    }));
    cruisesRelations = relations(cruises, ({ many, one }) => ({
      itinerary: many(itinerary),
      events: many(events),
      cruiseTalent: many(cruiseTalent),
      userCruises: many(userCruises),
      creator: one(users, {
        fields: [cruises.createdBy],
        references: [users.id]
      })
    }));
    itineraryRelations = relations(itinerary, ({ one }) => ({
      cruise: one(cruises, {
        fields: [itinerary.cruiseId],
        references: [cruises.id]
      })
    }));
    eventsRelations = relations(events, ({ one }) => ({
      cruise: one(cruises, {
        fields: [events.cruiseId],
        references: [cruises.id]
      })
    }));
    talentRelations = relations(talent, ({ many }) => ({
      cruiseTalent: many(cruiseTalent)
    }));
    cruiseTalentRelations = relations(cruiseTalent, ({ one }) => ({
      cruise: one(cruises, {
        fields: [cruiseTalent.cruiseId],
        references: [cruises.id]
      }),
      talent: one(talent, {
        fields: [cruiseTalent.talentId],
        references: [talent.id]
      })
    }));
    userCruisesRelations = relations(userCruises, ({ one }) => ({
      user: one(users, {
        fields: [userCruises.userId],
        references: [users.id]
      }),
      cruise: one(cruises, {
        fields: [userCruises.cruiseId],
        references: [cruises.id]
      })
    }));
    partyTemplatesRelations = relations(partyTemplates, ({ one }) => ({
      creator: one(users, {
        fields: [partyTemplates.createdBy],
        references: [users.id]
      })
    }));
    cruiseInfoSectionsRelations = relations(cruiseInfoSections, ({ one }) => ({
      cruise: one(cruises, {
        fields: [cruiseInfoSections.cruiseId],
        references: [cruises.id]
      }),
      updater: one(users, {
        fields: [cruiseInfoSections.updatedBy],
        references: [users.id]
      })
    }));
    aiJobsRelations = relations(aiJobs, ({ one, many }) => ({
      cruise: one(cruises, {
        fields: [aiJobs.cruiseId],
        references: [cruises.id]
      }),
      creator: one(users, {
        fields: [aiJobs.createdBy],
        references: [users.id]
      }),
      drafts: many(aiDrafts)
    }));
    aiDraftsRelations = relations(aiDrafts, ({ one }) => ({
      cruise: one(cruises, {
        fields: [aiDrafts.cruiseId],
        references: [cruises.id]
      }),
      job: one(aiJobs, {
        fields: [aiDrafts.createdFromJobId],
        references: [aiJobs.id]
      }),
      creator: one(users, {
        fields: [aiDrafts.createdBy],
        references: [users.id]
      })
    }));
    insertUserSchema = createInsertSchema(users).pick({
      username: true,
      password: true,
      email: true,
      fullName: true,
      role: true
    });
    insertCruiseSchema = createInsertSchema(cruises).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertItinerarySchema = createInsertSchema(itinerary).omit({
      id: true
    });
    insertEventSchema = createInsertSchema(events).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertTalentSchema = createInsertSchema(talent).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertMediaSchema = createInsertSchema(media).omit({
      id: true,
      uploadedAt: true
    });
    insertPartyTemplateSchema = createInsertSchema(partyTemplates).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertCruiseInfoSectionSchema = createInsertSchema(cruiseInfoSections).omit({
      id: true,
      updatedAt: true
    });
    insertAiJobSchema = createInsertSchema(aiJobs).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertAiDraftSchema = createInsertSchema(aiDrafts).omit({
      id: true,
      createdAt: true
    });
  }
});

// server/storage.ts
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, and, desc, asc, ilike, or } from "drizzle-orm";
var queryClient, db, users2, cruises2, itinerary2, events2, talent2, cruiseTalent2, media2, userCruises2, auditLog2, UserStorage, CruiseStorage, ItineraryStorage, EventStorage, TalentStorage, MediaStorage, storage, cruiseStorage, itineraryStorage, eventStorage, talentStorage, mediaStorage;
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
    init_schema();
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set, ensure the database is provisioned");
    }
    queryClient = neon(process.env.DATABASE_URL);
    db = drizzle(queryClient, { schema: schema_exports });
    ({
      users: users2,
      cruises: cruises2,
      itinerary: itinerary2,
      events: events2,
      talent: talent2,
      cruiseTalent: cruiseTalent2,
      media: media2,
      userCruises: userCruises2,
      auditLog: auditLog2
    } = schema_exports);
    UserStorage = class {
      async getUser(id) {
        const result = await db.select().from(users2).where(eq(users2.id, id));
        return result[0];
      }
      async getUserByUsername(username) {
        const result = await db.select().from(users2).where(eq(users2.username, username));
        return result[0];
      }
      async createUser(insertUser) {
        const result = await db.insert(users2).values(insertUser).returning();
        return result[0];
      }
      async updateUserLastLogin(id) {
        await db.update(users2).set({ lastLogin: /* @__PURE__ */ new Date() }).where(eq(users2.id, id));
      }
    };
    CruiseStorage = class {
      async getAllCruises() {
        return await db.select().from(cruises2).orderBy(desc(cruises2.startDate));
      }
      async getCruiseById(id) {
        const result = await db.select().from(cruises2).where(eq(cruises2.id, id));
        return result[0];
      }
      async getCruiseBySlug(slug) {
        const result = await db.select().from(cruises2).where(eq(cruises2.slug, slug));
        return result[0];
      }
      async getUpcomingCruises() {
        return await db.select().from(cruises2).where(eq(cruises2.status, "upcoming")).orderBy(asc(cruises2.startDate));
      }
      async getPastCruises() {
        return await db.select().from(cruises2).where(eq(cruises2.status, "past")).orderBy(desc(cruises2.startDate));
      }
      async createCruise(cruise) {
        const values = { ...cruise };
        if (cruise.startDate) {
          if (typeof cruise.startDate === "string") {
            values.startDate = new Date(cruise.startDate);
          } else {
            values.startDate = cruise.startDate;
          }
        }
        if (cruise.endDate) {
          if (typeof cruise.endDate === "string") {
            values.endDate = new Date(cruise.endDate);
          } else {
            values.endDate = cruise.endDate;
          }
        }
        const result = await db.insert(cruises2).values(values).returning();
        return result[0];
      }
      async updateCruise(id, cruise) {
        const updates = { ...cruise, updatedAt: /* @__PURE__ */ new Date() };
        if (cruise.startDate) {
          if (typeof cruise.startDate === "string") {
            updates.startDate = new Date(cruise.startDate);
          } else {
            updates.startDate = cruise.startDate;
          }
        }
        if (cruise.endDate) {
          if (typeof cruise.endDate === "string") {
            updates.endDate = new Date(cruise.endDate);
          } else {
            updates.endDate = cruise.endDate;
          }
        }
        const result = await db.update(cruises2).set(updates).where(eq(cruises2.id, id)).returning();
        return result[0];
      }
      async deleteCruise(id) {
        await db.delete(cruises2).where(eq(cruises2.id, id));
      }
    };
    ItineraryStorage = class {
      async getItineraryByCruise(cruiseId) {
        return await db.select().from(itinerary2).where(eq(itinerary2.cruiseId, cruiseId)).orderBy(asc(itinerary2.orderIndex));
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
        const result = await db.insert(itinerary2).values(values).returning();
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
        const result = await db.update(itinerary2).set(updates).where(eq(itinerary2.id, id)).returning();
        return result[0];
      }
      async deleteItineraryStop(id) {
        await db.delete(itinerary2).where(eq(itinerary2.id, id));
      }
    };
    EventStorage = class {
      async getEventsByCruise(cruiseId) {
        return await db.select().from(events2).where(eq(events2.cruiseId, cruiseId)).orderBy(asc(events2.date), asc(events2.time));
      }
      async getEventsByDate(cruiseId, date) {
        return await db.select().from(events2).where(and(eq(events2.cruiseId, cruiseId), eq(events2.date, date))).orderBy(asc(events2.time));
      }
      async getEventsByType(cruiseId, type) {
        return await db.select().from(events2).where(and(eq(events2.cruiseId, cruiseId), eq(events2.type, type))).orderBy(asc(events2.date), asc(events2.time));
      }
      async createEvent(event) {
        const result = await db.insert(events2).values(event).returning();
        return result[0];
      }
      async updateEvent(id, event) {
        const result = await db.update(events2).set({ ...event, updatedAt: /* @__PURE__ */ new Date() }).where(eq(events2.id, id)).returning();
        return result[0];
      }
      async deleteEvent(id) {
        await db.delete(events2).where(eq(events2.id, id));
      }
    };
    TalentStorage = class {
      async getAllTalent() {
        return await db.select().from(talent2).orderBy(asc(talent2.name));
      }
      async getTalentById(id) {
        const result = await db.select().from(talent2).where(eq(talent2.id, id));
        return result[0];
      }
      async getTalentByCruise(cruiseId) {
        const result = await db.select().from(talent2).innerJoin(cruiseTalent2, eq(talent2.id, cruiseTalent2.talentId)).where(eq(cruiseTalent2.cruiseId, cruiseId)).orderBy(asc(talent2.name));
        return result.map((r) => r.talent);
      }
      async searchTalent(search, performanceType) {
        const conditions = [];
        if (search) {
          conditions.push(
            or(
              ilike(talent2.name, `%${search}%`),
              ilike(talent2.bio, `%${search}%`),
              ilike(talent2.knownFor, `%${search}%`)
            )
          );
        }
        if (performanceType) {
          conditions.push(eq(talent2.category, performanceType));
        }
        const query = conditions.length > 0 ? db.select().from(talent2).where(conditions.length === 1 ? conditions[0] : and(...conditions)) : db.select().from(talent2);
        return await query.orderBy(asc(talent2.name));
      }
      async createTalent(talentData) {
        const result = await db.insert(talent2).values(talentData).returning();
        return result[0];
      }
      async updateTalent(id, talentData) {
        const result = await db.update(talent2).set({ ...talentData, updatedAt: /* @__PURE__ */ new Date() }).where(eq(talent2.id, id)).returning();
        return result[0];
      }
      async deleteTalent(id) {
        await db.delete(talent2).where(eq(talent2.id, id));
      }
      async assignTalentToCruise(cruiseId, talentId, role) {
        await db.insert(cruiseTalent2).values({
          cruiseId,
          talentId,
          role
        }).onConflictDoNothing();
      }
      async removeTalentFromCruise(cruiseId, talentId) {
        await db.delete(cruiseTalent2).where(and(
          eq(cruiseTalent2.cruiseId, cruiseId),
          eq(cruiseTalent2.talentId, talentId)
        ));
      }
    };
    MediaStorage = class {
      async getMediaByType(type) {
        return await db.select().from(media2).where(eq(media2.type, type));
      }
      async getMediaByAssociation(associatedType, associatedId) {
        return await db.select().from(media2).where(and(
          eq(media2.associatedType, associatedType),
          eq(media2.associatedId, associatedId)
        ));
      }
      async createMedia(mediaData) {
        const result = await db.insert(media2).values(mediaData).returning();
        return result[0];
      }
      async deleteMedia(id) {
        await db.delete(media2).where(eq(media2.id, id));
      }
    };
    storage = new UserStorage();
    cruiseStorage = new CruiseStorage();
    itineraryStorage = new ItineraryStorage();
    eventStorage = new EventStorage();
    talentStorage = new TalentStorage();
    mediaStorage = new MediaStorage();
  }
});

// client/src/data/cruise-data.ts
var ITINERARY, PARTY_THEMES, DAILY, TALENT;
var init_cruise_data = __esm({
  "client/src/data/cruise-data.ts"() {
    "use strict";
    ITINERARY = [
      { key: "2025-08-20", date: "Wed, Aug 20", port: "Athens, Greece", arrive: "Pre-Cruise", depart: "\u2014" },
      { key: "2025-08-21", date: "Thu, Aug 21", port: "Athens, Greece (Embarkation Day)", arrive: "\u2014", depart: "6:00 PM" },
      { key: "2025-08-22", date: "Fri, Aug 22", port: "Santorini, Greece", arrive: "9:00 AM", depart: "10:00 PM" },
      { key: "2025-08-23", date: "Sat, Aug 23", port: "Ku\u015Fadas\u0131, Turkey", arrive: "8:00 AM", depart: "3:00 PM" },
      { key: "2025-08-24", date: "Sun, Aug 24", port: "Istanbul, Turkey", arrive: "1:00 PM", depart: "Overnight" },
      { key: "2025-08-25", date: "Mon, Aug 25", port: "Istanbul, Turkey", arrive: "\u2014", depart: "2:00 PM" },
      { key: "2025-08-26", date: "Tue, Aug 26", port: "Day at Sea", arrive: "\u2014", depart: "\u2014" },
      { key: "2025-08-27", date: "Wed, Aug 27", port: "Alexandria (Cairo), Egypt", arrive: "7:00 AM", depart: "12:00 AM" },
      { key: "2025-08-28", date: "Thu, Aug 28", port: "Day at Sea", arrive: "\u2014", depart: "\u2014" },
      { key: "2025-08-29", date: "Fri, Aug 29", port: "Mykonos, Greece", arrive: "9:00 AM", depart: "2:00 AM" },
      { key: "2025-08-30", date: "Sat, Aug 30", port: "Iraklion, Crete", arrive: "11:00 AM", depart: "6:00 PM" },
      { key: "2025-08-31", date: "Sun, Aug 31", port: "Athens, Greece (Disembarkation Day)", arrive: "7:00 AM", depart: "\u2014" }
    ];
    PARTY_THEMES = [
      {
        key: "Dog Tag T-Dance",
        desc: "Longest-running afternoon party with military uniform inspiration. We provide souvenir dog tags; you bring the strength and style.",
        shortDesc: "Military uniform vibes with souvenir dog tags provided."
      },
      {
        key: "UNITE",
        desc: "Global community celebration with 60+ nations represented. Show off your country's colors and unite in fun, frolic, and friendship.",
        shortDesc: "Celebrate global unity wearing your country's colors."
      },
      {
        key: "Empires",
        desc: "Ancient world glamour featuring Greece, Egypt, Rome, and Ottoman empires. Golden togas, silks, and Cleopatra-level dazzle welcome.",
        shortDesc: "Ancient empire glamour from Greece to Ottoman sultans."
      },
      {
        key: "Greek Isles: Here We Go Again!",
        desc: "Mamma Mia fantasy with Greek island chic meets ABBA disco. Blue & white, sequins, platform boots, and Mediterranean drama.",
        shortDesc: "Mamma Mia meets Greek islands with ABBA disco energy."
      },
      {
        key: "Lost At Sea",
        desc: "Nautical silliness with sea creatures, pirates, and mythical characters. Cruise passengers and TV escapees welcome too.",
        shortDesc: "Nautical chaos with pirates, sea creatures, and myths."
      },
      {
        key: "Neon Playground",
        desc: "Fast, flashy, bright musical playground in the Red Room. Neon, sparkles, lights, and bouncy sounds that make you smile. This event happens at 12:30am on Friday morning.",
        shortDesc: "Laser-bright neon playground with bouncy party vibes at 12:30am."
      },
      {
        key: "Think Pink T-Dance",
        desc: "Pink is in! It's everywhere and brings out the playful in all of us. From Barbie butch to fluffy fantastic, throw on your favorite interpretation for a hot afternoon of frivolous dolled up fun.",
        shortDesc: "Pink paradise - from Barbie butch to fluffy fantastic fun!"
      },
      {
        key: "Virgin White",
        desc: "Atlantis' pinnacle party in one perfect color. Be creative, sexy, irreverent, or simple in your favorite white outfit.",
        shortDesc: "The ultimate white party under Mediterranean stars."
      },
      {
        key: "Revival! Classic Disco T-Dance",
        desc: "Glory days of 70s disco with pure musical magic. Artificial fabrics, facial hair, oversized shoes, and obnoxious accessories welcome.",
        shortDesc: "70s disco revival with retro fabrics and accessories."
      },
      {
        key: "Atlantis Classics",
        desc: "Three decades of anthems & divas.",
        shortDesc: "Three decades of anthems & divas."
      },
      {
        key: "Off-White After party",
        desc: "Late-late afters post-White.",
        shortDesc: "Late-late afters post-White."
      },
      {
        key: "Last Dance",
        desc: "One last boogie into Athens.",
        shortDesc: "One last boogie into Athens."
      },
      {
        key: "Welcome Party",
        desc: "First night under the stars.",
        shortDesc: "First night under the stars."
      },
      {
        key: "Sail-Away Party",
        desc: "Top-deck vibes as we depart.",
        shortDesc: "Top-deck vibes as we depart."
      }
    ];
    DAILY = [
      { key: "2025-08-20", items: [
        { type: "social", time: "17:00", title: "Pre-Cruise Happy Hour by KGay Travel", venue: "Academias Hotel RoofTop Bar" }
      ] },
      { key: "2025-08-21", items: [
        { type: "party", time: "18:00", title: "Sail-Away Party", venue: "Aquatic Club" },
        { type: "show", time: "19:00", title: "First Time Cruisers Orientation", venue: "Red Room" },
        { type: "show", time: "19:30", title: "Mon\xE9t X Change", venue: "Red Room" },
        { type: "show", time: "22:00", title: "Mon\xE9t X Change", venue: "Red Room" },
        { type: "show", time: "21:00", title: "Rob Houchen", venue: "The Manor" },
        { type: "show", time: "23:00", title: "Gay Comedy Stars (Brad Loekle, Rachel Scanlon, Daniel Webb)", venue: "The Manor" },
        { type: "lounge", time: "23:00", title: "Piano Bar with Brian Nash", venue: "On the Rocks" },
        { type: "party", time: "23:00", title: "Welcome Party", venue: "Aquatic Club" }
      ] },
      { key: "2025-08-22", items: [
        { type: "dining", time: "17:00", title: "Another Rose (Dinner show)", venue: "The Manor" },
        { type: "show", time: "22:00", title: "Mon\xE9t X Change", venue: "Red Room" },
        { type: "show", time: "21:00", title: "Alyssa Wray", venue: "The Manor" },
        { type: "show", time: "23:00", title: "Sherry Vine", venue: "The Manor" },
        { type: "party", time: "23:00", title: "UNITE", venue: "Aquatic Club" }
      ] },
      { key: "2025-08-23", items: [
        { type: "party", time: "17:00", title: "Dog Tag T-Dance", venue: "Aquatic Club" },
        { type: "show", time: "19:00", title: "Alexis Michelle", venue: "The Manor" },
        { type: "show", time: "19:30", title: "AirOtic", venue: "Red Room" },
        { type: "show", time: "22:00", title: "AirOtic", venue: "Red Room" },
        { type: "show", time: "21:00", title: "Rob Houchen", venue: "The Manor" },
        { type: "show", time: "23:00", title: "Gay Comedy Stars (Rachel Scanlon, Daniel Webb)", venue: "The Manor" },
        { type: "party", time: "23:00", title: "Lost At Sea", venue: "Aquatic Club" },
        { type: "lounge", time: "23:00", title: "Piano Bar with William TN Hall", venue: "On the Rocks" }
      ] },
      { key: "2025-08-24", items: [
        { type: "show", time: "22:00", title: "AirOtic", venue: "Red Room" },
        { type: "show", time: "21:00", title: "Leona Winter", venue: "The Manor" },
        { type: "show", time: "23:00", title: "Rob Houchen", venue: "The Manor" },
        { type: "lounge", time: "23:00", title: "Piano Bar with Brandon James Gwinn", venue: "On the Rocks" },
        { type: "club", time: "23:00", title: "Atlantis Night Club", venue: "On the Rocks" }
      ] },
      { key: "2025-08-25", items: [
        { type: "dining", time: "17:00", title: "Another Rose (Dinner show)", venue: "The Manor" },
        { type: "show", time: "19:30", title: "Persephone", venue: "Red Room" },
        { type: "show", time: "22:00", title: "Persephone", venue: "Red Room" },
        { type: "show", time: "21:00", title: "Alyssa Wray", venue: "The Manor" },
        { type: "show", time: "23:00", title: "Alexis Michelle", venue: "The Manor" },
        { type: "party", time: "23:00", title: "Empires", venue: "Aquatic Club" },
        { type: "lounge", time: "23:00", title: "Piano Bar with Brian Nash", venue: "On the Rocks" }
      ] },
      { key: "2025-08-26", items: [
        { type: "fun", time: "14:00", title: "Bingo with The Diva", venue: "Red Room" },
        { type: "party", time: "17:00", title: "Think Pink T-Dance", venue: "Aquatic Club" },
        { type: "show", time: "19:30", title: "Reuben Kaye", venue: "Red Room" },
        { type: "show", time: "22:00", title: "Reuben Kaye", venue: "Red Room" },
        { type: "show", time: "19:00", title: "Leona Winter", venue: "The Manor" },
        { type: "show", time: "21:00", title: "Comedy All-Stars (Brad Loekle, Rachel Scanlon, Daniel Webb)", venue: "The Manor" },
        { type: "show", time: "23:00", title: "Sherry Vine", venue: "The Manor" },
        { type: "lounge", time: "23:00", title: "Piano Bar with William TN Hall", venue: "On the Rocks" },
        { type: "party", time: "23:00", title: "Atlantis Classics", venue: "Aquatic Club" }
      ] },
      { key: "2025-08-27", items: [
        { type: "show", time: "22:00", title: "Persephone", venue: "Red Room" },
        { type: "show", time: "21:00", title: "Comedy All-Stars (Brad Loekle, Rachel Scanlon, Daniel Webb)", venue: "The Manor" },
        { type: "show", time: "23:00", title: "Sherry Vine", venue: "The Manor" },
        { type: "party", time: "23:00", title: "Greek Isles: Here We Go Again!", venue: "Aquatic Club" }
      ] },
      { key: "2025-08-28", items: [
        { type: "dining", time: "17:00", title: "Another Rose (Dinner show)", venue: "The Manor" },
        { type: "show", time: "17:00", title: "Audra McDonald", venue: "Red Room" },
        { type: "show", time: "20:00", title: "Audra McDonald", venue: "Red Room" },
        { type: "show", time: "22:00", title: "Audra McDonald", venue: "Red Room" },
        { type: "show", time: "21:00", title: "Leona Winter", venue: "The Manor" },
        { type: "show", time: "23:00", title: "Alyssa Wray", venue: "The Manor" },
        { type: "lounge", time: "23:00", title: "Piano Bar with William TN Hall", venue: "On the Rocks" }
      ] },
      { key: "2025-08-29", items: [
        { type: "party", time: "00:30", title: "Neon Playground", venue: "Red Room" },
        { type: "dining", time: "19:00", title: "Another Rose (Dinner show)", venue: "The Manor" },
        { type: "show", time: "23:00", title: "Sherry Vine", venue: "The Manor" },
        { type: "lounge", time: "23:00", title: "Piano Bar with Brandon James Gwinn", venue: "On the Rocks" },
        { type: "party", time: "24:00", title: "Virgin White Party", venue: "Aquatic Club" },
        { type: "after", time: "05:00", title: "Off-White After party", venue: "The Manor" }
      ] },
      { key: "2025-08-30", items: [
        { type: "party", time: "17:00", title: "Revival! Classic Disco T-Dance", venue: "Aquatic Club" },
        { type: "show", time: "19:00", title: "Alexis Michelle", venue: "The Manor" },
        { type: "show", time: "21:00", title: "Alyssa Wray", venue: "The Manor" },
        { type: "show", time: "19:30", title: "Brad's Last Laugh (Brad Loekle)", venue: "Red Room" },
        { type: "show", time: "22:00", title: "Brad's Last Laugh (Brad Loekle)", venue: "Red Room" },
        { type: "lounge", time: "23:00", title: "Piano Bar with Brian Nash", venue: "On the Rocks" },
        { type: "party", time: "23:00", title: "Last Dance", venue: "The Manor" }
      ] },
      { key: "2025-08-31", items: [] }
    ];
    TALENT = [
      {
        name: "Audra McDonald",
        cat: "Broadway Legend",
        role: "Six-time Tony winner",
        knownFor: "Broadway's leading lady",
        bio: "Six-time Tony Award winner and Grammy Award recipient, Audra McDonald is one of Broadway's most celebrated performers. Known for her powerful voice and versatility across musical theater, opera, and television, she has starred in productions like Ragtime, Carousel, and Lady Day at Emerson's Bar & Grill.",
        img: "https://www.theatermania.com/wp-content/uploads/sites/4/2023/03/audra-mcdonald-will-swenson-logo-50940-1.jpeg?w=640",
        social: {
          instagram: "https://www.instagram.com/audramcdonald/",
          twitter: "https://x.com/AudraEqualityMc"
        }
      },
      {
        name: "Mon\xE9t X Change",
        cat: "Drag & Variety",
        role: "Drag icon & comic",
        knownFor: "RPDR All Stars 4 winner",
        bio: "Born in New York City, Mon\xE9t is a classically trained performer who won RuPaul's Drag Race All Stars 4. With her signature wit and powerful vocals, she's become a beloved figure in drag culture and comedy.",
        img: "https://www.billboard.com/wp-content/uploads/media/03-2-Monet-X-Change-rupauls-drag-race-s10-billboard-a-1548.jpg",
        social: {
          instagram: "https://www.instagram.com/monetxchange/",
          twitter: "https://x.com/monetxchange",
          website: "https://www.monetxchange.com"
        }
      },
      {
        name: "Alexis Michelle",
        cat: "Drag & Variety",
        role: "Singer & RPDR favorite",
        knownFor: "Glam cabaret",
        bio: "Broadway-trained drag performer who placed 5th on RuPaul's Drag Race Season 9. Known for her theatrical performances and cabaret shows at venues like Feinstein's/54 Below.",
        img: "https://i.redd.it/azxnlnbuql9b1.jpg",
        social: {
          instagram: "https://www.instagram.com/alexismichelleofficial/",
          tiktok: "https://www.tiktok.com/@alexismichelleofficial"
        }
      },
      {
        name: "Leona Winter",
        cat: "Vocalists",
        role: "Vocalist",
        knownFor: "Queen of the Universe",
        bio: "French drag queen and countertenor baritone with a three-octave range. Known for her appearances at Queen of the Universe and The Voice France in 2019.",
        img: "https://i.pinimg.com/736x/83/eb/d7/83ebd7f4d42b686feb15dd51ed68d987.jpg",
        social: {
          instagram: "https://www.instagram.com/leonawinter16/",
          tiktok: "https://www.tiktok.com/@leonawinterofficiel"
        }
      },
      {
        name: "Sherry Vine",
        cat: "Drag & Variety",
        role: "Comedy & vocals",
        knownFor: "Parody legend",
        bio: "Legendary NYC drag icon with over 35 years in entertainment. Known for her hilarious parody songs and has been a fixture of NYC nightlife since the 1990s.",
        img: "http://static1.squarespace.com/static/5e2256cf72c72a5f12f1fdfe/t/63cc50edf5765a4e44b610f1/1580806649356/sherry-web-social.png?format=1500w",
        social: {
          instagram: "https://www.instagram.com/misssherryvine/"
        }
      },
      {
        name: "Reuben Kaye",
        cat: "Drag & Variety",
        role: "Comic performer",
        knownFor: "Cabaret provocateur",
        bio: "Award-winning Australian comedian, cabaret host, and writer known for pushing boundaries. Nominated for Best Show at the 2024 Edinburgh Comedy Awards.",
        img: "https://encoremelbourne.com/wp-content/uploads/2024/09/Reuben-Kaye-c-Alan-Moyle-scaled-e1727080187482.jpg",
        social: {
          instagram: "https://www.instagram.com/reubenkayeofficial/",
          twitter: "https://x.com/reubenkaye",
          website: "https://www.reubenkaye.com/about"
        }
      },
      {
        name: "Rob Houchen",
        cat: "Vocalists",
        role: "West End star",
        knownFor: "Les Mis\xE9rables, Titanique",
        bio: "British stage actor and producer best known for playing Marius in Les Mis\xE9rables. Also starred in musicals including Titanique, South Pacific, and The Light in the Piazza.",
        img: "http://www.digitaljournal.com/wp-content/uploads/2024/10/Rob-Houchen-Photo-e1728160861225.jpg",
        social: {
          instagram: "https://www.instagram.com/robhouchen/"
        }
      },
      {
        name: "Alyssa Wray",
        cat: "Vocalists",
        role: "Vocalist",
        knownFor: "American Idol Top 9",
        bio: "Singer and performer from Kentucky who made it to the Top 9 on American Idol. Katy Perry called her a 'once in a generation' performer.",
        img: "https://s.yimg.com/ny/api/res/1.2/B32A9JNeo3IpS.FKxuffIQ--/YXBwaWQ9aGlnaGxhbmRlcjt3PTEyMDA7aD02NzY7Y2Y9d2VicA--/https://s.yimg.com/os/creatr-uploaded-images/2021-03/1a562ab0-7ee4-11eb-afce-ac7a09171992",
        social: {
          instagram: "https://www.instagram.com/itsalyssawray/"
        }
      },
      {
        name: "Brad Loekle",
        cat: "Comedy",
        role: "Comedian",
        knownFor: "Atlantis favorite",
        bio: "American stand-up comedian from Upstate New York who was a regular on premium cable comedy shows. Known for his appearances at Pride events, circuit parties, and cruise ships.",
        img: "https://images.squarespace-cdn.com/content/v1/62b20e5c24737a3005ebe5e1/1701816763654-IG6NG6UERJXYU354L1ZU/brad-loekle-web.jpg?format=2500w",
        social: {
          instagram: "https://www.instagram.com/bradloekle/",
          website: "https://www.bradloekle.com"
        }
      },
      {
        name: "Rachel Scanlon",
        cat: "Comedy",
        role: "Comedian",
        knownFor: "Two Dykes and a Mic",
        bio: "LA-based stand-up comedian and co-host of the popular podcast 'Two Dykes and a Mic'. Known for her sharp queer humor and sex-positive comedy.",
        img: "https://www.empirecomedyme.com/img/comedians/Rachel-Scanlon-Primary-Headshot-da5f117a-main-image.png",
        social: {
          instagram: "https://www.instagram.com/rachelscanloncomedy/",
          linktree: "https://linktr.ee/rachelscanlon"
        }
      },
      {
        name: "Daniel Webb",
        cat: "Comedy",
        role: "Comedian",
        knownFor: "Opened for Margaret Cho",
        bio: "Texas-born LA-based comedian who currently tours as the opening act for Margaret Cho. Featured in the documentary 'Queer Riot' and released his hour-long special 'Hoe's Parade: Live at the Rose Bowl' in 2021.",
        img: "https://images.squarespace-cdn.com/content/v1/62b20e5c24737a3005ebe5e1/1668557899908-6Z03ZHA1FY8Y9ANSKMJ9/daniel-webb-web.jpg?format=2500w",
        social: {
          instagram: "https://www.instagram.com/the_danielwebb/",
          website: "https://www.thedanielwebb.com"
        }
      },
      {
        name: "AirOtic",
        cat: "Productions",
        role: "Acrobatic spectacle",
        knownFor: "Les Farfadais production",
        bio: "High-energy circus cabaret show created by Les Farfadais featuring aerial acrobatics, dance, and stunning costumes.",
        img: "https://airoticcirquesoiree.com/assets/img/info/info_love-3.6a496b70.webp",
        social: {
          instagram: "https://www.instagram.com/airoticshow/"
        }
      },
      {
        name: "Another Rose",
        cat: "Productions",
        role: "Immersive dinner show",
        knownFor: "Interactive feast",
        bio: "Virgin Voyages' premium dinner theater experience featuring interactive storytelling and culinary artistry in an immersive setting.",
        img: "https://s3.amazonaws.com/a-us.storyblok.com/f/1005231/594cc18563/virgin-voyages_resilient-lady_persepone-and-hades_entertainment_kyle-valenta_18913661.jpg"
      },
      {
        name: "Persephone",
        cat: "Productions",
        role: "Virgin production",
        knownFor: "High-energy acrobatics",
        bio: "Virgin Voyages' signature acrobatic production show featuring aerial performances and theatrical storytelling for an adult-oriented entertainment experience.",
        img: "https://i0.wp.com/thehoteljournal.com/wp-content/uploads/2024/05/Virgin-Voyages-Cruise-Review-Show.jpg?resize=798%2C599&ssl=1"
      },
      {
        name: "The Diva (Bingo)",
        cat: "Productions",
        role: "Host",
        knownFor: "Camp bingo chaos",
        bio: "Virgin Voyages' drag bingo experience featuring outrageous hosts, ridiculous prizes, and camp chaos in a uniquely entertaining format.",
        img: "https://attractionsmagazine.com/wp-content/uploads/2025/01/IMG_8480-3-1.jpeg"
      },
      {
        name: "Abel",
        cat: "DJs",
        role: "DJ",
        knownFor: "Miami sound",
        bio: "Grammy-nominated DJ and producer from Miami, half of the electronic duo Abel. Known for producing tracks for Madonna, Rihanna, and Jennifer Lopez.",
        img: "https://bosphilly.com/wp-content/uploads/2023/01/ABEL-SPINNING-scaled-1.jpg",
        social: {
          instagram: "https://www.instagram.com/djabelaguilera/"
        }
      },
      {
        name: "Dan Slater",
        cat: "DJs",
        role: "DJ",
        knownFor: "Sydney to global",
        bio: "Australian DJ and producer based in the United States, with a career spanning over two decades and collaborations with major artists.",
        img: "https://chicago.gopride.com/c/I/52051-156158.jpg",
        social: {
          instagram: "https://www.instagram.com/danielsl8r/",
          website: "https://www.djdanSlater.com"
        }
      },
      {
        name: "DJ Suri",
        cat: "DJs",
        role: "DJ",
        knownFor: "Madrid",
        bio: "Valencia-born DJ specializing in electronic and house music. Known for his performances at major clubs worldwide and his ability to blend various electronic music subgenres.",
        img: "https://jceventsinternational.com/wp-content/uploads/2018/12/DJ-profile-pic_0002_DJSuri.jpg",
        social: {
          instagram: "https://www.instagram.com/djsurimusic/",
          youtube: "https://www.youtube.com/suridj"
        }
      },
      {
        name: "GSP",
        cat: "DJs",
        role: "DJ",
        knownFor: "Athens/Atlanta",
        bio: "Greek-born international DJ and producer George Spiliopoulos. Has performed in over 30 countries and produced remixes for Ariana Grande and Lil Nas X.",
        img: "https://geo-media.beatport.com/image_size/590x404/b4e28817-74b7-4868-9d60-34d0e944fe01.jpg",
        social: {
          instagram: "https://www.instagram.com/gspdj/"
        }
      },
      {
        name: "William TN Hall",
        cat: "Piano Bar",
        role: "Piano entertainer",
        knownFor: "Showtunes & pop",
        bio: "NYC-based composer, arranger, and piano entertainer who specializes in Broadway music and pop standards. Has worked with artists including Sharon Needles and the late Joan Rivers.",
        img: "https://shows.donttellmamanyc.com/images/performers/William_TN_Hallnew.jpg",
        social: {
          instagram: "https://www.instagram.com/williamtnhall?igsh=MXJjZnR1aGl0MmpxMQ==",
          twitter: "https://x.com/williamtnhall"
        }
      },
      {
        name: "Brian Nash",
        cat: "Piano Bar",
        role: "Piano entertainer",
        knownFor: "Musical director",
        bio: "Award-winning pianist, singer, and musical director from Nashville. Serves as entertainment coordinator and resident MD for Atlantis Events worldwide.",
        img: "https://cdn1.sixthman.net/2025/broadway/images/artists/brian_nash_-_brd_-_1500x1000_982140.jpg",
        social: {
          instagram: "https://www.instagram.com/brianjnash/"
        }
      },
      {
        name: "Brandon James Gwinn",
        cat: "Piano Bar",
        role: "Piano entertainer",
        knownFor: "Late night fun",
        bio: "Piano bar entertainer and vocalist known for his late-night performances and ability to take audience requests for an engaging experience.",
        img: "https://eghcszbxego.exactdn.com/wp-content/uploads/2025/07/Brandon-James-Gwinn-photo-by-Michael-Hull.jpg",
        social: {
          instagram: "https://www.instagram.com/brandonjamesg",
          twitter: "https://x.com/brandonjamesg",
          website: "https://www.brandonjamesgwinn.com"
        }
      }
    ];
  }
});

// server/production-seed.ts
var production_seed_exports = {};
__export(production_seed_exports, {
  seedProduction: () => seedProduction
});
import { eq as eq4 } from "drizzle-orm";
async function seedProduction() {
  console.log("\u{1F680} Starting production database seeding...");
  const isProduction = process.env.NODE_ENV === "production";
  if (!isProduction) {
    console.log("\u23ED\uFE0F Skipping production seed - not in production environment");
    return;
  }
  try {
    console.log("\u{1F50D} Checking existing cruise data...");
    const existingCruise = await db.select().from(cruises2).where(eq4(cruises2.slug, "greek-isles-2025"));
    let cruise;
    if (existingCruise.length === 0) {
      console.log("\u{1F195} First deployment detected - creating Greek Isles cruise...");
      [cruise] = await db.insert(cruises2).values({
        name: "Greek Isles Atlantis Cruise",
        slug: "greek-isles-2025",
        shipName: "Virgin Resilient Lady",
        cruiseLine: "Virgin Voyages",
        startDate: /* @__PURE__ */ new Date("2025-08-21"),
        endDate: /* @__PURE__ */ new Date("2025-08-31"),
        status: "upcoming",
        description: "Join us for an unforgettable journey through the Greek Isles aboard the Virgin Resilient Lady. Experience ancient wonders, stunning beaches, and legendary Atlantis parties.",
        heroImageUrl: "https://www.usatoday.com/gcdn/authoring/authoring-images/2024/02/09/USAT/72538478007-resilientlady.png",
        highlights: [
          "Visit iconic Greek islands including Mykonos and Santorini",
          "Explore ancient ruins in Athens and Ephesus",
          "Legendary Atlantis parties and entertainment",
          "World-class talent and performances",
          "All-gay vacation experience"
        ],
        includesInfo: {
          included: [
            "Accommodation in your selected cabin category",
            "All meals and entertainment onboard",
            "Access to all ship facilities",
            "Atlantis parties and events",
            "Talent performances and shows"
          ],
          notIncluded: [
            "Airfare",
            "Shore excursions",
            "Alcoholic beverages",
            "Gratuities",
            "Spa services"
          ]
        }
      }).returning();
      console.log(`\u2705 Created cruise: ${cruise.name} (ID: ${cruise.id})`);
    } else {
      cruise = existingCruise[0];
      console.log(`\u2705 Found existing cruise: ${cruise.name} (ID: ${cruise.id})`);
    }
    console.log("\u{1F3AD} Checking talent data...");
    const existingTalent = await db.select().from(talent2);
    const existingTalentNames = existingTalent.map((t) => t.name);
    const talentMap = new Map(existingTalent.map((t) => [t.name, t.id]));
    let newTalentCount = 0;
    for (const t of TALENT) {
      if (!existingTalentNames.includes(t.name)) {
        console.log(`\u2795 Adding new talent: ${t.name}`);
        const [talentRecord] = await db.insert(talent2).values({
          name: t.name,
          category: t.cat,
          bio: t.bio,
          knownFor: t.knownFor,
          profileImageUrl: t.img,
          socialLinks: t.social || {},
          website: t.social?.website || null
        }).returning();
        talentMap.set(t.name, talentRecord.id);
        await db.insert(cruiseTalent2).values({
          cruiseId: cruise.id,
          talentId: talentRecord.id,
          role: t.cat === "Broadway" ? "Headliner" : t.cat === "Drag" ? "Special Guest" : t.cat === "Comedy" ? "Host" : "Performer"
        });
        newTalentCount++;
      }
    }
    console.log(`\u2705 Talent check complete. Added ${newTalentCount} new performers.`);
    console.log("\u{1F5FA}\uFE0F Checking itinerary data...");
    const existingItinerary = await db.select().from(itinerary2).where(eq4(itinerary2.cruiseId, cruise.id));
    const existingPorts = existingItinerary.map((i) => `${i.date?.toISOString().split("T")[0]}-${i.portName}`);
    let newItineraryCount = 0;
    for (let index2 = 0; index2 < ITINERARY.length; index2++) {
      const stop = ITINERARY[index2];
      const [year, month, day] = stop.key.split("-").map(Number);
      const stopDate = new Date(year, month - 1, day);
      const stopKey = `${stopDate.toISOString().split("T")[0]}-${stop.port}`;
      if (!existingPorts.includes(stopKey)) {
        console.log(`\u2795 Adding new itinerary stop: ${stop.port} on ${stop.key}`);
        const dayNumber = index2 + 1;
        let allAboardTime = "";
        if (stop.depart && stop.depart !== "\u2014" && stop.depart !== "Overnight") {
          allAboardTime = stop.depart;
        }
        await db.insert(itinerary2).values({
          cruiseId: cruise.id,
          date: stopDate,
          day: dayNumber,
          portName: stop.port,
          country: "",
          // We'll derive this from port name if needed
          arrivalTime: stop.arrive === "\u2014" ? "" : stop.arrive,
          departureTime: stop.depart === "\u2014" ? "" : stop.depart,
          allAboardTime,
          description: stop.port.includes("Sea") ? "Enjoy a relaxing day at sea with all the ship amenities and Atlantis activities." : "",
          orderIndex: index2
        });
        newItineraryCount++;
      }
    }
    console.log(`\u2705 Itinerary check complete. Added ${newItineraryCount} new stops.`);
    console.log("\u{1F389} Checking events data...");
    const existingEvents = await db.select().from(events2).where(eq4(events2.cruiseId, cruise.id));
    const existingEventKeys = existingEvents.map(
      (e) => `${e.date?.toISOString().split("T")[0]}-${e.time}-${e.title}`
    );
    let newEventCount = 0;
    for (const daily of DAILY) {
      const [year, month, day] = daily.key.split("-").map(Number);
      const eventDate = new Date(year, month - 1, day);
      for (const item of daily.items) {
        const eventKey = `${eventDate.toISOString().split("T")[0]}-${item.time}-${item.title}`;
        if (!existingEventKeys.includes(eventKey)) {
          console.log(`\u2795 Adding new event: ${item.title} on ${daily.key}`);
          const talentIds = [];
          for (const [talentName, talentId] of Array.from(talentMap.entries())) {
            if (item.title.toLowerCase().includes(talentName.toLowerCase()) || talentName === "The Diva (Bingo)" && item.title.toLowerCase().includes("bingo")) {
              talentIds.push(talentId);
            }
          }
          let themeDesc = null;
          if (item.type === "party" || item.type === "after") {
            const theme = PARTY_THEMES.find((p) => item.title.includes(p.key));
            themeDesc = theme?.desc || null;
          }
          await db.insert(events2).values({
            cruiseId: cruise.id,
            date: eventDate,
            time: item.time,
            title: item.title,
            type: item.type,
            venue: item.venue,
            description: themeDesc,
            shortDescription: themeDesc ? themeDesc.length > 100 ? themeDesc.substring(0, 100) + "..." : themeDesc : null,
            talentIds: talentIds.length > 0 ? talentIds : null,
            requiresReservation: item.venue === "The Manor" || item.venue === "Pink Agave"
          });
          newEventCount++;
        }
      }
    }
    console.log(`\u2705 Events check complete. Added ${newEventCount} new events.`);
    console.log("\u{1F3AF} Production seeding completed successfully!");
    console.log(`\u{1F4CA} Summary:`);
    console.log(`   - Cruise: ${cruise.name} (${cruise.status})`);
    console.log(`   - New talent added: ${newTalentCount}`);
    console.log(`   - New itinerary stops: ${newItineraryCount}`);
    console.log(`   - New events added: ${newEventCount}`);
  } catch (error) {
    console.error("\u274C Error in production seeding:", error);
    throw error;
  }
}
var init_production_seed = __esm({
  "server/production-seed.ts"() {
    "use strict";
    init_storage();
    init_cruise_data();
    if (import.meta.url === new URL(process.argv[1], "file://").href) {
      seedProduction().then(() => {
        console.log("\u2705 Production seeding completed");
        process.exit(0);
      }).catch((error) => {
        console.error("\u274C Production seeding failed:", error);
        process.exit(1);
      });
    }
  }
});

// server/index.ts
import express3 from "express";
import cookieParser from "cookie-parser";

// server/routes.ts
init_storage();
import express from "express";
import { createServer } from "http";

// server/auth.ts
init_storage();
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
var requireSuperAdmin = requireRole(["super_admin"]);
var requireCruiseAdmin = requireRole(["super_admin", "cruise_admin"]);
var requireContentEditor = requireRole(["super_admin", "cruise_admin", "content_editor"]);
var requireMediaManager = requireRole(["super_admin", "cruise_admin", "content_editor", "media_manager"]);

// server/auth-routes.ts
init_storage();
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
      const userResults = await db.select().from(users).where(eq2(users.username, username)).limit(1);
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
      await db.update(users).set({ lastLogin: /* @__PURE__ */ new Date() }).where(eq2(users.id, user.id));
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
      const userResults = await db.select().from(users).where(eq2(users.id, payload.userId)).limit(1);
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
      const userResults = await db.select().from(users).where(eq2(users.id, payload.userId)).limit(1);
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
      const userResults = await db.select().from(users).where(eq2(users.id, payload.userId)).limit(1);
      const currentUser = userResults[0];
      if (!currentUser || currentUser?.role !== "super_admin") {
        return res.status(403).json({ error: "Only super admins can create users" });
      }
      const allowedRoles = ["viewer", "media_manager", "content_editor", "cruise_admin", "super_admin"];
      const userData = req.body;
      if (!userData.username || !userData.password) {
        return res.status(400).json({ error: "Username and password are required" });
      }
      if (userData.role && !allowedRoles.includes(userData.role)) {
        return res.status(400).json({ error: "Invalid role specified" });
      }
      const validatedData = insertUserSchema.parse(userData);
      const hashedPassword = await AuthService.hashPassword(validatedData.password);
      const newUsers = await db.insert(users).values({
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
      const userResults = await db.select().from(users).where(eq2(users.id, payload.userId)).limit(1);
      const currentUser = userResults[0];
      if (!currentUser || currentUser?.role !== "super_admin") {
        return res.status(403).json({ error: "Only super admins can view users" });
      }
      const allUsers = await db.select({
        id: users.id,
        username: users.username,
        email: users.email,
        fullName: users.fullName,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
        lastLogin: users.lastLogin
      }).from(users).orderBy(users.createdAt);
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
      const userResults = await db.select().from(users).where(eq2(users.id, payload.userId)).limit(1);
      const currentUser = userResults[0];
      if (!currentUser || currentUser?.role !== "super_admin") {
        return res.status(403).json({ error: "Only super admins can update users" });
      }
      const updateData = req.body;
      const allowedRoles = ["viewer", "media_manager", "content_editor", "cruise_admin", "super_admin"];
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
      const updatedUsers = await db.update(users).set({
        ...filteredUpdateData,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq2(users.id, userId)).returning();
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
      const userResults = await db.select().from(users).where(eq2(users.id, payload.userId)).limit(1);
      const currentUser = userResults[0];
      if (!currentUser || currentUser?.role !== "super_admin") {
        return res.status(403).json({ error: "Only super admins can delete users" });
      }
      if (userId === payload.userId) {
        return res.status(400).json({ error: "Cannot delete your own account" });
      }
      const deletedUsers = await db.delete(users).where(eq2(users.id, userId)).returning();
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
      const userResults = await db.select().from(users).where(eq2(users.email, email)).limit(1);
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
      await db.update(users).set({
        password: hashedPassword,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq2(users.id, resetToken.userId));
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
init_storage();
init_schema();
import { eq as eq3, ilike as ilike2, or as or2 } from "drizzle-orm";
import { z as z2 } from "zod";

// server/image-utils.ts
import multer from "multer";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
var storage4 = multer.diskStorage({
  destination: (req, file, cb) => {
    const imageType = req.body.imageType || "general";
    let directory;
    switch (imageType) {
      case "talent":
        directory = "server/public/talent-images";
        break;
      case "event":
        directory = "server/public/event-images";
        break;
      case "itinerary":
        directory = "server/public/itinerary-images";
        break;
      case "cruise":
        directory = "server/public/cruise-images";
        break;
      default:
        directory = "server/public/uploads";
    }
    cb(null, directory);
  },
  filename: (req, file, cb) => {
    const imageType = req.body.imageType || "general";
    const timestamp2 = Date.now();
    const uniqueId = randomUUID().substring(0, 8);
    const extension = path.extname(file.originalname).toLowerCase();
    const filename = `${imageType}-${timestamp2}-${uniqueId}${extension}`;
    cb(null, filename);
  }
});
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
var upload = multer({
  storage: storage4,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024
    // 10MB limit
  }
});
function getPublicImageUrl(imageType, filename) {
  switch (imageType) {
    case "talent":
      return `/talent-images/${filename}`;
    case "event":
      return `/event-images/${filename}`;
    case "itinerary":
      return `/itinerary-images/${filename}`;
    case "cruise":
      return `/cruise-images/${filename}`;
    default:
      return `/uploads/${filename}`;
  }
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

// server/image-migration.ts
init_storage();
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
  const talent3 = await talentStorage.getAllTalent();
  for (const t of talent3) {
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
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateAllImages().then(() => {
    console.log("Migration finished successfully");
    process.exit(0);
  }).catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
}

// server/routes.ts
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
  app2.post("/api/images/upload/:type", requireContentEditor, (req, res, next) => {
    const imageType = req.params.type;
    if (!["talent", "event", "itinerary", "cruise"].includes(imageType)) {
      return res.status(400).json({ error: "Invalid image type. Must be one of: talent, event, itinerary, cruise" });
    }
    req.body.imageType = imageType;
    next();
  }, upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }
      const imageType = req.params.type;
      const publicUrl = getPublicImageUrl(imageType, req.file.filename);
      res.json({
        success: true,
        imageUrl: publicUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size
      });
    } catch (error) {
      console.error("Image upload error:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  });
  app2.post("/api/images/download-from-url", requireContentEditor, async (req, res) => {
    try {
      const { url, imageType, name } = req.body;
      if (!url || !isValidImageUrl(url)) {
        return res.status(400).json({ error: "Invalid URL provided" });
      }
      if (!["talent", "event", "itinerary", "cruise"].includes(imageType)) {
        return res.status(400).json({ error: "Invalid image type. Must be one of: talent, event, itinerary, cruise" });
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
      const cruises3 = await cruiseStorage.getAllCruises();
      res.json(cruises3);
    } catch (error) {
      console.error("Error fetching cruises:", error);
      res.status(500).json({ error: "Failed to fetch cruises" });
    }
  });
  app2.get("/api/cruises/upcoming", async (req, res) => {
    try {
      const cruises3 = await cruiseStorage.getUpcomingCruises();
      res.json(cruises3);
    } catch (error) {
      console.error("Error fetching upcoming cruises:", error);
      res.status(500).json({ error: "Failed to fetch upcoming cruises" });
    }
  });
  app2.get("/api/cruises/past", async (req, res) => {
    try {
      const cruises3 = await cruiseStorage.getPastCruises();
      res.json(cruises3);
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
  app2.get("/api/cruises/:cruiseId/itinerary", async (req, res) => {
    try {
      const itinerary3 = await itineraryStorage.getItineraryByCruise(parseInt(req.params.cruiseId));
      res.json(itinerary3);
    } catch (error) {
      console.error("Error fetching itinerary:", error);
      res.status(500).json({ error: "Failed to fetch itinerary" });
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
      const events3 = await eventStorage.getEventsByCruise(parseInt(req.params.cruiseId));
      res.json(events3);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });
  app2.get("/api/cruises/:cruiseId/events/date/:date", async (req, res) => {
    try {
      const date = new Date(req.params.date);
      const events3 = await eventStorage.getEventsByDate(parseInt(req.params.cruiseId), date);
      res.json(events3);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });
  app2.get("/api/cruises/:cruiseId/events/type/:type", async (req, res) => {
    try {
      const events3 = await eventStorage.getEventsByType(parseInt(req.params.cruiseId), req.params.type);
      res.json(events3);
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
      const talent3 = await talentStorage.searchTalent(search, performanceType);
      res.json(talent3);
    } catch (error) {
      console.error("Error fetching talent:", error);
      res.status(500).json({ error: "Failed to fetch talent" });
    }
  });
  app2.get("/api/talent/:id", async (req, res) => {
    try {
      const talent3 = await talentStorage.getTalentById(parseInt(req.params.id));
      if (!talent3) {
        return res.status(404).json({ error: "Talent not found" });
      }
      res.json(talent3);
    } catch (error) {
      console.error("Error fetching talent:", error);
      res.status(500).json({ error: "Failed to fetch talent" });
    }
  });
  app2.get("/api/cruises/:cruiseId/talent", async (req, res) => {
    try {
      const talent3 = await talentStorage.getTalentByCruise(parseInt(req.params.cruiseId));
      res.json(talent3);
    } catch (error) {
      console.error("Error fetching cruise talent:", error);
      res.status(500).json({ error: "Failed to fetch cruise talent" });
    }
  });
  app2.post("/api/talent", requireAuth, requireContentEditor, async (req, res) => {
    try {
      const talent3 = await talentStorage.createTalent(req.body);
      res.status(201).json(talent3);
    } catch (error) {
      console.error("Error creating talent:", error);
      res.status(500).json({ error: "Failed to create talent" });
    }
  });
  app2.put("/api/talent/:id", requireAuth, requireContentEditor, async (req, res) => {
    try {
      const talent3 = await talentStorage.updateTalent(parseInt(req.params.id), req.body);
      if (!talent3) {
        return res.status(404).json({ error: "Talent not found" });
      }
      res.json(talent3);
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
      const media3 = await mediaStorage.getMediaByType(req.params.type);
      res.json(media3);
    } catch (error) {
      console.error("Error fetching media:", error);
      res.status(500).json({ error: "Failed to fetch media" });
    }
  });
  app2.get("/api/media/:associatedType/:associatedId", async (req, res) => {
    try {
      const media3 = await mediaStorage.getMediaByAssociation(
        req.params.associatedType,
        parseInt(req.params.associatedId)
      );
      res.json(media3);
    } catch (error) {
      console.error("Error fetching media:", error);
      res.status(500).json({ error: "Failed to fetch media" });
    }
  });
  app2.post("/api/media", requireAuth, requireContentEditor, async (req, res) => {
    try {
      const media3 = await mediaStorage.createMedia(req.body);
      res.status(201).json(media3);
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
      const [itinerary3, events3, talent3] = await Promise.all([
        itineraryStorage.getItineraryByCruise(cruise.id),
        eventStorage.getEventsByCruise(cruise.id),
        talentStorage.getTalentByCruise(cruise.id)
      ]);
      res.json({
        cruise,
        itinerary: itinerary3,
        events: events3,
        talent: talent3
      });
    } catch (error) {
      console.error("Error fetching complete cruise data:", error);
      res.status(500).json({ error: "Failed to fetch cruise data" });
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
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express2 from "express";
import fs3 from "fs";
import path4 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path3 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path3.resolve(import.meta.dirname, "client", "src"),
      "@shared": path3.resolve(import.meta.dirname, "shared"),
      "@assets": path3.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path3.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path3.resolve(import.meta.dirname, "dist/public"),
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
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path4.resolve(
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
  const distPath = path4.resolve(import.meta.dirname, "public");
  if (!fs3.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express2.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path4.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express3();
app.use(express3.json());
app.use(express3.urlencoded({ extended: false }));
app.use(cookieParser());
app.use((req, res, next) => {
  const start = Date.now();
  const path5 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path5.startsWith("/api")) {
      let logLine = `${req.method} ${path5} ${res.statusCode} in ${duration}ms`;
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
app.get("/healthz", (req, res) => {
  res.status(200).send("OK");
});
app.head("/healthz", (req, res) => {
  res.status(200).end();
});
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});
app.head("/health", (req, res) => {
  res.status(200).end();
});
app.get("/api/health", (req, res) => {
  res.status(200).send("OK");
});
app.head("/api/health", (req, res) => {
  res.status(200).end();
});
app.get("/", (req, res, next) => {
  const userAgent = req.headers["user-agent"] || "";
  const acceptHeader = req.headers.accept || "";
  const isHealthCheck = userAgent.includes("HealthChecker") || userAgent.includes("kube-probe") || userAgent.includes("curl") || userAgent.includes("wget") || userAgent.startsWith("Go-http-client") || acceptHeader === "*/*" || acceptHeader === "" || !acceptHeader;
  if (isHealthCheck) {
    return res.status(200).send("OK");
  }
  next();
});
app.head("/", (req, res) => {
  res.status(200).end();
});
(async () => {
  const server = await registerRoutes(app);
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
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
    if (process.env.NODE_ENV === "production") {
      log("Production environment detected - starting background seeding...");
      setTimeout(async () => {
        try {
          log("Starting production database seeding...");
          const module = await Promise.resolve().then(() => (init_production_seed(), production_seed_exports));
          if (module.seedProduction) {
            await module.seedProduction();
            log("\u2705 Production seeding completed successfully");
          }
        } catch (error) {
          console.error("\u274C Production seeding failed:", error);
          console.error("Server will continue running without seeded data");
        }
      }, 100);
    }
  });
})();
