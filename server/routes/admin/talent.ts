/**
 * Talent Management Routes
 *
 * Provides CRUD operations for global talent pool
 * Talent can be assigned to trips and events
 */

import type { Express, Response } from 'express';
import { requireTripAdmin, type AuthenticatedRequest } from '../../auth';
import { z } from 'zod';
import { logger } from '../../logging/logger';
import { asyncHandler } from '../../middleware/errorHandler';
import { ApiError } from '../../utils/ApiError';
import { getSupabaseAdmin } from '../../supabase-admin';

// Transform snake_case to camelCase for API responses
function transformTalentData(talent: any): any {
  if (!talent) return null;

  return {
    id: talent.id,
    name: talent.name,
    bio: talent.bio,
    knownFor: talent.known_for,
    profileImageUrl: talent.profile_image_url,
    socialLinks: talent.social_links,
    website: talent.website,
    talentCategoryId: talent.talent_category_id,
    createdAt: talent.created_at,
    updatedAt: talent.updated_at,
  };
}

// Validation schemas
const createTalentSchema = z.object({
  name: z.string().min(1).max(255),
  talentCategoryId: z.number().int().min(1, 'Talent category is required'),
  bio: z.string().optional().nullable(),
  knownFor: z.string().optional().nullable(),
  profileImageUrl: z.string().url().optional().nullable(),
  socialLinks: z.record(z.string()).optional().nullable(),
  website: z.string().url().optional().nullable(),
});

const updateTalentSchema = createTalentSchema.partial();

