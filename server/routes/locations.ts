import type { Express } from "express";
import {
  db
} from "../storage";
import { requireAuth, requireContentEditor, requireSuperAdmin, type AuthenticatedRequest } from "../auth";
import { auditLogger } from "../logging/middleware";
import * as schema from "../../shared/schema";
const locations = schema.locations;
import { eq, ilike, or, count, sql } from "drizzle-orm";
import {
  validateBody,
  validateParams,
  idParamSchema
} from "../middleware/validation";
import {
  adminRateLimit
} from "../middleware/rate-limiting";
import { getSupabaseAdmin, handleSupabaseError, isSupabaseAdminAvailable } from "../supabase-admin";

export function registerLocationRoutes(app: Express) {
  // ============ LOCATION ENDPOINTS ============

  // Get location statistics
  app.get("/api/locations/stats", async (req, res) => {
    try {
      const stats = await db.select({
        total: count(),
        byCountry: sql<any>`json_object_agg(country, country_count) FROM (SELECT country, COUNT(*) as country_count FROM ${locations} GROUP BY country) t`
      }).from(schema.locations);

      res.json(stats[0] || { total: 0, byCountry: {} });
    } catch (error) {
      console.error('Error fetching location stats:', error);
      res.status(500).json({ error: 'Failed to fetch location statistics' });
    }
  });

  // List all locations
  app.get("/api/locations", async (req, res) => {
    try {
      const {
        search = '',
        country,
        limit = '100',
        offset = '0'
      } = req.query;

      let query = db.select().from(schema.locations);

      // Apply filters
      const conditions = [];
      if (search) {
        conditions.push(
          or(
            ilike(schema.locations.name, `%${search}%`),
            ilike(schema.locations.country, `%${search}%`),
            ilike(schema.locations.description, `%${search}%`)
          )
        );
      }
      if (country) {
        conditions.push(eq(schema.locations.country, country as string));
      }

      if (conditions.length > 0) {
        query = query.where(conditions.length === 1 ? conditions[0] : sql`${conditions.join(' AND ')}`) as typeof query;
      }

      // Apply pagination
      query = query.limit(parseInt(limit as string)).offset(parseInt(offset as string)) as typeof query;

      const results = await query;

      // Transform snake_case to camelCase for frontend compatibility
      const transformedResults = results.map((location: any) => ({
        ...location,
        imageUrl: location.image_url,
        portType: location.port_type,
        createdAt: location.created_at,
        updatedAt: location.updated_at
      }));

      res.json(transformedResults);
    } catch (error) {
      console.error('Error fetching locations:', error);
      res.status(500).json({ error: 'Failed to fetch locations' });
    }
  });

  // Get location by ID
  app.get("/api/locations/:id", async (req, res) => {
    try {
      const [location] = await db.select()
        .from(schema.locations)
        .where(eq(schema.locations.id, Number(req.params.id)))
        .limit(1);

      if (!location) {
        return res.status(404).json({ error: "Location not found" });
      }

      res.json(location);
    } catch (error) {
      console.error('Error fetching location:', error);
      res.status(500).json({ error: 'Failed to fetch location' });
    }
  });

  // Create location
  app.post("/api/locations", requireContentEditor, auditLogger('admin.location.create'), async (req: AuthenticatedRequest, res) => {
    try {
      // Validate required fields
      if (!req.body.name || !req.body.country) {
        return res.status(400).json({ error: 'Name and country are required fields' });
      }

      // Check if Supabase admin is available
      if (!isSupabaseAdminAvailable()) {
        return res.status(503).json({
          error: 'Admin service not configured',
          details: 'Please configure SUPABASE_SERVICE_ROLE_KEY environment variable'
        });
      }

      // Prepare location data with proper field names
      const locationData = {
        name: req.body.name,
        country: req.body.country,
        coordinates: req.body.coordinates || null,
        description: req.body.description || null,
        image_url: req.body.imageUrl || req.body.image_url || null
      };

      // Use Supabase Admin client to bypass RLS
      const supabaseAdmin = getSupabaseAdmin();
      const { data: location, error } = await supabaseAdmin
        .from('locations')
        .insert(locationData)
        .select()
        .single();

      if (error) {
        handleSupabaseError(error, 'create location');
      }

      if (!location) {
        return res.status(500).json({ error: 'Failed to create location' });
      }

      // Transform snake_case to camelCase for frontend compatibility
      const transformedLocation = {
        id: location.id,  // Explicitly include ID to ensure it's present
        ...location,
        imageUrl: location.image_url,
        createdAt: location.created_at,
        updatedAt: location.updated_at
      };

      res.json(transformedLocation);
    } catch (error: any) {
      console.error('Error creating location:', error);

      // Provide more specific error messages
      if (error.message?.includes('Duplicate entry')) {
        return res.status(409).json({ error: 'A location with this name already exists' });
      }
      if (error.message?.includes('Missing required field')) {
        return res.status(400).json({ error: error.message });
      }
      if (error.message?.includes('Invalid data format')) {
        return res.status(400).json({ error: error.message });
      }

      res.status(500).json({
        error: error.message || 'Failed to create location',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

  // Update location
  app.put("/api/locations/:id", requireContentEditor, validateParams(idParamSchema as any), auditLogger('admin.location.update'), async (req: AuthenticatedRequest, res) => {
    try {
      // Check if Supabase admin is available
      if (!isSupabaseAdminAvailable()) {
        return res.status(503).json({
          error: 'Admin service not configured',
          details: 'Please configure SUPABASE_SERVICE_ROLE_KEY environment variable'
        });
      }

      // Prepare update data with proper field names
      const updateData: any = {};
      if (req.body.name !== undefined) updateData.name = req.body.name;
      if (req.body.country !== undefined) updateData.country = req.body.country;
      if (req.body.coordinates !== undefined) updateData.coordinates = req.body.coordinates;
      if (req.body.description !== undefined) updateData.description = req.body.description;
      if (req.body.imageUrl !== undefined || req.body.image_url !== undefined) {
        updateData.image_url = req.body.imageUrl || req.body.image_url;
      }
      updateData.updated_at = new Date().toISOString();

      // Use Supabase Admin client to bypass RLS
      const supabaseAdmin = getSupabaseAdmin();
      const { data: location, error } = await supabaseAdmin
        .from('locations')
        .update(updateData)
        .eq('id', Number(req.params.id))
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: "Location not found" });
        }
        handleSupabaseError(error, 'update location');
      }

      if (!location) {
        return res.status(404).json({ error: "Location not found" });
      }

      // Transform snake_case to camelCase for frontend compatibility
      const transformedLocation = {
        id: location.id,  // Explicitly include ID to ensure it's present
        ...location,
        imageUrl: location.image_url,
        createdAt: location.created_at,
        updatedAt: location.updated_at
      };

      res.json(transformedLocation);
    } catch (error: any) {
      console.error('Error updating location:', error);

      // Provide more specific error messages
      if (error.message?.includes('Duplicate entry')) {
        return res.status(409).json({ error: 'A location with this name already exists' });
      }
      if (error.message?.includes('Foreign key violation')) {
        return res.status(400).json({ error: error.message });
      }
      if (error.message?.includes('Invalid data format')) {
        return res.status(400).json({ error: error.message });
      }

      res.status(500).json({
        error: error.message || 'Failed to update location',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

  // Delete location
  app.delete("/api/locations/:id", requireContentEditor, auditLogger('admin.location.delete'), async (req: AuthenticatedRequest, res) => {
    try {
      // Check if Supabase admin is available
      if (!isSupabaseAdminAvailable()) {
        return res.status(503).json({
          error: 'Admin service not configured',
          details: 'Please configure SUPABASE_SERVICE_ROLE_KEY environment variable'
        });
      }

      // Use Supabase Admin client to bypass RLS
      const supabaseAdmin = getSupabaseAdmin();
      const { error } = await supabaseAdmin
        .from('locations')
        .delete()
        .eq('id', Number(req.params.id));

      if (error) {
        handleSupabaseError(error, 'delete location');
      }

      res.json({ message: "Location deleted" });
    } catch (error: any) {
      console.error('Error deleting location:', error);
      res.status(500).json({
        error: error.message || 'Failed to delete location',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
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
      }).from(schema.ships);

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

      let query = db.select().from(schema.ships);

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

      // Transform snake_case to camelCase for frontend compatibility
      const transformedResults = results.map((ship: any) => ({
        id: ship.id,
        name: ship.name,
        cruiseLine: ship.cruise_line,
        shipCode: ship.ship_code,
        capacity: ship.capacity,
        crewSize: ship.crew_size,
        grossTonnage: ship.gross_tonnage,
        lengthMeters: ship.length_meters,
        beamMeters: ship.beam_meters,
        decks: ship.decks,
        builtYear: ship.built_year,
        refurbishedYear: ship.refurbished_year,
        shipClass: ship.ship_class,
        flag: ship.flag,
        imageUrl: ship.image_url,
        description: ship.description,
        highlights: ship.highlights,
        amenities: ship.amenities,
        createdAt: ship.created_at,
        updatedAt: ship.updated_at
      }));

      res.json(transformedResults);
    } catch (error) {
      console.error('Error fetching ships:', error);
      res.status(500).json({ error: 'Failed to fetch ships' });
    }
  });

  // Get ship by ID
  app.get("/api/ships/:id", async (req, res) => {
    try {
      const [ship] = await db.select()
        .from(schema.ships)
        .where(eq(schema.ships.id, Number(req.params.id)))
        .limit(1);

      if (!ship) {
        return res.status(404).json({ error: "Ship not found" });
      }

      // Transform snake_case to camelCase for frontend compatibility
      const transformedShip = {
        id: ship.id,
        name: ship.name,
        cruiseLine: ship.cruise_line,
        shipCode: ship.ship_code,
        capacity: ship.capacity,
        crewSize: ship.crew_size,
        grossTonnage: ship.gross_tonnage,
        lengthMeters: ship.length_meters,
        beamMeters: ship.beam_meters,
        decks: ship.decks,
        builtYear: ship.built_year,
        refurbishedYear: ship.refurbished_year,
        shipClass: ship.ship_class,
        flag: ship.flag,
        imageUrl: ship.image_url,
        description: ship.description,
        highlights: ship.highlights,
        amenities: ship.amenities,
        createdAt: ship.created_at,
        updatedAt: ship.updated_at
      };

      res.json(transformedShip);
    } catch (error) {
      console.error('Error fetching ship:', error);
      res.status(500).json({ error: 'Failed to fetch ship' });
    }
  });

  // Create ship
  app.post("/api/ships", requireContentEditor, auditLogger('admin.ship.create'), async (req: AuthenticatedRequest, res) => {
    try {
      // Check if Supabase admin is available
      if (!isSupabaseAdminAvailable()) {
        return res.status(503).json({
          error: 'Admin service not configured',
          details: 'Please configure SUPABASE_SERVICE_ROLE_KEY environment variable'
        });
      }

      // Validate required fields (accept both camelCase and snake_case)
      const cruiseLine = req.body.cruiseLine || req.body.cruise_line;
      if (!req.body.name || !cruiseLine) {
        return res.status(400).json({ error: 'Name and cruise line are required fields' });
      }

      // Prepare ship data with proper field names for database
      const shipData = {
        name: req.body.name,
        cruise_line: cruiseLine,  // Always use snake_case for database
        ship_code: req.body.shipCode || req.body.ship_code || null,
        capacity: req.body.capacity || null,
        crew_size: req.body.crewSize || req.body.crew_size || null,
        gross_tonnage: req.body.grossTonnage || req.body.gross_tonnage || null,
        length_meters: req.body.lengthMeters || req.body.length_meters || null,
        beam_meters: req.body.beamMeters || req.body.beam_meters || null,
        decks: req.body.decks || null,
        built_year: req.body.builtYear || req.body.built_year || null,
        refurbished_year: req.body.refurbishedYear || req.body.refurbished_year || null,
        ship_class: req.body.shipClass || req.body.ship_class || null,
        flag: req.body.flag || null,
        image_url: req.body.imageUrl || req.body.image_url || null,
        description: req.body.description || null,
        highlights: req.body.highlights || null,
        amenities: req.body.amenities || null
      };

      // Use Supabase Admin client to bypass RLS
      const supabaseAdmin = getSupabaseAdmin();
      const { data: ship, error } = await supabaseAdmin
        .from('ships')
        .insert(shipData)
        .select()
        .single();

      if (error) {
        handleSupabaseError(error, 'create ship');
      }

      if (!ship) {
        return res.status(500).json({ error: 'Failed to create ship' });
      }

      // Transform snake_case to camelCase for frontend compatibility
      const transformedShip = {
        id: ship.id,
        name: ship.name,
        cruiseLine: ship.cruise_line,
        shipCode: ship.ship_code,
        capacity: ship.capacity,
        crewSize: ship.crew_size,
        grossTonnage: ship.gross_tonnage,
        lengthMeters: ship.length_meters,
        beamMeters: ship.beam_meters,
        decks: ship.decks,
        builtYear: ship.built_year,
        refurbishedYear: ship.refurbished_year,
        shipClass: ship.ship_class,
        flag: ship.flag,
        imageUrl: ship.image_url,
        description: ship.description,
        highlights: ship.highlights,
        amenities: ship.amenities,
        createdAt: ship.created_at,
        updatedAt: ship.updated_at
      };

      res.json(transformedShip);
    } catch (error: any) {
      console.error('Error creating ship:', error);
      res.status(500).json({
        error: error.message || 'Failed to create ship',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

  // Update ship
  app.put("/api/ships/:id", requireContentEditor, validateParams(idParamSchema as any), auditLogger('admin.ship.update'), async (req: AuthenticatedRequest, res) => {
    try {
      // Check if Supabase admin is available
      if (!isSupabaseAdminAvailable()) {
        return res.status(503).json({
          error: 'Admin service not configured',
          details: 'Please configure SUPABASE_SERVICE_ROLE_KEY environment variable'
        });
      }

      // Prepare update data with proper field names for database
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      // Convert camelCase to snake_case for database fields
      if (req.body.name !== undefined) updateData.name = req.body.name;
      if (req.body.cruiseLine !== undefined || req.body.cruise_line !== undefined) {
        updateData.cruise_line = req.body.cruiseLine || req.body.cruise_line;
      }
      if (req.body.shipCode !== undefined || req.body.ship_code !== undefined) {
        updateData.ship_code = req.body.shipCode || req.body.ship_code;
      }
      if (req.body.capacity !== undefined) updateData.capacity = req.body.capacity;
      if (req.body.crewSize !== undefined || req.body.crew_size !== undefined) {
        updateData.crew_size = req.body.crewSize || req.body.crew_size;
      }
      if (req.body.grossTonnage !== undefined || req.body.gross_tonnage !== undefined) {
        updateData.gross_tonnage = req.body.grossTonnage || req.body.gross_tonnage;
      }
      if (req.body.lengthMeters !== undefined || req.body.length_meters !== undefined) {
        updateData.length_meters = req.body.lengthMeters || req.body.length_meters;
      }
      if (req.body.beamMeters !== undefined || req.body.beam_meters !== undefined) {
        updateData.beam_meters = req.body.beamMeters || req.body.beam_meters;
      }
      if (req.body.decks !== undefined) updateData.decks = req.body.decks;
      if (req.body.builtYear !== undefined || req.body.built_year !== undefined) {
        updateData.built_year = req.body.builtYear || req.body.built_year;
      }
      if (req.body.refurbishedYear !== undefined || req.body.refurbished_year !== undefined) {
        updateData.refurbished_year = req.body.refurbishedYear || req.body.refurbished_year;
      }
      if (req.body.shipClass !== undefined || req.body.ship_class !== undefined) {
        updateData.ship_class = req.body.shipClass || req.body.ship_class;
      }
      if (req.body.flag !== undefined) updateData.flag = req.body.flag;
      if (req.body.imageUrl !== undefined || req.body.image_url !== undefined) {
        updateData.image_url = req.body.imageUrl || req.body.image_url;
      }
      if (req.body.description !== undefined) updateData.description = req.body.description;
      if (req.body.highlights !== undefined) updateData.highlights = req.body.highlights;
      if (req.body.amenities !== undefined) updateData.amenities = req.body.amenities;

      // Use Supabase Admin client to bypass RLS
      const supabaseAdmin = getSupabaseAdmin();
      const { data: ship, error } = await supabaseAdmin
        .from('ships')
        .update(updateData)
        .eq('id', Number(req.params.id))
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: "Ship not found" });
        }
        handleSupabaseError(error, 'update ship');
      }

      if (!ship) {
        return res.status(404).json({ error: "Ship not found" });
      }

      // Transform snake_case to camelCase for frontend compatibility
      const transformedShip = {
        id: ship.id,
        name: ship.name,
        cruiseLine: ship.cruise_line,
        shipCode: ship.ship_code,
        capacity: ship.capacity,
        crewSize: ship.crew_size,
        grossTonnage: ship.gross_tonnage,
        lengthMeters: ship.length_meters,
        beamMeters: ship.beam_meters,
        decks: ship.decks,
        builtYear: ship.built_year,
        refurbishedYear: ship.refurbished_year,
        shipClass: ship.ship_class,
        flag: ship.flag,
        imageUrl: ship.image_url,
        description: ship.description,
        highlights: ship.highlights,
        amenities: ship.amenities,
        createdAt: ship.created_at,
        updatedAt: ship.updated_at
      };

      res.json(transformedShip);
    } catch (error: any) {
      console.error('Error updating ship:', error);
      res.status(500).json({
        error: error.message || 'Failed to update ship',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

  // Delete ship
  app.delete("/api/ships/:id", requireContentEditor, auditLogger('admin.ship.delete'), async (req: AuthenticatedRequest, res) => {
    try {
      // Check if Supabase admin is available
      if (!isSupabaseAdminAvailable()) {
        return res.status(503).json({
          error: 'Admin service not configured',
          details: 'Please configure SUPABASE_SERVICE_ROLE_KEY environment variable'
        });
      }

      // Use Supabase Admin client to bypass RLS
      const supabaseAdmin = getSupabaseAdmin();
      const { error } = await supabaseAdmin
        .from('ships')
        .delete()
        .eq('id', Number(req.params.id));

      if (error) {
        handleSupabaseError(error, 'delete ship');
      }

      res.json({ message: "Ship deleted" });
    } catch (error: any) {
      console.error('Error deleting ship:', error);
      res.status(500).json({
        error: error.message || 'Failed to delete ship',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

}