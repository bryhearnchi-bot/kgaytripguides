import type { Express, Response } from "express";
import { requireAuth, requireContentEditor, requireSuperAdmin, type AuthenticatedRequest } from "../auth";
import { auditLogger } from "../logging/middleware";
import {
  validateBody,
  validateParams,
  idParamSchema
} from "../middleware/validation";
import {
  adminRateLimit
} from "../middleware/rate-limiting";
import { asyncHandler } from "../middleware/errorHandler";
import { ApiError } from "../utils/ApiError";
import { getSupabaseAdmin, handleSupabaseError, isSupabaseAdminAvailable } from "../supabase-admin";
import { logger } from "../logging/logger";

export function registerLocationRoutes(app: Express) {
  // ============ LOCATION ENDPOINTS ============

  // Get location statistics
  app.get("/api/locations/stats", asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Use Supabase Admin client
    const supabaseAdmin = getSupabaseAdmin();
    const { data: locations, error } = await supabaseAdmin
      .from('locations')
      .select('country');

    if (error) {
      logger.error('Error fetching location stats:', error, {
        method: req.method,
        path: req.path
      });
      throw ApiError.internal('Failed to fetch location statistics');
    }

    // Calculate stats from the results
    const total = locations?.length || 0;
    const byCountry = locations?.reduce((acc: Record<string, number>, loc: any) => {
      acc[loc.country] = (acc[loc.country] || 0) + 1;
      return acc;
    }, {}) || {};

    return res.json({ total, byCountry });
  }));

  // List all locations
  app.get("/api/locations", asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
      logger.error('Error fetching locations:', error, {
        method: req.method,
        path: req.path
      });
      throw ApiError.internal('Failed to fetch locations');
    }

    // Transform snake_case to camelCase for frontend compatibility
    const transformedResults = results.map((location: any) => ({
      id: location.id,
      name: location.name,
      location: location.location,
      country: location.country,
      city: location.city,
      state_province: location.state_province,
      country_code: location.country_code,
      description: location.description,
      imageUrl: location.image_url,
      createdAt: location.created_at,
      updatedAt: location.updated_at
    }));

    return res.json(transformedResults);
  }));

  // Get location by ID
  app.get("/api/locations/:id", asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Use Supabase Admin client
    const supabaseAdmin = getSupabaseAdmin();
    const { data: location, error } = await supabaseAdmin
      .from('locations')
      .select('*')
      .eq('id', Number(req.params.id))
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw ApiError.notFound('Location not found');
      }
      logger.error('Error fetching location:', error, {
        method: req.method,
        path: req.path
      });
      throw ApiError.internal('Failed to fetch location');
    }

    if (!location) {
      throw ApiError.notFound('Location not found');
    }

    // Transform snake_case to camelCase for frontend compatibility
    const transformedLocation = {
      id: location.id,
      name: location.name,
      location: location.location,
      country: location.country,
      city: location.city,
      state_province: location.state_province,
      country_code: location.country_code,
      coordinates: location.coordinates,
      description: location.description,
      imageUrl: location.image_url,
      createdAt: location.created_at,
      updatedAt: location.updated_at
    };

    return res.json(transformedLocation);
  }));

  // Create location
  app.post("/api/locations", requireContentEditor, auditLogger('admin.location.create'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Validate required fields
    if (!req.body.name || !req.body.country) {
      throw ApiError.badRequest('Name and country are required fields');
    }

    // Check if Supabase admin is available
    if (!isSupabaseAdminAvailable()) {
      throw ApiError.serviceUnavailable(
        'Admin service not configured',
        'Please configure SUPABASE_SERVICE_ROLE_KEY environment variable'
      );
    }

    // Prepare location data with proper field names
    const locationData = {
      name: req.body.name,
      location: req.body.location || null,
      country: req.body.country,
      city: req.body.city || null,
      state_province: req.body.state_province || null,
      country_code: req.body.country_code || null,
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
      logger.error('Supabase error creating location:', error, {
        method: req.method,
        path: req.path
      });
      if (error.code === '23505') {
        throw ApiError.conflict('A location with this name already exists');
      }
      if (error.code === '23502') {
        throw ApiError.badRequest('Missing required field');
      }
      throw ApiError.internal(error.message || 'Failed to create location');
    }

    if (!location) {
      throw ApiError.internal('Failed to create location');
    }

    // Transform snake_case to camelCase for frontend compatibility
    const transformedLocation = {
      id: location.id,
      name: location.name,
      location: location.location,
      country: location.country,
      city: location.city,
      state_province: location.state_province,
      country_code: location.country_code,
      coordinates: location.coordinates,
      description: location.description,
      imageUrl: location.image_url,
      createdAt: location.created_at,
      updatedAt: location.updated_at
    };

    return res.json(transformedLocation);
  }));

  // Update location
  app.put("/api/locations/:id", requireContentEditor, validateParams(idParamSchema as any), auditLogger('admin.location.update'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Check if Supabase admin is available
    if (!isSupabaseAdminAvailable()) {
      throw ApiError.serviceUnavailable(
        'Admin service not configured',
        'Please configure SUPABASE_SERVICE_ROLE_KEY environment variable'
      );
    }

    // Prepare update data with proper field names
    const updateData: any = {};
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.location !== undefined) updateData.location = req.body.location || null;
    if (req.body.country !== undefined) updateData.country = req.body.country;
    if (req.body.city !== undefined) updateData.city = req.body.city || null;
    if (req.body.state_province !== undefined) updateData.state_province = req.body.state_province || null;
    if (req.body.country_code !== undefined) updateData.country_code = req.body.country_code || null;
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
        throw ApiError.notFound('Location not found');
      }
      handleSupabaseError(error, 'update location');
    }

    if (!location) {
      throw ApiError.notFound('Location not found');
    }

    // Transform snake_case to camelCase for frontend compatibility
    const transformedLocation = {
      id: location.id,
      name: location.name,
      location: location.location,
      country: location.country,
      city: location.city,
      state_province: location.state_province,
      country_code: location.country_code,
      coordinates: location.coordinates,
      description: location.description,
      imageUrl: location.image_url,
      createdAt: location.created_at,
      updatedAt: location.updated_at
    };

    return res.json(transformedLocation);
  }));

  // Delete location
  app.delete("/api/locations/:id", requireContentEditor, auditLogger('admin.location.delete'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Check if Supabase admin is available
    if (!isSupabaseAdminAvailable()) {
      throw ApiError.serviceUnavailable(
        'Admin service not configured',
        'Please configure SUPABASE_SERVICE_ROLE_KEY environment variable'
      );
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

    return res.json({ message: "Location deleted" });
  }));

  // ============ SHIP ENDPOINTS ============

  // Get ship statistics
  app.get("/api/ships/stats", asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Use Supabase Admin client
    const supabaseAdmin = getSupabaseAdmin();
    const { data: ships, error } = await supabaseAdmin
      .from('ships')
      .select('capacity');

    if (error) {
      logger.error('Error fetching ship stats:', error, {
        method: req.method,
        path: req.path
      });
      throw ApiError.internal('Failed to fetch ship statistics');
    }

    const stats = {
      total: ships?.length || 0,
      totalCapacity: ships?.reduce((sum, ship) => sum + (ship.capacity || 0), 0) || 0,
      avgCapacity: ships?.length ?
        (ships.reduce((sum, ship) => sum + (ship.capacity || 0), 0) / ships.length) : 0
    };

    return res.json(stats);
  }));

  // List all ships
  app.get("/api/ships", asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
      logger.error('Error fetching ships:', error, {
        method: req.method,
        path: req.path
      });
      throw ApiError.internal('Failed to fetch ships');
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

    return res.json(transformedResults);
  }));

  // Get ship by ID
  app.get("/api/ships/:id", asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Use Supabase Admin client
    const supabaseAdmin = getSupabaseAdmin();
    const { data: ship, error } = await supabaseAdmin
      .from('ships')
      .select('*')
      .eq('id', Number(req.params.id))
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw ApiError.notFound('Ship not found');
      }
      logger.error('Error fetching ship:', error, {
        method: req.method,
        path: req.path
      });
      throw ApiError.internal('Failed to fetch ship');
    }

    if (!ship) {
      throw ApiError.notFound('Ship not found');
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

    return res.json(transformedShip);
  }));

  // Create ship
  app.post("/api/ships", requireContentEditor, auditLogger('admin.ship.create'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Check if Supabase admin is available
    if (!isSupabaseAdminAvailable()) {
      throw ApiError.serviceUnavailable(
        'Admin service not configured',
        'Please configure SUPABASE_SERVICE_ROLE_KEY environment variable'
      );
    }

    // Validate required fields (accept both camelCase and snake_case)
    const cruiseLine = req.body.cruiseLine || req.body.cruise_line;
    if (!req.body.name || !cruiseLine) {
      throw ApiError.badRequest('Name and cruise line are required fields');
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
      throw ApiError.internal('Failed to create ship');
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

    return res.json(transformedShip);
  }));

  // Update ship
  app.put("/api/ships/:id", requireContentEditor, validateParams(idParamSchema as any), auditLogger('admin.ship.update'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Check if Supabase admin is available
    if (!isSupabaseAdminAvailable()) {
      throw ApiError.serviceUnavailable(
        'Admin service not configured',
        'Please configure SUPABASE_SERVICE_ROLE_KEY environment variable'
      );
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
        throw ApiError.notFound('Ship not found');
      }
      handleSupabaseError(error, 'update ship');
    }

    if (!ship) {
      throw ApiError.notFound('Ship not found');
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

    return res.json(transformedShip);
  }));

  // Delete ship
  app.delete("/api/ships/:id", requireContentEditor, auditLogger('admin.ship.delete'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Check if Supabase admin is available
    if (!isSupabaseAdminAvailable()) {
      throw ApiError.serviceUnavailable(
        'Admin service not configured',
        'Please configure SUPABASE_SERVICE_ROLE_KEY environment variable'
      );
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

    return res.json({ message: "Ship deleted" });
  }));

  // ============ AMENITIES ENDPOINTS ============

  // Get amenities statistics
  app.get("/api/amenities/stats", asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Use Supabase Admin client
    const supabaseAdmin = getSupabaseAdmin();
    const { data: amenities, error } = await supabaseAdmin
      .from('amenities')
      .select('id');

    if (error) {
      logger.error('Error fetching amenities stats:', error, {
        method: req.method,
        path: req.path
      });
      throw ApiError.internal('Failed to fetch amenities statistics');
    }

    return res.json({ total: amenities?.length || 0 });
  }));

  // List all amenities
  app.get("/api/amenities", asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const {
      search = '',
      limit = '100',
      offset = '0'
    } = req.query;

    // Use Supabase Admin client
    const supabaseAdmin = getSupabaseAdmin();
    let query = supabaseAdmin
      .from('amenities')
      .select('*')
      .order('name');

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply pagination
    const startIndex = parseInt(offset as string);
    const endIndex = startIndex + parseInt(limit as string) - 1;
    query = query.range(startIndex, endIndex);

    const { data: results, error } = await query;

    if (error) {
      logger.error('Error fetching amenities:', error, {
        method: req.method,
        path: req.path
      });
      throw ApiError.internal('Failed to fetch amenities');
    }

    // Transform snake_case to camelCase for frontend compatibility
    const transformedResults = results.map((amenity: any) => ({
      id: amenity.id,
      name: amenity.name,
      description: amenity.description,
      createdAt: amenity.created_at,
      updatedAt: amenity.updated_at
    }));

    return res.json(transformedResults);
  }));

  // Get amenity by ID
  app.get("/api/amenities/:id", asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Use Supabase Admin client
    const supabaseAdmin = getSupabaseAdmin();
    const { data: amenity, error } = await supabaseAdmin
      .from('amenities')
      .select('*')
      .eq('id', Number(req.params.id))
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw ApiError.notFound('Amenity not found');
      }
      logger.error('Error fetching amenity:', error, {
        method: req.method,
        path: req.path
      });
      throw ApiError.internal('Failed to fetch amenity');
    }

    if (!amenity) {
      throw ApiError.notFound('Amenity not found');
    }

    // Transform snake_case to camelCase for frontend compatibility
    const transformedAmenity = {
      id: amenity.id,
      name: amenity.name,
      description: amenity.description,
      createdAt: amenity.created_at,
      updatedAt: amenity.updated_at
    };

    return res.json(transformedAmenity);
  }));

  // Create amenity
  app.post("/api/amenities", requireContentEditor, auditLogger('admin.amenity.create'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Check if Supabase admin is available
    if (!isSupabaseAdminAvailable()) {
      throw ApiError.serviceUnavailable(
        'Admin service not configured',
        'Please configure SUPABASE_SERVICE_ROLE_KEY environment variable'
      );
    }

    // Validate required fields
    const { name } = req.body;
    if (!name) {
      throw ApiError.badRequest('Name is required');
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
      throw ApiError.internal('Failed to create amenity');
    }

    // Transform snake_case to camelCase for frontend compatibility
    const transformedAmenity = {
      id: amenity.id,
      name: amenity.name,
      description: amenity.description,
      createdAt: amenity.created_at,
      updatedAt: amenity.updated_at
    };

    return res.json(transformedAmenity);
  }));

  // Update amenity
  app.put("/api/amenities/:id", requireContentEditor, validateParams(idParamSchema as any), auditLogger('admin.amenity.update'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Check if Supabase admin is available
    if (!isSupabaseAdminAvailable()) {
      throw ApiError.serviceUnavailable(
        'Admin service not configured',
        'Please configure SUPABASE_SERVICE_ROLE_KEY environment variable'
      );
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
        throw ApiError.notFound('Amenity not found');
      }
      handleSupabaseError(error, 'update amenity');
    }

    if (!amenity) {
      throw ApiError.notFound('Amenity not found');
    }

    // Transform snake_case to camelCase for frontend compatibility
    const transformedAmenity = {
      id: amenity.id,
      name: amenity.name,
      description: amenity.description,
      createdAt: amenity.created_at,
      updatedAt: amenity.updated_at
    };

    return res.json(transformedAmenity);
  }));

  // Delete amenity
  app.delete("/api/amenities/:id", requireContentEditor, auditLogger('admin.amenity.delete'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Check if Supabase admin is available
    if (!isSupabaseAdminAvailable()) {
      throw ApiError.serviceUnavailable(
        'Admin service not configured',
        'Please configure SUPABASE_SERVICE_ROLE_KEY environment variable'
      );
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

    return res.json({ message: "Amenity deleted" });
  }));

  // ============ VENUE TYPES ENDPOINTS ============

  // List all venue types (reference data)
  app.get("/api/venue-types", asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Use Supabase Admin client
    const supabaseAdmin = getSupabaseAdmin();
    const { data: results, error } = await supabaseAdmin
      .from('venue_types')
      .select('*')
      .order('name');

    if (error) {
      logger.error('Error fetching venue types:', error, {
        method: req.method,
        path: req.path
      });
      throw ApiError.internal('Failed to fetch venue types');
    }

    // Transform snake_case to camelCase for frontend compatibility
    const transformedResults = results.map((venueType: any) => ({
      id: venueType.id,
      name: venueType.name,
      createdAt: venueType.created_at,
      updatedAt: venueType.updated_at
    }));

    return res.json(transformedResults);
  }));

  // ============ VENUES ENDPOINTS ============

  // Get venues statistics
  app.get("/api/venues/stats", asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Use Supabase Admin client
    const supabaseAdmin = getSupabaseAdmin();
    const { data: venues, error } = await supabaseAdmin
      .from('venues')
      .select(`
        id,
        venue_type_id,
        venue_types!inner(name)
      `);

    if (error) {
      logger.error('Error fetching venues stats:', error, {
        method: req.method,
        path: req.path
      });
      throw ApiError.internal('Failed to fetch venues statistics');
    }

    const total = venues?.length || 0;
    const byType = venues?.reduce((acc: Record<string, number>, venue: any) => {
      const typeName = venue.venue_types?.name || 'Unknown';
      acc[typeName] = (acc[typeName] || 0) + 1;
      return acc;
    }, {}) || {};

    return res.json({ total, byType });
  }));

  // List all venues
  app.get("/api/venues", asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const {
      search = '',
      venueTypeId,
      limit = '100',
      offset = '0'
    } = req.query;

    // Use Supabase Admin client
    const supabaseAdmin = getSupabaseAdmin();
    let query = supabaseAdmin
      .from('venues')
      .select(`
        id,
        name,
        venue_type_id,
        description,
        created_at,
        updated_at,
        venue_types!inner(name)
      `)
      .order('name');

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }
    if (venueTypeId) {
      query = query.eq('venue_type_id', Number(venueTypeId));
    }

    // Apply pagination
    const startIndex = parseInt(offset as string);
    const endIndex = startIndex + parseInt(limit as string) - 1;
    query = query.range(startIndex, endIndex);

    const { data: results, error } = await query;

    if (error) {
      logger.error('Error fetching venues:', error, {
        method: req.method,
        path: req.path
      });
      throw ApiError.internal('Failed to fetch venues');
    }

    // Transform snake_case to camelCase for frontend compatibility
    const transformedResults = results.map((venue: any) => ({
      id: venue.id,
      name: venue.name,
      venueTypeId: venue.venue_type_id,
      venueTypeName: venue.venue_types?.name,
      description: venue.description,
      createdAt: venue.created_at,
      updatedAt: venue.updated_at
    }));

    return res.json(transformedResults);
  }));

  // Get venue by ID
  app.get("/api/venues/:id", asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Use Supabase Admin client
    const supabaseAdmin = getSupabaseAdmin();
    const { data: venue, error } = await supabaseAdmin
      .from('venues')
      .select(`
        id,
        name,
        venue_type_id,
        description,
        created_at,
        updated_at,
        venue_types!inner(name)
      `)
      .eq('id', Number(req.params.id))
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw ApiError.notFound('Venue not found');
      }
      logger.error('Error fetching venue:', error, {
        method: req.method,
        path: req.path
      });
      throw ApiError.internal('Failed to fetch venue');
    }

    if (!venue) {
      throw ApiError.notFound('Venue not found');
    }

    // Transform snake_case to camelCase for frontend compatibility
    const transformedVenue = {
      id: venue.id,
      name: venue.name,
      venueTypeId: venue.venue_type_id,
      venueTypeName: (venue.venue_types as any)?.name,
      description: venue.description,
      createdAt: venue.created_at,
      updatedAt: venue.updated_at
    };

    return res.json(transformedVenue);
  }));

  // Create venue
  app.post("/api/venues", requireContentEditor, auditLogger('admin.venue.create'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Check if Supabase admin is available
    if (!isSupabaseAdminAvailable()) {
      throw ApiError.serviceUnavailable(
        'Admin service not configured',
        'Please configure SUPABASE_SERVICE_ROLE_KEY environment variable'
      );
    }

    // Validate required fields
    const { name, venueTypeId } = req.body;
    if (!name) {
      throw ApiError.badRequest('Name is required');
    }
    if (!venueTypeId) {
      throw ApiError.badRequest('Venue type ID is required');
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
      throw ApiError.internal('Failed to create venue');
    }

    // Transform snake_case to camelCase for frontend compatibility
    const transformedVenue = {
      id: venue.id,
      name: venue.name,
      venueTypeId: venue.venue_type_id,
      venueTypeName: (venue.venue_types as any)?.name,
      description: venue.description,
      createdAt: venue.created_at,
      updatedAt: venue.updated_at
    };

    return res.json(transformedVenue);
  }));

  // Update venue
  app.put("/api/venues/:id", requireContentEditor, validateParams(idParamSchema as any), auditLogger('admin.venue.update'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Check if Supabase admin is available
    if (!isSupabaseAdminAvailable()) {
      throw ApiError.serviceUnavailable(
        'Admin service not configured',
        'Please configure SUPABASE_SERVICE_ROLE_KEY environment variable'
      );
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
        throw ApiError.notFound('Venue not found');
      }
      handleSupabaseError(error, 'update venue');
    }

    if (!venue) {
      throw ApiError.notFound('Venue not found');
    }

    // Transform snake_case to camelCase for frontend compatibility
    const transformedVenue = {
      id: venue.id,
      name: venue.name,
      venueTypeId: venue.venue_type_id,
      venueTypeName: (venue.venue_types as any)?.name,
      description: venue.description,
      createdAt: venue.created_at,
      updatedAt: venue.updated_at
    };

    return res.json(transformedVenue);
  }));

  // Delete venue
  app.delete("/api/venues/:id", requireContentEditor, auditLogger('admin.venue.delete'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Check if Supabase admin is available
    if (!isSupabaseAdminAvailable()) {
      throw ApiError.serviceUnavailable(
        'Admin service not configured',
        'Please configure SUPABASE_SERVICE_ROLE_KEY environment variable'
      );
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

    return res.json({ message: "Venue deleted" });
  }));

  // ============ RESORTS ENDPOINTS ============

  // Get resort statistics
  app.get("/api/resorts/stats", asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Use Supabase Admin client
    const supabaseAdmin = getSupabaseAdmin();
    const { data: resorts, error } = await supabaseAdmin
      .from('resorts')
      .select('capacity');

    if (error) {
      logger.error('Error fetching resort stats:', error, {
        method: req.method,
        path: req.path
      });
      throw ApiError.internal('Failed to fetch resort statistics');
    }

    const stats = {
      total: resorts?.length || 0,
      totalCapacity: resorts?.reduce((sum, resort) => sum + (resort.capacity || 0), 0) || 0,
      avgCapacity: resorts?.length ?
        (resorts.reduce((sum, resort) => sum + (resort.capacity || 0), 0) / resorts.length) : 0
    };

    return res.json(stats);
  }));

  // List all resorts
  app.get("/api/resorts", asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
      logger.error('Error fetching resorts:', error, {
        method: req.method,
        path: req.path
      });
      throw ApiError.internal('Failed to fetch resorts');
    }

    // Transform snake_case to camelCase for frontend compatibility
    const transformedResults = results.map((resort: any) => ({
      id: resort.id,
      name: resort.name,
      location: resort.location,
      city: resort.city,
      state_province: resort.state_province,
      country: resort.country,
      country_code: resort.country_code,
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

    return res.json(transformedResults);
  }));

  // Get resort by ID
  app.get("/api/resorts/:id", asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Use Supabase Admin client
    const supabaseAdmin = getSupabaseAdmin();
    const { data: resort, error } = await supabaseAdmin
      .from('resorts')
      .select('*')
      .eq('id', Number(req.params.id))
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw ApiError.notFound('Resort not found');
      }
      logger.error('Error fetching resort:', error, {
        method: req.method,
        path: req.path
      });
      throw ApiError.internal('Failed to fetch resort');
    }

    if (!resort) {
      throw ApiError.notFound('Resort not found');
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

    return res.json(transformedResort);
  }));

  // Create resort
  app.post("/api/resorts", requireContentEditor, auditLogger('admin.resort.create'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Check if Supabase admin is available
    if (!isSupabaseAdminAvailable()) {
      throw ApiError.serviceUnavailable(
        'Admin service not configured',
        'Please configure SUPABASE_SERVICE_ROLE_KEY environment variable'
      );
    }

    // Validate required fields
    const { name, country } = req.body;
    if (!name) {
      throw ApiError.badRequest('Name is required');
    }
    if (!country) {
      throw ApiError.badRequest('Country is required');
    }

    // Prepare resort data with proper field names for database
    const resortData = {
      name: req.body.name,
      location: req.body.location,
      city: req.body.city || null,
      state_province: req.body.state_province || null,
      country: req.body.country,
      country_code: req.body.country_code || null,
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
      throw ApiError.internal('Failed to create resort');
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

    return res.json(transformedResort);
  }));

  // Update resort
  app.put("/api/resorts/:id", requireContentEditor, validateParams(idParamSchema as any), auditLogger('admin.resort.update'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Check if Supabase admin is available
    if (!isSupabaseAdminAvailable()) {
      throw ApiError.serviceUnavailable(
        'Admin service not configured',
        'Please configure SUPABASE_SERVICE_ROLE_KEY environment variable'
      );
    }

      // Build update data dynamically
      const updateData: any = {};
      if (req.body.name !== undefined) updateData.name = req.body.name;
      if (req.body.location !== undefined) updateData.location = req.body.location;
      if (req.body.city !== undefined) updateData.city = req.body.city || null;
      if (req.body.state_province !== undefined) updateData.state_province = req.body.state_province || null;
      if (req.body.country !== undefined) updateData.country = req.body.country;
      if (req.body.country_code !== undefined) updateData.country_code = req.body.country_code || null;
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
          throw ApiError.notFound("Resort not found");
        }
        handleSupabaseError(error, 'update resort');
      }

      if (!resort) {
        throw ApiError.notFound("Resort not found");
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

      return res.json(transformedResort);
  }));

  // Delete resort
  app.delete("/api/resorts/:id", requireContentEditor, auditLogger('admin.resort.delete'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Check if Supabase admin is available
    if (!isSupabaseAdminAvailable()) {
      throw ApiError.serviceUnavailable("Admin service not configured", "Please configure SUPABASE_SERVICE_ROLE_KEY environment variable");
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

    return res.json({ message: "Resort deleted" });
  }));

  // ============ SHIPS RELATIONSHIP ENDPOINTS ============

  // Get ship's amenities
  app.get("/api/ships/:id/amenities", asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const shipId = Number(req.params.id);

    // Use Supabase Admin client
    const supabaseAdmin = getSupabaseAdmin();
    const { data: results, error } = await supabaseAdmin
      .from('ship_amenities')
      .select(`
        amenities!inner(
          id,
          name,
          description,
          created_at,
          updated_at
        )
      `)
      .eq('ship_id', shipId);

    if (error) {
      logger.error('Error fetching ship amenities:', error, {
        method: req.method,
        path: req.path
      });
      throw ApiError.internal("Failed to fetch ship amenities");
    }

    // Transform results to flat structure with camelCase
    const transformedResults = results?.map((item: any) => ({
      id: item.amenities.id,
      name: item.amenities.name,
      description: item.amenities.description,
      createdAt: item.amenities.created_at,
      updatedAt: item.amenities.updated_at
    })) || [];

    return res.json(transformedResults);
  }));

  // Update ship's amenities
  app.put("/api/ships/:id/amenities", requireContentEditor, auditLogger('admin.ship.amenities.update'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Check if Supabase admin is available
    if (!isSupabaseAdminAvailable()) {
      throw ApiError.serviceUnavailable("Admin service not configured", "Please configure SUPABASE_SERVICE_ROLE_KEY environment variable");
    }

    const shipId = Number(req.params.id);
    const { amenityIds = [] } = req.body;

    if (!Array.isArray(amenityIds)) {
      throw ApiError.badRequest("amenityIds must be an array");
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

    return res.json({ message: "Ship amenities updated successfully" });
  }));

  // Get ship's venues
  app.get("/api/ships/:id/venues", asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const shipId = Number(req.params.id);

    // Use Supabase Admin client
    const supabaseAdmin = getSupabaseAdmin();
    const { data: results, error } = await supabaseAdmin
      .from('ship_venues')
      .select(`
        venues!inner(
          id,
          name,
          venue_type_id,
          description,
          created_at,
          updated_at,
          venue_types!inner(name)
        )
      `)
      .eq('ship_id', shipId);

    if (error) {
      logger.error('Error fetching ship venues:', error, {
        method: req.method,
        path: req.path
      });
      throw ApiError.internal("Failed to fetch ship venues");
    }

    // Transform results to flat structure with camelCase
    const transformedResults = results?.map((item: any) => ({
      id: item.venues.id,
      name: item.venues.name,
      venueTypeId: item.venues.venue_type_id,
      venueTypeName: item.venues.venue_types?.name,
      description: item.venues.description,
      createdAt: item.venues.created_at,
      updatedAt: item.venues.updated_at
    })) || [];

    return res.json(transformedResults);
  }));

  // Update ship's venues
  app.put("/api/ships/:id/venues", requireContentEditor, auditLogger('admin.ship.venues.update'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Check if Supabase admin is available
    if (!isSupabaseAdminAvailable()) {
      throw ApiError.serviceUnavailable("Admin service not configured", "Please configure SUPABASE_SERVICE_ROLE_KEY environment variable");
    }

    const shipId = Number(req.params.id);
    const { venueIds = [] } = req.body;

    if (!Array.isArray(venueIds)) {
      throw ApiError.badRequest("venueIds must be an array");
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

    return res.json({ message: "Ship venues updated successfully" });
  }));

  // ============ RESORTS RELATIONSHIP ENDPOINTS ============

  // Get resort's amenities
  app.get("/api/resorts/:id/amenities", asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const resortId = Number(req.params.id);

    // Use Supabase Admin client
    const supabaseAdmin = getSupabaseAdmin();
    const { data: results, error } = await supabaseAdmin
      .from('resort_amenities')
      .select(`
        amenities!inner(
          id,
          name,
          description,
          created_at,
          updated_at
        )
      `)
      .eq('resort_id', resortId);

    if (error) {
      logger.error('Error fetching resort amenities:', error, {
        method: req.method,
        path: req.path
      });
      throw ApiError.internal("Failed to fetch resort amenities");
    }

    // Transform results to flat structure with camelCase
    const transformedResults = results?.map((item: any) => ({
      id: item.amenities.id,
      name: item.amenities.name,
      description: item.amenities.description,
      createdAt: item.amenities.created_at,
      updatedAt: item.amenities.updated_at
    })) || [];

    return res.json(transformedResults);
  }));

  // Update resort's amenities
  app.put("/api/resorts/:id/amenities", requireContentEditor, auditLogger('admin.resort.amenities.update'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Check if Supabase admin is available
    if (!isSupabaseAdminAvailable()) {
      throw ApiError.serviceUnavailable("Admin service not configured", "Please configure SUPABASE_SERVICE_ROLE_KEY environment variable");
    }

    const resortId = Number(req.params.id);
    const { amenityIds = [] } = req.body;

    if (!Array.isArray(amenityIds)) {
      throw ApiError.badRequest("amenityIds must be an array");
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

    return res.json({ message: "Resort amenities updated successfully" });
  }));

  // Get resort's venues
  app.get("/api/resorts/:id/venues", asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const resortId = Number(req.params.id);

    // Use Supabase Admin client
    const supabaseAdmin = getSupabaseAdmin();
    const { data: results, error } = await supabaseAdmin
      .from('resort_venues')
      .select(`
        venues!inner(
          id,
          name,
          venue_type_id,
          description,
          created_at,
          updated_at,
          venue_types!inner(name)
        )
      `)
      .eq('resort_id', resortId);

    if (error) {
      logger.error('Error fetching resort venues:', error, {
        method: req.method,
        path: req.path
      });
      throw ApiError.internal("Failed to fetch resort venues");
    }

    // Transform results to flat structure with camelCase
    const transformedResults = results?.map((item: any) => ({
      id: item.venues.id,
      name: item.venues.name,
      venueTypeId: item.venues.venue_type_id,
      venueTypeName: item.venues.venue_types?.name,
      description: item.venues.description,
      createdAt: item.venues.created_at,
      updatedAt: item.venues.updated_at
    })) || [];

    return res.json(transformedResults);
  }));

  // Update resort's venues
  app.put("/api/resorts/:id/venues", requireContentEditor, auditLogger('admin.resort.venues.update'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Check if Supabase admin is available
    if (!isSupabaseAdminAvailable()) {
      throw ApiError.serviceUnavailable("Admin service not configured", "Please configure SUPABASE_SERVICE_ROLE_KEY environment variable");
    }

    const resortId = Number(req.params.id);
    const { venueIds = [] } = req.body;

    if (!Array.isArray(venueIds)) {
      throw ApiError.badRequest("venueIds must be an array");
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

    return res.json({ message: "Resort venues updated successfully" });
  }));

}