export function registerTalentRoutes(app: Express) {
  // Get all talent (global pool)
  app.get(
    '/api/admin/talent',
    requireTripAdmin,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      try {
        const supabaseAdmin = await getSupabaseAdmin();

        // Fetch all talent with talent category names
        const { data: talentData, error } = await supabaseAdmin
          .from('talent')
          .select(
            `
          id,
          name,
          bio,
          known_for,
          profile_image_url,
          social_links,
          website,
          talent_category_id,
          created_at,
          updated_at,
          talent_categories(category)
        `
          )
          .order('name');

        if (error) {
          logger.error('Error fetching all talent', {
            errorMessage: error.message,
            errorCode: error.code,
            errorDetails: error.details,
            errorHint: error.hint,
          });
          throw ApiError.internal('Failed to fetch talent');
        }

        // Transform and add category name
        const talent = (talentData || []).map((t: any) => ({
          ...transformTalentData(t),
          talentCategoryName: t.talent_categories?.category || null,
        }));

        return res.json(talent);
      } catch (error: any) {
        if (error.status) throw error;
        logger.error('Error fetching talent', { error });
        throw ApiError.internal('Failed to fetch talent');
      }
    })
  );

  // Get single talent by ID
  app.get(
    '/api/admin/talent/:id',
    requireTripAdmin,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;

      try {
        const supabaseAdmin = await getSupabaseAdmin();

        const { data: talentData, error } = await supabaseAdmin
          .from('talent')
          .select(
            `
          id,
          name,
          bio,
          known_for,
          profile_image_url,
          social_links,
          website,
          talent_category_id,
          created_at,
          updated_at,
          talent_categories(category)
        `
          )
          .eq('id', id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            throw ApiError.notFound('Talent not found');
          }
          logger.error('Error fetching talent by ID', {
            errorMessage: error.message,
            errorCode: error.code,
            errorDetails: error.details,
            errorHint: error.hint,
            talentId: id,
          });
          throw ApiError.internal('Failed to fetch talent');
        }

        const talent = {
          ...transformTalentData(talentData),
          talentCategoryName: (talentData.talent_categories as any)?.category || null,
        };

        return res.json(talent);
      } catch (error: any) {
        logger.error('Error fetching talent', { error, talentId: id });
        if (error.status) throw error;
        throw ApiError.internal('Failed to fetch talent');
      }
    })
  );

  // Create new talent
  app.post(
    '/api/admin/talent',
    requireTripAdmin,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const validation = createTalentSchema.safeParse(req.body);

      if (!validation.success) {
        throw ApiError.badRequest('Invalid talent data', { errors: validation.error.errors });
      }

      const data = validation.data;

      try {
        const supabaseAdmin = await getSupabaseAdmin();

        // Verify talent category exists
        const { data: category, error: categoryError } = await supabaseAdmin
          .from('talent_categories')
          .select('id')
          .eq('id', data.talentCategoryId)
          .single();

        if (categoryError || !category) {
          throw ApiError.badRequest('Invalid talent category ID');
        }

        // Create the talent
        const { data: newTalent, error } = await supabaseAdmin
          .from('talent')
          .insert({
            name: data.name,
            talent_category_id: data.talentCategoryId,
            bio: data.bio || null,
            known_for: data.knownFor || null,
            profile_image_url: data.profileImageUrl || null,
            social_links: data.socialLinks || null,
            website: data.website || null,
          })
          .select(
            `
          *,
          talent_categories(category)
        `
          )
          .single();

        if (error) {
          logger.error('Error creating talent', { error, data });

          // Check for unique constraint violation
          if (error.code === '23505') {
            throw ApiError.conflict('Talent with this name already exists');
          }

          throw ApiError.internal('Failed to create talent');
        }

        const transformedTalent = {
          ...transformTalentData(newTalent),
          talentCategoryName: newTalent.talent_categories?.category || null,
        };

        logger.info('Talent created', { talentId: transformedTalent.id, userId: req.user?.id });

        return res.status(201).json(transformedTalent);
      } catch (error: any) {
        if (error.status) throw error;
        logger.error('Error creating talent', { error, data });
        throw ApiError.internal('Failed to create talent');
      }
    })
  );

  // Update talent
  app.put(
    '/api/admin/talent/:id',
    requireTripAdmin,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;
      const validation = updateTalentSchema.safeParse(req.body);

      if (!validation.success) {
        throw ApiError.badRequest('Invalid talent data', { errors: validation.error.errors });
      }

      const data = validation.data;

      try {
        const supabaseAdmin = await getSupabaseAdmin();

        // If talent category is being updated, verify it exists
        if (data.talentCategoryId) {
          const { data: category, error: categoryError } = await supabaseAdmin
            .from('talent_categories')
            .select('id')
            .eq('id', data.talentCategoryId)
            .single();

          if (categoryError || !category) {
            throw ApiError.badRequest('Invalid talent category ID');
          }
        }

        // Build update object
        const updateData: any = {
          updated_at: new Date().toISOString(),
        };

        if (data.name !== undefined) updateData.name = data.name;
        if (data.talentCategoryId !== undefined)
          updateData.talent_category_id = data.talentCategoryId;
        if (data.bio !== undefined) updateData.bio = data.bio;
        if (data.knownFor !== undefined) updateData.known_for = data.knownFor;
        if (data.profileImageUrl !== undefined) updateData.profile_image_url = data.profileImageUrl;
        if (data.socialLinks !== undefined) updateData.social_links = data.socialLinks;
        if (data.website !== undefined) updateData.website = data.website;

        const { data: updatedTalent, error } = await supabaseAdmin
          .from('talent')
          .update(updateData)
          .eq('id', id)
          .select(
            `
          *,
          talent_categories(category)
        `
          )
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            throw ApiError.notFound('Talent not found');
          }

          logger.error('Error updating talent', { error, talentId: id });

          // Check for unique constraint violation
          if (error.code === '23505') {
            throw ApiError.conflict('Talent with this name already exists');
          }

          throw ApiError.internal('Failed to update talent');
        }

        const transformedTalent = {
          ...transformTalentData(updatedTalent),
          talentCategoryName: updatedTalent.talent_categories?.category || null,
        };

        logger.info('Talent updated', { talentId: id, userId: req.user?.id });

        return res.json(transformedTalent);
      } catch (error: any) {
        if (error.status) throw error;
        logger.error('Error updating talent', { error, talentId: id });
        throw ApiError.internal('Failed to update talent');
      }
    })
  );

  // Delete talent
  app.delete(
    '/api/admin/talent/:id',
    requireTripAdmin,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;

      try {
        const supabaseAdmin = await getSupabaseAdmin();

        // Check if talent is assigned to any trips
        const { count: tripCount, error: tripError } = await supabaseAdmin
          .from('trip_talent')
          .select('*', { count: 'exact', head: true })
          .eq('talent_id', id);

        if (tripError) {
          logger.error('Error checking trip talent', { error: tripError, talentId: id });
        }

        if (tripCount && tripCount > 0) {
          throw ApiError.conflict(`Cannot delete talent. It is assigned to ${tripCount} trip(s).`);
        }

        // Check if talent is assigned to any events
        // Note: events.talent_ids is an array column, so we use contains
        const { data: eventsData, error: eventsError } = await supabaseAdmin
          .from('events')
          .select('id')
          .contains('talent_ids', [parseInt(id ?? '0')]);

        if (eventsError) {
          logger.error('Error checking event talent', { error: eventsError, talentId: id });
        }

        const eventCount = eventsData?.length || 0;
        if (eventCount > 0) {
          throw ApiError.conflict(
            `Cannot delete talent. It is assigned to ${eventCount} event(s).`
          );
        }

        // Delete the talent
        const { error: deleteError } = await supabaseAdmin.from('talent').delete().eq('id', id);

        if (deleteError) {
          if (deleteError.code === 'PGRST116') {
            throw ApiError.notFound('Talent not found');
          }
          logger.error('Error deleting talent', { error: deleteError, talentId: id });
          throw ApiError.internal('Failed to delete talent');
        }

        logger.info('Talent deleted', { talentId: id, userId: req.user?.id });

        return res.status(204).send();
      } catch (error: any) {
        logger.error('Error deleting talent', { error, talentId: id });
        if (error.status) throw error; // Re-throw ApiError
        throw ApiError.internal('Failed to delete talent');
      }
    })
  );
}
