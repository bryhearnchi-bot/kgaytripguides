import { db } from "./storage";
import { ships, type Ship, type InsertShip } from "../shared/schema";
import { eq, ilike, or, and, sql } from "drizzle-orm";

export const shipStorage = {
  // Get all ships
  async getAll() {
    return await db.select().from(ships).orderBy(ships.cruiseLine, ships.name);
  },

  // Get ship by ID
  async getById(id: number) {
    const result = await db.select().from(ships).where(eq(ships.id, id)).limit(1);
    return result[0] || null;
  },

  // Search ships by name or cruise line
  async search(query: string) {
    const searchPattern = `%${query}%`;
    return await db
      .select()
      .from(ships)
      .where(
        or(
          ilike(ships.name, searchPattern),
          ilike(ships.cruiseLine, searchPattern),
          ilike(ships.shipClass, searchPattern)
        )
      )
      .orderBy(ships.cruiseLine, ships.name);
  },

  // Get ships by cruise line
  async getByCruiseLine(cruiseLine: string) {
    return await db
      .select()
      .from(ships)
      .where(eq(ships.cruiseLine, cruiseLine))
      .orderBy(ships.name);
  },

  // Create a new ship
  async create(data: InsertShip) {
    const result = await db.insert(ships).values(data).returning();
    return result[0];
  },

  // Update a ship
  async update(id: number, data: Partial<InsertShip>) {
    const result = await db
      .update(ships)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(ships.id, id))
      .returning();
    return result[0] || null;
  },

  // Delete a ship
  async delete(id: number) {
    // Check if ship is being used by any cruises
    const cruisesUsingShip = await db.execute(
      sql`SELECT COUNT(*) as count FROM cruises WHERE ship_id = ${id}`
    );

    if (cruisesUsingShip.rows[0].count > 0) {
      throw new Error(`Cannot delete ship. It is being used by ${cruisesUsingShip.rows[0].count} cruise(s).`);
    }

    const result = await db.delete(ships).where(eq(ships.id, id)).returning();
    return result[0] || null;
  },

  // Get ship statistics
  async getStatistics() {
    const totalShips = await db.select({ count: sql<number>`count(*)` }).from(ships);
    const shipsByCruiseLine = await db
      .select({
        cruiseLine: ships.cruiseLine,
        count: sql<number>`count(*)`,
      })
      .from(ships)
      .groupBy(ships.cruiseLine);

    const shipsWithCruises = await db.execute(
      sql`
        SELECT
          s.id,
          s.name,
          s.cruise_line,
          COUNT(c.id) as cruise_count
        FROM ships s
        LEFT JOIN cruises c ON c.ship_id = s.id
        GROUP BY s.id, s.name, s.cruise_line
        ORDER BY cruise_count DESC
      `
    );

    return {
      total: totalShips[0]?.count || 0,
      byCruiseLine: shipsByCruiseLine,
      shipsWithCruises: shipsWithCruises.rows,
    };
  },

  // Check if a ship exists
  async exists(name: string, cruiseLine: string) {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(ships)
      .where(and(eq(ships.name, name), eq(ships.cruiseLine, cruiseLine)));
    return (result[0]?.count || 0) > 0;
  },

  // Get or create a ship (useful for cruise creation)
  async getOrCreate(name: string, cruiseLine: string, additionalData?: Partial<InsertShip>) {
    // First try to find existing ship
    const existing = await db
      .select()
      .from(ships)
      .where(and(eq(ships.name, name), eq(ships.cruiseLine, cruiseLine)))
      .limit(1);

    if (existing[0]) {
      return existing[0];
    }

    // Create new ship
    return await this.create({
      name,
      cruiseLine,
      ...additionalData,
    } as InsertShip);
  },
};