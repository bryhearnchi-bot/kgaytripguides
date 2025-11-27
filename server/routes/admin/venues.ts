/**
 * Venue Management Routes (New Structure)
 *
 * Manages ship_venues and resort_venues separately
 * - Ship venues belong to specific ships
 * - Resort venues belong to specific resorts
 * - No more global venues table or junction tables
 */

import type { Express, Response } from 'express';
import { requireTripAdmin, type AuthenticatedRequest } from '../../auth';
import { z } from 'zod';
import { logger } from '../../logging/logger';
import { asyncHandler } from '../../middleware/errorHandler';
import { ApiError } from '../../utils/ApiError';
import { getSupabaseAdmin } from '../../supabase-admin';

// Transform snake_case to camelCase for API responses
function transformVenueData(venue: any): any {
  if (!venue) return null;

  return {
    id: venue.id,
    shipId: venue.ship_id,
    resortId: venue.resort_id,
    name: venue.name,
    venueTypeId: venue.venue_type_id,
    venueTypeName: venue.venue_types?.name,
    description: venue.description,
    createdAt: venue.created_at,
    updatedAt: venue.updated_at,
  };
}

function transformVenueTypeData(venueType: any): any {
  if (!venueType) return null;

  return {
    id: venueType.id,
    name: venueType.name,
    createdAt: venueType.created_at,
    updatedAt: venueType.updated_at,
  };
}

// Validation schemas
const createShipVenueSchema = z.object({
  name: z.string().min(1).max(255),
  venueTypeId: z.number().int().min(1, 'Venue type is required'),
  description: z
    .string()
    .optional()
    .nullable()
    .transform(val => val || ''),
});

const createResortVenueSchema = z.object({
  name: z.string().min(1).max(255),
  venueTypeId: z.number().int().min(1, 'Venue type is required'),
  description: z
    .string()
    .optional()
    .nullable()
    .transform(val => val || ''),
});

const updateVenueSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  venueTypeId: z.number().int().min(1).optional(),
  description: z.string().optional().nullable(),
});

