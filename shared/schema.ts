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
  index
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// ============ USERS TABLE (existing) ============
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").unique(),
  fullName: text("full_name"),
  role: text("role").default("viewer"), // super_admin, cruise_admin, content_editor, media_manager, viewer
  createdAt: timestamp("created_at").defaultNow(),
  lastLogin: timestamp("last_login"),
  isActive: boolean("is_active").default(true),
});

// ============ CRUISES TABLE ============
export const cruises = pgTable("cruises", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  shipName: text("ship_name").notNull(),
  cruiseLine: text("cruise_line"), // Virgin, Celebrity, etc.
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: text("status").default("upcoming"), // upcoming, ongoing, past
  heroImageUrl: text("hero_image_url"),
  description: text("description"),
  highlights: jsonb("highlights"), // Array of highlight strings
  includesInfo: jsonb("includes_info"), // What's included in the cruise
  pricing: jsonb("pricing"), // Pricing tiers and info
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  statusIdx: index("cruise_status_idx").on(table.status),
  slugIdx: index("cruise_slug_idx").on(table.slug),
}));

// ============ ITINERARY TABLE ============
export const itinerary = pgTable("itinerary", {
  id: serial("id").primaryKey(),
  cruiseId: integer("cruise_id").notNull().references(() => cruises.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  day: integer("day").notNull(), // Day number of cruise (1, 2, 3, etc.)
  portName: text("port_name").notNull(),
  country: text("country"),
  arrivalTime: text("arrival_time"), // Stored as text for flexibility (e.g., "08:00", "—")
  departureTime: text("departure_time"),
  allAboardTime: text("all_aboard_time"),
  portImageUrl: text("port_image_url"),
  description: text("description"),
  highlights: jsonb("highlights"), // Port highlights
  orderIndex: integer("order_index").notNull(), // For sorting
  segment: text("segment").default("main"), // pre, main, post
}, (table) => ({
  cruiseIdx: index("itinerary_cruise_idx").on(table.cruiseId),
  dateIdx: index("itinerary_date_idx").on(table.date),
}));

// ============ EVENTS TABLE ============
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  cruiseId: integer("cruise_id").notNull().references(() => cruises.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  time: text("time").notNull(), // "14:00", "21:30", etc.
  title: text("title").notNull(),
  type: text("type").notNull(), // party, show, dining, lounge, fun, club, after
  venue: text("venue").notNull(),
  deck: text("deck"),
  description: text("description"),
  shortDescription: text("short_description"),
  imageUrl: text("image_url"),
  themeDescription: text("theme_description"), // For parties
  dressCode: text("dress_code"),
  capacity: integer("capacity"),
  requiresReservation: boolean("requires_reservation").default(false),
  talentIds: jsonb("talent_ids"), // Array of talent IDs
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  cruiseIdx: index("events_cruise_idx").on(table.cruiseId),
  dateIdx: index("events_date_idx").on(table.date),
  typeIdx: index("events_type_idx").on(table.type),
}));

// ============ TALENT TABLE ============
export const talent = pgTable("talent", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // Broadway, Drag, Comedy, Music, etc.
  bio: text("bio"),
  knownFor: text("known_for"),
  profileImageUrl: text("profile_image_url"),
  socialLinks: jsonb("social_links"), // {instagram: "", twitter: "", etc.}
  website: text("website"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  nameIdx: index("talent_name_idx").on(table.name),
  categoryIdx: index("talent_category_idx").on(table.category),
}));

// ============ CRUISE_TALENT JUNCTION TABLE ============
export const cruiseTalent = pgTable("cruise_talent", {
  cruiseId: integer("cruise_id").notNull().references(() => cruises.id, { onDelete: "cascade" }),
  talentId: integer("talent_id").notNull().references(() => talent.id, { onDelete: "cascade" }),
  role: text("role"), // Headliner, Special Guest, Host, etc.
  performanceCount: integer("performance_count"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.cruiseId, table.talentId] }),
  cruiseIdx: index("cruise_talent_cruise_idx").on(table.cruiseId),
  talentIdx: index("cruise_talent_talent_idx").on(table.talentId),
}));

