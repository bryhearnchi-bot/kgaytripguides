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

      // Use Supabase Admin client
      const supabaseAdmin = getSupabaseAdmin();
      let query = supabaseAdmin
        .from('locations')
        .select('*')
        .order('name');

      // Apply filters
      if (search) {
        query = query.or(`name.ilike.%${search}%,country.ilike.%${search}%,description.ilike.%${search}%`);
      }
      if (country) {
        query = query.eq('country', country as string);
      }

      // Apply pagination
      const startIndex = parseInt(offset as string);
      const endIndex = startIndex + parseInt(limit as string) - 1;
      query = query.range(startIndex, endIndex);

      const { data: results, error } = await query;

      if (error) {
        console.error('Error fetching locations:', error);
        return res.status(500).json({ error: 'Failed to fetch locations' });
      }

      // Transform snake_case to camelCase for frontend compatibility
      const transformedResults = results.map((location: any) => ({
        id: location.id,
        name: location.name,
        country: location.country,
        coordinates: location.coordinates,
        description: location.description,
        imageUrl: location.image_url,
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
      // Use Supabase Admin client
      const supabaseAdmin = getSupabaseAdmin();
      const { data: location, error } = await supabaseAdmin
        .from('locations')
        .select('*')
        .eq('id', Number(req.params.id))
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: "Location not found" });
        }
        console.error('Error fetching location:', error);
        return res.status(500).json({ error: 'Failed to fetch location' });
      }

      if (!location) {
        return res.status(404).json({ error: "Location not found" });
      }

      // Transform snake_case to camelCase for frontend compatibility
      const transformedLocation = {
        id: location.id,
        name: location.name,
        country: location.country,
        coordinates: location.coordinates,
        description: location.description,
        imageUrl: location.image_url,
        createdAt: location.created_at,
        updatedAt: location.updated_at
      };

      res.json(transformedLocation);
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
        image_url: req.body.imageUrl || null
      };

      // Use Supabase Admin client to bypass RLS
      const supabaseAdmin = getSupabaseAdmin();
      const { data: location, error } = await supabaseAdmin
        .from('locations')
        .insert(locationData)
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating location:', error);
        if (error.code === '23505') {
          return res.status(409).json({ error: 'A location with this name already exists' });
        }
        if (error.code === '23502') {
          return res.status(400).json({ error: 'Missing required field' });
        }
        return res.status(500).json({ error: error.message || 'Failed to create location' });
      }

      if (!location) {
        return res.status(500).json({ error: 'Failed to create location' });
      }

      // Transform snake_case to camelCase for frontend compatibility
      const transformedLocation = {
        id: location.id,
        name: location.name,
        country: location.country,
        coordinates: location.coordinates,
        description: location.description,
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
      if (req.body.coordinates !== undefined) updateData.coordinates = req.body.coordinates || null;
      if (req.body.description !== undefined) updateData.description = req.body.description || null;
      if (req.body.imageUrl !== undefined) {
        updateData.image_url = req.body.imageUrl || null;
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
        id: location.id,
        name: location.name,
        country: location.country,
        coordinates: location.coordinates,
        description: location.description,
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
      // Use Supabase Admin client
      const supabaseAdmin = getSupabaseAdmin();
      const { data: ships, error } = await supabaseAdmin
        .from('ships')
        .select('capacity');

      if (error) {
        throw error;
      }

      const stats = {
        total: ships?.length || 0,
        totalCapacity: ships?.reduce((sum, ship) => sum + (ship.capacity || 0), 0) || 0,
        avgCapacity: ships?.length ?
          (ships.reduce((sum, ship) => sum + (ship.capacity || 0), 0) / ships.length) : 0
      };

      res.json(stats);
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

      // Use Supabase Admin client
      const supabaseAdmin = getSupabaseAdmin();
      let query = supabaseAdmin
        .from('ships')
        .select('*');

      // Apply filters
      if (search) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
      }
      if (minCapacity) {
        query = query.gte('capacity', parseInt(minCapacity as string));
      }
      if (maxCapacity) {
        query = query.lte('capacity', parseInt(maxCapacity as string));
      }

      // Apply pagination
      const start = parseInt(offset as string);
      const end = start + parseInt(limit as string) - 1;
      query = query.range(start, end);

      const { data: results, error } = await query;

      if (error) {
        throw error;
      }

      if (!results) {
        return res.json([]);
      }

      // Transform snake_case to camelCase for frontend compatibility
      const transformedResults = results.map((ship: any) => ({
        id: ship.id,
        name: ship.name,
        cruiseLine: ship.cruise_line,
        capacity: ship.capacity,
        decks: ship.decks,
        imageUrl: ship.image_url,
        deckPlansUrl: ship.deck_plans_url,
        description: ship.description,
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
      // Use Supabase Admin client
      const supabaseAdmin = getSupabaseAdmin();
      const { data: ship, error } = await supabaseAdmin
        .from('ships')
        .select('*')
        .eq('id', Number(req.params.id))
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: "Ship not found" });
        }
        throw error;
      }

      if (!ship) {
        return res.status(404).json({ error: "Ship not found" });
      }

      // Transform snake_case to camelCase for frontend compatibility
      const transformedShip = {
        id: ship.id,
        name: ship.name,
        cruiseLine: ship.cruise_line,
        capacity: ship.capacity,
        decks: ship.decks,
        imageUrl: ship.image_url,
        deckPlansUrl: ship.deck_plans_url,
        description: ship.description,
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
        capacity: req.body.capacity || null,
        decks: req.body.decks || null,
        image_url: req.body.imageUrl || req.body.image_url || null,
        deck_plans_url: req.body.deckPlansUrl || req.body.deck_plans_url || null,
        description: req.body.description || null
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
        capacity: ship.capacity,
        decks: ship.decks,
        imageUrl: ship.image_url,
        deckPlansUrl: ship.deck_plans_url,
        description: ship.description,
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

      // Convert camelCase to snake_case for database fields - ONLY fields that exist in DB
      if (req.body.name !== undefined) updateData.name = req.body.name;
      if (req.body.cruiseLine !== undefined || req.body.cruise_line !== undefined) {
        updateData.cruise_line = req.body.cruiseLine || req.body.cruise_line;
      }
      if (req.body.capacity !== undefined) updateData.capacity = req.body.capacity;
      if (req.body.decks !== undefined) updateData.decks = req.body.decks;
      if (req.body.imageUrl !== undefined || req.body.image_url !== undefined) {
        updateData.image_url = req.body.imageUrl || req.body.image_url;
      }
      if (req.body.deckPlansUrl !== undefined || req.body.deck_plans_url !== undefined) {
        updateData.deck_plans_url = req.body.deckPlansUrl || req.body.deck_plans_url;
      }
      if (req.body.description !== undefined) updateData.description = req.body.description;

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
        capacity: ship.capacity,
        decks: ship.decks,
        imageUrl: ship.image_url,
        deckPlansUrl: ship.deck_plans_url,
        description: ship.description,
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

  // ============ AMENITIES ENDPOINTS ============

  // Get amenities statistics
  app.get("/api/amenities/stats", async (req, res) => {
    try {
      const stats = await db.select({
        total: count()
      }).from(schema.amenities);

      res.json(stats[0] || { total: 0 });
    } catch (error) {
      console.error('Error fetching amenities stats:', error);
      res.status(500).json({ error: 'Failed to fetch amenities statistics' });
    }
  });

  // List all amenities
  app.get("/api/amenities", async (req, res) => {
    try {
      const {
        search = '',
        limit = '100',
        offset = '0'
      } = req.query;

      let query = db.select().from(schema.amenities);

      // Apply filters
      const conditions = [];
      if (search) {
        conditions.push(
          or(
            ilike(schema.amenities.name, `%${search}%`),
            ilike(schema.amenities.description, `%${search}%`)
          )
        );
      }

      if (conditions.length > 0) {
        query = query.where(conditions.length === 1 ? conditions[0] : sql`${conditions.join(' AND ')}`) as typeof query;
      }

      // Apply pagination
      query = query.limit(parseInt(limit as string)).offset(parseInt(offset as string)) as typeof query;

      const results = await query;

      // Transform snake_case to camelCase for frontend compatibility
      const transformedResults = results.map((amenity: any) => ({
        id: amenity.id,
        name: amenity.name,
        description: amenity.description,
        createdAt: amenity.created_at,
        updatedAt: amenity.updated_at
      }));

      res.json(transformedResults);
    } catch (error) {
      console.error('Error fetching amenities:', error);
      res.status(500).json({ error: 'Failed to fetch amenities' });
    }
  });

  // Get amenity by ID
  app.get("/api/amenities/:id", async (req, res) => {
    try {
      const [amenity] = await db.select()
        .from(schema.amenities)
        .where(eq(schema.amenities.id, Number(req.params.id)))
        .limit(1);

      if (!amenity) {
        return res.status(404).json({ error: "Amenity not found" });
      }

      // Transform snake_case to camelCase for frontend compatibility
      const transformedAmenity = {
        id: amenity.id,
        name: amenity.name,
        description: amenity.description,
        createdAt: amenity.created_at,
        updatedAt: amenity.updated_at
      };

      res.json(transformedAmenity);
    } catch (error) {
      console.error('Error fetching amenity:', error);
      res.status(500).json({ error: 'Failed to fetch amenity' });
    }
  });

  // Create amenity
  app.post("/api/amenities", requireContentEditor, auditLogger('admin.amenity.create'), async (req: AuthenticatedRequest, res) => {
    try {
      // Check if Supabase admin is available
      if (!isSupabaseAdminAvailable()) {
        return res.status(503).json({
          error: 'Admin service not configured',
          details: 'Please configure SUPABASE_SERVICE_ROLE_KEY environment variable'
        });
      }

      // Validate required fields
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ error: 'Name is required' });
      }

      // Prepare amenity data with proper field names for database
      const amenityData = {
        name: req.body.name,
        description: req.body.description || null
      };

      // Use Supabase Admin client to bypass RLS
      const supabaseAdmin = getSupabaseAdmin();
      const { data: amenity, error } = await supabaseAdmin
        .from('amenities')
        .insert(amenityData)
        .select()
        .single();

      if (error) {
        handleSupabaseError(error, 'create amenity');
      }

      if (!amenity) {
        return res.status(500).json({ error: 'Failed to create amenity' });
      }

      // Transform snake_case to camelCase for frontend compatibility
      const transformedAmenity = {
        id: amenity.id,
        name: amenity.name,
        description: amenity.description,
        createdAt: amenity.created_at,
        updatedAt: amenity.updated_at
      };

      res.json(transformedAmenity);
    } catch (error: any) {
      console.error('Error creating amenity:', error);
      res.status(500).json({
        error: error.message || 'Failed to create amenity',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

  // Update amenity
  app.put("/api/amenities/:id", requireContentEditor, validateParams(idParamSchema as any), auditLogger('admin.amenity.update'), async (req: AuthenticatedRequest, res) => {
    try {
      // Check if Supabase admin is available
      if (!isSupabaseAdminAvailable()) {
        return res.status(503).json({
          error: 'Admin service not configured',
          details: 'Please configure SUPABASE_SERVICE_ROLE_KEY environment variable'
        });
      }

      // Build update data dynamically
      const updateData: any = {};
      if (req.body.name !== undefined) updateData.name = req.body.name;
      if (req.body.description !== undefined) updateData.description = req.body.description;

      // Always update the updated_at timestamp
      updateData.updated_at = new Date().toISOString();

      // Use Supabase Admin client to bypass RLS
      const supabaseAdmin = getSupabaseAdmin();
      const { data: amenity, error } = await supabaseAdmin
        .from('amenities')
        .update(updateData)
        .eq('id', Number(req.params.id))
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: "Amenity not found" });
        }
        handleSupabaseError(error, 'update amenity');
      }

      if (!amenity) {
        return res.status(404).json({ error: "Amenity not found" });
      }

      // Transform snake_case to camelCase for frontend compatibility
      const transformedAmenity = {
        id: amenity.id,
        name: amenity.name,
        description: amenity.description,
        createdAt: amenity.created_at,
        updatedAt: amenity.updated_at
      };

      res.json(transformedAmenity);
    } catch (error: any) {
      console.error('Error updating amenity:', error);
      res.status(500).json({
        error: error.message || 'Failed to update amenity',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

  // Delete amenity
  app.delete("/api/amenities/:id", requireContentEditor, auditLogger('admin.amenity.delete'), async (req: AuthenticatedRequest, res) => {
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
        .from('amenities')
        .delete()
        .eq('id', Number(req.params.id));

      if (error) {
        handleSupabaseError(error, 'delete amenity');
      }

      res.json({ message: "Amenity deleted" });
    } catch (error: any) {
      console.error('Error deleting amenity:', error);
      res.status(500).json({
        error: error.message || 'Failed to delete amenity',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

  // ============ VENUE TYPES ENDPOINTS ============

  // List all venue types (reference data)
  app.get("/api/venue-types", async (req, res) => {
    try {
      const results = await db.select().from(schema.venueTypes);

      // Transform snake_case to camelCase for frontend compatibility
      const transformedResults = results.map((venueType: any) => ({
        id: venueType.id,
        name: venueType.name,
        createdAt: venueType.created_at,
        updatedAt: venueType.updated_at
      }));

      res.json(transformedResults);
    } catch (error) {
      console.error('Error fetching venue types:', error);
      res.status(500).json({ error: 'Failed to fetch venue types' });
    }
  });

  // ============ VENUES ENDPOINTS ============

  // Get venues statistics
  app.get("/api/venues/stats", async (req, res) => {
    try {
      const totalResult = await db.select({ total: count() }).from(schema.venues);
      const total = totalResult[0]?.total || 0;

      const typeStats = await db.select({
        venue_type_name: schema.venueTypes.name,
        type_count: count()
      })
      .from(schema.venues)
      .leftJoin(schema.venueTypes, eq(schema.venues.venueTypeId, schema.venueTypes.id))
      .groupBy(schema.venueTypes.name);

      const byType = Object.fromEntries(
        typeStats.map(stat => [stat.venue_type_name, stat.type_count])
      );

      const stats = { total, byType };

      res.json(stats);
    } catch (error) {
      console.error('Error fetching venues stats:', error);
      res.status(500).json({ error: 'Failed to fetch venues statistics' });
    }
  });

  // List all venues
  app.get("/api/venues", async (req, res) => {
    try {
      const {
        search = '',
        venueTypeId,
        limit = '100',
        offset = '0'
      } = req.query;

      // Join with venue types to get venue type name
      let query = db.select({
        id: schema.venues.id,
        name: schema.venues.name,
        venue_type_id: schema.venues.venueTypeId,
        venue_type_name: schema.venueTypes.name,
        description: schema.venues.description,
        created_at: schema.venues.createdAt,
        updated_at: schema.venues.updatedAt
      }).from(schema.venues)
        .innerJoin(schema.venueTypes, eq(schema.venues.venueTypeId, schema.venueTypes.id));

      // Apply filters
      const conditions = [];
      if (search) {
        conditions.push(
          or(
            ilike(schema.venues.name, `%${search}%`),
            ilike(schema.venues.description, `%${search}%`),
            ilike(schema.venueTypes.name, `%${search}%`)
          )
        );
      }
      if (venueTypeId) {
        conditions.push(eq(schema.venues.venueTypeId, Number(venueTypeId)));
      }

      if (conditions.length > 0) {
        query = query.where(conditions.length === 1 ? conditions[0] : sql`${conditions.join(' AND ')}`) as typeof query;
      }

      // Apply pagination
      query = query.limit(parseInt(limit as string)).offset(parseInt(offset as string)) as typeof query;

      const results = await query;

      // Transform snake_case to camelCase for frontend compatibility
      const transformedResults = results.map((venue: any) => ({
        id: venue.id,
        name: venue.name,
        venueTypeId: venue.venue_type_id,
        venueTypeName: venue.venue_type_name,
        description: venue.description,
        createdAt: venue.created_at,
        updatedAt: venue.updated_at
      }));

      res.json(transformedResults);
    } catch (error) {
      console.error('Error fetching venues:', error);
      res.status(500).json({ error: 'Failed to fetch venues' });
    }
  });

  // Get venue by ID
  app.get("/api/venues/:id", async (req, res) => {
    try {
      const results = await db.select({
        id: schema.venues.id,
        name: schema.venues.name,
        venue_type_id: schema.venues.venueTypeId,
        venue_type_name: schema.venueTypes.name,
        description: schema.venues.description,
        created_at: schema.venues.createdAt,
        updated_at: schema.venues.updatedAt
      }).from(schema.venues)
        .innerJoin(schema.venueTypes, eq(schema.venues.venueTypeId, schema.venueTypes.id))
        .where(eq(schema.venues.id, Number(req.params.id)))
        .limit(1);

      if (results.length === 0) {
        return res.status(404).json({ error: "Venue not found" });
      }

      const venue = results[0];

      // Transform snake_case to camelCase for frontend compatibility
      const transformedVenue = {
        id: venue.id,
        name: venue.name,
        venueTypeId: venue.venue_type_id,
        venueTypeName: venue.venue_type_name,
        description: venue.description,
        createdAt: venue.created_at,
        updatedAt: venue.updated_at
      };

      res.json(transformedVenue);
    } catch (error) {
      console.error('Error fetching venue:', error);
      res.status(500).json({ error: 'Failed to fetch venue' });
    }
  });

  // Create venue
  app.post("/api/venues", requireContentEditor, auditLogger('admin.venue.create'), async (req: AuthenticatedRequest, res) => {
    try {
      // Check if Supabase admin is available
      if (!isSupabaseAdminAvailable()) {
        return res.status(503).json({
          error: 'Admin service not configured',
          details: 'Please configure SUPABASE_SERVICE_ROLE_KEY environment variable'
        });
      }

      // Validate required fields
      const { name, venueTypeId } = req.body;
      if (!name) {
        return res.status(400).json({ error: 'Name is required' });
      }
      if (!venueTypeId) {
        return res.status(400).json({ error: 'Venue type ID is required' });
      }

      // Prepare venue data with proper field names for database
      const venueData = {
        name: req.body.name,
        venue_type_id: req.body.venueTypeId,
        description: req.body.description || null
      };

      // Use Supabase Admin client to bypass RLS
      const supabaseAdmin = getSupabaseAdmin();
      const { data: venue, error } = await supabaseAdmin
        .from('venues')
        .insert(venueData)
        .select(`
          id,
          name,
          venue_type_id,
          description,
          created_at,
          updated_at,
          venue_types!inner(name)
        `)
        .single();

      if (error) {
        handleSupabaseError(error, 'create venue');
      }

      if (!venue) {
        return res.status(500).json({ error: 'Failed to create venue' });
      }

      // Transform snake_case to camelCase for frontend compatibility
      const transformedVenue = {
        id: venue.id,
        name: venue.name,
        venueTypeId: venue.venue_type_id,
        venueTypeName: venue.venue_types?.name,
        description: venue.description,
        createdAt: venue.created_at,
        updatedAt: venue.updated_at
      };

      res.json(transformedVenue);
    } catch (error: any) {
      console.error('Error creating venue:', error);
      res.status(500).json({
        error: error.message || 'Failed to create venue',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

  // Update venue
  app.put("/api/venues/:id", requireContentEditor, validateParams(idParamSchema as any), auditLogger('admin.venue.update'), async (req: AuthenticatedRequest, res) => {
    try {
      // Check if Supabase admin is available
      if (!isSupabaseAdminAvailable()) {
        return res.status(503).json({
          error: 'Admin service not configured',
          details: 'Please configure SUPABASE_SERVICE_ROLE_KEY environment variable'
        });
      }

      // Build update data dynamically
      const updateData: any = {};
      if (req.body.name !== undefined) updateData.name = req.body.name;
      if (req.body.venueTypeId !== undefined) updateData.venue_type_id = req.body.venueTypeId;
      if (req.body.description !== undefined) updateData.description = req.body.description;

      // Always update the updated_at timestamp
      updateData.updated_at = new Date().toISOString();

      // Use Supabase Admin client to bypass RLS
      const supabaseAdmin = getSupabaseAdmin();
      const { data: venue, error } = await supabaseAdmin
        .from('venues')
        .update(updateData)
        .eq('id', Number(req.params.id))
        .select(`
          id,
          name,
          venue_type_id,
          description,
          created_at,
          updated_at,
          venue_types!inner(name)
        `)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: "Venue not found" });
        }
        handleSupabaseError(error, 'update venue');
      }

      if (!venue) {
        return res.status(404).json({ error: "Venue not found" });
      }

      // Transform snake_case to camelCase for frontend compatibility
      const transformedVenue = {
        id: venue.id,
        name: venue.name,
        venueTypeId: venue.venue_type_id,
        venueTypeName: venue.venue_types?.name,
        description: venue.description,
        createdAt: venue.created_at,
        updatedAt: venue.updated_at
      };

      res.json(transformedVenue);
    } catch (error: any) {
      console.error('Error updating venue:', error);
      res.status(500).json({
        error: error.message || 'Failed to update venue',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

  // Delete venue
  app.delete("/api/venues/:id", requireContentEditor, auditLogger('admin.venue.delete'), async (req: AuthenticatedRequest, res) => {
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
        .from('venues')
        .delete()
        .eq('id', Number(req.params.id));

      if (error) {
        handleSupabaseError(error, 'delete venue');
      }

      res.json({ message: "Venue deleted" });
    } catch (error: any) {
      console.error('Error deleting venue:', error);
      res.status(500).json({
        error: error.message || 'Failed to delete venue',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

  // ============ RESORTS ENDPOINTS ============

  // Get resort statistics
  app.get("/api/resorts/stats", async (req, res) => {
    try {
      const stats = await db.select({
        total: count(),
        totalCapacity: sql<number>`SUM(capacity)`,
        avgCapacity: sql<number>`AVG(capacity)`
      }).from(schema.resorts);

      res.json(stats[0] || { total: 0, totalCapacity: 0, avgCapacity: 0 });
    } catch (error) {
      console.error('Error fetching resort stats:', error);
      res.status(500).json({ error: 'Failed to fetch resort statistics' });
    }
  });

  // List all resorts
  app.get("/api/resorts", async (req, res) => {
    try {
      const {
        search = '',
        location,
        limit = '100',
        offset = '0'
      } = req.query;

      // Use Supabase Admin client
      const supabaseAdmin = getSupabaseAdmin();
      let query = supabaseAdmin
        .from('resorts')
        .select('*')
        .order('name');

      // Apply filters
      if (search) {
        query = query.or(`name.ilike.%${search}%,location.ilike.%${search}%,description.ilike.%${search}%`);
      }
      if (location) {
        query = query.eq('location', location as string);
      }

      // Apply pagination
      const startIndex = parseInt(offset as string);
      const endIndex = startIndex + parseInt(limit as string) - 1;
      query = query.range(startIndex, endIndex);

      const { data: results, error } = await query;

      if (error) {
        console.error('Error fetching resorts:', error);
        return res.status(500).json({ error: 'Failed to fetch resorts' });
      }

      // Transform snake_case to camelCase for frontend compatibility
      const transformedResults = results.map((resort: any) => ({
        id: resort.id,
        name: resort.name,
        location: resort.location,
        capacity: resort.capacity,
        roomCount: resort.room_count,
        imageUrl: resort.image_url,
        description: resort.description,
        propertyMapUrl: resort.property_map_url,
        checkInTime: resort.check_in_time,
        checkOutTime: resort.check_out_time,
        createdAt: resort.created_at,
        updatedAt: resort.updated_at
      }));

      res.json(transformedResults);
    } catch (error) {
      console.error('Error fetching resorts:', error);
      res.status(500).json({ error: 'Failed to fetch resorts' });
    }
  });

  // Get resort by ID
  app.get("/api/resorts/:id", async (req, res) => {
    try {
      // Use Supabase Admin client
      const supabaseAdmin = getSupabaseAdmin();
      const { data: resort, error } = await supabaseAdmin
        .from('resorts')
        .select('*')
        .eq('id', Number(req.params.id))
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: "Resort not found" });
        }
        console.error('Error fetching resort:', error);
        return res.status(500).json({ error: 'Failed to fetch resort' });
      }

      if (!resort) {
        return res.status(404).json({ error: "Resort not found" });
      }

      // Transform snake_case to camelCase for frontend compatibility
      const transformedResort = {
        id: resort.id,
        name: resort.name,
        location: resort.location,
        capacity: resort.capacity,
        roomCount: resort.room_count,
        imageUrl: resort.image_url,
        description: resort.description,
        propertyMapUrl: resort.property_map_url,
        checkInTime: resort.check_in_time,
        checkOutTime: resort.check_out_time,
        createdAt: resort.created_at,
        updatedAt: resort.updated_at
      };

      res.json(transformedResort);
    } catch (error) {
      console.error('Error fetching resort:', error);
      res.status(500).json({ error: 'Failed to fetch resort' });
    }
  });

  // Create resort
  app.post("/api/resorts", requireContentEditor, auditLogger('admin.resort.create'), async (req: AuthenticatedRequest, res) => {
    try {
      // Check if Supabase admin is available
      if (!isSupabaseAdminAvailable()) {
        return res.status(503).json({
          error: 'Admin service not configured',
          details: 'Please configure SUPABASE_SERVICE_ROLE_KEY environment variable'
        });
      }

      // Validate required fields
      const { name, location } = req.body;
      if (!name) {
        return res.status(400).json({ error: 'Name is required' });
      }
      if (!location) {
        return res.status(400).json({ error: 'Location is required' });
      }

      // Prepare resort data with proper field names for database
      const resortData = {
        name: req.body.name,
        location: req.body.location,
        capacity: req.body.capacity || null,
        room_count: req.body.roomCount || null,
        image_url: req.body.imageUrl || null,
        description: req.body.description || null,
        property_map_url: req.body.propertyMapUrl || null,
        check_in_time: req.body.checkInTime || null,
        check_out_time: req.body.checkOutTime || null
      };

      // Use Supabase Admin client to bypass RLS
      const supabaseAdmin = getSupabaseAdmin();
      const { data: resort, error } = await supabaseAdmin
        .from('resorts')
        .insert(resortData)
        .select()
        .single();

      if (error) {
        handleSupabaseError(error, 'create resort');
      }

      if (!resort) {
        return res.status(500).json({ error: 'Failed to create resort' });
      }

      // Transform snake_case to camelCase for frontend compatibility
      const transformedResort = {
        id: resort.id,
        name: resort.name,
        location: resort.location,
        capacity: resort.capacity,
        roomCount: resort.room_count,
        imageUrl: resort.image_url,
        description: resort.description,
        propertyMapUrl: resort.property_map_url,
        checkInTime: resort.check_in_time,
        checkOutTime: resort.check_out_time,
        createdAt: resort.created_at,
        updatedAt: resort.updated_at
      };

      res.json(transformedResort);
    } catch (error: any) {
      console.error('Error creating resort:', error);
      res.status(500).json({
        error: error.message || 'Failed to create resort',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

  // Update resort
  app.put("/api/resorts/:id", requireContentEditor, validateParams(idParamSchema as any), auditLogger('admin.resort.update'), async (req: AuthenticatedRequest, res) => {
    try {
      // Check if Supabase admin is available
      if (!isSupabaseAdminAvailable()) {
        return res.status(503).json({
          error: 'Admin service not configured',
          details: 'Please configure SUPABASE_SERVICE_ROLE_KEY environment variable'
        });
      }

      // Build update data dynamically
      const updateData: any = {};
      if (req.body.name !== undefined) updateData.name = req.body.name;
      if (req.body.location !== undefined) updateData.location = req.body.location;
      if (req.body.capacity !== undefined) updateData.capacity = req.body.capacity;
      if (req.body.roomCount !== undefined) {
        updateData.room_count = req.body.roomCount || null;
      }
      if (req.body.imageUrl !== undefined) {
        updateData.image_url = req.body.imageUrl || null;
      }
      if (req.body.description !== undefined) updateData.description = req.body.description || null;
      if (req.body.propertyMapUrl !== undefined) {
        updateData.property_map_url = req.body.propertyMapUrl || null;
      }
      if (req.body.checkInTime !== undefined) {
        updateData.check_in_time = req.body.checkInTime || null;
      }
      if (req.body.checkOutTime !== undefined) {
        updateData.check_out_time = req.body.checkOutTime || null;
      }

      // Always update the updated_at timestamp
      updateData.updated_at = new Date().toISOString();

      // Use Supabase Admin client to bypass RLS
      const supabaseAdmin = getSupabaseAdmin();
      const { data: resort, error } = await supabaseAdmin
        .from('resorts')
        .update(updateData)
        .eq('id', Number(req.params.id))
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: "Resort not found" });
        }
        handleSupabaseError(error, 'update resort');
      }

      if (!resort) {
        return res.status(404).json({ error: "Resort not found" });
      }

      // Transform snake_case to camelCase for frontend compatibility
      const transformedResort = {
        id: resort.id,
        name: resort.name,
        location: resort.location,
        capacity: resort.capacity,
        roomCount: resort.room_count,
        imageUrl: resort.image_url,
        description: resort.description,
        propertyMapUrl: resort.property_map_url,
        checkInTime: resort.check_in_time,
        checkOutTime: resort.check_out_time,
        createdAt: resort.created_at,
        updatedAt: resort.updated_at
      };

      res.json(transformedResort);
    } catch (error: any) {
      console.error('Error updating resort:', error);
      res.status(500).json({
        error: error.message || 'Failed to update resort',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

  // Delete resort
  app.delete("/api/resorts/:id", requireContentEditor, auditLogger('admin.resort.delete'), async (req: AuthenticatedRequest, res) => {
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
        .from('resorts')
        .delete()
        .eq('id', Number(req.params.id));

      if (error) {
        handleSupabaseError(error, 'delete resort');
      }

      res.json({ message: "Resort deleted" });
    } catch (error: any) {
      console.error('Error deleting resort:', error);
      res.status(500).json({
        error: error.message || 'Failed to delete resort',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

  // ============ SHIPS RELATIONSHIP ENDPOINTS ============

  // Get ship's amenities
  app.get("/api/ships/:id/amenities", async (req, res) => {
    try {
      const shipId = Number(req.params.id);

      // Join ship_amenities with amenities to get full amenity details
      const results = await db.select({
        id: schema.amenities.id,
        name: schema.amenities.name,
        description: schema.amenities.description,
        createdAt: schema.amenities.createdAt,
        updatedAt: schema.amenities.updatedAt
      })
      .from(schema.shipAmenities)
      .innerJoin(schema.amenities, eq(schema.shipAmenities.amenityId, schema.amenities.id))
      .where(eq(schema.shipAmenities.shipId, shipId));

      // Transform snake_case to camelCase for frontend compatibility
      const transformedResults = results.map((amenity: any) => ({
        id: amenity.id,
        name: amenity.name,
        description: amenity.description,
        createdAt: amenity.createdAt,
        updatedAt: amenity.updatedAt
      }));

      res.json(transformedResults);
    } catch (error) {
      console.error('Error fetching ship amenities:', error);
      res.status(500).json({ error: 'Failed to fetch ship amenities' });
    }
  });

  // Update ship's amenities
  app.put("/api/ships/:id/amenities", requireContentEditor, auditLogger('admin.ship.amenities.update'), async (req: AuthenticatedRequest, res) => {
    try {
      // Check if Supabase admin is available
      if (!isSupabaseAdminAvailable()) {
        return res.status(503).json({
          error: 'Admin service not configured',
          details: 'Please configure SUPABASE_SERVICE_ROLE_KEY environment variable'
        });
      }

      const shipId = Number(req.params.id);
      const { amenityIds = [] } = req.body;

      if (!Array.isArray(amenityIds)) {
        return res.status(400).json({ error: 'amenityIds must be an array' });
      }

      const supabaseAdmin = getSupabaseAdmin();

      // First, remove all existing amenities for this ship
      const { error: deleteError } = await supabaseAdmin
        .from('ship_amenities')
        .delete()
        .eq('ship_id', shipId);

      if (deleteError) {
        handleSupabaseError(deleteError, 'remove ship amenities');
      }

      // Then, add the new amenities
      if (amenityIds.length > 0) {
        const insertData = amenityIds.map((amenityId: number) => ({
          ship_id: shipId,
          amenity_id: amenityId
        }));

        const { error: insertError } = await supabaseAdmin
          .from('ship_amenities')
          .insert(insertData);

        if (insertError) {
          handleSupabaseError(insertError, 'add ship amenities');
        }
      }

      res.json({ message: "Ship amenities updated successfully" });
    } catch (error: any) {
      console.error('Error updating ship amenities:', error);
      res.status(500).json({
        error: error.message || 'Failed to update ship amenities',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

  // Get ship's venues
  app.get("/api/ships/:id/venues", async (req, res) => {
    try {
      const shipId = Number(req.params.id);

      // Join ship_venues with venues and venue_types to get full venue details
      const results = await db.select({
        id: schema.venues.id,
        name: schema.venues.name,
        venue_type_id: schema.venues.venueTypeId,
        venue_type_name: schema.venueTypes.name,
        description: schema.venues.description,
        created_at: schema.venues.createdAt,
        updated_at: schema.venues.updatedAt
      })
      .from(schema.shipVenues)
      .innerJoin(schema.venues, eq(schema.shipVenues.venueId, schema.venues.id))
      .innerJoin(schema.venueTypes, eq(schema.venues.venueTypeId, schema.venueTypes.id))
      .where(eq(schema.shipVenues.shipId, shipId));

      // Transform snake_case to camelCase for frontend compatibility
      const transformedResults = results.map((venue: any) => ({
        id: venue.id,
        name: venue.name,
        venueTypeId: venue.venue_type_id,
        venueTypeName: venue.venue_type_name,
        description: venue.description,
        createdAt: venue.created_at,
        updatedAt: venue.updated_at
      }));

      res.json(transformedResults);
    } catch (error) {
      console.error('Error fetching ship venues:', error);
      res.status(500).json({ error: 'Failed to fetch ship venues' });
    }
  });

  // Update ship's venues
  app.put("/api/ships/:id/venues", requireContentEditor, auditLogger('admin.ship.venues.update'), async (req: AuthenticatedRequest, res) => {
    try {
      // Check if Supabase admin is available
      if (!isSupabaseAdminAvailable()) {
        return res.status(503).json({
          error: 'Admin service not configured',
          details: 'Please configure SUPABASE_SERVICE_ROLE_KEY environment variable'
        });
      }

      const shipId = Number(req.params.id);
      const { venueIds = [] } = req.body;

      if (!Array.isArray(venueIds)) {
        return res.status(400).json({ error: 'venueIds must be an array' });
      }

      const supabaseAdmin = getSupabaseAdmin();

      // First, remove all existing venues for this ship
      const { error: deleteError } = await supabaseAdmin
        .from('ship_venues')
        .delete()
        .eq('ship_id', shipId);

      if (deleteError) {
        handleSupabaseError(deleteError, 'remove ship venues');
      }

      // Then, add the new venues
      if (venueIds.length > 0) {
        const insertData = venueIds.map((venueId: number) => ({
          ship_id: shipId,
          venue_id: venueId
        }));

        const { error: insertError } = await supabaseAdmin
          .from('ship_venues')
          .insert(insertData);

        if (insertError) {
          handleSupabaseError(insertError, 'add ship venues');
        }
      }

      res.json({ message: "Ship venues updated successfully" });
    } catch (error: any) {
      console.error('Error updating ship venues:', error);
      res.status(500).json({
        error: error.message || 'Failed to update ship venues',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

  // ============ RESORTS RELATIONSHIP ENDPOINTS ============

  // Get resort's amenities
  app.get("/api/resorts/:id/amenities", async (req, res) => {
    try {
      const resortId = Number(req.params.id);

      // Join resort_amenities with amenities to get full amenity details
      const results = await db.select({
        id: schema.amenities.id,
        name: schema.amenities.name,
        description: schema.amenities.description,
        createdAt: schema.amenities.createdAt,
        updatedAt: schema.amenities.updatedAt
      })
      .from(schema.resortAmenities)
      .innerJoin(schema.amenities, eq(schema.resortAmenities.amenityId, schema.amenities.id))
      .where(eq(schema.resortAmenities.resortId, resortId));

      // Transform snake_case to camelCase for frontend compatibility
      const transformedResults = results.map((amenity: any) => ({
        id: amenity.id,
        name: amenity.name,
        description: amenity.description,
        createdAt: amenity.createdAt,
        updatedAt: amenity.updatedAt
      }));

      res.json(transformedResults);
    } catch (error) {
      console.error('Error fetching resort amenities:', error);
      res.status(500).json({ error: 'Failed to fetch resort amenities' });
    }
  });

  // Update resort's amenities
  app.put("/api/resorts/:id/amenities", requireContentEditor, auditLogger('admin.resort.amenities.update'), async (req: AuthenticatedRequest, res) => {
    try {
      // Check if Supabase admin is available
      if (!isSupabaseAdminAvailable()) {
        return res.status(503).json({
          error: 'Admin service not configured',
          details: 'Please configure SUPABASE_SERVICE_ROLE_KEY environment variable'
        });
      }

      const resortId = Number(req.params.id);
      const { amenityIds = [] } = req.body;

      if (!Array.isArray(amenityIds)) {
        return res.status(400).json({ error: 'amenityIds must be an array' });
      }

      const supabaseAdmin = getSupabaseAdmin();

      // First, remove all existing amenities for this resort
      const { error: deleteError } = await supabaseAdmin
        .from('resort_amenities')
        .delete()
        .eq('resort_id', resortId);

      if (deleteError) {
        handleSupabaseError(deleteError, 'remove resort amenities');
      }

      // Then, add the new amenities
      if (amenityIds.length > 0) {
        const insertData = amenityIds.map((amenityId: number) => ({
          resort_id: resortId,
          amenity_id: amenityId
        }));

        const { error: insertError } = await supabaseAdmin
          .from('resort_amenities')
          .insert(insertData);

        if (insertError) {
          handleSupabaseError(insertError, 'add resort amenities');
        }
      }

      res.json({ message: "Resort amenities updated successfully" });
    } catch (error: any) {
      console.error('Error updating resort amenities:', error);
      res.status(500).json({
        error: error.message || 'Failed to update resort amenities',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

  // Get resort's venues
  app.get("/api/resorts/:id/venues", async (req, res) => {
    try {
      const resortId = Number(req.params.id);

      // Join resort_venues with venues and venue_types to get full venue details
      const results = await db.select({
        id: schema.venues.id,
        name: schema.venues.name,
        venue_type_id: schema.venues.venueTypeId,
        venue_type_name: schema.venueTypes.name,
        description: schema.venues.description,
        created_at: schema.venues.createdAt,
        updated_at: schema.venues.updatedAt
      })
      .from(schema.resortVenues)
      .innerJoin(schema.venues, eq(schema.resortVenues.venueId, schema.venues.id))
      .innerJoin(schema.venueTypes, eq(schema.venues.venueTypeId, schema.venueTypes.id))
      .where(eq(schema.resortVenues.resortId, resortId));

      // Transform snake_case to camelCase for frontend compatibility
      const transformedResults = results.map((venue: any) => ({
        id: venue.id,
        name: venue.name,
        venueTypeId: venue.venue_type_id,
        venueTypeName: venue.venue_type_name,
        description: venue.description,
        createdAt: venue.created_at,
        updatedAt: venue.updated_at
      }));

      res.json(transformedResults);
    } catch (error) {
      console.error('Error fetching resort venues:', error);
      res.status(500).json({ error: 'Failed to fetch resort venues' });
    }
  });

  // Update resort's venues
  app.put("/api/resorts/:id/venues", requireContentEditor, auditLogger('admin.resort.venues.update'), async (req: AuthenticatedRequest, res) => {
    try {
      // Check if Supabase admin is available
      if (!isSupabaseAdminAvailable()) {
        return res.status(503).json({
          error: 'Admin service not configured',
          details: 'Please configure SUPABASE_SERVICE_ROLE_KEY environment variable'
        });
      }

      const resortId = Number(req.params.id);
      const { venueIds = [] } = req.body;

      if (!Array.isArray(venueIds)) {
        return res.status(400).json({ error: 'venueIds must be an array' });
      }

      const supabaseAdmin = getSupabaseAdmin();

      // First, remove all existing venues for this resort
      const { error: deleteError } = await supabaseAdmin
        .from('resort_venues')
        .delete()
        .eq('resort_id', resortId);

      if (deleteError) {
        handleSupabaseError(deleteError, 'remove resort venues');
      }

      // Then, add the new venues
      if (venueIds.length > 0) {
        const insertData = venueIds.map((venueId: number) => ({
          resort_id: resortId,
          venue_id: venueId
        }));

        const { error: insertError } = await supabaseAdmin
          .from('resort_venues')
          .insert(insertData);

        if (insertError) {
          handleSupabaseError(insertError, 'add resort venues');
        }
      }

      res.json({ message: "Resort venues updated successfully" });
    } catch (error: any) {
      console.error('Error updating resort venues:', error);
      res.status(500).json({
        error: error.message || 'Failed to update resort venues',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

}