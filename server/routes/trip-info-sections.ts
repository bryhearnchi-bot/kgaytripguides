import type { Express, Response } from 'express';
import { getSupabaseAdmin } from '../supabase-admin';
import { requireAuth, requireContentEditor, type AuthenticatedRequest } from '../auth';
import { validateBody, validateParams, idParamSchema } from '../middleware/validation';
import { z } from 'zod';
import { logger } from '../logging/logger';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiError } from '../utils/ApiError';

// Validation schemas for new structure (using underscores to match database)
const createSectionSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().optional().nullable(),
  section_type: z.enum(['trip_specific', 'general', 'always']),
  updated_by: z.string().optional().nullable(),
});

const updateSectionSchema = createSectionSchema.partial();

const assignmentSchema = z.object({
  trip_id: z.number().positive(),
  section_id: z.number().positive(),
  order_index: z.number().positive(),
});

const updateAssignmentSchema = z.object({
  order_index: z.number().positive(),
});

// Legacy schema for backward compatibility
const createTripInfoSectionSchema = z.object({
  trip_id: z.number().positive(),
  title: z.string().min(1).max(255),
  content: z.string().optional().nullable(),
  order_index: z.number().positive().default(1),
  updated_by: z.string().optional().nullable(),
});

export function registerTripInfoSectionRoutes(app: Express) {
  // ============ SECTION MANAGEMENT ENDPOINTS ============

  // Get all sections (library view) - with optional type filtering
  app.get(
    '/api/trip-info-sections',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const supabaseAdmin = getSupabaseAdmin();
      const { type } = req.query;

      let query = supabaseAdmin
        .from('trip_info_sections')
        .select('*')
        .order('title', { ascending: true });

      if (type && (type === 'general' || type === 'trip_specific')) {
        query = query.eq('section_type', type);
      }

      const { data: sections, error } = await query;

      if (error) {
        logger.error('Error fetching trip info sections:', error, {
          method: req.method,
          path: req.path,
        });
        throw ApiError.internal('Failed to fetch trip info sections');
      }

      return res.json(sections || []);
    })
  );

  // Get only general (reusable) sections
  app.get(
    '/api/trip-info-sections/general',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const supabaseAdmin = getSupabaseAdmin();
      const { data: sections, error } = await supabaseAdmin
        .from('trip_info_sections')
        .select('*')
        .eq('section_type', 'general')
        .order('title', { ascending: true });

      if (error) {
        logger.error('Error fetching general sections:', error, {
          method: req.method,
          path: req.path,
        });
        throw ApiError.internal('Failed to fetch general sections');
      }

      return res.json(sections || []);
    })
  );

  // Get ALL sections for a specific trip (comprehensive view)
  // Returns: trip_specific + always + general (if assigned)
  app.get(
    '/api/trip-info-sections/trip/:tripId/all',
    validateParams(z.object({ tripId: z.string().transform(Number) }) as any),
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const supabaseAdmin = getSupabaseAdmin();
      const tripId = req.params.tripId as unknown as number;

      // Query that gets:
      // 1. All "always" sections (appear on every trip)
      // 2. All sections assigned to this specific trip (trip_specific or general)
      const { data: sections, error } = await supabaseAdmin.rpc('get_trip_sections_comprehensive', {
        p_trip_id: tripId,
      });

      if (error) {
        logger.error('Error fetching comprehensive trip sections:', error, {
          method: req.method,
          path: req.path,
          tripId,
        });
        throw ApiError.internal('Failed to fetch trip sections');
      }

      return res.json(sections || []);
    })
  );

  // Get sections for a specific trip (via assignments only - legacy)
  app.get(
    '/api/trip-info-sections/trip/:tripId',
    validateParams(z.object({ tripId: z.string().transform(Number) }) as any),
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const supabaseAdmin = getSupabaseAdmin();
      const { data: sections, error } = await supabaseAdmin
        .from('trip_section_assignments')
        .select(
          `
        id,
        order_index,
        trip_info_sections (
          id,
          title,
          content,
          section_type,
          updated_by,
          updated_at
        )
      `
        )
        .eq('trip_id', req.params.tripId as unknown as number)
        .order('order_index', { ascending: true });

      if (error) {
        logger.error('Error fetching trip sections:', error, {
          method: req.method,
          path: req.path,
        });
        throw ApiError.internal('Failed to fetch trip sections');
      }

      // Transform data to include assignment info
      const transformedSections = (sections || []).map(assignment => ({
        ...assignment.trip_info_sections,
        assignment: {
          id: assignment.id,
          trip_id: req.params.tripId,
          order_index: assignment.order_index,
        },
      }));

      return res.json(transformedSections);
    })
  );

  // Get section by ID
  app.get(
    '/api/trip-info-sections/:id',
    validateParams(idParamSchema as any),
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const supabaseAdmin = getSupabaseAdmin();
      const { data: section, error } = await supabaseAdmin
        .from('trip_info_sections')
        .select('*')
        .eq('id', parseInt(req.params.id ?? '0'))
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw ApiError.notFound('Trip info section');
        }
        logger.error('Error fetching trip info section:', error, {
          method: req.method,
          path: req.path,
        });
        throw ApiError.internal('Failed to fetch trip info section');
      }

      return res.json(section);
    })
  );

  // Create new section
  app.post(
    '/api/trip-info-sections',
    requireContentEditor,
    validateBody(createSectionSchema),
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      logger.info('🔵 POST /api/trip-info-sections - Received body:', { body: req.body });

      const supabaseAdmin = getSupabaseAdmin();
      const insertData = {
        title: req.body.title,
        content: req.body.content,
        section_type: req.body.section_type,
        updated_by: req.body.updated_by,
        trip_id: null, // New sections are not tied to specific trips
      };

      logger.info('🔵 POST /api/trip-info-sections - Inserting data:', { insertData });

      const { data: section, error } = await supabaseAdmin
        .from('trip_info_sections')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        logger.error('❌ POST /api/trip-info-sections - Database error:', { error, insertData });
        throw ApiError.internal('Failed to create trip info section');
      }

      logger.info('✅ POST /api/trip-info-sections - Section created:', { section });
      return res.status(201).json(section);
    })
  );

  // Update section
  app.put(
    '/api/trip-info-sections/:id',
    requireContentEditor,
    validateParams(idParamSchema as any),
    validateBody(updateSectionSchema),
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const id = parseInt(req.params.id ?? '0');
      const supabaseAdmin = getSupabaseAdmin();

      const updateData: any = { updated_at: new Date().toISOString() };
      if (req.body.title !== undefined) updateData.title = req.body.title;
      if (req.body.content !== undefined) updateData.content = req.body.content;
      if (req.body.section_type !== undefined) updateData.section_type = req.body.section_type;
      if (req.body.updated_by !== undefined) updateData.updated_by = req.body.updated_by;

      const { data: section, error } = await supabaseAdmin
        .from('trip_info_sections')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw ApiError.notFound('Trip info section');
        }
        logger.error('Error updating trip info section:', error, {
          method: req.method,
          path: req.path,
        });
        throw ApiError.internal('Failed to update trip info section');
      }

      return res.json(section);
    })
  );

  // Delete section
  app.delete(
    '/api/trip-info-sections/:id',
    requireContentEditor,
    validateParams(idParamSchema as any),
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const id = parseInt(req.params.id ?? '0');
      const supabaseAdmin = getSupabaseAdmin();

      const { error } = await supabaseAdmin.from('trip_info_sections').delete().eq('id', id);

      if (error) {
        logger.error('Error deleting trip info section:', error, {
          method: req.method,
          path: req.path,
        });
        throw ApiError.internal('Failed to delete trip info section');
      }

      return res.json({ message: 'Trip info section deleted successfully' });
    })
  );

  // ============ ASSIGNMENT MANAGEMENT ENDPOINTS ============

  // Assign section to trip
  app.post(
    '/api/trip-section-assignments',
    requireContentEditor,
    validateBody(assignmentSchema),
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const supabaseAdmin = getSupabaseAdmin();
      const { data: assignment, error } = await supabaseAdmin
        .from('trip_section_assignments')
        .insert({
          trip_id: req.body.trip_id,
          section_id: req.body.section_id,
          order_index: req.body.order_index,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          // Unique constraint violation
          throw ApiError.conflict('Section already assigned to this trip');
        }
        logger.error('Error creating assignment:', error, {
          method: req.method,
          path: req.path,
        });
        throw ApiError.internal('Failed to assign section to trip');
      }

      return res.status(201).json(assignment);
    })
  );

  // Batch reorder trip section assignments (for drag-and-drop)
  app.put(
    '/api/trips/:tripId/section-assignments/reorder',
    requireContentEditor,
    validateParams(z.object({ tripId: z.string().transform(Number) }) as any),
    validateBody(
      z.object({
        assignments: z.array(
          z.object({
            id: z.number().positive(),
            order_index: z.number().nonnegative(),
          })
        ),
      })
    ),
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const supabaseAdmin = getSupabaseAdmin();
      const tripId = req.params.tripId as unknown as number;
      const { assignments } = req.body;

      // Update all assignments in a transaction
      const updatePromises = assignments.map(assignment =>
        supabaseAdmin
          .from('trip_section_assignments')
          .update({
            order_index: assignment.order_index,
            updated_at: new Date().toISOString(),
          })
          .eq('id', assignment.id)
          .eq('trip_id', tripId)
      );

      const results = await Promise.all(updatePromises);

      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        logger.error('Error batch reordering section assignments:', errors[0].error, {
          method: req.method,
          path: req.path,
        });
        throw ApiError.internal('Failed to reorder section assignments');
      }

      return res.json({ message: 'Section assignments reordered successfully' });
    })
  );

  // Update assignment order
  app.put(
    '/api/trip-section-assignments/:id',
    requireContentEditor,
    validateParams(idParamSchema as any),
    validateBody(updateAssignmentSchema),
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const id = parseInt(req.params.id ?? '0');
      const supabaseAdmin = getSupabaseAdmin();

      const { data: assignment, error } = await supabaseAdmin
        .from('trip_section_assignments')
        .update({
          order_index: req.body.order_index,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw ApiError.notFound('Assignment');
        }
        logger.error('Error updating assignment:', error, {
          method: req.method,
          path: req.path,
        });
        throw ApiError.internal('Failed to update assignment');
      }

      return res.json(assignment);
    })
  );

  // Remove assignment (unassign section from trip)
  app.delete(
    '/api/trip-section-assignments/:id',
    requireContentEditor,
    validateParams(idParamSchema as any),
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const id = parseInt(req.params.id ?? '0');
      const supabaseAdmin = getSupabaseAdmin();

      const { error } = await supabaseAdmin.from('trip_section_assignments').delete().eq('id', id);

      if (error) {
        logger.error('Error deleting assignment:', error, {
          method: req.method,
          path: req.path,
        });
        throw ApiError.internal('Failed to unassign section');
      }

      return res.json({ message: 'Section unassigned successfully' });
    })
  );

  // ============ LEGACY ENDPOINTS (for backward compatibility) ============

  // Legacy create endpoint - automatically creates assignment
  app.post(
    '/api/trip-info-sections/legacy',
    requireContentEditor,
    validateBody(createTripInfoSectionSchema),
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const supabaseAdmin = getSupabaseAdmin();

      // Create the section
      const { data: section, error: sectionError } = await supabaseAdmin
        .from('trip_info_sections')
        .insert({
          title: req.body.title,
          content: req.body.content,
          section_type: 'trip_specific',
          updated_by: req.body.updated_by,
          trip_id: req.body.trip_id, // Keep for reference
        })
        .select()
        .single();

      if (sectionError) {
        logger.error('Error creating trip info section:', sectionError, {
          method: req.method,
          path: req.path,
        });
        throw ApiError.internal('Failed to create trip info section');
      }

      // Create the assignment
      const { data: assignment, error: assignmentError } = await supabaseAdmin
        .from('trip_section_assignments')
        .insert({
          trip_id: req.body.trip_id,
          section_id: section.id,
          order_index: req.body.order_index,
        })
        .select()
        .single();

      if (assignmentError) {
        logger.error('Error creating assignment:', assignmentError, {
          method: req.method,
          path: req.path,
        });
        throw ApiError.internal('Failed to create assignment');
      }

      return res.status(201).json({ section, assignment });
    })
  );
}