// ============ MEDIA TABLE ============
export const media = pgTable("media", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  type: text("type").notNull(), // port, party, talent, cruise, event, gallery
  associatedType: text("associated_type"), // cruise, event, talent, itinerary
  associatedId: integer("associated_id"),
  caption: text("caption"),
  altText: text("alt_text"),
  credits: text("credits"), // Photographer/source credits
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  metadata: jsonb("metadata"), // Additional metadata like dimensions, file size, etc.
}, (table) => ({
  typeIdx: index("media_type_idx").on(table.type),
  associatedIdx: index("media_associated_idx").on(table.associatedType, table.associatedId),
}));

// ============ USER_CRUISES TABLE (for permissions) ============
export const userCruises = pgTable("user_cruises", {
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  cruiseId: integer("cruise_id").notNull().references(() => cruises.id, { onDelete: "cascade" }),
  permissionLevel: text("permission_level").notNull(), // admin, editor, viewer
  assignedBy: varchar("assigned_by").references(() => users.id),
  assignedAt: timestamp("assigned_at").defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.cruiseId] }),
  userIdx: index("user_cruises_user_idx").on(table.userId),
  cruiseIdx: index("user_cruises_cruise_idx").on(table.cruiseId),
}));

// ============ PARTY TEMPLATES TABLE ============
export const partyTemplates = pgTable("party_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  themeDescription: text("theme_description"),
  dressCode: text("dress_code"),
  defaultImageUrl: text("default_image_url"),
  tags: jsonb("tags"), // Array of tags for searching
  defaults: jsonb("defaults"), // Default values for events using this template
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  nameIdx: index("party_templates_name_idx").on(table.name),
}));

// ============ CRUISE INFO SECTIONS TABLE ============
export const cruiseInfoSections = pgTable("cruise_info_sections", {
  id: serial("id").primaryKey(),
  cruiseId: integer("cruise_id").notNull().references(() => cruises.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content"), // Rich text content
  orderIndex: integer("order_index").notNull(),
  updatedBy: varchar("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  cruiseIdx: index("cruise_info_cruise_idx").on(table.cruiseId),
  orderIdx: index("cruise_info_order_idx").on(table.cruiseId, table.orderIndex),
}));

// ============ AI JOBS TABLE ============
export const aiJobs = pgTable("ai_jobs", {
  id: serial("id").primaryKey(),
  cruiseId: integer("cruise_id").notNull().references(() => cruises.id, { onDelete: "cascade" }),
  sourceType: text("source_type").notNull(), // pdf, url
  sourceRef: text("source_ref").notNull(), // URL or file path
  task: text("task").notNull(), // extract
  status: text("status").default("queued"), // queued, processing, completed, failed
  result: jsonb("result"), // Extracted data
  error: text("error"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  cruiseIdx: index("ai_jobs_cruise_idx").on(table.cruiseId),
  statusIdx: index("ai_jobs_status_idx").on(table.status),
}));

// ============ AI DRAFTS TABLE ============
export const aiDrafts = pgTable("ai_drafts", {
  id: serial("id").primaryKey(),
  cruiseId: integer("cruise_id").notNull().references(() => cruises.id, { onDelete: "cascade" }),
  draftType: text("draft_type").notNull(), // itinerary, events, info
  payload: jsonb("payload").notNull(), // Draft data to be reviewed
  createdFromJobId: integer("created_from_job_id").references(() => aiJobs.id),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  cruiseIdx: index("ai_drafts_cruise_idx").on(table.cruiseId),
  typeIdx: index("ai_drafts_type_idx").on(table.draftType),
}));

// ============ AUDIT_LOG TABLE ============
export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  action: text("action").notNull(), // create, update, delete
  tableName: text("table_name").notNull(),
  recordId: text("record_id"),
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  timestamp: timestamp("timestamp").defaultNow(),
  ipAddress: text("ip_address"),
}, (table) => ({
  userIdx: index("audit_user_idx").on(table.userId),
  timestampIdx: index("audit_timestamp_idx").on(table.timestamp),
}));

