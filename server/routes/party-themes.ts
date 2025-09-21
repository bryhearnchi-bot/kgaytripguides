import type { Express } from "express";
import { partyThemeStorage } from "../storage/PartyThemeStorage";
import { requireAuth, requireContentEditor, requireSuperAdmin, type AuthenticatedRequest } from "../auth";
import {
  validateBody,
  validateParams,
  idParamSchema
} from "../middleware/validation";
import { z } from "zod";

// Validation schemas
const createPartyThemeSchema = z.object({
  name: z.string().min(1).max(255),
  longDescription: z.string().optional().nullable(),
  shortDescription: z.string().optional().nullable(),
  costumeIdeas: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  amazonShoppingListUrl: z.string().url().optional().nullable()
});

const updatePartyThemeSchema = createPartyThemeSchema.partial();

export function registerPartyThemeRoutes(app: Express) {
  // ============ PARTY THEME ENDPOINTS ============

  // Get all party themes
  app.get("/api/party-themes", async (req, res) => {
    try {
      const { search, withCostumes } = req.query;

      let themes;
      if (search) {
        themes = await partyThemeStorage.search(search as string);
      } else if (withCostumes === 'true') {
        themes = await partyThemeStorage.getWithCostumeIdeas();
      } else {
        themes = await partyThemeStorage.getAll();
      }

      res.json(themes);
    } catch (error) {
      console.error('Error fetching party themes:', error);
      res.status(500).json({ error: 'Failed to fetch party themes' });
    }
  });

  // Get party theme statistics
  app.get("/api/party-themes/stats", async (req, res) => {
    try {
      const stats = await partyThemeStorage.getStatistics();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching party theme stats:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  });

  // Get party theme by ID
  app.get("/api/party-themes/:id", validateParams(idParamSchema), async (req, res) => {
    try {
      const theme = await partyThemeStorage.getById(parseInt(req.params.id));

      if (!theme) {
        return res.status(404).json({ error: 'Party theme not found' });
      }

      res.json(theme);
    } catch (error) {
      console.error('Error fetching party theme:', error);
      res.status(500).json({ error: 'Failed to fetch party theme' });
    }
  });

  // Get events using a party theme
  app.get("/api/party-themes/:id/events", validateParams(idParamSchema), async (req, res) => {
    try {
      const events = await partyThemeStorage.getEvents(parseInt(req.params.id));
      res.json(events);
    } catch (error) {
      console.error('Error fetching events for party theme:', error);
      res.status(500).json({ error: 'Failed to fetch events' });
    }
  });

  // Create party theme
  app.post("/api/party-themes", requireContentEditor, validateBody(createPartyThemeSchema), async (req: AuthenticatedRequest, res) => {
    try {
      const theme = await partyThemeStorage.create(req.body);
      res.status(201).json(theme);
    } catch (error: any) {
      console.error('Error creating party theme:', error);
      if (error.message?.includes('already exists')) {
        res.status(409).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to create party theme' });
      }
    }
  });

  // Update party theme
  app.put("/api/party-themes/:id", requireContentEditor, validateParams(idParamSchema), validateBody(updatePartyThemeSchema), async (req: AuthenticatedRequest, res) => {
    try {
      const theme = await partyThemeStorage.update(parseInt(req.params.id), req.body);
      res.json(theme);
    } catch (error: any) {
      console.error('Error updating party theme:', error);
      if (error.message?.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else if (error.message?.includes('already exists')) {
        res.status(409).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to update party theme' });
      }
    }
  });

  // Delete party theme
  app.delete("/api/party-themes/:id", requireSuperAdmin, validateParams(idParamSchema), async (req: AuthenticatedRequest, res) => {
    try {
      const deleted = await partyThemeStorage.delete(parseInt(req.params.id));

      if (!deleted) {
        return res.status(404).json({ error: 'Party theme not found' });
      }

      res.json({ message: 'Party theme deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting party theme:', error);
      if (error.message?.includes('Cannot delete')) {
        res.status(409).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to delete party theme' });
      }
    }
  });

  // Duplicate party theme
  app.post("/api/party-themes/:id/duplicate", requireContentEditor, validateParams(idParamSchema), async (req: AuthenticatedRequest, res) => {
    try {
      const { name } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'New name is required' });
      }

      const theme = await partyThemeStorage.duplicate(parseInt(req.params.id), name);
      res.status(201).json(theme);
    } catch (error: any) {
      console.error('Error duplicating party theme:', error);
      if (error.message?.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else if (error.message?.includes('already exists')) {
        res.status(409).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to duplicate party theme' });
      }
    }
  });

  // Check party theme usage
  app.get("/api/party-themes/:id/usage", validateParams(idParamSchema), async (req, res) => {
    try {
      const usage = await partyThemeStorage.checkUsage(parseInt(req.params.id));
      res.json(usage);
    } catch (error) {
      console.error('Error checking party theme usage:', error);
      res.status(500).json({ error: 'Failed to check usage' });
    }
  });

  // ============ BACKWARD COMPATIBILITY - Redirect old /api/parties routes ============

  // Redirect old parties endpoints to new party-themes endpoints
  app.get("/api/parties", (req, res) => {
    res.redirect(301, `/api/party-themes${req.url.slice(11)}`);
  });

  app.get("/api/parties/:id", (req, res) => {
    res.redirect(301, `/api/party-themes/${req.params.id}`);
  });

  app.post("/api/parties", requireContentEditor, async (req: AuthenticatedRequest, res) => {
    // Transform old party structure to new party theme structure
    const transformedData = {
      name: req.body.name,
      longDescription: req.body.theme || req.body.description,
      shortDescription: req.body.theme,
      imageUrl: req.body.image_url || req.body.imageUrl,
      costumeIdeas: req.body.dress_code || null,
      amazonShoppingListUrl: null
    };

    try {
      const theme = await partyThemeStorage.create(transformedData);
      res.status(201).json(theme);
    } catch (error: any) {
      console.error('Error creating party theme (legacy):', error);
      if (error.message?.includes('already exists')) {
        res.status(409).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to create party theme' });
      }
    }
  });

  app.put("/api/parties/:id", requireContentEditor, validateParams(idParamSchema), async (req: AuthenticatedRequest, res) => {
    // Transform old party structure to new party theme structure
    const transformedData: any = {};
    if (req.body.name) transformedData.name = req.body.name;
    if (req.body.theme) transformedData.longDescription = req.body.theme;
    if (req.body.description) transformedData.longDescription = req.body.description;
    if (req.body.image_url) transformedData.imageUrl = req.body.image_url;
    if (req.body.imageUrl) transformedData.imageUrl = req.body.imageUrl;
    if (req.body.dress_code) transformedData.costumeIdeas = req.body.dress_code;

    try {
      const theme = await partyThemeStorage.update(parseInt(req.params.id), transformedData);
      res.json(theme);
    } catch (error: any) {
      console.error('Error updating party theme (legacy):', error);
      if (error.message?.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else if (error.message?.includes('already exists')) {
        res.status(409).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to update party theme' });
      }
    }
  });

  app.delete("/api/parties/:id", requireSuperAdmin, validateParams(idParamSchema), async (req: AuthenticatedRequest, res) => {
    res.redirect(307, `/api/party-themes/${req.params.id}`);
  });
}