var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express3 from "express";
import cookieParser from "cookie-parser";

// server/routes.ts
import express from "express";
import { createServer } from "http";

// server/storage.ts
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, and, desc, asc, ilike, or } from "drizzle-orm";

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
var users = pgTable("users", {
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
var passwordResetTokens = pgTable("password_reset_tokens", {
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
var cruises = pgTable("cruises", {
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
var itinerary = pgTable("itinerary", {
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
var events = pgTable("events", {
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
var talent = pgTable("talent", {
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
var cruiseTalent = pgTable("cruise_talent", {
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
var media = pgTable("media", {
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
var userCruises = pgTable("user_cruises", {
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
var partyTemplates = pgTable("party_templates", {
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
var cruiseInfoSections = pgTable("cruise_info_sections", {
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
var aiJobs = pgTable("ai_jobs", {
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
var aiDrafts = pgTable("ai_drafts", {
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
var auditLog = pgTable("audit_log", {
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
var cruisesRelations = relations(cruises, ({ many, one }) => ({
  itinerary: many(itinerary),
  events: many(events),
  cruiseTalent: many(cruiseTalent),
  userCruises: many(userCruises),
  creator: one(users, {
    fields: [cruises.createdBy],
    references: [users.id]
  })
}));
var itineraryRelations = relations(itinerary, ({ one }) => ({
  cruise: one(cruises, {
    fields: [itinerary.cruiseId],
    references: [cruises.id]
  })
}));
var eventsRelations = relations(events, ({ one }) => ({
  cruise: one(cruises, {
    fields: [events.cruiseId],
    references: [cruises.id]
  })
}));
var talentRelations = relations(talent, ({ many }) => ({
  cruiseTalent: many(cruiseTalent)
}));
var cruiseTalentRelations = relations(cruiseTalent, ({ one }) => ({
  cruise: one(cruises, {
    fields: [cruiseTalent.cruiseId],
    references: [cruises.id]
  }),
  talent: one(talent, {
    fields: [cruiseTalent.talentId],
    references: [talent.id]
  })
}));
var userCruisesRelations = relations(userCruises, ({ one }) => ({
  user: one(users, {
    fields: [userCruises.userId],
    references: [users.id]
  }),
  cruise: one(cruises, {
    fields: [userCruises.cruiseId],
    references: [cruises.id]
  })
}));
var partyTemplatesRelations = relations(partyTemplates, ({ one }) => ({
  creator: one(users, {
    fields: [partyTemplates.createdBy],
    references: [users.id]
  })
}));
var cruiseInfoSectionsRelations = relations(cruiseInfoSections, ({ one }) => ({
  cruise: one(cruises, {
    fields: [cruiseInfoSections.cruiseId],
    references: [cruises.id]
  }),
  updater: one(users, {
    fields: [cruiseInfoSections.updatedBy],
    references: [users.id]
  })
}));
var aiJobsRelations = relations(aiJobs, ({ one, many }) => ({
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
var aiDraftsRelations = relations(aiDrafts, ({ one }) => ({
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
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
  role: true
});
var insertCruiseSchema = createInsertSchema(cruises).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertItinerarySchema = createInsertSchema(itinerary).omit({
  id: true
});
var insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertTalentSchema = createInsertSchema(talent).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertMediaSchema = createInsertSchema(media).omit({
  id: true,
  uploadedAt: true
});
var insertPartyTemplateSchema = createInsertSchema(partyTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertCruiseInfoSectionSchema = createInsertSchema(cruiseInfoSections).omit({
  id: true,
  updatedAt: true
});
var insertAiJobSchema = createInsertSchema(aiJobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertAiDraftSchema = createInsertSchema(aiDrafts).omit({
  id: true,
  createdAt: true
});

// server/storage.ts
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set, ensure the database is provisioned");
}
var queryClient = neon(process.env.DATABASE_URL);
var db = drizzle(queryClient, { schema: schema_exports });
var {
  users: users2,
  cruises: cruises2,
  itinerary: itinerary2,
  events: events2,
  talent: talent2,
  cruiseTalent: cruiseTalent2,
  media: media2,
  userCruises: userCruises2,
  auditLog: auditLog2
} = schema_exports;
var UserStorage = class {
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
var CruiseStorage = class {
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
var ItineraryStorage = class {
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
var EventStorage = class {
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
var TalentStorage = class {
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
var MediaStorage = class {
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
var storage = new UserStorage();
var cruiseStorage = new CruiseStorage();
var itineraryStorage = new ItineraryStorage();
var eventStorage = new EventStorage();
var talentStorage = new TalentStorage();
var mediaStorage = new MediaStorage();

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
var requireSuperAdmin = requireRole(["super_admin"]);
var requireCruiseAdmin = requireRole(["super_admin", "cruise_admin"]);
var requireContentEditor = requireRole(["super_admin", "cruise_admin", "content_editor"]);
var requireMediaManager = requireRole(["super_admin", "cruise_admin", "content_editor", "media_manager"]);

// server/auth-routes.ts
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
} else if (process.env.NODE_ENV === "production" && process.env.RUN_MIGRATIONS === "true") {
  migrateAllImages().then(() => {
    console.log("Migration finished successfully");
  }).catch((error) => {
    console.error("Migration failed:", error);
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
app.get("/healthz", (req, res) => {
  req.setTimeout(5e3);
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("OK");
});
app.head("/healthz", (req, res) => {
  res.writeHead(200);
  res.end();
});
app.get("/", (req, res) => {
  req.setTimeout(5e3);
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("OK");
});
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
  server.listen(port, "0.0.0.0", async () => {
    log(`\u2705 Server ready and listening on port ${port}`);
    try {
    } catch (error) {
      console.error("Migration failed:", error);
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
