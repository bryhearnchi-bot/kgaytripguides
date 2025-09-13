import { sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  real,
  primaryKey,
  index
} from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// ============ USERS TABLE ============
export const users = sqliteTable("users", {
  id: text("id").primaryKey().default(sql`lower(hex(randomblob(16)))`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").unique(),
  fullName: text("full_name"),
  role: text("role").default("viewer"),
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  lastLogin: integer("last_login", { mode: 'timestamp' }),
  isActive: integer("is_active", { mode: 'boolean' }).default(1),
});

// ============ TRIPS TABLE ============
export const trips = sqliteTable("trips", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  shortDescription: text("short_description"),
  heroImageUrl: text("hero_image_url"),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  status: text("status").default("upcoming"),
  featured: integer("featured", { mode: 'boolean' }).default(0),
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

// Alias for backward compatibility
export const cruises = trips;

// ============ ITINERARY TABLE ============
export const itinerary = sqliteTable("itinerary", {
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
  isSeaDay: integer("is_sea_day", { mode: 'boolean' }).default(0),
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

// ============ EVENTS TABLE ============
export const events = sqliteTable("events", {
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
  featured: integer("featured", { mode: 'boolean' }).default(0),
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

// ============ TALENT TABLE ============
export const talent = sqliteTable("talent", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  category: text("category"),
  role: text("role"),
  knownFor: text("known_for"),
  bio: text("bio"),
  imageUrl: text("image_url"),
  socialLinks: text("social_links"),
  featured: integer("featured", { mode: 'boolean' }).default(0),
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

// ============ MEDIA TABLE ============
export const media = sqliteTable("media", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tripId: integer("trip_id").references(() => trips.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  url: text("url").notNull(),
  title: text("title"),
  description: text("description"),
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Trip = typeof trips.$inferSelect;
export type Cruise = Trip; // Backward compatibility
export type Itinerary = typeof itinerary.$inferSelect;
export type Event = typeof events.$inferSelect;
export type Talent = typeof talent.$inferSelect;
export type Media = typeof media.$inferSelect;