// ============ RELATIONS ============
export const cruisesRelations = relations(cruises, ({ many, one }) => ({
  itinerary: many(itinerary),
  events: many(events),
  cruiseTalent: many(cruiseTalent),
  userCruises: many(userCruises),
  creator: one(users, {
    fields: [cruises.createdBy],
    references: [users.id],
  }),
}));

export const itineraryRelations = relations(itinerary, ({ one }) => ({
  cruise: one(cruises, {
    fields: [itinerary.cruiseId],
    references: [cruises.id],
  }),
}));

export const eventsRelations = relations(events, ({ one }) => ({
  cruise: one(cruises, {
    fields: [events.cruiseId],
    references: [cruises.id],
  }),
}));

export const talentRelations = relations(talent, ({ many }) => ({
  cruiseTalent: many(cruiseTalent),
}));

export const cruiseTalentRelations = relations(cruiseTalent, ({ one }) => ({
  cruise: one(cruises, {
    fields: [cruiseTalent.cruiseId],
    references: [cruises.id],
  }),
  talent: one(talent, {
    fields: [cruiseTalent.talentId],
    references: [talent.id],
  }),
}));

export const userCruisesRelations = relations(userCruises, ({ one }) => ({
  user: one(users, {
    fields: [userCruises.userId],
    references: [users.id],
  }),
  cruise: one(cruises, {
    fields: [userCruises.cruiseId],
    references: [cruises.id],
  }),
}));

export const partyTemplatesRelations = relations(partyTemplates, ({ one }) => ({
  creator: one(users, {
    fields: [partyTemplates.createdBy],
    references: [users.id],
  }),
}));

export const cruiseInfoSectionsRelations = relations(cruiseInfoSections, ({ one }) => ({
  cruise: one(cruises, {
    fields: [cruiseInfoSections.cruiseId],
    references: [cruises.id],
  }),
  updater: one(users, {
    fields: [cruiseInfoSections.updatedBy],
    references: [users.id],
  }),
}));

export const aiJobsRelations = relations(aiJobs, ({ one, many }) => ({
  cruise: one(cruises, {
    fields: [aiJobs.cruiseId],
    references: [cruises.id],
  }),
  creator: one(users, {
    fields: [aiJobs.createdBy],
    references: [users.id],
  }),
  drafts: many(aiDrafts),
}));

export const aiDraftsRelations = relations(aiDrafts, ({ one }) => ({
  cruise: one(cruises, {
    fields: [aiDrafts.cruiseId],
    references: [cruises.id],
  }),
  job: one(aiJobs, {
    fields: [aiDrafts.createdFromJobId],
    references: [aiJobs.id],
  }),
  creator: one(users, {
    fields: [aiDrafts.createdBy],
    references: [users.id],
  }),
}));

// ============ INSERT SCHEMAS ============
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
  role: true,
});

export const insertCruiseSchema = createInsertSchema(cruises).omit({
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

export const insertTalentSchema = createInsertSchema(talent).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMediaSchema = createInsertSchema(media).omit({
  id: true,
  uploadedAt: true,
});

export const insertPartyTemplateSchema = createInsertSchema(partyTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCruiseInfoSectionSchema = createInsertSchema(cruiseInfoSections).omit({
  id: true,
  updatedAt: true,
});

export const insertAiJobSchema = createInsertSchema(aiJobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAiDraftSchema = createInsertSchema(aiDrafts).omit({
  id: true,
  createdAt: true,
});

// ============ TYPE EXPORTS ============
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Cruise = typeof cruises.$inferSelect;
export type Itinerary = typeof itinerary.$inferSelect;
export type Event = typeof events.$inferSelect;
export type Talent = typeof talent.$inferSelect;
export type Media = typeof media.$inferSelect;
export type UserCruise = typeof userCruises.$inferSelect;
export type AuditLog = typeof auditLog.$inferSelect;
export type PartyTemplate = typeof partyTemplates.$inferSelect;
export type CruiseInfoSection = typeof cruiseInfoSections.$inferSelect;
export type AiJob = typeof aiJobs.$inferSelect;
export type AiDraft = typeof aiDrafts.$inferSelect;