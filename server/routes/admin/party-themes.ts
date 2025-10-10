/**
 * Party Themes Management Routes
 *
 * Provides CRUD operations for party themes
 * Party themes can be assigned to events
 */

import type { Express, Response } from 'express';
import { requireTripAdmin, type AuthenticatedRequest } from '../../auth';
import { z } from 'zod';
import { logger } from '../../logging/logger';
import { asyncHandler } from '../../middleware/errorHandler';
import { ApiError } from '../../utils/ApiError';
import { getSupabaseAdmin } from '../../supabase-admin';

// Transform snake_case to camelCase for API responses
function transformPartyThemeData(theme: any): any {
  if (!theme) return null;

  return {
    id: theme.id,
    name: theme.name,
    shortDescription: theme.short_description,
    longDescription: theme.long_description,
    costumeIdeas: theme.costume_ideas,
    imageUrl: theme.image_url,
    amazonShoppingListUrl: theme.amazon_shopping_list_url,
    createdAt: theme.created_at,
    updatedAt: theme.updated_at,
  };
}

// Validation schemas
const createPartyThemeSchema = z.object({
  name: z.string().min(1).max(100),
  shortDescription: z.string().optional(),
  longDescription: z.string().optional(),
  costumeIdeas: z.string().optional(),
  imageUrl: z.string().url().optional(),
  amazonShoppingListUrl: z.string().url().optional(),
});

const updatePartyThemeSchema = createPartyThemeSchema.partial();

export function registerPartyThemeRoutes(app: Express) {
  // Get all party themes
  app.get(
    '/api/admin/party-themes',
    requireTripAdmin,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      try {
        const supabaseAdmin = await getSupabaseAdmin();

        const { data: partyThemes, error } = await supabaseAdmin
          .from('party_themes')
          .select('*')
          .order('name');

        if (error) {
          logger.error('Error fetching party themes', { error });
          throw ApiError.internal('Failed to fetch party themes');
        }

        const transformedThemes = partyThemes?.map(transformPartyThemeData) || [];
        return res.json(transformedThemes);
      } catch (error: any) {
        if (error.status) throw error;
        logger.error('Error fetching party themes', { error });
        throw ApiError.internal('Failed to fetch party themes');
      }
    })
  );

  // Create a new party theme
  app.post(
    '/api/admin/party-themes',
    requireTripAdmin,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const validation = createPartyThemeSchema.safeParse(req.body);

      if (!validation.success) {
        throw ApiError.badRequest('Invalid party theme data', { errors: validation.error.errors });
      }

      const data = validation.data;

      try {
        const supabaseAdmin = await getSupabaseAdmin();

        const { data: newTheme, error } = await supabaseAdmin
          .from('party_themes')
          .insert({
            name: data.name,
            short_description: data.shortDescription || null,
            long_description: data.longDescription || null,
            costume_ideas: data.costumeIdeas || null,
            image_url: data.imageUrl || null,
            amazon_shopping_list_url: data.amazonShoppingListUrl || null,
          })
          .select()
          .single();

        if (error) {
          logger.error('Error creating party theme', { error, data });

          // Check for unique constraint violation
          if (error.code === '23505') {
            throw ApiError.conflict('A party theme with this name already exists');
          }

          throw ApiError.internal('Failed to create party theme');
        }

        const transformedTheme = transformPartyThemeData(newTheme);
        logger.info('Party theme created', { themeId: transformedTheme.id, userId: req.user?.id });

        return res.status(201).json(transformedTheme);
      } catch (error: any) {
        if (error.status) throw error;
        logger.error('Error creating party theme', { error, data });
        throw ApiError.internal('Failed to create party theme');
      }
    })
  );

  // Update a party theme
  app.put(
    '/api/admin/party-themes/:id',
    requireTripAdmin,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;
      const validation = updatePartyThemeSchema.safeParse(req.body);

      if (!validation.success) {
        throw ApiError.badRequest('Invalid party theme data', { errors: validation.error.errors });
      }

      const data = validation.data;

      try {
        const supabaseAdmin = await getSupabaseAdmin();

        // Build update object
        const updateData: any = {
          updated_at: new Date().toISOString(),
        };

        if (data.name !== undefined) updateData.name = data.name;
        if (data.shortDescription !== undefined)
          updateData.short_description = data.shortDescription;
        if (data.longDescription !== undefined) updateData.long_description = data.longDescription;
        if (data.costumeIdeas !== undefined) updateData.costume_ideas = data.costumeIdeas;
        if (data.imageUrl !== undefined) updateData.image_url = data.imageUrl;
        if (data.amazonShoppingListUrl !== undefined)
          updateData.amazon_shopping_list_url = data.amazonShoppingListUrl;

        if (Object.keys(updateData).length === 1) {
          // Only updated_at
          throw ApiError.badRequest('No fields to update');
        }

        const { data: updatedTheme, error } = await supabaseAdmin
          .from('party_themes')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            throw ApiError.notFound('Party theme not found');
          }

          // Check for unique constraint violation
          if (error.code === '23505') {
            throw ApiError.conflict('A party theme with this name already exists');
          }

          logger.error('Error updating party theme', { error, themeId: id });
          throw ApiError.internal('Failed to update party theme');
        }

        const transformedTheme = transformPartyThemeData(updatedTheme);
        logger.info('Party theme updated', { themeId: id, userId: req.user?.id });

        return res.json(transformedTheme);
      } catch (error: any) {
        if (error.status) throw error;
        logger.error('Error updating party theme', { error, themeId: id });
        throw ApiError.internal('Failed to update party theme');
      }
    })
  );

  // Delete a party theme
  app.delete(
    '/api/admin/party-themes/:id',
    requireTripAdmin,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;

      try {
        const supabaseAdmin = await getSupabaseAdmin();

        // Check if the theme is being used by any events
        const { data: eventsUsingTheme, error: checkError } = await supabaseAdmin
          .from('events')
          .select('id')
          .eq('party_theme_id', id)
          .limit(1);

        if (checkError) {
          logger.error('Error checking party theme usage', { error: checkError, themeId: id });
          throw ApiError.internal('Failed to check party theme usage');
        }

        if (eventsUsingTheme && eventsUsingTheme.length > 0) {
          // Count how many events use this theme
          const { count, error: countError } = await supabaseAdmin
            .from('events')
            .select('*', { count: 'exact', head: true })
            .eq('party_theme_id', id);

          if (!countError && count) {
            throw ApiError.conflict(
              `Cannot delete party theme. It is being used by ${count} event(s).`
            );
          }
        }

        const { error } = await supabaseAdmin.from('party_themes').delete().eq('id', id);

        if (error) {
          if (error.code === 'PGRST116') {
            throw ApiError.notFound('Party theme not found');
          }
          logger.error('Error deleting party theme', { error, themeId: id });
          throw ApiError.internal('Failed to delete party theme');
        }

        logger.info('Party theme deleted', { themeId: id, userId: req.user?.id });

        return res.status(204).send();
      } catch (error: any) {
        if (error.status) throw error;
        logger.error('Error deleting party theme', { error, themeId: id });
        throw ApiError.internal('Failed to delete party theme');
      }
    })
  );
}
