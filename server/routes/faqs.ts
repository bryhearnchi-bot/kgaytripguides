import type { Express, Response } from 'express';
import { getSupabaseAdmin } from '../supabase-admin';
import { requireAuth, requireContentEditor, type AuthenticatedRequest } from '../auth';
import { validateBody, validateParams, idParamSchema } from '../middleware/validation';
import { z } from 'zod';
import { logger } from '../logging/logger';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiError } from '../utils/ApiError';

// Validation schemas
const createFaqSchema = z.object({
  question: z.string().min(1).max(500),
  answer: z.string().min(1),
  section_type: z.enum(['general', 'trip-specific', 'always']).default('general'),
});

const updateFaqSchema = createFaqSchema.partial();

const faqAssignmentSchema = z.object({
  trip_id: z.number().positive(),
  faq_id: z.number().positive(),
  order_index: z.number().nonnegative(),
});

const updateFaqAssignmentSchema = z.object({
  order_index: z.number().nonnegative(),
});

// Batch reorder schema for drag-and-drop
const batchReorderSchema = z.object({
  assignments: z.array(
    z.object({
      id: z.number().positive(),
      order_index: z.number().nonnegative(),
    })
  ),
});

export function registerFaqRoutes(app: Express) {
  // ============ FAQ MANAGEMENT ENDPOINTS ============

  // Get all FAQs (library view) - with optional type filtering
  app.get(
    '/api/faqs',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const supabaseAdmin = getSupabaseAdmin();
      const { type } = req.query;

      let query = supabaseAdmin.from('faqs').select('*').order('created_at', { ascending: false });

      if (type && ['general', 'trip-specific', 'always'].includes(type as string)) {
        query = query.eq('section_type', type);
      }

      const { data: faqs, error } = await query;

      if (error) {
        logger.error('Error fetching FAQs:', error, {
          method: req.method,
          path: req.path,
        });
        throw ApiError.internal('Failed to fetch FAQs');
      }

      return res.json(faqs || []);
    })
  );

  // Get only general (reusable) FAQs
  app.get(
    '/api/faqs/general',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const supabaseAdmin = getSupabaseAdmin();
      const { data: faqs, error } = await supabaseAdmin
        .from('faqs')
        .select('*')
        .eq('section_type', 'general')
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching general FAQs:', error, {
          method: req.method,
          path: req.path,
        });
        throw ApiError.internal('Failed to fetch general FAQs');
      }

      return res.json(faqs || []);
    })
  );

  // Get FAQs for a specific trip (via assignments)
  app.get(
    '/api/faqs/trip/:tripId',
    validateParams(z.object({ tripId: z.string().transform(Number) }) as any),
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const supabaseAdmin = getSupabaseAdmin();
      const { data: faqs, error } = await supabaseAdmin
        .from('trip_faq_assignments')
        .select(
          `
        id,
        order_index,
        faqs (
          id,
          question,
          answer,
          section_type,
          created_at,
          updated_at
        )
      `
        )
        .eq('trip_id', req.params.tripId as unknown as number)
        .order('order_index', { ascending: true });

      if (error) {
        logger.error('Error fetching trip FAQs:', error, {
          method: req.method,
          path: req.path,
        });
        throw ApiError.internal('Failed to fetch trip FAQs');
      }

      // Transform data to include assignment info
      const transformedFaqs = (faqs || []).map(assignment => ({
        ...(assignment.faqs as any),
        assignment: {
          id: assignment.id,
          trip_id: req.params.tripId,
          order_index: assignment.order_index,
        },
      }));

      return res.json(transformedFaqs);
    })
  );

  // Get FAQ by ID
  app.get(
    '/api/faqs/:id',
    validateParams(idParamSchema as any),
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const supabaseAdmin = getSupabaseAdmin();
      const { data: faq, error } = await supabaseAdmin
        .from('faqs')
        .select('*')
        .eq('id', parseInt(req.params.id ?? '0'))
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw ApiError.notFound('FAQ');
        }
        logger.error('Error fetching FAQ:', error, {
          method: req.method,
          path: req.path,
        });
        throw ApiError.internal('Failed to fetch FAQ');
      }

      return res.json(faq);
    })
  );

  // Create new FAQ
  app.post(
    '/api/faqs',
    requireContentEditor,
    validateBody(createFaqSchema),
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const supabaseAdmin = getSupabaseAdmin();
      const { data: faq, error } = await supabaseAdmin
        .from('faqs')
        .insert({
          question: req.body.question,
          answer: req.body.answer,
          section_type: req.body.section_type,
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating FAQ:', error, {
          method: req.method,
          path: req.path,
        });
        throw ApiError.internal('Failed to create FAQ');
      }

      return res.status(201).json(faq);
    })
  );

  // Update FAQ
  app.put(
    '/api/faqs/:id',
    requireContentEditor,
    validateParams(idParamSchema as any),
    validateBody(updateFaqSchema),
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const id = parseInt(req.params.id ?? '0');
      const supabaseAdmin = getSupabaseAdmin();

      const updateData: any = { updated_at: new Date().toISOString() };
      if (req.body.question !== undefined) updateData.question = req.body.question;
      if (req.body.answer !== undefined) updateData.answer = req.body.answer;
      if (req.body.section_type !== undefined) updateData.section_type = req.body.section_type;

      const { data: faq, error } = await supabaseAdmin
        .from('faqs')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw ApiError.notFound('FAQ');
        }
        logger.error('Error updating FAQ:', error, {
          method: req.method,
          path: req.path,
        });
        throw ApiError.internal('Failed to update FAQ');
      }

      return res.json(faq);
    })
  );

  // Delete FAQ
  app.delete(
    '/api/faqs/:id',
    requireContentEditor,
    validateParams(idParamSchema as any),
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const id = parseInt(req.params.id ?? '0');
      const supabaseAdmin = getSupabaseAdmin();

      const { error } = await supabaseAdmin.from('faqs').delete().eq('id', id);

      if (error) {
        logger.error('Error deleting FAQ:', error, {
          method: req.method,
          path: req.path,
        });
        throw ApiError.internal('Failed to delete FAQ');
      }

      return res.json({ message: 'FAQ deleted successfully' });
    })
  );

  // ============ ASSIGNMENT MANAGEMENT ENDPOINTS ============

  // Assign FAQ to trip
  app.post(
    '/api/trip-faq-assignments',
    requireContentEditor,
    validateBody(faqAssignmentSchema),
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const supabaseAdmin = getSupabaseAdmin();
      const { data: assignment, error } = await supabaseAdmin
        .from('trip_faq_assignments')
        .insert({
          trip_id: req.body.trip_id,
          faq_id: req.body.faq_id,
          order_index: req.body.order_index,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          // Unique constraint violation
          throw ApiError.conflict('FAQ already assigned to this trip');
        }
        logger.error('Error creating FAQ assignment:', error, {
          method: req.method,
          path: req.path,
        });
        throw ApiError.internal('Failed to assign FAQ to trip');
      }

      return res.status(201).json(assignment);
    })
  );

  // Batch reorder FAQ assignments (for drag-and-drop)
  app.put(
    '/api/trips/:tripId/faq-assignments/reorder',
    requireContentEditor,
    validateParams(z.object({ tripId: z.string().transform(Number) }) as any),
    validateBody(batchReorderSchema),
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const supabaseAdmin = getSupabaseAdmin();
      const tripId = req.params.tripId as unknown as number;
      const { assignments } = req.body;

      // Update all assignments in a transaction
      const updatePromises = assignments.map(
        assignment =>
          supabaseAdmin
            .from('trip_faq_assignments')
            .update({
              order_index: assignment.order_index,
              updated_at: new Date().toISOString(),
            })
            .eq('id', assignment.id)
            .eq('trip_id', tripId) // Ensure assignment belongs to this trip
      );

      const results = await Promise.all(updatePromises);

      // Check for errors
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        logger.error('Error batch reordering FAQ assignments:', errors[0].error, {
          method: req.method,
          path: req.path,
        });
        throw ApiError.internal('Failed to reorder FAQ assignments');
      }

      return res.json({ message: 'FAQ assignments reordered successfully' });
    })
  );

  // Update assignment order
  app.put(
    '/api/trip-faq-assignments/:id',
    requireContentEditor,
    validateParams(idParamSchema as any),
    validateBody(updateFaqAssignmentSchema),
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const id = parseInt(req.params.id ?? '0');
      const supabaseAdmin = getSupabaseAdmin();

      const { data: assignment, error } = await supabaseAdmin
        .from('trip_faq_assignments')
        .update({
          order_index: req.body.order_index,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw ApiError.notFound('FAQ Assignment');
        }
        logger.error('Error updating FAQ assignment:', error, {
          method: req.method,
          path: req.path,
        });
        throw ApiError.internal('Failed to update FAQ assignment');
      }

      return res.json(assignment);
    })
  );

  // Remove assignment (unassign FAQ from trip)
  app.delete(
    '/api/trip-faq-assignments/:id',
    requireContentEditor,
    validateParams(idParamSchema as any),
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const id = parseInt(req.params.id ?? '0');
      const supabaseAdmin = getSupabaseAdmin();

      const { error } = await supabaseAdmin.from('trip_faq_assignments').delete().eq('id', id);

      if (error) {
        logger.error('Error deleting FAQ assignment:', error, {
          method: req.method,
          path: req.path,
        });
        throw ApiError.internal('Failed to unassign FAQ');
      }

      return res.json({ message: 'FAQ unassigned successfully' });
    })
  );
}
