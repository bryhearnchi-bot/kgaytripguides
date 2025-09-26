import type { Express } from "express";
import { tripInfoSectionStorage } from "../storage/TripInfoSectionStorage";
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
      const sections = await tripInfoSectionStorage.getAll();
      res.json(sections);
    } catch (error) {
      console.error('Error fetching trip info sections:', error);
      res.status(500).json({ error: 'Failed to fetch trip info sections' });
    }
  });

  // Get trip info sections for a specific trip
  app.get("/api/trip-info-sections/trip/:tripId", validateParams(z.object({ tripId: z.string().transform(Number) })), async (req, res) => {
    try {
      const sections = await tripInfoSectionStorage.getByTripId(req.params.tripId as unknown as number);
      res.json(sections);
    } catch (error) {
      console.error('Error fetching trip info sections for trip:', error);
      res.status(500).json({ error: 'Failed to fetch trip info sections' });
    }
  });

  // Get trip info section by ID
  app.get("/api/trip-info-sections/:id", validateParams(idParamSchema), async (req, res) => {
    try {
      const section = await tripInfoSectionStorage.getById(parseInt(req.params.id));

      if (!section) {
        return res.status(404).json({ error: 'Trip info section not found' });
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
      const section = await tripInfoSectionStorage.create(req.body);
      res.status(201).json(section);
    } catch (error: any) {
      console.error('Error creating trip info section:', error);
      res.status(500).json({ error: 'Failed to create trip info section' });
    }
  });

  // Update trip info section
  app.put("/api/trip-info-sections/:id", requireContentEditor, validateParams(idParamSchema), validateBody(updateTripInfoSectionSchema), async (req: AuthenticatedRequest, res) => {
    try {
      const section = await tripInfoSectionStorage.update(parseInt(req.params.id), req.body);
      res.json(section);
    } catch (error: any) {
      console.error('Error updating trip info section:', error);
      if (error.message?.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to update trip info section' });
      }
    }
  });

  // Delete trip info section
  app.delete("/api/trip-info-sections/:id", requireContentEditor, validateParams(idParamSchema), async (req: AuthenticatedRequest, res) => {
    try {
      await tripInfoSectionStorage.delete(parseInt(req.params.id));
      res.json({ message: 'Trip info section deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting trip info section:', error);
      res.status(500).json({ error: 'Failed to delete trip info section' });
    }
  });
}