export function registerVenueRoutes(app: Express) {
  // ==================== VENUE TYPES (unchanged) ====================

  // Get all venue types
  app.get(
    '/api/admin/venue-types',
    requireTripAdmin,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const supabaseAdmin = await getSupabaseAdmin();

      const { data: venueTypes, error } = await supabaseAdmin
        .from('venue_types')
        .select('*')
        .order('name');

      if (error) {
        logger.error('Error fetching venue types', { error });
        throw ApiError.internal('Failed to fetch venue types');
      }

      return res.json(venueTypes?.map(transformVenueTypeData) || []);
    })
  );

  // ==================== SHIP VENUES ====================

  // Get all venues for a specific ship
  app.get(
    '/api/admin/ships/:shipId/venues',
    requireTripAdmin,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { shipId } = req.params;
      const supabaseAdmin = await getSupabaseAdmin();

      const { data: venues, error } = await supabaseAdmin
        .from('ship_venues')
        .select(
          `
        *,
        venue_types(*)
      `
        )
        .eq('ship_id', shipId)
        .order('name');

      if (error) {
        logger.error('Error fetching ship venues', { error, shipId });
        throw ApiError.internal('Failed to fetch ship venues');
      }

      return res.json(venues?.map(transformVenueData) || []);
    })
  );

  // Create a new ship venue
  app.post(
    '/api/admin/ships/:shipId/venues',
    requireTripAdmin,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { shipId } = req.params;
      const validation = createShipVenueSchema.safeParse(req.body);

      if (!validation.success) {
        throw ApiError.badRequest('Invalid venue data', { errors: validation.error.errors });
      }

      const { name, venueTypeId, description } = validation.data;
      const supabaseAdmin = await getSupabaseAdmin();

      if (!shipId) {
        throw ApiError.badRequest('shipId is required');
      }
      const { data: venue, error } = await supabaseAdmin
        .from('ship_venues')
        .insert({
          ship_id: parseInt(shipId),
          name,
          venue_type_id: venueTypeId,
          description: description || '',
        })
        .select(
          `
        *,
        venue_types(*)
      `
        )
        .single();

      if (error) {
        logger.error('Error creating ship venue', { error, shipId });
        throw ApiError.internal('Failed to create ship venue');
      }

      logger.info('Ship venue created', { venueId: venue.id, shipId, userId: req.user?.id });
      return res.status(201).json(transformVenueData(venue));
    })
  );

  // Update a ship venue
  app.put(
    '/api/admin/ships/:shipId/venues/:venueId',
    requireTripAdmin,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { shipId, venueId } = req.params;
      const validation = updateVenueSchema.safeParse(req.body);

      if (!validation.success) {
        throw ApiError.badRequest('Invalid venue data', { errors: validation.error.errors });
      }

      const supabaseAdmin = await getSupabaseAdmin();
      const updateData: any = { updated_at: new Date().toISOString() };

      if (validation.data.name !== undefined) updateData.name = validation.data.name;
      if (validation.data.venueTypeId !== undefined)
        updateData.venue_type_id = validation.data.venueTypeId;
      if (validation.data.description !== undefined)
        updateData.description = validation.data.description || '';

      const { data: venue, error } = await supabaseAdmin
        .from('ship_venues')
        .update(updateData)
        .eq('id', venueId)
        .eq('ship_id', shipId)
        .select(
          `
        *,
        venue_types(*)
      `
        )
        .single();

      if (error) {
        logger.error('Error updating ship venue', { error, venueId, shipId });
        throw ApiError.internal('Failed to update ship venue');
      }

      logger.info('Ship venue updated', { venueId, shipId, userId: req.user?.id });
      return res.json(transformVenueData(venue));
    })
  );

  // Delete a ship venue
  app.delete(
    '/api/admin/ships/:shipId/venues/:venueId',
    requireTripAdmin,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { shipId, venueId } = req.params;
      const supabaseAdmin = await getSupabaseAdmin();

      const { error } = await supabaseAdmin
        .from('ship_venues')
        .delete()
        .eq('id', venueId)
        .eq('ship_id', shipId);

      if (error) {
        logger.error('Error deleting ship venue', { error, venueId, shipId });
        throw ApiError.internal('Failed to delete ship venue');
      }

      logger.info('Ship venue deleted', { venueId, shipId, userId: req.user?.id });
      return res.status(204).send();
    })
  );

  // ==================== RESORT VENUES ====================

  // Get all venues for a specific resort
  app.get(
    '/api/admin/resorts/:resortId/venues',
    requireTripAdmin,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { resortId } = req.params;
      const supabaseAdmin = await getSupabaseAdmin();

      const { data: venues, error } = await supabaseAdmin
        .from('resort_venues')
        .select(
          `
        *,
        venue_types(*)
      `
        )
        .eq('resort_id', resortId)
        .order('name');

      if (error) {
        logger.error('Error fetching resort venues', { error, resortId });
        throw ApiError.internal('Failed to fetch resort venues');
      }

      return res.json(venues?.map(transformVenueData) || []);
    })
  );

  // Create a new resort venue
  app.post(
    '/api/admin/resorts/:resortId/venues',
    requireTripAdmin,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { resortId } = req.params;
      const validation = createResortVenueSchema.safeParse(req.body);

      if (!validation.success) {
        throw ApiError.badRequest('Invalid venue data', { errors: validation.error.errors });
      }

      const { name, venueTypeId, description } = validation.data;
      const supabaseAdmin = await getSupabaseAdmin();

      if (!resortId) {
        throw ApiError.badRequest('resortId is required');
      }
      const { data: venue, error } = await supabaseAdmin
        .from('resort_venues')
        .insert({
          resort_id: parseInt(resortId),
          name,
          venue_type_id: venueTypeId,
          description: description || '',
        })
        .select(
          `
        *,
        venue_types(*)
      `
        )
        .single();

      if (error) {
        logger.error('Error creating resort venue', { error, resortId });
        throw ApiError.internal('Failed to create resort venue');
      }

      logger.info('Resort venue created', { venueId: venue.id, resortId, userId: req.user?.id });
      return res.status(201).json(transformVenueData(venue));
    })
  );

  // Update a resort venue
  app.put(
    '/api/admin/resorts/:resortId/venues/:venueId',
    requireTripAdmin,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { resortId, venueId } = req.params;
      const validation = updateVenueSchema.safeParse(req.body);

      if (!validation.success) {
        throw ApiError.badRequest('Invalid venue data', { errors: validation.error.errors });
      }

      const supabaseAdmin = await getSupabaseAdmin();
      const updateData: any = { updated_at: new Date().toISOString() };

      if (validation.data.name !== undefined) updateData.name = validation.data.name;
      if (validation.data.venueTypeId !== undefined)
        updateData.venue_type_id = validation.data.venueTypeId;
      if (validation.data.description !== undefined)
        updateData.description = validation.data.description || '';

      const { data: venue, error } = await supabaseAdmin
        .from('resort_venues')
        .update(updateData)
        .eq('id', venueId)
        .eq('resort_id', resortId)
        .select(
          `
        *,
        venue_types(*)
      `
        )
        .single();

      if (error) {
        logger.error('Error updating resort venue', { error, venueId, resortId });
        throw ApiError.internal('Failed to update resort venue');
      }

      logger.info('Resort venue updated', { venueId, resortId, userId: req.user?.id });
      return res.json(transformVenueData(venue));
    })
  );

  // Delete a resort venue
  app.delete(
    '/api/admin/resorts/:resortId/venues/:venueId',
    requireTripAdmin,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { resortId, venueId } = req.params;
      const supabaseAdmin = await getSupabaseAdmin();

      const { error } = await supabaseAdmin
        .from('resort_venues')
        .delete()
        .eq('id', venueId)
        .eq('resort_id', resortId);

      if (error) {
        logger.error('Error deleting resort venue', { error, venueId, resortId });
        throw ApiError.internal('Failed to delete resort venue');
      }

      logger.info('Resort venue deleted', { venueId, resortId, userId: req.user?.id });
      return res.status(204).send();
    })
  );
}
