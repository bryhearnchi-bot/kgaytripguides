import type { Express, Response } from 'express';
import { requireAuth, requireContentEditor, type AuthenticatedRequest } from '../auth';
import { getSupabaseAdmin } from '../supabase-admin';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../logging/logger';
import { ApiError } from '../utils/ApiError';
import {
  tripWizardSchema,
  tripDraftSchema,
  type TripWizardData,
  type TripDraftData,
} from '../schemas/trip-wizard-schemas';

/**
 * Generate a unique slug by appending a number if needed
 */
async function ensureUniqueSlug(supabase: any, baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const { data: existing } = await supabase.from('trips').select('id').eq('slug', slug).single();

    if (!existing) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

/**
 * Create a complete trip with all relationships
 */
async function createCompleteTrip(supabase: any, tripData: TripWizardData, userId: string) {
  // Start transaction (Supabase doesn't have explicit transactions, so we'll handle rollback manually)
  const createdResources: { table: string; id: number }[] = [];

  try {
    // 1. Ensure unique slug
    const uniqueSlug = await ensureUniqueSlug(supabase, tripData.slug);

    // 2. Create/link resort OR ship FIRST (before trip)
    let resortId: number | null = null;
    let shipId: number | null = null;

    // Handle resort
    if (tripData.resortId) {
      // Link to existing resort
      resortId = tripData.resortId;
      logger.info('Using existing resort', { resortId });
    } else if (tripData.resortData) {
      // Create new resort
      const { data: resort, error: resortError } = await supabase
        .from('resorts')
        .insert({
          name: tripData.resortData.name,
          location_id: tripData.resortData.locationId,
          capacity: tripData.resortData.capacity || null,
          number_of_rooms: tripData.resortData.numberOfRooms || null,
          image_url: tripData.resortData.imageUrl || null,
          description: tripData.resortData.description || null,
          property_map_url: tripData.resortData.propertyMapUrl || null,
          check_in_time: tripData.resortData.checkInTime || null,
          check_out_time: tripData.resortData.checkOutTime || null,
        })
        .select()
        .single();

      if (resortError) throw new Error(`Failed to create resort: ${resortError.message}`);
      createdResources.push({ table: 'resorts', id: resort.id });
      resortId = resort.id;
      logger.info('Created new resort', { resortId });
    }

    // Handle ship
    if (tripData.shipId) {
      // Link to existing ship
      shipId = tripData.shipId;
      logger.info('Using existing ship', { shipId });
    } else if (tripData.shipData) {
      // Create new ship
      const { data: ship, error: shipError } = await supabase
        .from('ships')
        .insert({
          name: tripData.shipData.name,
          cruise_line: tripData.shipData.cruiseLine || null,
          capacity: tripData.shipData.capacity || null,
          decks: tripData.shipData.decks || null,
          image_url: tripData.shipData.imageUrl || null,
          description: tripData.shipData.description || null,
          deck_plans_url: tripData.shipData.deckPlansUrl || null,
        })
        .select()
        .single();

      if (shipError) throw new Error(`Failed to create ship: ${shipError.message}`);
      createdResources.push({ table: 'ships', id: ship.id });
      shipId = ship.id;
      logger.info('Created new ship', { shipId });
    }

    // 3. Get the Preview status ID
    const { data: previewStatus } = await supabase
      .from('trip_status')
      .select('id')
      .eq('status', 'Preview')
      .single();

    if (!previewStatus) {
      throw new Error('Preview status not found');
    }

    // 4. Create the main trip record WITH ship_id/resort_id already set
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .insert({
        name: tripData.name,
        slug: uniqueSlug,
        charter_company_id: tripData.charterCompanyId,
        trip_type_id: tripData.tripTypeId,
        start_date: tripData.startDate,
        end_date: tripData.endDate,
        hero_image_url: tripData.heroImageUrl || null,
        map_url: tripData.mapUrl || null,
        description: tripData.description || null,
        highlights: tripData.highlights || null,
        ship_id: shipId,
        resort_id: resortId,
        trip_status_id: previewStatus.id, // Set to Preview status
        is_active: false, // Not live on site yet
        created_by: userId,
      })
      .select()
      .single();

    if (tripError) throw new Error(`Failed to create trip: ${tripError.message}`);
    createdResources.push({ table: 'trips', id: trip.id });

    logger.info('Created trip', { tripId: trip.id, name: trip.name, resortId, shipId });

    // 4. Link amenities and create schedules/itineraries
    if (resortId) {
      // 4. Link venues (one-to-one) - if venueIds provided, they should already exist
      if (tripData.venueIds && tripData.venueIds.length > 0) {
        // Note: Venues are typically created separately, then linked here
        // For now, we'll just log that they should be linked
        logger.info('Venue linking needed', { resortId, venueIds: tripData.venueIds });
      }

      // 5. Link amenities (many-to-many)
      if (tripData.amenityIds && tripData.amenityIds.length > 0) {
        const amenityLinks = tripData.amenityIds.map(amenityId => ({
          resort_id: resortId,
          amenity_id: amenityId,
        }));

        // Use upsert with onConflict to handle duplicates
        const { error: amenityError } = await supabase
          .from('resort_amenities')
          .upsert(amenityLinks, {
            onConflict: 'resort_id,amenity_id',
            ignoreDuplicates: true,
          });

        if (amenityError) throw new Error(`Failed to link amenities: ${amenityError.message}`);

        logger.info('Linked amenities to resort', { resortId, count: amenityLinks.length });
      }

      // 6. Create schedule entries
      if (tripData.scheduleEntries && tripData.scheduleEntries.length > 0) {
        const scheduleData = tripData.scheduleEntries.map(entry => ({
          trip_id: trip.id,
          day_number: entry.dayNumber,
          date: entry.date,
          image_url: entry.imageUrl || null,
          description: entry.description || null,
          order_index: entry.dayNumber + 1, // order_index = day_number + 1
        }));

        // First, delete any existing schedule entries for this trip to avoid conflicts
        await supabase.from('resort_schedules').delete().eq('trip_id', trip.id);

        // Now insert fresh schedule entries
        const { error: scheduleError } = await supabase
          .from('resort_schedules')
          .insert(scheduleData);

        if (scheduleError) throw new Error(`Failed to create schedule: ${scheduleError.message}`);

        logger.info('Created resort schedule', { tripId: trip.id, entries: scheduleData.length });
      }
    }

    // 5. Link ship amenities and create itinerary (ship_id already set from earlier)
    if (shipId) {
      // 4. Link venues (one-to-one)
      if (tripData.venueIds && tripData.venueIds.length > 0) {
        logger.info('Venue linking needed', { shipId, venueIds: tripData.venueIds });
      }

      // 5. Link amenities (many-to-many)
      if (tripData.amenityIds && tripData.amenityIds.length > 0) {
        const amenityLinks = tripData.amenityIds.map(amenityId => ({
          ship_id: shipId,
          amenity_id: amenityId,
        }));

        // Use upsert with onConflict to handle duplicates
        const { error: amenityError } = await supabase.from('ship_amenities').upsert(amenityLinks, {
          onConflict: 'ship_id,amenity_id',
          ignoreDuplicates: true,
        });

        if (amenityError) throw new Error(`Failed to link amenities: ${amenityError.message}`);

        logger.info('Linked amenities to ship', { shipId, count: amenityLinks.length });
      }

      // 6. Create itinerary entries
      if (tripData.itineraryEntries && tripData.itineraryEntries.length > 0) {
        const itineraryData = tripData.itineraryEntries.map(entry => ({
          trip_id: trip.id,
          day: entry.dayNumber,
          date: entry.date,
          location_id: entry.locationId || null,
          location_name: entry.locationName || null,
          arrival_time: entry.arrivalTime || null,
          departure_time: entry.departureTime || null,
          all_aboard_time: entry.allAboardTime || null,
          description: entry.description || null,
          location_image_url: entry.imageUrl || null,
          location_type_id: entry.locationTypeId || 1, // Default to 1 if not provided
          order_index: entry.dayNumber + 1,
        }));

        // First, delete any existing itinerary entries for this trip to avoid conflicts
        await supabase.from('itinerary').delete().eq('trip_id', trip.id);

        // Now insert fresh itinerary entries
        const { error: itineraryError } = await supabase.from('itinerary').insert(itineraryData);

        if (itineraryError)
          throw new Error(`Failed to create itinerary: ${itineraryError.message}`);

        logger.info('Created cruise itinerary', { tripId: trip.id, entries: itineraryData.length });
      }
    }

    return trip;
  } catch (error) {
    // Rollback: delete created resources in reverse order
    logger.error('Trip creation failed, rolling back', { error, createdResources });

    for (const resource of createdResources.reverse()) {
      try {
        await supabase.from(resource.table).delete().eq('id', resource.id);
        logger.info('Rolled back resource', resource);
      } catch (rollbackError) {
        logger.error('Rollback failed', { resource, error: rollbackError });
      }
    }

    throw error;
  }
}

export function registerTripWizardRoutes(app: Express) {
  /**
   * POST /api/admin/trips
   * Create a complete trip from wizard data
   */
  app.post(
    '/api/admin/trips',
    requireContentEditor,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      // Check if this is an update (has id field) or create
      const tripId = req.body.id;
      const isUpdate = !!tripId;

      // For updates, preprocess schedule entries to handle null imageUrl
      if (isUpdate && req.body.scheduleEntries) {
        req.body.scheduleEntries = req.body.scheduleEntries.map((entry: any) => ({
          ...entry,
          imageUrl: entry.imageUrl === null ? undefined : entry.imageUrl,
        }));
      }

      // Validate request body
      const validation = tripWizardSchema.safeParse(req.body);

      if (!validation.success) {
        logger.error('Trip wizard validation failed', {
          errors: validation.error.errors,
          body: JSON.stringify(req.body, null, 2),
        });
        throw new ApiError(400, 'Validation failed', { details: validation.error.errors });
      }

      const tripData = validation.data;
      const userId = req.user!.id;
      const draftId = req.body.draftId; // Extract draftId if provided

      const supabase = getSupabaseAdmin();
      let trip;

      if (isUpdate) {
        // UPDATE existing trip
        logger.info('Updating trip from Edit Modal', {
          userId,
          tripName: tripData.name,
          tripId,
        });

        // Update the main trip record
        const { data: updatedTrip, error: tripError } = await supabase
          .from('trips')
          .update({
            name: tripData.name,
            slug: tripData.slug,
            charter_company_id: tripData.charterCompanyId,
            trip_type_id: tripData.tripTypeId,
            start_date: tripData.startDate,
            end_date: tripData.endDate,
            hero_image_url: tripData.heroImageUrl || null,
            map_url: tripData.mapUrl || null,
            description: tripData.description || null,
            highlights: tripData.highlights || null,
            ship_id: tripData.shipId || null,
            resort_id: tripData.resortId || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', tripId)
          .select()
          .single();

        if (tripError) throw new Error(`Failed to update trip: ${tripError.message}`);
        trip = updatedTrip;

        // Update schedules/itineraries
        if (tripData.resortId) {
          // Delete existing schedules first
          await supabase.from('resort_schedules').delete().eq('trip_id', tripId);

          // Insert new schedules if provided
          if (tripData.scheduleEntries && tripData.scheduleEntries.length > 0) {
            const scheduleData = tripData.scheduleEntries.map(entry => ({
              trip_id: tripId,
              day_number: entry.dayNumber,
              date: entry.date,
              image_url: entry.imageUrl || null,
              description: entry.description || null,
              order_index: entry.dayNumber + 1,
            }));

            const { error: scheduleError } = await supabase
              .from('resort_schedules')
              .insert(scheduleData);

            if (scheduleError)
              throw new Error(`Failed to update schedule: ${scheduleError.message}`);
          }
        }

        if (tripData.shipId) {
          // Delete existing itinerary first
          await supabase.from('itinerary').delete().eq('trip_id', tripId);

          // Insert new itinerary if provided
          if (tripData.itineraryEntries && tripData.itineraryEntries.length > 0) {
            const itineraryData = tripData.itineraryEntries.map(entry => ({
              trip_id: tripId,
              day: entry.dayNumber,
              date: entry.date,
              location_id: entry.locationId || null,
              location_name: entry.locationName || null,
              arrival_time: entry.arrivalTime || null,
              departure_time: entry.departureTime || null,
              all_aboard_time: entry.allAboardTime || null,
              description: entry.description || null,
              location_image_url: entry.imageUrl || null,
              location_type_id: entry.locationTypeId || 1,
              order_index: entry.dayNumber + 1,
            }));

            const { error: itineraryError } = await supabase
              .from('itinerary')
              .insert(itineraryData);

            if (itineraryError)
              throw new Error(`Failed to update itinerary: ${itineraryError.message}`);
          }
        }

        // NOTE: We do NOT update amenities or venues here!
        // Amenities and venues are managed separately via:
        //   - PUT /api/ships/:id/amenities (from ShipFormModal)
        //   - PUT /api/resorts/:id/amenities (from ResortFormModal)
        //   - Ship venues and resort venues are managed via VenueManagementModal
        // This prevents accidental deletion of amenities/venues when editing a trip
        logger.info('Trip update complete - amenities/venues managed separately', { tripId });

        logger.info('Trip updated successfully', { tripId });
      } else {
        // CREATE new trip
        logger.info('Creating trip from wizard', { userId, tripName: tripData.name, draftId });
        trip = await createCompleteTrip(supabase, tripData, userId);
      }

      // If this trip was created from a draft, delete the draft
      if (draftId) {
        try {
          // Get Draft status ID
          const { data: draftStatus } = await supabase
            .from('trip_status')
            .select('id')
            .eq('status', 'Draft')
            .single();

          if (draftStatus) {
            const { error: deleteError } = await supabase
              .from('trips')
              .delete()
              .eq('id', draftId)
              .eq('created_by', userId)
              .eq('trip_status_id', draftStatus.id);

            if (deleteError) {
              logger.error('Failed to delete draft after trip creation', {
                draftId,
                error: deleteError,
              });
              // Don't throw - trip was created successfully
            } else {
              logger.info('Deleted draft after successful trip creation', { draftId });
            }
          }
        } catch (error) {
          logger.error('Error during draft cleanup', { draftId, error });
          // Don't throw - trip was created successfully
        }
      }

      // Transform database response to camelCase
      const responseTrip = {
        id: trip.id,
        name: trip.name,
        slug: trip.slug,
        charterCompanyId: trip.charter_company_id,
        tripTypeId: trip.trip_type_id,
        startDate: trip.start_date,
        endDate: trip.end_date,
        heroImageUrl: trip.hero_image_url,
        description: trip.description,
        highlights: trip.highlights,
        tripStatusId: trip.trip_status_id,
        status: trip.status,
        resortId: trip.resort_id,
        shipId: trip.ship_id,
        createdAt: trip.created_at,
        updatedAt: trip.updated_at,
      };

      logger.info('Trip created successfully', { tripId: trip.id, slug: trip.slug });

      return res.status(201).json(responseTrip);
    })
  );

  /**
   * POST /api/admin/trips/draft
   * Save wizard state as draft to trips table
   */
  app.post(
    '/api/admin/trips/draft',
    requireContentEditor,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      // Validate request body
      const validation = tripDraftSchema.safeParse(req.body);

      if (!validation.success) {
        throw new ApiError(400, 'Validation failed', { details: validation.error.errors });
      }

      const draftData = validation.data;
      const userId = req.user!.id;

      logger.info('Saving trip draft', { userId, currentPage: draftData.currentPage });

      const supabase = getSupabaseAdmin();

      // Get Draft status ID
      const { data: draftStatus } = await supabase
        .from('trip_status')
        .select('id')
        .eq('status', 'Draft')
        .single();

      if (!draftStatus) {
        throw new ApiError(500, 'Draft status not found in database');
      }

      // Generate slug from trip name if available
      let slug = 'draft-trip';
      let uniqueSlug = slug;

      if (draftData.draftId) {
        // For updates, get existing slug from database
        const { data: existing } = await supabase
          .from('trips')
          .select('slug')
          .eq('id', draftData.draftId)
          .single();

        if (existing) {
          uniqueSlug = existing.slug;
        }
      } else {
        // For new drafts, generate slug from name
        if (draftData.tripData.name) {
          slug =
            draftData.tripData.slug ||
            draftData.tripData.name
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-|-$/g, '');
        }

        // Ensure unique slug for new drafts
        uniqueSlug = await ensureUniqueSlug(supabase, slug);
      }

      // Extract ship/resort IDs from draft data (if they exist)
      const shipId = draftData.shipId || null;
      const resortId = draftData.resortId || null;

      // Prepare complete wizard state for storage
      const completeWizardState = {
        currentPage: draftData.currentPage,
        tripType: draftData.tripType,
        buildMethod: draftData.buildMethod,
        tripData: draftData.tripData,
        resortId: draftData.resortId,
        shipId: draftData.shipId,
        resortData: draftData.resortData,
        shipData: draftData.shipData,
        amenityIds: draftData.amenityIds || [],
        venueIds: draftData.venueIds || [],
        scheduleEntries: draftData.scheduleEntries || [],
        itineraryEntries: draftData.itineraryEntries || [],
        tempFiles: draftData.tempFiles || [],
      };

      // Check if we're updating an existing draft or creating a new one
      const isUpdate = !!draftData.draftId;

      let draft;
      let draftError;

      if (isUpdate) {
        // UPDATE existing draft
        const { data, error } = await supabase
          .from('trips')
          .update({
            name: draftData.tripData.name || 'Untitled Trip',
            slug: uniqueSlug,
            charter_company_id: draftData.tripData.charterCompanyId || null,
            trip_type_id: draftData.tripData.tripTypeId || null,
            start_date: draftData.tripData.startDate || null,
            end_date: draftData.tripData.endDate || null,
            hero_image_url: draftData.tripData.heroImageUrl || null,
            map_url: draftData.tripData.mapUrl || null,
            description: draftData.tripData.description || null,
            highlights: draftData.tripData.highlights || null,
            ship_id: shipId,
            resort_id: resortId,
            wizard_state: completeWizardState,
            wizard_current_page: draftData.currentPage,
          })
          .eq('id', draftData.draftId)
          .eq('created_by', userId) // Ensure user owns this draft
          .eq('trip_status_id', draftStatus.id) // Ensure it's still a draft
          .select()
          .single();

        draft = data;
        draftError = error;

        if (!draft && !draftError) {
          throw new ApiError(404, 'Draft not found or access denied');
        }

        logger.info('Updated existing draft', { draftId: draftData.draftId });
      } else {
        // INSERT new draft
        const { data, error } = await supabase
          .from('trips')
          .insert({
            name: draftData.tripData.name || 'Untitled Trip',
            slug: uniqueSlug,
            charter_company_id: draftData.tripData.charterCompanyId || null,
            trip_type_id: draftData.tripData.tripTypeId || null,
            start_date: draftData.tripData.startDate || null,
            end_date: draftData.tripData.endDate || null,
            hero_image_url: draftData.tripData.heroImageUrl || null,
            map_url: draftData.tripData.mapUrl || null,
            description: draftData.tripData.description || null,
            highlights: draftData.tripData.highlights || null,
            ship_id: shipId,
            resort_id: resortId,
            trip_status_id: draftStatus.id,
            wizard_state: completeWizardState,
            wizard_current_page: draftData.currentPage,
            created_by: userId,
          })
          .select()
          .single();

        draft = data;
        draftError = error;

        logger.info('Created new draft', { draftId: draft?.id });
      }

      if (draftError) {
        logger.error('Failed to save draft', draftError);
        throw new ApiError(500, 'Failed to save draft', {
          supabaseError: draftError.message,
          code: draftError.code,
          details: draftError.details,
          hint: draftError.hint,
        });
      }

      logger.info('Draft saved successfully', { tripId: draft.id, slug: draft.slug, isUpdate });

      return res.status(isUpdate ? 200 : 201).json({
        id: draft.id,
        name: draft.name,
        slug: draft.slug,
        currentPage: draft.wizard_current_page,
        createdAt: draft.created_at,
        updatedAt: draft.updated_at,
      });
    })
  );

  /**
   * GET /api/admin/trips/drafts
   * List all drafts for current user
   */
  app.get(
    '/api/admin/trips/drafts',
    requireAuth,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user!.id;
      const supabase = getSupabaseAdmin();

      // Get Draft status ID
      const { data: draftStatus } = await supabase
        .from('trip_status')
        .select('id')
        .eq('status', 'Draft')
        .single();

      if (!draftStatus) {
        throw new ApiError(500, 'Draft status not found in database');
      }

      const { data: drafts, error } = await supabase
        .from('trips')
        .select('id, name, wizard_current_page, created_at, updated_at')
        .eq('created_by', userId)
        .eq('trip_status_id', draftStatus.id)
        .order('updated_at', { ascending: false });

      if (error) {
        logger.error('Failed to fetch drafts', { error });
        throw new ApiError(500, 'Failed to fetch drafts');
      }

      // Transform to camelCase
      const responseDrafts = drafts.map(draft => ({
        id: draft.id,
        tripName: draft.name,
        currentPage: draft.wizard_current_page,
        createdAt: draft.created_at,
        updatedAt: draft.updated_at,
      }));

      return res.json(responseDrafts);
    })
  );

  /**
   * GET /api/admin/trips/draft/:id
   * Get specific draft for resumption
   */
  app.get(
    '/api/admin/trips/draft/:id',
    requireAuth,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const draftId = parseInt(req.params.id);
      const userId = req.user!.id;

      if (isNaN(draftId)) {
        throw new ApiError(400, 'Invalid draft ID');
      }

      const supabase = getSupabaseAdmin();

      // Get Draft status ID
      const { data: draftStatus } = await supabase
        .from('trip_status')
        .select('id')
        .eq('status', 'Draft')
        .single();

      if (!draftStatus) {
        throw new ApiError(500, 'Draft status not found in database');
      }

      const { data: draft, error } = await supabase
        .from('trips')
        .select('*')
        .eq('id', draftId)
        .eq('created_by', userId) // Ensure user owns this draft
        .eq('trip_status_id', draftStatus.id) // Ensure it's a draft
        .single();

      if (error || !draft) {
        logger.error('Draft not found', { draftId, userId });
        throw new ApiError(404, 'Draft not found');
      }

      return res.json({
        id: draft.id,
        wizardState: draft.wizard_state,
        tripName: draft.name,
        currentPage: draft.wizard_current_page,
        createdAt: draft.created_at,
        updatedAt: draft.updated_at,
      });
    })
  );

  /**
   * DELETE /api/admin/trips/draft/:id
   * Delete a draft
   */
  app.delete(
    '/api/admin/trips/draft/:id',
    requireAuth,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const draftId = parseInt(req.params.id);
      const userId = req.user!.id;

      if (isNaN(draftId)) {
        throw new ApiError(400, 'Invalid draft ID');
      }

      const supabase = getSupabaseAdmin();

      // Get Draft status ID
      const { data: draftStatus } = await supabase
        .from('trip_status')
        .select('id')
        .eq('status', 'Draft')
        .single();

      if (!draftStatus) {
        throw new ApiError(500, 'Draft status not found in database');
      }

      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', draftId)
        .eq('created_by', userId) // Ensure user owns this draft
        .eq('trip_status_id', draftStatus.id); // Ensure it's a draft

      if (error) {
        logger.error('Failed to delete draft', { draftId, error });
        throw new ApiError(500, 'Failed to delete draft');
      }

      logger.info('Draft deleted', { draftId, userId });

      return res.status(204).send();
    })
  );

  /**
   * PATCH /api/admin/trips/:id/slug
   * Update a trip's URL slug
   */
  app.patch(
    '/api/admin/trips/:id/slug',
    requireAuth,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const tripId = parseInt(req.params.id);
      const { slug } = req.body;
      const userId = req.user!.id;

      if (isNaN(tripId)) {
        throw new ApiError(400, 'Invalid trip ID');
      }

      if (!slug || typeof slug !== 'string') {
        throw new ApiError(400, 'Slug is required');
      }

      // Validate slug format
      const slugRegex = /^[a-z0-9-]+$/;
      if (!slugRegex.test(slug)) {
        throw new ApiError(400, 'Slug must contain only lowercase letters, numbers, and hyphens');
      }

      const supabase = getSupabaseAdmin();

      // Check if slug is already in use by another trip
      const { data: existingTrip } = await supabase
        .from('trips')
        .select('id')
        .eq('slug', slug)
        .neq('id', tripId)
        .single();

      if (existingTrip) {
        throw new ApiError(400, 'This slug is already in use by another trip');
      }

      // Update the trip slug
      const { data, error } = await supabase
        .from('trips')
        .update({ slug, updated_at: new Date().toISOString() })
        .eq('id', tripId)
        .select('id, slug')
        .single();

      if (error) {
        logger.error('Failed to update trip slug', { tripId, error });
        throw new ApiError(500, 'Failed to update slug');
      }

      if (!data) {
        throw new ApiError(404, 'Trip not found');
      }

      logger.info('Trip slug updated', { tripId, newSlug: slug, userId });

      return res.json({
        id: data.id,
        slug: data.slug,
        message: 'Slug updated successfully',
      });
    })
  );
}
