/**
 * Events Management Routes
 *
 * Provides comprehensive event management for trips including:
 * - CRUD operations for trip events
 * - Event type associations
 * - Talent assignments
 * - Venue and party theme management
 */

import type { Express, Response } from 'express';
import { requireTripAdmin, type AuthenticatedRequest } from '../../auth';
import { z } from 'zod';
import { logger } from '../../logging/logger';
import { asyncHandler } from '../../middleware/errorHandler';
import { ApiError } from '../../utils/ApiError';
import { getSupabaseAdmin } from '../../supabase-admin';

// Transform snake_case to camelCase for API responses
function transformEventData(event: any): any {
  if (!event) return null;

  // Format date to YYYY-MM-DD string (timezone-agnostic - no timezone conversions)
  const formatDate = (dateValue: any): string => {
    if (!dateValue) return '';

    // If already a string in YYYY-MM-DD format, return as-is
    if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateValue)) {
      return dateValue.split('T')[0];
    }

    // Otherwise parse and extract date components in UTC to avoid timezone shifts
    const date = new Date(dateValue);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return {
    id: event.id,
    tripId: event.trip_id,
    date: formatDate(event.date),
    time: event.time || '',
    title: event.title,
    shipVenueId: event.ship_venue_id,
    resortVenueId: event.resort_venue_id,
    venueName: event.ship_venues?.name || event.resort_venues?.name,
    talentIds: Array.isArray(event.talent_ids) ? event.talent_ids : [],
    talentNames: Array.isArray(event.talentNames) ? event.talentNames : [],
    talentImages: Array.isArray(event.talentImages) ? event.talentImages : [],
    partyThemeId: event.party_theme_id,
    partyThemeName: event.party_themes?.name,
    eventTypeId: event.event_type_id,
    eventTypeName: event.event_types?.name,
    eventTypeColor: event.event_types?.color,
    eventTypeIcon: event.event_types?.icon,
    imageUrl: event.image_url,
    description: event.description,
    createdAt: event.created_at,
    updatedAt: event.updated_at,
  };
}

// Validation schemas
const createEventSchema = z.object({
  tripId: z.number().int(),
  date: z
    .string()
    .min(1, 'Date is required')
    .regex(/^\d{4}-\d{2}-\d{2}/, 'Date must be in YYYY-MM-DD format'),
  time: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in 24-hour format (HH:MM)'),
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
  eventTypeId: z.number().int().min(1, 'Event type is required'),
  shipVenueId: z.number().int().nullable().optional(),
  resortVenueId: z.number().int().nullable().optional(),
  talentIds: z.array(z.number().int()).optional().default([]),
  partyThemeId: z.number().int().nullable().optional(),
  imageUrl: z
    .string()
    .url()
    .optional()
    .or(z.literal(''))
    .transform(val => val || null)
    .nullable(),
  description: z.string().optional().nullable(),
});

const updateEventSchema = createEventSchema.partial();

