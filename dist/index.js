var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, and, desc, asc } from "drizzle-orm";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  auditLog: () => auditLog,
  cruiseTalent: () => cruiseTalent,
  cruiseTalentRelations: () => cruiseTalentRelations,
  cruises: () => cruises,
  cruisesRelations: () => cruisesRelations,
  events: () => events,
  eventsRelations: () => eventsRelations,
  insertCruiseSchema: () => insertCruiseSchema,
  insertEventSchema: () => insertEventSchema,
  insertItinerarySchema: () => insertItinerarySchema,
  insertMediaSchema: () => insertMediaSchema,
  insertTalentSchema: () => insertTalentSchema,
  insertUserSchema: () => insertUserSchema,
  itinerary: () => itinerary,
  itineraryRelations: () => itineraryRelations,
  media: () => media,
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
  lastLogin: timestamp("last_login"),
  isActive: boolean("is_active").default(true)
});
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
  orderIndex: integer("order_index").notNull()
  // For sorting
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
    const result = await db.insert(cruises2).values(cruise).returning();
    return result[0];
  }
  async updateCruise(id, cruise) {
    const result = await db.update(cruises2).set({ ...cruise, updatedAt: /* @__PURE__ */ new Date() }).where(eq(cruises2.id, id)).returning();
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
    const result = await db.insert(itinerary2).values(stop).returning();
    return result[0];
  }
  async updateItineraryStop(id, stop) {
    const result = await db.update(itinerary2).set(stop).where(eq(itinerary2.id, id)).returning();
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

// server/routes.ts
async function registerRoutes(app2) {
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
  app2.post("/api/cruises", async (req, res) => {
    try {
      const cruise = await cruiseStorage.createCruise(req.body);
      res.status(201).json(cruise);
    } catch (error) {
      console.error("Error creating cruise:", error);
      res.status(500).json({ error: "Failed to create cruise" });
    }
  });
  app2.put("/api/cruises/:id", async (req, res) => {
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
  app2.delete("/api/cruises/:id", async (req, res) => {
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
  app2.post("/api/cruises/:cruiseId/itinerary", async (req, res) => {
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
  app2.put("/api/itinerary/:id", async (req, res) => {
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
  app2.delete("/api/itinerary/:id", async (req, res) => {
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
  app2.post("/api/cruises/:cruiseId/events", async (req, res) => {
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
  app2.put("/api/events/:id", async (req, res) => {
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
  app2.delete("/api/events/:id", async (req, res) => {
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
      const talent3 = await talentStorage.getAllTalent();
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
  app2.post("/api/talent", async (req, res) => {
    try {
      const talent3 = await talentStorage.createTalent(req.body);
      res.status(201).json(talent3);
    } catch (error) {
      console.error("Error creating talent:", error);
      res.status(500).json({ error: "Failed to create talent" });
    }
  });
  app2.put("/api/talent/:id", async (req, res) => {
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
  app2.delete("/api/talent/:id", async (req, res) => {
    try {
      await talentStorage.deleteTalent(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting talent:", error);
      res.status(500).json({ error: "Failed to delete talent" });
    }
  });
  app2.post("/api/cruises/:cruiseId/talent/:talentId", async (req, res) => {
    try {
      await talentStorage.assignTalentToCruise(
        parseInt(req.params.cruiseId),
        parseInt(req.params.talentId),
        req.body.role
      );
      res.status(201).json({ message: "Talent assigned to cruise" });
    } catch (error) {
      console.error("Error assigning talent:", error);
      res.status(500).json({ error: "Failed to assign talent" });
    }
  });
  app2.delete("/api/cruises/:cruiseId/talent/:talentId", async (req, res) => {
    try {
      await talentStorage.removeTalentFromCruise(
        parseInt(req.params.cruiseId),
        parseInt(req.params.talentId)
      );
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
  app2.post("/api/media", async (req, res) => {
    try {
      const media3 = await mediaStorage.createMedia(req.body);
      res.status(201).json(media3);
    } catch (error) {
      console.error("Error creating media:", error);
      res.status(500).json({ error: "Failed to create media" });
    }
  });
  app2.delete("/api/media/:id", async (req, res) => {
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
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
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
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
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
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
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
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
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
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
