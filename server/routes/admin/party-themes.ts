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
    description: theme.description,
    heroImageUrl: theme.hero_image_url,
    thumbnailImageUrl: theme.thumbnail_image_url,
    icon: theme.icon,
    color: theme.color,
    isActive: theme.is_active,
    displayOrder: theme.display_order,
    tags: theme.tags,
    createdAt: theme.created_at,
    updatedAt: theme.updated_at,
  };
}

// Validation schemas
const createPartyThemeSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  heroImageUrl: z.string().url().optional(),
  thumbnailImageUrl: z.string().url().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  isActive: z.boolean().optional().default(true),
  displayOrder: z.number().int().optional(),
  tags: z.array(z.string()).optional(),
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
        const includeInactive = req.query.includeInactive === 'true';

        let query = supabaseAdmin.from('party_themes').select('*');

        if (!includeInactive) {
          query = query.eq('is_active', true);
        }

        const { data: partyThemes, error } = await query.order('display_order').order('name');

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
            description: data.description || null,
            hero_image_url: data.heroImageUrl || null,
            thumbnail_image_url: data.thumbnailImageUrl || null,
            icon: data.icon || null,
            color: data.color || null,
            is_active: data.isActive ?? true,
            display_order: data.displayOrder || null,
            tags: data.tags || null,
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
        if (data.description !== undefined) updateData.description = data.description;
        if (data.heroImageUrl !== undefined) updateData.hero_image_url = data.heroImageUrl;
        if (data.thumbnailImageUrl !== undefined)
          updateData.thumbnail_image_url = data.thumbnailImageUrl;
        if (data.icon !== undefined) updateData.icon = data.icon;
        if (data.color !== undefined) updateData.color = data.color;
        if (data.isActive !== undefined) updateData.is_active = data.isActive;
        if (data.displayOrder !== undefined) updateData.display_order = data.displayOrder;
        if (data.tags !== undefined) updateData.tags = data.tags;

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
