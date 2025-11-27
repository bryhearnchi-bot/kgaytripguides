import type { Express, Response } from 'express';
import { getSupabaseAdmin } from '../supabase-admin';
import { requireAuth, requireContentEditor, type AuthenticatedRequest } from '../auth';
import { validateBody, validateParams, idParamSchema } from '../middleware/validation';
import { z } from 'zod';
import { logger } from '../logging/logger';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiError } from '../utils/ApiError';

// Validation schemas
const createUpdateSchema = z.object({
  trip_id: z.number().positive(),
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  update_type: z.enum([
    'new_cruise',
    'party_themes_released',
    'guide_updated',
    'guide_live',
    'new_event',
    'new_artist',
    'schedule_updated',
    'ship_info_updated',
    'custom',
  ]),
  custom_title: z.string().max(200).optional(),
  link_section: z
    .enum(['overview', 'events', 'artists', 'schedule', 'faqs', 'ship', 'none'])
    .default('none'),
  show_on_homepage: z.boolean().default(false),
  order_index: z.number().nonnegative(),
});

const updateUpdateSchema = createUpdateSchema.partial().omit({ trip_id: true });

// Batch reorder schema for drag-and-drop
const batchReorderSchema = z.object({
  updates: z.array(
    z.object({
      id: z.number().positive(),
      order_index: z.number().nonnegative(),
    })
  ),
});

