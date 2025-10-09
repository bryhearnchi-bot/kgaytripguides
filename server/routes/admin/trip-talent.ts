/**
 * Trip-Talent Junction Routes
 *
 * Manages the relationship between trips and talent
 * Allows adding/removing talent from trips
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
    talentCategoryId: talent.talent_category_id,
    talentCategoryName: talent.talent_category_name,
    bio: talent.bio,
    knownFor: talent.known_for,
    profileImageUrl: talent.profile_image_url,
    socialLinks: talent.social_links,
    website: talent.website,
    createdAt: talent.created_at,
    updatedAt: talent.updated_at,
  };
}

// Validation schemas
const addTalentToTripSchema = z.object({
  talentIds: z.array(z.number().int()).min(1),
});

export function registerTripTalentRoutes(app: Express) {
  // Get all talent for a trip
  app.get(
    '/api/admin/trips/:tripId/talent',
    requireTripAdmin,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { tripId } = req.params;
      const supabase = await getSupabaseAdmin();

      try {
        // Get talent assigned to this trip
        const { data: tripTalentData, error: tripTalentError } = await supabase
          .from('trip_talent')
          .select('talent_id')
          .eq('trip_id', tripId);

        if (tripTalentError) {
          logger.error('Error fetching trip talent', { error: tripTalentError, tripId });
          throw ApiError.internal('Failed to fetch trip talent');
        }

        if (!tripTalentData || tripTalentData.length === 0) {
          return res.json([]);
        }

        const talentIds = tripTalentData.map(tt => tt.talent_id);

        // Fetch full talent details with category names
        const { data: talentData, error: talentError } = await supabase
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
          .in('id', talentIds)
          .order('name');

        if (talentError) {
          logger.error('Error fetching talent details', {
            errorMessage: talentError.message,
            errorCode: talentError.code,
            errorDetails: talentError.details,
            errorHint: talentError.hint,
            talentIds,
          });
          throw ApiError.internal('Failed to fetch talent details');
        }

        // Transform and add category name
        const talent = (talentData || []).map((t: any) => ({
          ...transformTalentData(t),
          talentCategoryName: t.talent_categories?.category || null,
        }));

        return res.json(talent);
      } catch (error) {
        logger.error('Error fetching trip talent', { error, tripId });
        throw ApiError.internal('Failed to fetch trip talent');
      }
    })
  );

  // Add talent to trip
  app.post(
    '/api/admin/trips/:tripId/talent',
    requireTripAdmin,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { tripId } = req.params;

      logger.info('POST /api/admin/trips/:tripId/talent - Request received', {
        tripId,
        body: req.body,
        userId: req.user?.id,
      });

      const validation = addTalentToTripSchema.safeParse(req.body);

      if (!validation.success) {
        logger.error('Validation failed', { errors: validation.error.errors });
        throw ApiError.badRequest('Invalid data', { errors: validation.error.errors });
      }

      const { talentIds } = validation.data;
      logger.info('Validation passed', { talentIds });

      const supabase = await getSupabaseAdmin();

      try {
        // Verify all talent IDs exist
        logger.info('Checking if talent IDs exist', { talentIds });
        const { data: talentCheck, error: talentCheckError } = await supabase
          .from('talent')
          .select('id')
          .in('id', talentIds);

        if (talentCheckError) {
          logger.error('Error checking talent IDs', {
            errorMessage: talentCheckError.message,
            errorCode: talentCheckError.code,
            talentIds,
          });
          throw ApiError.internal('Failed to verify talent IDs');
        }

        const validTalentIds = (talentCheck || []).map(t => t.id);
        logger.info('Talent check complete', { validTalentIds, requestedIds: talentIds });

        if (validTalentIds.length !== talentIds.length) {
          const invalidIds = talentIds.filter(id => !validTalentIds.includes(id));
          logger.error('Invalid talent IDs', { invalidIds });
          throw ApiError.badRequest(`Invalid talent IDs: ${invalidIds.join(', ')}`);
        }

        // Check for existing assignments
        logger.info('Checking for existing assignments', { tripId, talentIds });
        const { data: existing, error: existingError } = await supabase
          .from('trip_talent')
          .select('talent_id')
          .eq('trip_id', tripId)
          .in('talent_id', talentIds);

        if (existingError) {
          logger.error('Error checking existing talent', {
            errorMessage: existingError.message,
            errorCode: existingError.code,
            tripId,
            talentIds,
          });
          throw ApiError.internal('Failed to check existing talent');
        }

        const existingIds = (existing || []).map(e => e.talent_id);
        const newIds = talentIds.filter(id => !existingIds.includes(id));
        logger.info('Existing check complete', { existingIds, newIds });

        if (newIds.length === 0) {
          logger.warn('All talent already assigned', { tripId, talentIds });
          throw ApiError.conflict('All specified talent are already assigned to this trip');
        }

        // Insert new talent assignments
        const insertData = newIds.map(talentId => ({
          trip_id: parseInt(tripId),
          talent_id: talentId,
        }));

        logger.info('Inserting trip talent', { insertData });
        const { error: insertError } = await supabase.from('trip_talent').insert(insertData);

        if (insertError) {
          logger.error('Error inserting trip talent', {
            errorMessage: insertError.message,
            errorCode: insertError.code,
            errorDetails: insertError.details,
            errorHint: insertError.hint,
            insertData,
          });
          throw ApiError.internal(`Failed to add talent to trip: ${insertError.message}`);
        }

        logger.info('Talent added to trip successfully', {
          tripId,
          talentIds: newIds,
          userId: req.user?.id,
          alreadyExisted: existingIds,
        });

        return res.status(201).json({
          added: newIds.length,
          alreadyExisted: existingIds,
          message:
            existingIds.length > 0
              ? `Added ${newIds.length} talent. ${existingIds.length} were already assigned.`
              : `Successfully added ${newIds.length} talent to the trip.`,
        });
      } catch (error: any) {
        logger.error('Error adding talent to trip - CATCH BLOCK', {
          errorMessage: error?.message || 'Unknown error',
          errorName: error?.name,
          errorStatus: error?.status,
          errorStack: error?.stack,
          tripId,
          talentIds,
        });
        if (error.status) throw error; // Re-throw ApiError
        throw ApiError.internal('Failed to add talent to trip');
      }
    })
  );

  // Remove talent from trip
  app.delete(
    '/api/admin/trips/:tripId/talent/:talentId',
    requireTripAdmin,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { tripId, talentId } = req.params;
      const supabase = await getSupabaseAdmin();

      try {
        const numericTalentId = parseInt(talentId);

        // Fetch all events for this trip, then filter in JavaScript
        const { data: allEvents, error: eventsError } = await supabase
          .from('events')
          .select('id, talent_ids')
          .eq('trip_id', tripId);

        if (eventsError) {
          logger.error('Error fetching events', { error: eventsError });
          throw ApiError.internal('Failed to fetch events');
        }

        // Filter events that have this talent
        const events =
          allEvents?.filter(
            event => Array.isArray(event.talent_ids) && event.talent_ids.includes(numericTalentId)
          ) || [];

        // Remove talent from events
        if (events && events.length > 0) {
          for (const event of events) {
            const updatedTalentIds = event.talent_ids.filter(
              (id: number) => id !== numericTalentId
            );
            await supabase
              .from('events')
              .update({ talent_ids: updatedTalentIds.length > 0 ? updatedTalentIds : null })
              .eq('id', event.id);
          }
        }

        // Then remove from trip_talent
        const { error: deleteError } = await supabase
          .from('trip_talent')
          .delete()
          .eq('trip_id', tripId)
          .eq('talent_id', talentId);

        if (deleteError) {
          logger.error('Error deleting trip talent', { error: deleteError });
          throw ApiError.internal('Failed to remove talent from trip');
        }

        logger.info('Talent removed from trip', {
          tripId,
          talentId,
          eventsUpdated: events?.length || 0,
          userId: req.user?.id,
        });

        return res.status(204).send();
      } catch (error: any) {
        logger.error('Error removing talent from trip', { error, tripId, talentId });
        if (error.status) throw error; // Re-throw ApiError
        throw ApiError.internal('Failed to remove talent from trip');
      }
    })
  );
}
