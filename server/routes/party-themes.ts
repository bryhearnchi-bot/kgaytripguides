import type { Express, Response } from "express";
import { getSupabaseAdmin } from "../supabase-admin";
import { requireAuth, requireContentEditor, requireSuperAdmin, type AuthenticatedRequest } from "../auth";
import {
  validateBody,
  validateParams,
  idParamSchema
} from "../middleware/validation";
import { z } from "zod";
import { asyncHandler } from "../middleware/errorHandler";
import { ApiError } from "../utils/ApiError";
import { logger } from "../logging/logger";

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
  app.get("/api/party-themes", asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
      logger.error('Error fetching party themes:', error, {
        method: req.method,
        path: req.path
      });
      throw ApiError.internal('Failed to fetch party themes');
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
  }));

  // Get party theme statistics
  app.get("/api/party-themes/stats", asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const supabaseAdmin = getSupabaseAdmin();

    // Get total count
    const { count: totalCount, error: countError } = await supabaseAdmin
      .from('party_themes')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      logger.error('Error fetching party theme count:', countError, {
        method: req.method,
        path: req.path
      });
      throw ApiError.internal('Failed to fetch statistics');
    }

    // Get count with costume ideas
    const { count: withCostumesCount, error: costumesError } = await supabaseAdmin
      .from('party_themes')
      .select('*', { count: 'exact', head: true })
      .not('costume_ideas', 'is', null);

    if (costumesError) {
      logger.error('Error fetching costume count:', costumesError, {
        method: req.method,
        path: req.path
      });
      throw ApiError.internal('Failed to fetch statistics');
    }

    const stats = {
      total: totalCount || 0,
      withCostumeIdeas: withCostumesCount || 0,
      withoutCostumeIdeas: (totalCount || 0) - (withCostumesCount || 0)
    };

    return res.json(stats);
  }));

  // Get party theme by ID
  app.get("/api/party-themes/:id", validateParams(idParamSchema as any), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const supabaseAdmin = getSupabaseAdmin();
    const id = parseInt(req.params.id ?? '0');
    const { data: theme, error } = await supabaseAdmin
      .from('party_themes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw ApiError.notFound('Party theme not found');
      }
      logger.error('Error fetching party theme:', error, {
        method: req.method,
        path: req.path
      });
      throw ApiError.internal('Failed to fetch party theme');
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
  }));

  // Get events using a party theme
  app.get("/api/party-themes/:id/events", validateParams(idParamSchema as any), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const id = parseInt(req.params.id ?? '0');
    const supabaseAdmin = getSupabaseAdmin();
    const { data: events, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('party_theme_id', id)
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (error) {
      logger.error('Error fetching events for party theme:', error, {
        method: req.method,
        path: req.path
      });
      throw ApiError.internal('Failed to fetch events');
    }

    return res.json(events || []);
  }));

  // Create party theme
  app.post("/api/party-themes", requireContentEditor, validateBody(createPartyThemeSchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const supabaseAdmin = getSupabaseAdmin();

    // Check if name already exists
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('party_themes')
      .select('name')
      .eq('name', req.body.name)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      logger.error('Error checking existing party theme:', checkError, {
        method: req.method,
        path: req.path
      });
      throw ApiError.internal('Failed to create party theme');
    }

    if (existing) {
      throw ApiError.conflict(`Party theme with name '${req.body.name}' already exists`);
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
      logger.error('Error creating party theme:', error, {
        method: req.method,
        path: req.path
      });
      throw ApiError.internal('Failed to create party theme');
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
  }));

  // Update party theme
  app.put("/api/party-themes/:id", requireContentEditor, validateParams(idParamSchema as any), validateBody(updatePartyThemeSchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
        logger.error('Error checking existing party theme:', checkError, {
          method: req.method,
          path: req.path
        });
        throw ApiError.internal('Failed to update party theme');
      }

      if (existing) {
        throw ApiError.conflict(`Party theme with name '${req.body.name}' already exists`);
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
        throw ApiError.notFound('Party theme not found');
      }
      logger.error('Error updating party theme:', error, {
        method: req.method,
        path: req.path
      });
      throw ApiError.internal('Failed to update party theme');
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
  }));

  // Delete party theme
  app.delete("/api/party-themes/:id", requireContentEditor, validateParams(idParamSchema as any), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const id = parseInt(req.params.id ?? '0');
    const supabaseAdmin = getSupabaseAdmin();

    // Check if theme is used in any events
    const { data: usedEvents, error: usageError } = await supabaseAdmin
      .from('events')
      .select('id')
      .eq('party_theme_id', id)
      .limit(1);

    if (usageError) {
      logger.error('Error checking party theme usage:', usageError, {
        method: req.method,
        path: req.path
      });
      throw ApiError.internal('Failed to delete party theme');
    }

    if (usedEvents && usedEvents.length > 0) {
      throw ApiError.conflict('Cannot delete party theme as it is being used by one or more events');
    }

    const { error } = await supabaseAdmin
      .from('party_themes')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('Error deleting party theme:', error, {
        method: req.method,
        path: req.path
      });
      throw ApiError.internal('Failed to delete party theme');
    }

    return res.json({ message: 'Party theme deleted successfully' });
  }));

  // Duplicate party theme
  app.post("/api/party-themes/:id/duplicate", requireContentEditor, validateParams(idParamSchema as any), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { name } = req.body;
    const id = parseInt(req.params.id ?? '0');

    if (!name) {
      throw ApiError.badRequest('New name is required');
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
        throw ApiError.notFound('Party theme not found');
      }
      logger.error('Error fetching original theme:', fetchError, {
        method: req.method,
        path: req.path
      });
      throw ApiError.internal('Failed to duplicate party theme');
    }

    // Check if new name already exists
    const { data: existingTheme, error: checkError } = await supabaseAdmin
      .from('party_themes')
      .select('name')
      .eq('name', name)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      logger.error('Error checking existing theme name:', checkError, {
        method: req.method,
        path: req.path
      });
      throw ApiError.internal('Failed to duplicate party theme');
    }

    if (existingTheme) {
      throw ApiError.conflict(`Party theme with name '${name}' already exists`);
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
      logger.error('Error creating duplicate theme:', duplicateError, {
        method: req.method,
        path: req.path
      });
      throw ApiError.internal('Failed to duplicate party theme');
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
  }));

  // Check party theme usage
  app.get("/api/party-themes/:id/usage", validateParams(idParamSchema as any), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const id = parseInt(req.params.id ?? '0');
    const supabaseAdmin = getSupabaseAdmin();

    // Get events using this party theme
    const { data: events, error: eventsError } = await supabaseAdmin
      .from('events')
      .select('id, title, date, trip_id')
      .eq('party_theme_id', id);

    if (eventsError) {
      logger.error('Error checking party theme usage:', eventsError, {
        method: req.method,
        path: req.path
      });
      throw ApiError.internal('Failed to check usage');
    }

    const usage = {
      isUsed: (events && events.length > 0),
      eventCount: events ? events.length : 0,
      events: events || []
    };

    return res.json(usage);
  }));

}