import type { Express, Response } from "express";
import { getSupabaseAdmin } from "../supabase-admin";
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
  imageUrl: z.string().url().optional().nullable().or(z.literal('')),
  amazonShoppingListUrl: z.string().url().optional().nullable().or(z.literal(''))
});

const updatePartyThemeSchema = createPartyThemeSchema.partial();

export function registerPartyThemeRoutes(app: Express) {
  // ============ PARTY THEME ENDPOINTS ============

  // Get all party themes
  app.get("/api/party-themes", async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { search, withCostumes } = req.query;
      const supabaseAdmin = getSupabaseAdmin();

      let query = supabaseAdmin.from('party_themes').select('*');

      if (search) {
        query = query.or(`name.ilike.%${search}%,short_description.ilike.%${search}%,long_description.ilike.%${search}%`);
      } else if (withCostumes === 'true') {
        query = query.not('costume_ideas', 'is', null);
      }

      const { data: themes, error } = await query.order('name', { ascending: true });

      if (error) {
        console.error('Error fetching party themes:', error);
        return res.status(500).json({ error: 'Failed to fetch party themes' });
      }

      // Map snake_case database fields to camelCase for frontend
      const mappedThemes = (themes || []).map(theme => ({
        id: theme.id,
        name: theme.name,
        longDescription: theme.long_description,
        shortDescription: theme.short_description,
        costumeIdeas: theme.costume_ideas,
        imageUrl: theme.image_url,
        amazonShoppingListUrl: theme.amazon_shopping_list_url,
        createdAt: theme.created_at,
        updatedAt: theme.updated_at
      }));

      return res.json(mappedThemes);
    } catch (error: unknown) {
      console.error('Error fetching party themes:', error);
      return res.status(500).json({ error: 'Failed to fetch party themes' });
    }
  });

  // Get party theme statistics
  app.get("/api/party-themes/stats", async (req: AuthenticatedRequest, res: Response) => {
    try {
      const supabaseAdmin = getSupabaseAdmin();

      // Get total count
      const { count: totalCount, error: countError } = await supabaseAdmin
        .from('party_themes')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.error('Error fetching party theme count:', countError);
        return res.status(500).json({ error: 'Failed to fetch statistics' });
      }

      // Get count with costume ideas
      const { count: withCostumesCount, error: costumesError } = await supabaseAdmin
        .from('party_themes')
        .select('*', { count: 'exact', head: true })
        .not('costume_ideas', 'is', null);

      if (costumesError) {
        console.error('Error fetching costume count:', costumesError);
        return res.status(500).json({ error: 'Failed to fetch statistics' });
      }

      const stats = {
        total: totalCount || 0,
        withCostumeIdeas: withCostumesCount || 0,
        withoutCostumeIdeas: (totalCount || 0) - (withCostumesCount || 0)
      };

      return res.json(stats);
    } catch (error: unknown) {
      console.error('Error fetching party theme stats:', error);
      return res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  });

  // Get party theme by ID
  app.get("/api/party-themes/:id", validateParams(idParamSchema as any), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const id = parseInt(req.params.id ?? '0');
      const { data: theme, error } = await supabaseAdmin
        .from('party_themes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Party theme not found' });
        }
        console.error('Error fetching party theme:', error);
        return res.status(500).json({ error: 'Failed to fetch party theme' });
      }

      // Map snake_case database fields to camelCase for frontend
      const mappedTheme = {
        id: theme.id,
        name: theme.name,
        longDescription: theme.long_description,
        shortDescription: theme.short_description,
        costumeIdeas: theme.costume_ideas,
        imageUrl: theme.image_url,
        amazonShoppingListUrl: theme.amazon_shopping_list_url,
        createdAt: theme.created_at,
        updatedAt: theme.updated_at
      };

      return res.json(mappedTheme);
    } catch (error: unknown) {
      console.error('Error fetching party theme:', error);
      return res.status(500).json({ error: 'Failed to fetch party theme' });
    }
  });

  // Get events using a party theme
  app.get("/api/party-themes/:id/events", validateParams(idParamSchema as any), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id ?? '0');
      const supabaseAdmin = getSupabaseAdmin();
      const { data: events, error } = await supabaseAdmin
        .from('events')
        .select('*')
        .eq('party_theme_id', id)
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (error) {
        console.error('Error fetching events for party theme:', error);
        return res.status(500).json({ error: 'Failed to fetch events' });
      }

      return res.json(events || []);
    } catch (error: unknown) {
      console.error('Error fetching events for party theme:', error);
      return res.status(500).json({ error: 'Failed to fetch events' });
    }
  });

  // Create party theme
  app.post("/api/party-themes", requireContentEditor, validateBody(createPartyThemeSchema), async (req: AuthenticatedRequest, res) => {
    try {
      const supabaseAdmin = getSupabaseAdmin();

      // Check if name already exists
      const { data: existing, error: checkError } = await supabaseAdmin
        .from('party_themes')
        .select('name')
        .eq('name', req.body.name)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing party theme:', checkError);
        return res.status(500).json({ error: 'Failed to create party theme' });
      }

      if (existing) {
        return res.status(409).json({ error: `Party theme with name '${req.body.name}' already exists` });
      }

      const { data: theme, error } = await supabaseAdmin
        .from('party_themes')
        .insert({
          name: req.body.name,
          long_description: req.body.longDescription,
          short_description: req.body.shortDescription,
          costume_ideas: req.body.costumeIdeas,
          image_url: req.body.imageUrl === '' ? null : req.body.imageUrl,
          amazon_shopping_list_url: req.body.amazonShoppingListUrl === '' ? null : req.body.amazonShoppingListUrl
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating party theme:', error);
        return res.status(500).json({ error: 'Failed to create party theme' });
      }

      // Map snake_case database fields to camelCase for frontend
      const mappedTheme = {
        id: theme.id,
        name: theme.name,
        longDescription: theme.long_description,
        shortDescription: theme.short_description,
        costumeIdeas: theme.costume_ideas,
        imageUrl: theme.image_url,
        amazonShoppingListUrl: theme.amazon_shopping_list_url,
        createdAt: theme.created_at,
        updatedAt: theme.updated_at
      };

      return res.status(201).json(mappedTheme);
    } catch (error: any) {
      console.error('Error creating party theme:', error);
      return res.status(500).json({ error: 'Failed to create party theme' });
    }
  });

  // Update party theme
  app.put("/api/party-themes/:id", requireContentEditor, validateParams(idParamSchema as any), validateBody(updatePartyThemeSchema), async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id ?? '0');
      const supabaseAdmin = getSupabaseAdmin();

      // Check if name already exists (if name is being updated)
      if (req.body.name) {
        const { data: existing, error: checkError } = await supabaseAdmin
          .from('party_themes')
          .select('id, name')
          .eq('name', req.body.name)
          .neq('id', id)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          console.error('Error checking existing party theme:', checkError);
          return res.status(500).json({ error: 'Failed to update party theme' });
        }

        if (existing) {
          return res.status(409).json({ error: `Party theme with name '${req.body.name}' already exists` });
        }
      }

      const updateData: any = { updated_at: new Date().toISOString() };
      if (req.body.name !== undefined) updateData.name = req.body.name;
      if (req.body.longDescription !== undefined) updateData.long_description = req.body.longDescription;
      if (req.body.shortDescription !== undefined) updateData.short_description = req.body.shortDescription;
      if (req.body.costumeIdeas !== undefined) updateData.costume_ideas = req.body.costumeIdeas;
      if (req.body.imageUrl !== undefined) updateData.image_url = req.body.imageUrl === '' ? null : req.body.imageUrl;
      if (req.body.amazonShoppingListUrl !== undefined) updateData.amazon_shopping_list_url = req.body.amazonShoppingListUrl === '' ? null : req.body.amazonShoppingListUrl;

      const { data: theme, error } = await supabaseAdmin
        .from('party_themes')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Party theme not found' });
        }
        console.error('Error updating party theme:', error);
        return res.status(500).json({ error: 'Failed to update party theme' });
      }

      // Map snake_case database fields to camelCase for frontend
      const mappedTheme = {
        id: theme.id,
        name: theme.name,
        longDescription: theme.long_description,
        shortDescription: theme.short_description,
        costumeIdeas: theme.costume_ideas,
        imageUrl: theme.image_url,
        amazonShoppingListUrl: theme.amazon_shopping_list_url,
        createdAt: theme.created_at,
        updatedAt: theme.updated_at
      };

      return res.json(mappedTheme);
    } catch (error: any) {
      console.error('Error updating party theme:', error);
      return res.status(500).json({ error: 'Failed to update party theme' });
    }
  });

  // Delete party theme
  app.delete("/api/party-themes/:id", requireContentEditor, validateParams(idParamSchema as any), async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id ?? '0');
      const supabaseAdmin = getSupabaseAdmin();

      // Check if theme is used in any events
      const { data: usedEvents, error: usageError } = await supabaseAdmin
        .from('events')
        .select('id')
        .eq('party_theme_id', id)
        .limit(1);

      if (usageError) {
        console.error('Error checking party theme usage:', usageError);
        return res.status(500).json({ error: 'Failed to delete party theme' });
      }

      if (usedEvents && usedEvents.length > 0) {
        return res.status(409).json({
          error: 'Cannot delete party theme as it is being used by one or more events'
        });
      }

      const { error } = await supabaseAdmin
        .from('party_themes')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting party theme:', error);
        return res.status(500).json({ error: 'Failed to delete party theme' });
      }

      return res.json({ message: 'Party theme deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting party theme:', error);
      return res.status(500).json({ error: 'Failed to delete party theme' });
    }
  });

  // Duplicate party theme
  app.post("/api/party-themes/:id/duplicate", requireContentEditor, validateParams(idParamSchema as any), async (req: AuthenticatedRequest, res) => {
    try {
      const { name } = req.body;
      const id = parseInt(req.params.id ?? '0');

      if (!name) {
        return res.status(400).json({ error: 'New name is required' });
      }

      const supabaseAdmin = getSupabaseAdmin();

      // Get the original theme
      const { data: originalTheme, error: fetchError } = await supabaseAdmin
        .from('party_themes')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          return res.status(404).json({ error: 'Party theme not found' });
        }
        console.error('Error fetching original theme:', fetchError);
        return res.status(500).json({ error: 'Failed to duplicate party theme' });
      }

      // Check if new name already exists
      const { data: existingTheme, error: checkError } = await supabaseAdmin
        .from('party_themes')
        .select('name')
        .eq('name', name)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing theme name:', checkError);
        return res.status(500).json({ error: 'Failed to duplicate party theme' });
      }

      if (existingTheme) {
        return res.status(409).json({ error: `Party theme with name '${name}' already exists` });
      }

      // Create duplicate with new name
      const { data: duplicatedTheme, error: duplicateError } = await supabaseAdmin
        .from('party_themes')
        .insert({
          name: name,
          long_description: originalTheme.long_description,
          short_description: originalTheme.short_description,
          costume_ideas: originalTheme.costume_ideas,
          image_url: originalTheme.image_url,
          amazon_shopping_list_url: originalTheme.amazon_shopping_list_url
        })
        .select()
        .single();

      if (duplicateError) {
        console.error('Error creating duplicate theme:', duplicateError);
        return res.status(500).json({ error: 'Failed to duplicate party theme' });
      }

      // Map snake_case database fields to camelCase for frontend
      const mappedTheme = {
        id: duplicatedTheme.id,
        name: duplicatedTheme.name,
        longDescription: duplicatedTheme.long_description,
        shortDescription: duplicatedTheme.short_description,
        costumeIdeas: duplicatedTheme.costume_ideas,
        imageUrl: duplicatedTheme.image_url,
        amazonShoppingListUrl: duplicatedTheme.amazon_shopping_list_url,
        createdAt: duplicatedTheme.created_at,
        updatedAt: duplicatedTheme.updated_at
      };

      return res.status(201).json(mappedTheme);
    } catch (error: any) {
      console.error('Error duplicating party theme:', error);
      return res.status(500).json({ error: 'Failed to duplicate party theme' });
    }
  });

  // Check party theme usage
  app.get("/api/party-themes/:id/usage", validateParams(idParamSchema as any), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id ?? '0');
      const supabaseAdmin = getSupabaseAdmin();

      // Get events using this party theme
      const { data: events, error: eventsError } = await supabaseAdmin
        .from('events')
        .select('id, title, date, trip_id')
        .eq('party_theme_id', id);

      if (eventsError) {
        console.error('Error checking party theme usage:', eventsError);
        return res.status(500).json({ error: 'Failed to check usage' });
      }

      const usage = {
        isUsed: (events && events.length > 0),
        eventCount: events ? events.length : 0,
        events: events || []
      };

      return res.json(usage);
    } catch (error: unknown) {
      console.error('Error checking party theme usage:', error);
      return res.status(500).json({ error: 'Failed to check usage' });
    }
  });

}