export function registerUpdateRoutes(app: Express) {
  // ============ UPDATE MANAGEMENT ENDPOINTS ============

  // Get updates for a specific trip
  app.get(
    '/api/trips/:tripId/updates',
    validateParams(z.object({ tripId: z.string().transform(Number) }) as any),
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const supabaseAdmin = getSupabaseAdmin();
      const { data: updates, error } = await supabaseAdmin
        .from('updates')
        .select('*')
        .eq('trip_id', req.params.tripId as unknown as number)
        .order('order_index', { ascending: true });

      if (error) {
        logger.error('Error fetching trip updates:', error, {
          method: req.method,
          path: req.path,
        });
        throw ApiError.internal('Failed to fetch trip updates');
      }

      return res.json(updates || []);
    })
  );

  // Get ALL updates across all trips (for global notifications)
  app.get(
    '/api/updates/all',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const supabaseAdmin = getSupabaseAdmin();
      const limit = parseInt(req.query.limit as string) || 50;

      // Get all updates
      const { data: updates, error: updatesError } = await supabaseAdmin
        .from('updates')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (updatesError) {
        logger.error('Error fetching all updates:', {
          error: updatesError,
          errorMessage: updatesError.message,
          errorHint: updatesError.hint,
          method: req.method,
          path: req.path,
        });
        throw ApiError.internal(
          `Failed to fetch updates: ${updatesError.message || 'Unknown error'}`
        );
      }

      if (!updates || updates.length === 0) {
        return res.json([]);
      }

      // Get trip details for these updates
      const tripIds = Array.from(new Set(updates.map(u => u.trip_id)));
      const { data: trips, error: tripsError } = await supabaseAdmin
        .from('trips')
        .select('id, slug, name, start_date')
        .in('id', tripIds);

      if (tripsError) {
        logger.error('Error fetching trip details for updates:', {
          error: JSON.stringify(tripsError),
          method: req.method,
          path: req.path,
        });
        throw ApiError.internal('Failed to fetch trip details');
      }

      // Combine updates with trip data
      const tripsMap = new Map(trips?.map(t => [t.id, t]) || []);
      const updatesWithTrips = updates.map(update => {
        const trip = tripsMap.get(update.trip_id);
        return {
          ...update,
          trip_name: trip?.name,
          trip_slug: trip?.slug,
          start_date: trip?.start_date,
        };
      });

      return res.json(updatesWithTrips);
    })
  );

  // Get updates that should appear on homepage
  app.get(
    '/api/updates/homepage',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const supabaseAdmin = getSupabaseAdmin();
      const limit = parseInt(req.query.limit as string) || 3;

      // First get updates - try very simple query first
      logger.info('Attempting to fetch homepage updates');
      const { data: updates, error: updatesError } = await supabaseAdmin
        .from('updates')
        .select('*')
        .eq('show_on_homepage', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      logger.info('Updates query result:', {
        hasData: !!updates,
        hasError: !!updatesError,
        updatesCount: updates?.length || 0,
      });

      if (updatesError) {
        logger.error('Error fetching homepage updates:', {
          error: updatesError,
          errorMessage: updatesError.message,
          errorHint: updatesError.hint,
          method: req.method,
          path: req.path,
        });
        throw ApiError.internal(
          `Failed to fetch homepage updates: ${updatesError.message || 'Unknown error'}`
        );
      }

      if (!updates || updates.length === 0) {
        return res.json([]);
      }

      // Get trip details for these updates
      const tripIds = updates.map(u => u.trip_id);
      const { data: trips, error: tripsError } = await supabaseAdmin
        .from('trips')
        .select('id, slug, name')
        .in('id', tripIds);

      if (tripsError) {
        logger.error('Error fetching trip details for homepage updates:', {
          error: JSON.stringify(tripsError),
          method: req.method,
          path: req.path,
        });
        throw ApiError.internal('Failed to fetch trip details');
      }

      // Combine updates with trip data
      const tripsMap = new Map(trips?.map(t => [t.id, t]) || []);
      const updatesWithTrips = updates.map(update => ({
        ...update,
        trips: tripsMap.get(update.trip_id),
      }));

      return res.json(updatesWithTrips);
    })
  );

  // Get update by ID
  app.get(
    '/api/updates/:id',
    validateParams(idParamSchema as any),
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const supabaseAdmin = getSupabaseAdmin();
      const { data: update, error } = await supabaseAdmin
        .from('updates')
        .select('*')
        .eq('id', parseInt(req.params.id ?? '0'))
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw ApiError.notFound('Update');
        }
        logger.error('Error fetching update:', error, {
          method: req.method,
          path: req.path,
        });
        throw ApiError.internal('Failed to fetch update');
      }

      return res.json(update);
    })
  );

  // Create new update
  app.post(
    '/api/trips/:tripId/updates',
    requireContentEditor,
    validateParams(z.object({ tripId: z.string().transform(Number) }) as any),
    validateBody(createUpdateSchema.omit({ trip_id: true })),
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const supabaseAdmin = getSupabaseAdmin();
      const tripId = req.params.tripId as unknown as number;

      const { data: update, error } = await supabaseAdmin
        .from('updates')
        .insert({
          trip_id: tripId,
          title: req.body.title,
          description: req.body.description,
          update_type: req.body.update_type,
          custom_title: req.body.custom_title,
          link_section: req.body.link_section,
          show_on_homepage: req.body.show_on_homepage,
          order_index: req.body.order_index,
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating update:', error, {
          method: req.method,
          path: req.path,
        });
        throw ApiError.internal('Failed to create update');
      }

      return res.status(201).json(update);
    })
  );

  // Update an existing update
  app.put(
    '/api/updates/:id',
    requireContentEditor,
    validateParams(idParamSchema as any),
    validateBody(updateUpdateSchema),
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const id = parseInt(req.params.id ?? '0');
      const supabaseAdmin = getSupabaseAdmin();

      const updateData: any = { updated_at: new Date().toISOString() };
      if (req.body.title !== undefined) updateData.title = req.body.title;
      if (req.body.description !== undefined) updateData.description = req.body.description;
      if (req.body.update_type !== undefined) updateData.update_type = req.body.update_type;
      if (req.body.custom_title !== undefined) updateData.custom_title = req.body.custom_title;
      if (req.body.link_section !== undefined) updateData.link_section = req.body.link_section;
      if (req.body.show_on_homepage !== undefined)
        updateData.show_on_homepage = req.body.show_on_homepage;
      if (req.body.order_index !== undefined) updateData.order_index = req.body.order_index;

      const { data: update, error } = await supabaseAdmin
        .from('updates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw ApiError.notFound('Update');
        }
        logger.error('Error updating update:', error, {
          method: req.method,
          path: req.path,
        });
        throw ApiError.internal('Failed to update update');
      }

      return res.json(update);
    })
  );

  // Delete update
  app.delete(
    '/api/updates/:id',
    requireContentEditor,
    validateParams(idParamSchema as any),
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const id = parseInt(req.params.id ?? '0');
      const supabaseAdmin = getSupabaseAdmin();

      const { error } = await supabaseAdmin.from('updates').delete().eq('id', id);

      if (error) {
        logger.error('Error deleting update:', error, {
          method: req.method,
          path: req.path,
        });
        throw ApiError.internal('Failed to delete update');
      }

      return res.json({ message: 'Update deleted successfully' });
    })
  );

  // Batch reorder updates (for drag-and-drop)
  app.put(
    '/api/trips/:tripId/updates/reorder',
    requireContentEditor,
    validateParams(z.object({ tripId: z.string().transform(Number) }) as any),
    validateBody(batchReorderSchema),
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const supabaseAdmin = getSupabaseAdmin();
      const tripId = req.params.tripId as unknown as number;
      const { updates } = req.body;

      // Update all updates in parallel
      const updatePromises = updates.map(
        (update: { id: number; order_index: number }) =>
          supabaseAdmin
            .from('updates')
            .update({
              order_index: update.order_index,
              updated_at: new Date().toISOString(),
            })
            .eq('id', update.id)
            .eq('trip_id', tripId) // Ensure update belongs to this trip
      );

      const results = await Promise.all(updatePromises);

      // Check for errors
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        logger.error('Error batch reordering updates:', errors[0].error, {
          method: req.method,
          path: req.path,
        });
        throw ApiError.internal('Failed to reorder updates');
      }

      return res.json({ message: 'Updates reordered successfully' });
    })
  );
}
