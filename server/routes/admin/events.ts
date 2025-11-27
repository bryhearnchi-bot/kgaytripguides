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
    if (typeof dateValue !== 'string' && !(dateValue instanceof Date)) return '';

    // If already a string in YYYY-MM-DD format, return as-is
    if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateValue)) {
      return dateValue.split('T')[0] ?? '';
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

      logger.debug('Create event request received', {
        body: req.body,
        tripId,
      });

      const validation = createEventSchema.safeParse(req.body);

      if (!validation.success) {
        logger.warn('Event validation failed', {
          errors: validation.error.errors,
          tripId,
        });
        throw ApiError.badRequest('Invalid event data', { errors: validation.error.errors });
      }

      const data = validation.data;
      logger.debug('Event validation passed', { data, tripId });

      try {
        const supabaseAdmin = await getSupabaseAdmin();

        // If talent IDs are provided, auto-add them to trip_talent if not already there
        logger.debug('Checking talent assignments', { talentIds: data.talentIds });
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
            logger.warn('Some talent IDs do not exist', {
              expected: data.talentIds.length,
              found: talentExists?.length,
              tripId,
            });
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
            logger.info('Auto-adding talent to trip_talent', { missingTalentIds, tripId });
            if (!tripId) {
              logger.error('tripId is required for auto-adding talent');
              return;
            }
            const tripTalentInserts = missingTalentIds.map(talentId => ({
              trip_id: parseInt(tripId),
              talent_id: talentId,
            }));

            const { error: insertError } = await supabaseAdmin
              .from('trip_talent')
              .insert(tripTalentInserts);

            if (insertError) {
              logger.error('Error adding talent to trip_talent', { error: insertError, tripId });
              throw ApiError.internal('Failed to add talent to trip');
            }
            logger.debug('Successfully added talent to trip_talent', { tripId });
          } else {
            logger.debug('All talent already in trip_talent', { tripId });
          }
        } else {
          logger.debug('No talent IDs to validate', { tripId });
        }

        // Create the event
        // Convert YYYY-MM-DD date string to timestamp (using midnight UTC to avoid timezone shifts)
        logger.debug('Converting date', { date: data.date, type: typeof data.date, tripId });

        if (!data.date || data.date === '') {
          throw ApiError.badRequest('Date is required');
        }

        // Extract only YYYY-MM-DD part in case a timestamp was sent
        const datePart = data.date.split('T')[0];
        logger.debug('Extracted date part', { datePart, tripId });

        const dateObj = new Date(`${datePart}T00:00:00Z`);
        if (isNaN(dateObj.getTime())) {
          logger.warn('Invalid date value', { datePart, tripId });
          throw ApiError.badRequest(`Invalid date format: ${datePart}`);
        }

        const dateTimestamp = dateObj.toISOString();
        logger.debug('Date converted to timestamp', { dateTimestamp, tripId });

        // If no image URL provided and this is a party with a theme, fetch the party theme's image
        let eventImageUrl = data.imageUrl || null;
        if (!eventImageUrl && data.partyThemeId) {
          logger.debug('No event image provided, fetching party theme image', {
            partyThemeId: data.partyThemeId,
            tripId,
          });
          const { data: partyTheme, error: themeError } = await supabaseAdmin
            .from('party_themes')
            .select('image_url')
            .eq('id', data.partyThemeId)
            .single();

          if (!themeError && partyTheme?.image_url) {
            eventImageUrl = partyTheme.image_url;
            logger.debug('Using party theme image as fallback', { eventImageUrl, tripId });
          }
        }

        logger.debug('Inserting event into database', { tripId });
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
            image_url: eventImageUrl,
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
          logger.error('Error creating event - Supabase error', {
            message: error?.message || 'Unknown error',
            details: error?.details || 'No details',
            hint: error?.hint || 'No hint',
            code: error?.code || 'No code',
            tripId,
            requestData: data,
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

        // Handle image URL with party theme fallback
        if (data.imageUrl !== undefined) {
          let eventImageUrl = data.imageUrl || null;

          // If no image URL provided and this is a party with a theme, fetch the party theme's image
          if (!eventImageUrl && data.partyThemeId) {
            logger.debug('No event image provided, fetching party theme image', {
              partyThemeId: data.partyThemeId,
              eventId: id,
            });
            const { data: partyTheme, error: themeError } = await supabaseAdmin
              .from('party_themes')
              .select('image_url')
              .eq('id', data.partyThemeId)
              .single();

            if (!themeError && partyTheme?.image_url) {
              eventImageUrl = partyTheme.image_url;
              logger.debug('Using party theme image as fallback', { eventImageUrl, eventId: id });
            }
          }

          updateData.image_url = eventImageUrl;
        }

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
              logger.debug('Checking if removed talent should be cleaned up from trip_talent', {
                removedTalentIds,
                tripId,
                eventId: id,
              });

              for (const talentId of removedTalentIds) {
                // Check if this talent is in any other event on this trip
                // Use a raw query to check if talent_ids array contains the talent
                if (!tripId) {
                  logger.error('tripId is required for checking talent in other events');
                  return;
                }
                const validTripId = tripId.toString();
                const validEventId = parseInt(id ?? '0');
                const { data: otherEvents, error: checkError } = await supabaseAdmin.rpc(
                  'check_talent_in_other_events',
                  {
                    p_trip_id: validTripId,
                    p_event_id: validEventId,
                    p_talent_id: talentId,
                  }
                );

                if (checkError) {
                  logger.warn('Error checking other events for talent', {
                    error: checkError,
                    talentId,
                    tripId,
                    eventId: id,
                  });
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
                      logger.debug('Successfully removed talent from trip_talent', {
                        talentId,
                        tripId,
                        eventId: id,
                      });
                    }
                  }
                  continue;
                }

                // If talent is not in any other events, remove from trip_talent
                if (!otherEvents || otherEvents === 0) {
                  logger.debug('Talent not in any other events, removing from trip_talent', {
                    talentId,
                    tripId,
                    eventId: id,
                  });
                  const { error: deleteError } = await supabaseAdmin
                    .from('trip_talent')
                    .delete()
                    .eq('trip_id', tripId)
                    .eq('talent_id', talentId);

                  if (deleteError) {
                    logger.warn('Error removing talent from trip_talent', {
                      error: deleteError,
                      talentId,
                      tripId,
                      eventId: id,
                    });
                  } else {
                    logger.debug('Successfully removed talent from trip_talent', {
                      talentId,
                      tripId,
                      eventId: id,
                    });
                  }
                } else {
                  logger.debug('Talent still in other events, keeping in trip_talent', {
                    talentId,
                    tripId,
                    eventId: id,
                  });
                }
              }
            }
          }
        } catch (cleanupError) {
          // Log cleanup errors but don't fail the update
          logger.warn('Non-fatal error during talent cleanup', {
            error: cleanupError,
            eventId: id,
          });
        }

        logger.debug('Event update successful, now fetching talent data', { eventId: id });
        let talentNames: string[] = [];
        let talentImages: (string | null)[] = [];

        const updatedTalentIds: number[] = Array.isArray(updatedEvent?.talent_ids)
          ? updatedEvent.talent_ids
          : [];
        logger.debug('Updated talent IDs', { updatedTalentIds, eventId: id });

        if (updatedTalentIds.length > 0) {
          logger.debug('Fetching talent data', {
            count: updatedTalentIds.length,
            eventId: id,
          });
          const { data: talentData, error: talentFetchError } = await supabaseAdmin
            .from('talent')
            .select('id, name, profile_image_url')
            .in('id', updatedTalentIds);

          if (talentFetchError) {
            logger.error('Error fetching talent for updated event', {
              error: talentFetchError,
              eventId: id,
            });
          } else if (talentData) {
            logger.debug('Talent data fetched successfully', {
              count: talentData.length,
              eventId: id,
            });
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
            logger.debug('Checking if talent should be removed from trip_talent', {
              talentIdsToCheck,
              tripId,
              eventId: id,
            });

            for (const talentId of talentIdsToCheck) {
              // Check if this talent is in any other events on this trip
              const { data: otherEvents, error: checkError } = await supabaseAdmin
                .from('events')
                .select('id, talent_ids')
                .eq('trip_id', tripId);

              if (checkError) {
                logger.warn('Error checking other events', {
                  error: checkError,
                  talentId,
                  tripId,
                  eventId: id,
                });
                continue; // Skip this talent if we can't check
              }

              // Filter events that have this talent
              const talentInOtherEvents = otherEvents?.some(
                e => Array.isArray(e.talent_ids) && e.talent_ids.includes(talentId)
              );

              // If talent is not in any other events, remove from trip_talent
              if (!talentInOtherEvents) {
                logger.debug('Removing talent from trip_talent (no longer in any events)', {
                  talentId,
                  tripId,
                  eventId: id,
                });
                const { error: deleteError } = await supabaseAdmin
                  .from('trip_talent')
                  .delete()
                  .eq('trip_id', tripId)
                  .eq('talent_id', talentId);

                if (deleteError) {
                  logger.warn('Error removing talent from trip_talent', {
                    error: deleteError,
                    talentId,
                    tripId,
                    eventId: id,
                  });
                }
              } else {
                logger.debug('Keeping talent in trip_talent (still in other events)', {
                  talentId,
                  tripId,
                  eventId: id,
                });
              }
            }
          } catch (cleanupError) {
            // Log cleanup errors but don't fail the deletion
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