export function registerEventRoutes(app: Express) {
  // Get all events for a trip
  app.get(
    '/api/admin/trips/:tripId/events',
    requireTripAdmin,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { tripId } = req.params;

      try {
        const supabaseAdmin = await getSupabaseAdmin();

        // Get events with joins to related tables
        const { data: events, error } = await supabaseAdmin
          .from('events')
          .select(
            `
          *,
          event_types (*),
          ship_venues (*),
          resort_venues (*),
          party_themes (*)
        `
          )
          .eq('trip_id', tripId)
          .order('date')
          .order('time')
          .order('id');

        if (error) {
          logger.error('Error fetching events', { error, tripId });
          throw ApiError.internal('Failed to fetch events');
        }

        // Fetch talent details (names and images) for events that have talent_ids
        // Also apply image fallback logic for party themes
        const eventsWithTalent = await Promise.all(
          (events || []).map(async event => {
            let talentNames: string[] = [];
            let talentImages: (string | null)[] = [];

            // Fetch talent data if talent IDs exist
            if (
              event.talent_ids &&
              Array.isArray(event.talent_ids) &&
              event.talent_ids.length > 0
            ) {
              const { data: talentData, error: talentError } = await supabaseAdmin
                .from('talent')
                .select('id, name, profile_image_url')
                .in('id', event.talent_ids);

              if (!talentError && talentData) {
                // Create maps to preserve the order from talent_ids
                const talentNameMap = new Map(talentData.map(t => [t.id, t.name]));
                const talentImageMap = new Map(talentData.map(t => [t.id, t.profile_image_url]));

                talentNames = event.talent_ids
                  .map((id: number) => talentNameMap.get(id))
                  .filter(Boolean);
                talentImages = event.talent_ids
                  .map((id: number) => talentImageMap.get(id))
                  .filter(Boolean);
              }
            }

            // Apply image fallback: if no event image and it's a party with a theme, use theme image
            let eventImageUrl = event.image_url;
            if (!eventImageUrl && event.party_theme_id && event.party_themes?.image_url) {
              eventImageUrl = event.party_themes.image_url;
            }

            return {
              ...event,
              image_url: eventImageUrl,
              talentNames,
              talentImages,
            };
          })
        );

        const transformedEvents = eventsWithTalent.map(transformEventData);
        return res.json(transformedEvents);
      } catch (error: any) {
        if (error.status) throw error;
        logger.error('Error fetching events', { error, tripId });
        throw ApiError.internal('Failed to fetch events');
      }
    })
  );

  // Create a new event for a trip
  app.post(
    '/api/admin/trips/:tripId/events',
    requireTripAdmin,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { tripId } = req.params;

      console.log('==================== CREATE EVENT REQUEST ====================');
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      console.log('Trip ID:', tripId);
      console.log('==============================================================');

      const validation = createEventSchema.safeParse(req.body);

      if (!validation.success) {
        console.log('==================== VALIDATION FAILED ====================');
        console.log('Validation errors:', JSON.stringify(validation.error.errors, null, 2));
        console.log('===========================================================');
        throw ApiError.badRequest('Invalid event data', { errors: validation.error.errors });
      }

      const data = validation.data;
      console.log('✓ Validation passed');
      console.log('Validated data:', JSON.stringify(data, null, 2));

      try {
        console.log('✓ Getting Supabase admin client');
        const supabaseAdmin = await getSupabaseAdmin();

        // If talent IDs are provided, auto-add them to trip_talent if not already there
        console.log('✓ Checking talent assignments...');
        if (data.talentIds && data.talentIds.length > 0) {
          // First, verify the talent IDs actually exist in the talent table
          const { data: talentExists, error: talentExistsError } = await supabaseAdmin
            .from('talent')
            .select('id')
            .in('id', data.talentIds);

          if (talentExistsError) {
            console.log('✗ Error checking if talent exists:', talentExistsError);
            logger.error('Error checking talent existence', { error: talentExistsError, tripId });
            throw ApiError.internal('Failed to validate talent');
          }

          if (!talentExists || talentExists.length !== data.talentIds.length) {
            console.log(
              '✗ Some talent IDs do not exist. Expected:',
              data.talentIds.length,
              'Found:',
              talentExists?.length
            );
            throw ApiError.badRequest('Some talent IDs do not exist');
          }

          // Check which talents are already in trip_talent
          const { data: existingTripTalent, error: tripTalentError } = await supabaseAdmin
            .from('trip_talent')
            .select('talent_id')
            .eq('trip_id', tripId)
            .in('talent_id', data.talentIds);

          if (tripTalentError) {
            console.log('✗ Error checking trip_talent:', tripTalentError);
            logger.error('Error checking trip_talent', { error: tripTalentError, tripId });
            throw ApiError.internal('Failed to check trip talent assignments');
          }

          const existingTalentIds = existingTripTalent?.map(t => t.talent_id) || [];
          const missingTalentIds = data.talentIds.filter(id => !existingTalentIds.includes(id));

          // Auto-add missing talent to trip_talent
          if (missingTalentIds.length > 0) {
            console.log('✓ Auto-adding talent to trip_talent:', missingTalentIds);
            const tripTalentInserts = missingTalentIds.map(talentId => ({
              trip_id: parseInt(tripId),
              talent_id: talentId,
            }));

            const { error: insertError } = await supabaseAdmin
              .from('trip_talent')
              .insert(tripTalentInserts);

            if (insertError) {
              console.log('✗ Error adding talent to trip_talent:', insertError);
              logger.error('Error adding talent to trip_talent', { error: insertError, tripId });
              throw ApiError.internal('Failed to add talent to trip');
            }
            console.log('✓ Successfully added talent to trip_talent');
          } else {
            console.log('✓ All talent already in trip_talent');
          }
        } else {
          console.log('✓ No talent IDs to validate');
        }

        // Create the event
        // Convert YYYY-MM-DD date string to timestamp (using midnight UTC to avoid timezone shifts)
        console.log('✓ Converting date:', data.date, 'Type:', typeof data.date);

        if (!data.date || data.date === '') {
          throw ApiError.badRequest('Date is required');
        }

        // Extract only YYYY-MM-DD part in case a timestamp was sent
        const datePart = data.date.split('T')[0];
        console.log('✓ Extracted date part:', datePart);

        const dateObj = new Date(`${datePart}T00:00:00Z`);
        if (isNaN(dateObj.getTime())) {
          console.log('✗ Invalid date value:', datePart);
          throw ApiError.badRequest(`Invalid date format: ${datePart}`);
        }

        const dateTimestamp = dateObj.toISOString();
        console.log('✓ Date converted to timestamp:', dateTimestamp);

        console.log('✓ Inserting event into database...');
        const { data: newEvent, error } = await supabaseAdmin
          .from('events')
          .insert({
            trip_id: tripId,
            date: dateTimestamp,
            time: data.time,
            title: data.title,
            event_type_id: data.eventTypeId,
            ship_venue_id: data.shipVenueId || null,
            resort_venue_id: data.resortVenueId || null,
            talent_ids: data.talentIds && data.talentIds.length > 0 ? data.talentIds : null,
            party_theme_id: data.partyThemeId || null,
            image_url: data.imageUrl || null,
            description: data.description || null,
          })
          .select(
            `
          *,
          event_types (*),
          ship_venues (*),
          resort_venues (*),
          party_themes (*)
        `
          )
          .single();

        if (error) {
          console.log('==================== SUPABASE ERROR ====================');
          console.log('Error message:', error?.message);
          console.log('Error details:', error?.details);
          console.log('Error hint:', error?.hint);
          console.log('Error code:', error?.code);
          console.log('Full error:', JSON.stringify(error, null, 2));
          console.log('Request data:', JSON.stringify(data, null, 2));
          console.log('========================================================');

          logger.error('Error creating event - Supabase error:', {
            message: error?.message || 'Unknown error',
            details: error?.details || 'No details',
            hint: error?.hint || 'No hint',
            code: error?.code || 'No code',
            tripId,
            requestData: JSON.stringify(data),
          });
          throw ApiError.internal('Failed to create event');
        }

        let talentNames: string[] = [];
        let talentImages: (string | null)[] = [];

        const createdTalentIds: number[] = Array.isArray(newEvent?.talent_ids)
          ? newEvent.talent_ids
          : [];

        if (createdTalentIds.length > 0) {
          const { data: talentData, error: talentFetchError } = await supabaseAdmin
            .from('talent')
            .select('id, name, profile_image_url')
            .in('id', createdTalentIds);

          if (talentFetchError) {
            logger.error('Error fetching talent for new event', {
              error: talentFetchError,
              tripId,
            });
          } else if (talentData) {
            const nameMap = new Map(talentData.map(t => [t.id, t.name]));
            const imageMap = new Map(talentData.map(t => [t.id, t.profile_image_url]));

            talentNames = createdTalentIds
              .map(talentId => nameMap.get(talentId) || null)
              .filter(Boolean) as string[];
            talentImages = createdTalentIds.map(talentId => imageMap.get(talentId) || null);
          }
        }

        const transformedEvent = transformEventData({
          ...newEvent,
          talentNames,
          talentImages,
        });
        logger.info('Event created', {
          eventId: transformedEvent.id,
          tripId,
          userId: req.user?.id,
        });

        return res.status(201).json(transformedEvent);
      } catch (error: any) {
        if (error.status) throw error;
        console.log('==================== CAUGHT ERROR ====================');
        console.log('Error message:', error?.message);
        console.log('Error stack:', error?.stack);
        console.log('Error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        console.log('======================================================');
        logger.error('Error creating event', {
          message: error?.message,
          stack: error?.stack,
          error,
          tripId,
          data,
        });
        throw ApiError.internal('Failed to create event');
      }
    })
  );

  // Update an event
  app.put(
    '/api/admin/events/:id',
    requireTripAdmin,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;
      const validation = updateEventSchema.safeParse(req.body);

      if (!validation.success) {
        throw ApiError.badRequest('Invalid event data', { errors: validation.error.errors });
      }

      const data = validation.data;

      try {
        const supabaseAdmin = await getSupabaseAdmin();

        // Get the current event to find trip_id for talent validation
        const { data: existingEvent, error: fetchError } = await supabaseAdmin
          .from('events')
          .select('trip_id, talent_ids')
          .eq('id', id)
          .single();

        if (fetchError || !existingEvent) {
          throw ApiError.notFound('Event not found');
        }

        const tripId = existingEvent.trip_id;
        const previousTalentIds = Array.isArray(existingEvent.talent_ids)
          ? existingEvent.talent_ids
          : [];

        // If talent IDs are provided, auto-add them to trip_talent if not already there
        if (data.talentIds && data.talentIds.length > 0) {
          // First, verify the talent IDs actually exist in the talent table
          const { data: talentExists, error: talentExistsError } = await supabaseAdmin
            .from('talent')
            .select('id')
            .in('id', data.talentIds);

          if (talentExistsError) {
            logger.error('Error checking talent existence', { error: talentExistsError, tripId });
            throw ApiError.internal('Failed to validate talent');
          }

          if (!talentExists || talentExists.length !== data.talentIds.length) {
            throw ApiError.badRequest('Some talent IDs do not exist');
          }

          // Check which talents are already in trip_talent
          const { data: existingTripTalent, error: tripTalentError } = await supabaseAdmin
            .from('trip_talent')
            .select('talent_id')
            .eq('trip_id', tripId)
            .in('talent_id', data.talentIds);

          if (tripTalentError) {
            logger.error('Error checking trip_talent', { error: tripTalentError, tripId });
            throw ApiError.internal('Failed to check trip talent assignments');
          }

          const existingTalentIds = existingTripTalent?.map(t => t.talent_id) || [];
          const missingTalentIds = data.talentIds.filter(id => !existingTalentIds.includes(id));

          // Auto-add missing talent to trip_talent
          if (missingTalentIds.length > 0) {
            const tripTalentInserts = missingTalentIds.map(talentId => ({
              trip_id: tripId,
              talent_id: talentId,
            }));

            const { error: insertError } = await supabaseAdmin
              .from('trip_talent')
              .insert(tripTalentInserts);

            if (insertError) {
              logger.error('Error adding talent to trip_talent', { error: insertError, tripId });
              throw ApiError.internal('Failed to add talent to trip');
            }
          }
        }

        // Build update object
        const updateData: any = {
          updated_at: new Date().toISOString(),
        };

        if (data.date !== undefined) {
          // Convert YYYY-MM-DD date string to timestamp (using midnight UTC to avoid timezone shifts)
          // Extract only YYYY-MM-DD part in case a timestamp was sent
          const datePart = data.date.split('T')[0];
          updateData.date = new Date(`${datePart}T00:00:00Z`).toISOString();
        }
        if (data.time !== undefined) updateData.time = data.time;
        if (data.title !== undefined) updateData.title = data.title;
        if (data.eventTypeId !== undefined) updateData.event_type_id = data.eventTypeId;
        if (data.shipVenueId !== undefined) updateData.ship_venue_id = data.shipVenueId;
        if (data.resortVenueId !== undefined) updateData.resort_venue_id = data.resortVenueId;
        if (data.partyThemeId !== undefined) updateData.party_theme_id = data.partyThemeId;
        if (data.talentIds !== undefined)
          updateData.talent_ids =
            data.talentIds && data.talentIds.length > 0 ? data.talentIds : null;
        if (data.imageUrl !== undefined) updateData.image_url = data.imageUrl;
        if (data.description !== undefined) updateData.description = data.description;

        const { data: updatedEvent, error } = await supabaseAdmin
          .from('events')
          .update(updateData)
          .eq('id', id)
          .select(
            `
          *,
          event_types (*),
          ship_venues (*),
          resort_venues (*),
          party_themes (*)
        `
          )
          .single();

        if (error) {
          logger.error('Error updating event', { error, eventId: id });
          throw ApiError.internal('Failed to update event');
        }

        // Check if any talent was removed and clean up trip_talent if needed
        // Wrap in try-catch to prevent cleanup errors from failing the update
        try {
          if (data.talentIds !== undefined) {
            const newTalentIds = Array.isArray(data.talentIds) ? data.talentIds : [];
            const removedTalentIds = previousTalentIds.filter(id => !newTalentIds.includes(id));

            // For each removed talent, check if they're in any other events on this trip
            if (removedTalentIds.length > 0) {
              console.log(
                '✓ Checking if removed talent should be cleaned up from trip_talent:',
                removedTalentIds
              );

              for (const talentId of removedTalentIds) {
                // Check if this talent is in any other event on this trip
                // Use a raw query to check if talent_ids array contains the talent
                const { data: otherEvents, error: checkError } = await supabaseAdmin.rpc(
                  'check_talent_in_other_events',
                  {
                    p_trip_id: tripId,
                    p_event_id: parseInt(id),
                    p_talent_id: talentId,
                  }
                );

                if (checkError) {
                  console.log('✗ Error checking other events for talent:', checkError);
                  // Fallback to simple query
                  const { data: fallbackEvents } = await supabaseAdmin
                    .from('events')
                    .select('id, talent_ids')
                    .eq('trip_id', tripId)
                    .neq('id', id);

                  const talentInOtherEvents = fallbackEvents?.some(
                    e => Array.isArray(e.talent_ids) && e.talent_ids.includes(talentId)
                  );

                  if (!talentInOtherEvents) {
                    const { error: deleteError } = await supabaseAdmin
                      .from('trip_talent')
                      .delete()
                      .eq('trip_id', tripId)
                      .eq('talent_id', talentId);

                    if (!deleteError) {
                      console.log('✓ Successfully removed talent from trip_talent:', talentId);
                    }
                  }
                  continue;
                }

                // If talent is not in any other events, remove from trip_talent
                if (!otherEvents || otherEvents === 0) {
                  console.log(
                    '✓ Talent not in any other events, removing from trip_talent:',
                    talentId
                  );
                  const { error: deleteError } = await supabaseAdmin
                    .from('trip_talent')
                    .delete()
                    .eq('trip_id', tripId)
                    .eq('talent_id', talentId);

                  if (deleteError) {
                    console.log('✗ Error removing talent from trip_talent:', deleteError);
                  } else {
                    console.log('✓ Successfully removed talent from trip_talent:', talentId);
                  }
                } else {
                  console.log('✓ Talent still in other events, keeping in trip_talent:', talentId);
                }
              }
            }
          }
        } catch (cleanupError) {
          // Log cleanup errors but don't fail the update
          console.log('✗ Error during talent cleanup (non-fatal):', cleanupError);
          logger.warn('Non-fatal error during talent cleanup', {
            error: cleanupError,
            eventId: id,
          });
        }

        console.log('✓ Event update successful, now fetching talent data');
        let talentNames: string[] = [];
        let talentImages: (string | null)[] = [];

        const updatedTalentIds: number[] = Array.isArray(updatedEvent?.talent_ids)
          ? updatedEvent.talent_ids
          : [];
        console.log('✓ Updated talent IDs:', updatedTalentIds);

        if (updatedTalentIds.length > 0) {
          console.log('✓ Fetching talent data for', updatedTalentIds.length, 'talents');
          const { data: talentData, error: talentFetchError } = await supabaseAdmin
            .from('talent')
            .select('id, name, profile_image_url')
            .in('id', updatedTalentIds);

          if (talentFetchError) {
            logger.error('Error fetching talent for updated event', {
              error: talentFetchError,
              eventId: id,
            });
            console.log('✗ Error fetching talent:', talentFetchError);
          } else if (talentData) {
            console.log('✓ Talent data fetched successfully:', talentData.length, 'talents');
            const nameMap = new Map(talentData.map(t => [t.id, t.name]));
            const imageMap = new Map(talentData.map(t => [t.id, t.profile_image_url]));

            talentNames = updatedTalentIds
              .map(talentId => nameMap.get(talentId) || null)
              .filter(Boolean) as string[];
            talentImages = updatedTalentIds.map(talentId => imageMap.get(talentId) || null);
          }
        }

        const transformedEvent = transformEventData({
          ...updatedEvent,
          talentNames,
          talentImages,
        });
        logger.info('Event updated', { eventId: id, userId: req.user?.id });

        return res.json(transformedEvent);
      } catch (error: any) {
        if (error.status) throw error;
        logger.error('Error updating event', {
          error,
          eventId: id,
          errorMessage: error?.message,
          errorStack: error?.stack,
          errorName: error?.constructor?.name,
        });
        throw ApiError.internal('Failed to update event');
      }
    })
  );

  // Delete an event
  app.delete(
    '/api/admin/events/:id',
    requireTripAdmin,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;

      try {
        const supabaseAdmin = await getSupabaseAdmin();

        // First, get the event to access its talent_ids and trip_id before deletion
        const { data: event, error: fetchError } = await supabaseAdmin
          .from('events')
          .select('talent_ids, trip_id')
          .eq('id', id)
          .single();

        if (fetchError) {
          if (fetchError.code === 'PGRST116') {
            throw ApiError.notFound('Event not found');
          }
          logger.error('Error fetching event for deletion', { error: fetchError, eventId: id });
          throw ApiError.internal('Failed to fetch event');
        }

        const talentIdsToCheck = Array.isArray(event?.talent_ids) ? event.talent_ids : [];
        const tripId = event?.trip_id;

        // Delete the event
        const { error } = await supabaseAdmin.from('events').delete().eq('id', id);

        if (error) {
          logger.error('Error deleting event', { error, eventId: id });
          throw ApiError.internal('Failed to delete event');
        }

        // Clean up trip_talent: remove talent that are no longer in any events on this trip
        if (talentIdsToCheck.length > 0 && tripId) {
          try {
            console.log(
              '✓ Checking if talent should be removed from trip_talent:',
              talentIdsToCheck
            );

            for (const talentId of talentIdsToCheck) {
              // Check if this talent is in any other events on this trip
              const { data: otherEvents, error: checkError } = await supabaseAdmin
                .from('events')
                .select('id, talent_ids')
                .eq('trip_id', tripId);

              if (checkError) {
                console.log('✗ Error checking other events:', checkError);
                continue; // Skip this talent if we can't check
              }

              // Filter events that have this talent
              const talentInOtherEvents = otherEvents?.some(
                e => Array.isArray(e.talent_ids) && e.talent_ids.includes(talentId)
              );

              // If talent is not in any other events, remove from trip_talent
              if (!talentInOtherEvents) {
                console.log(
                  `✓ Removing talent ${talentId} from trip_talent (no longer in any events)`
                );
                const { error: deleteError } = await supabaseAdmin
                  .from('trip_talent')
                  .delete()
                  .eq('trip_id', tripId)
                  .eq('talent_id', talentId);

                if (deleteError) {
                  console.log('✗ Error removing talent from trip_talent:', deleteError);
                }
              } else {
                console.log(`✓ Keeping talent ${talentId} in trip_talent (still in other events)`);
              }
            }
          } catch (cleanupError) {
            // Log cleanup errors but don't fail the deletion
            console.log('✗ Error during talent cleanup (non-fatal):', cleanupError);
            logger.warn('Non-fatal error during talent cleanup after event deletion', {
              error: cleanupError,
              eventId: id,
            });
          }
        }

        logger.info('Event deleted', { eventId: id, userId: req.user?.id });

        return res.status(204).send();
      } catch (error: any) {
        if (error.status) throw error;
        logger.error('Error deleting event', { error, eventId: id });
        throw ApiError.internal('Failed to delete event');
      }
    })
  );
}
