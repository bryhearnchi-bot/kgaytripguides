import type { Express } from "express";
import {
  portStorage,
  db
} from "../storage";
import { requireAuth, requireContentEditor, requireSuperAdmin, type AuthenticatedRequest } from "../auth";
import { ports, ships } from "../../shared/schema";
import { eq, ilike, or, count, sql } from "drizzle-orm";
import {
  validateBody,
  validateParams,
  idParamSchema
} from "../middleware/validation";
import {
  adminRateLimit
} from "../middleware/rate-limiting";

export function registerLocationRoutes(app: Express) {
  // ============ PORT ENDPOINTS ============

  // Get port statistics
  app.get("/api/ports/stats", async (req, res) => {
    try {
      const stats = await db.select({
        total: count(),
        byCountry: sql<any>`json_object_agg(country, country_count) FROM (SELECT country, COUNT(*) as country_count FROM ${ports} GROUP BY country) t`
      }).from(ports);

      res.json(stats[0] || { total: 0, byCountry: {} });
    } catch (error) {
      console.error('Error fetching port stats:', error);
      res.status(500).json({ error: 'Failed to fetch port statistics' });
    }
  });

  // List all ports
  app.get("/api/ports", async (req, res) => {
    try {
      const {
        search = '',
        country,
        limit = '100',
        offset = '0'
      } = req.query;

      let query = db.select().from(ports);

      // Apply filters
      const conditions = [];
      if (search) {
        conditions.push(
          or(
            ilike(ports.name, `%${search}%`),
            ilike(ports.country, `%${search}%`),
            ilike(ports.description, `%${search}%`)
          )
        );
      }
      if (country) {
        conditions.push(eq(ports.country, country as string));
      }

      if (conditions.length > 0) {
        query = query.where(conditions.length === 1 ? conditions[0] : sql`${conditions.join(' AND ')}`) as typeof query;
      }

      // Apply pagination
      query = query.limit(parseInt(limit as string)).offset(parseInt(offset as string)) as typeof query;

      const results = await query;

      // Transform snake_case to camelCase for frontend compatibility
      const transformedResults = results.map(port => ({
        ...port,
        imageUrl: port.image_url,
        portType: port.port_type,
        createdAt: port.created_at,
        updatedAt: port.updated_at
      }));

      res.json(transformedResults);
    } catch (error) {
      console.error('Error fetching ports:', error);
      res.status(500).json({ error: 'Failed to fetch ports' });
    }
  });

  // Get port by ID
  app.get("/api/ports/:id", async (req, res) => {
    try {
      const [port] = await db.select()
        .from(ports)
        .where(eq(ports.id, req.params.id))
        .limit(1);

      if (!port) {
        return res.status(404).json({ error: "Port not found" });
      }

      res.json(port);
    } catch (error) {
      console.error('Error fetching port:', error);
      res.status(500).json({ error: 'Failed to fetch port' });
    }
  });

  // Create port
  app.post("/api/ports", requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      const [port] = await db.insert(ports).values(req.body).returning();
      res.json(port);
    } catch (error) {
      console.error('Error creating port:', error);
      res.status(500).json({ error: 'Failed to create port' });
    }
  });

  // Update port
  app.put("/api/ports/:id", requireContentEditor, validateParams(idParamSchema), async (req: AuthenticatedRequest, res) => {
    try {
      const [port] = await db.update(ports)
        .set(req.body)
        .where(eq(ports.id, req.params.id))
        .returning();

      if (!port) {
        return res.status(404).json({ error: "Port not found" });
      }

      res.json(port);
    } catch (error) {
      console.error('Error updating port:', error);
      res.status(500).json({ error: 'Failed to update port' });
    }
  });

  // Delete port
  app.delete("/api/ports/:id", requireSuperAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      await db.delete(ports).where(eq(ports.id, req.params.id));
      res.json({ message: "Port deleted" });
    } catch (error) {
      console.error('Error deleting port:', error);
      res.status(500).json({ error: 'Failed to delete port' });
    }
  });

  // ============ SHIP ENDPOINTS ============

  // Get ship statistics
  app.get("/api/ships/stats", async (req, res) => {
    try {
      const stats = await db.select({
        total: count(),
        totalCapacity: sql<number>`SUM(capacity)`,
        avgCapacity: sql<number>`AVG(capacity)`
      }).from(ships);

      res.json(stats[0] || { total: 0, totalCapacity: 0, avgCapacity: 0 });
    } catch (error) {
      console.error('Error fetching ship stats:', error);
      res.status(500).json({ error: 'Failed to fetch ship statistics' });
    }
  });

  // List all ships
  app.get("/api/ships", async (req, res) => {
    try {
      const {
        search = '',
        minCapacity,
        maxCapacity,
        limit = '50',
        offset = '0'
      } = req.query;

      let query = db.select().from(ships);

      // Apply filters
      const conditions = [];
      if (search) {
        conditions.push(
          or(
            ilike(ships.name, `%${search}%`),
            ilike(ships.description, `%${search}%`)
          )
        );
      }
      if (minCapacity) {
        conditions.push(sql`capacity >= ${parseInt(minCapacity as string)}`);
      }
      if (maxCapacity) {
        conditions.push(sql`capacity <= ${parseInt(maxCapacity as string)}`);
      }

      if (conditions.length > 0) {
        query = query.where(conditions.length === 1 ? conditions[0] : sql`${conditions.join(' AND ')}`) as typeof query;
      }

      // Apply pagination
      query = query.limit(parseInt(limit as string)).offset(parseInt(offset as string)) as typeof query;

      const results = await query;
      res.json(results);
    } catch (error) {
      console.error('Error fetching ships:', error);
      res.status(500).json({ error: 'Failed to fetch ships' });
    }
  });

  // Get ship by ID
  app.get("/api/ships/:id", async (req, res) => {
    try {
      const [ship] = await db.select()
        .from(ships)
        .where(eq(ships.id, req.params.id))
        .limit(1);

      if (!ship) {
        return res.status(404).json({ error: "Ship not found" });
      }

      res.json(ship);
    } catch (error) {
      console.error('Error fetching ship:', error);
      res.status(500).json({ error: 'Failed to fetch ship' });
    }
  });

  // Create ship
  app.post("/api/ships", requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      const [ship] = await db.insert(ships).values(req.body).returning();
      res.json(ship);
    } catch (error) {
      console.error('Error creating ship:', error);
      res.status(500).json({ error: 'Failed to create ship' });
    }
  });

  // Update ship
  app.put("/api/ships/:id", requireContentEditor, validateParams(idParamSchema), async (req: AuthenticatedRequest, res) => {
    try {
      const [ship] = await db.update(ships)
        .set(req.body)
        .where(eq(ships.id, req.params.id))
        .returning();

      if (!ship) {
        return res.status(404).json({ error: "Ship not found" });
      }

      res.json(ship);
    } catch (error) {
      console.error('Error updating ship:', error);
      res.status(500).json({ error: 'Failed to update ship' });
    }
  });

  // Delete ship
  app.delete("/api/ships/:id", requireSuperAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      await db.delete(ships).where(eq(ships.id, req.params.id));
      res.json({ message: "Ship deleted" });
    } catch (error) {
      console.error('Error deleting ship:', error);
      res.status(500).json({ error: 'Failed to delete ship' });
    }
  });

}