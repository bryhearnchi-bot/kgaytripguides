import type { Express } from "express";
import { getSupabaseAdmin } from "../supabase-admin";
import { requireAuth, requireContentEditor, type AuthenticatedRequest } from "../auth";
import {
  validateBody,
  validateParams,
  idParamSchema
} from "../middleware/validation";
import { z } from "zod";

// Validation schemas
const createTripInfoSectionSchema = z.object({
  trip_id: z.number().positive(),
  title: z.string().min(1).max(255),
  content: z.string().optional().nullable(),
  order_index: z.number().positive().default(1),
  updated_by: z.string().optional().nullable()
});

const updateTripInfoSectionSchema = createTripInfoSectionSchema.partial();

export function registerTripInfoSectionRoutes(app: Express) {
  // ============ TRIP INFO SECTION ENDPOINTS ============

  // Get all trip info sections
  app.get("/api/trip-info-sections", async (req, res) => {
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data: sections, error } = await supabaseAdmin
        .from('trip_info_sections')
        .select('*')
        .order('order_index', { ascending: true })
        .order('title', { ascending: true });

      if (error) {
        console.error('Error fetching trip info sections:', error);
        return res.status(500).json({ error: 'Failed to fetch trip info sections' });
      }

      res.json(sections || []);
    } catch (error) {
      console.error('Error fetching trip info sections:', error);
      res.status(500).json({ error: 'Failed to fetch trip info sections' });
    }
  });

  // Get trip info sections for a specific trip
  app.get("/api/trip-info-sections/trip/:tripId", validateParams(z.object({ tripId: z.string().transform(Number) })), async (req, res) => {
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data: sections, error } = await supabaseAdmin
        .from('trip_info_sections')
        .select('*')
        .eq('trip_id', req.params.tripId as unknown as number)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error fetching trip info sections for trip:', error);
        return res.status(500).json({ error: 'Failed to fetch trip info sections' });
      }

      res.json(sections || []);
    } catch (error) {
      console.error('Error fetching trip info sections for trip:', error);
      res.status(500).json({ error: 'Failed to fetch trip info sections' });
    }
  });

  // Get trip info section by ID
  app.get("/api/trip-info-sections/:id", validateParams(idParamSchema), async (req, res) => {
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data: section, error } = await supabaseAdmin
        .from('trip_info_sections')
        .select('*')
        .eq('id', parseInt(req.params.id))
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Trip info section not found' });
        }
        console.error('Error fetching trip info section:', error);
        return res.status(500).json({ error: 'Failed to fetch trip info section' });
      }

      res.json(section);
    } catch (error) {
      console.error('Error fetching trip info section:', error);
      res.status(500).json({ error: 'Failed to fetch trip info section' });
    }
  });

  // Create trip info section
  app.post("/api/trip-info-sections", requireContentEditor, validateBody(createTripInfoSectionSchema), async (req: AuthenticatedRequest, res) => {
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data: section, error } = await supabaseAdmin
        .from('trip_info_sections')
        .insert({
          trip_id: req.body.trip_id,
          title: req.body.title,
          content: req.body.content,
          order_index: req.body.order_index,
          updated_by: req.body.updated_by
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating trip info section:', error);
        return res.status(500).json({ error: 'Failed to create trip info section' });
      }

      res.status(201).json(section);
    } catch (error: any) {
      console.error('Error creating trip info section:', error);
      res.status(500).json({ error: 'Failed to create trip info section' });
    }
  });

  // Update trip info section
  app.put("/api/trip-info-sections/:id", requireContentEditor, validateParams(idParamSchema), validateBody(updateTripInfoSectionSchema), async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const supabaseAdmin = getSupabaseAdmin();

      const updateData: any = { updated_at: new Date().toISOString() };
      if (req.body.trip_id !== undefined) updateData.trip_id = req.body.trip_id;
      if (req.body.title !== undefined) updateData.title = req.body.title;
      if (req.body.content !== undefined) updateData.content = req.body.content;
      if (req.body.order_index !== undefined) updateData.order_index = req.body.order_index;
      if (req.body.updated_by !== undefined) updateData.updated_by = req.body.updated_by;

      const { data: section, error } = await supabaseAdmin
        .from('trip_info_sections')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Trip info section not found' });
        }
        console.error('Error updating trip info section:', error);
        return res.status(500).json({ error: 'Failed to update trip info section' });
      }

      res.json(section);
    } catch (error: any) {
      console.error('Error updating trip info section:', error);
      res.status(500).json({ error: 'Failed to update trip info section' });
    }
  });

  // Delete trip info section
  app.delete("/api/trip-info-sections/:id", requireContentEditor, validateParams(idParamSchema), async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const supabaseAdmin = getSupabaseAdmin();

      const { error } = await supabaseAdmin
        .from('trip_info_sections')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting trip info section:', error);
        return res.status(500).json({ error: 'Failed to delete trip info section' });
      }

      res.json({ message: 'Trip info section deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting trip info section:', error);
      res.status(500).json({ error: 'Failed to delete trip info section' });
    }
  });
}