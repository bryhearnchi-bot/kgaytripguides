import type { Express, Response } from 'express';
import { tripStorage, itineraryStorage, eventStorage, tripInfoStorage } from '../storage';
import {
  requireAuth,
  requireContentEditor,
  requireSuperAdmin,
  requireTripAdmin,
  type AuthenticatedRequest,
} from '../auth';
import { getSupabaseAdmin } from '../supabase-admin';
import {
  validateBody,
  validateParams,
  idParamSchema,
  slugParamSchema,
  createTripSchema,
  updateTripSchema,
  createEventSchema,
  updateEventSchema,
  bulkEventsSchema,
  exportTripSchema,
  importTripSchema,
} from '../middleware/validation';
import { adminRateLimit, bulkRateLimit } from '../middleware/rate-limiting';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../logging/logger';
import {
  validateId,
  ensureResourceExists,
  executeDbOperation,
  validateRequiredFields,
} from '../utils/errorUtils';

export function registerTripRoutes(app: Express) {
  // ============ TRIP MANAGEMENT ENDPOINTS ============

  // Duplicate a trip
  app.post(
    '/api/trips/:id/duplicate',
    requireContentEditor,
    validateParams(idParamSchema as any),
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const tripId = validateId(req.params.id, 'Trip');
      const { newName, newSlug } = req.body;

      // Validate required fields
      validateRequiredFields(req.body, ['newName', 'newSlug']);

      // Get the original trip
      const originalTrip = await executeDbOperation(
        () => tripStorage.getTripById(tripId),
        'Failed to retrieve trip for duplication'
      );

      ensureResourceExists(originalTrip, 'Trip');

      // Create a copy of the trip
      const newTrip = {
        ...originalTrip,
        id: undefined,
        name: newName,
        slug: newSlug,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Save the new trip
      const duplicatedTrip = await tripStorage.createTrip(newTrip as any);

      // Copy related data (itinerary, events, etc.) using batch operations
      const itinerary = await itineraryStorage.getItineraryByTrip(tripId);
      if (itinerary.length > 0) {
        const itineraryToCopy = itinerary.map((item: any) => ({
          ...item,
          id: undefined,
          tripId: duplicatedTrip.id,
        }));
        await itineraryStorage.bulkCreateItineraryStops(itineraryToCopy as any[]);
      }

      return res.json(duplicatedTrip);
    })
  );

  // Bulk create/update events
  app.post(
    '/api/events/bulk',
    bulkRateLimit,
    requireContentEditor,
    validateBody(bulkEventsSchema),
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { tripId, events } = req.body;
      const results = [];

      // Use bulk upsert for better performance
      const upsertedEvents = await executeDbOperation(
        () => eventStorage.bulkUpsertEvents(tripId, events),
        'Failed to bulk upsert events'
      );
      results.push(...upsertedEvents);

      res.json({ success: true, events: results });
    })
  );

  // Export trip data
  app.post(
    '/api/export/trips/:id',
    requireContentEditor,
    validateParams(idParamSchema as any),
    validateBody(exportTripSchema),
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const tripId = validateId(req.params.id, 'Trip');
      const { format = 'json', includeRelated = true } = req.body;

      const trip = await executeDbOperation(
        () => tripStorage.getTripById(tripId),
        'Failed to retrieve trip for export'
      );

      ensureResourceExists(trip, 'Trip');

      const exportData: any = { trip };

      if (includeRelated) {
        exportData.itinerary = await itineraryStorage.getItineraryByTrip(tripId);
        exportData.events = await eventStorage.getEventsByTrip(tripId);
        // Add more related data as needed
      }

      if (format === 'csv') {
        // Convert to CSV format
        // This would require a CSV library or custom implementation
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="trip-${tripId}.csv"`);
        // Send CSV data
        return res.send('CSV export not yet implemented');
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="trip-${tripId}.json"`);
        return res.json(exportData);
      }
    })
  );

  // Import trip data
  app.post(
    '/api/import/trips',
    bulkRateLimit,
    requireContentEditor,
    validateBody(importTripSchema),
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { data, format = 'json', overwrite = false } = req.body;

      if (format !== 'json') {
        throw ApiError.badRequest('Only JSON format is currently supported');
      }

      const { trip, itinerary, events } = data;

      // Check if trip with same slug exists
      const existingTrip = await executeDbOperation(
        () => tripStorage.getTripBySlug(trip.slug),
        'Failed to check for existing trip'
      );

      if (existingTrip && !overwrite) {
        throw ApiError.conflict('Trip with this slug already exists');
      }

      // Import the trip
      let importedTrip;
      if (existingTrip && overwrite) {
        importedTrip = await tripStorage.updateTrip(existingTrip.id, trip);
      } else {
        importedTrip = await tripStorage.createTrip(trip);
      }

      // Import related data using batch operations
      if (itinerary && itinerary.length > 0) {
        const itineraryToImport = itinerary.map((item: any) => ({
          ...item,
          id: undefined,
          tripId: importedTrip.id,
        }));
        await itineraryStorage.bulkCreateItineraryStops(itineraryToImport);
      }

      if (events && events.length > 0) {
        const eventsToImport = events.map((event: any) => ({
          ...event,
          id: undefined,
          tripId: importedTrip.id,
        }));
        await eventStorage.bulkCreateEvents(eventsToImport);
      }

      return res.json({ success: true, trip: importedTrip });
    })
  );

  // ============ ADMIN TRIP MANAGEMENT ============

  app.get(
    '/api/admin/trips',
    requireContentEditor,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { page = '1', limit = '20', search = '', status = '' } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      const supabaseAdmin = getSupabaseAdmin();

      // Build the query - include trip_status join to get status string
      let query = supabaseAdmin
        .from('trips')
        .select('*, trip_status!inner(status)', { count: 'exact' })
        .order('start_date', { ascending: true }); // Order by start date (earliest first)

      // Apply filters
      if (search) {
        query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
      }

      if (status) {
        // Filter by the trip_status.status field
        query = query.eq('trip_status.status', status as string);
      }

      // Apply pagination
      query = query.range(offset, offset + limitNum - 1);

      const { data: results, error, count: total } = await query;

      if (error) {
        logger.error('Error fetching admin trips:', error, {
          method: req.method,
          path: req.path,
        });
        throw ApiError.internal('Failed to fetch trips');
      }

      // Fetch counts for each trip
      const tripsWithCounts = await Promise.all(
        (results || []).map(async (trip: any) => {
          // Get events count
          const { count: eventsCount } = await supabaseAdmin
            .from('events')
            .select('*', { count: 'exact', head: true })
            .eq('trip_id', trip.id);

          // Get parties count (events where type = 'party')
          const { count: partiesCount } = await supabaseAdmin
            .from('events')
            .select('*', { count: 'exact', head: true })
            .eq('trip_id', trip.id)
            .eq('type', 'party');

          // Get talent count (distinct talent from trip_talent junction table)
          const { count: talentCount } = await supabaseAdmin
            .from('trip_talent')
            .select('talent_id', { count: 'exact', head: true })
            .eq('trip_id', trip.id);

          // Get itinerary entries (for cruise trips)
          // Join with locations to get location image as fallback
          const { data: rawItineraryData } = await supabaseAdmin
            .from('itinerary')
            .select('*, locations(image_url)')
            .eq('trip_id', trip.id)
            .order('day', { ascending: true });

          // Transform itinerary data to camelCase
          const itineraryData = (rawItineraryData || []).map((item: any) => {
            // Format timestamp to YYYY-MM-DD date string
            let formattedDate = '';
            if (item.date) {
              const dateObj = new Date(item.date);
              const year = dateObj.getUTCFullYear();
              const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
              const day = String(dateObj.getUTCDate()).padStart(2, '0');
              formattedDate = `${year}-${month}-${day}`;
            }

            // Use itinerary-specific image if available, otherwise use location image
            const imageUrl = item.location_image_url || item.locations?.image_url || '';

            const transformed = {
              dayNumber: item.day,
              date: formattedDate,
              locationId: item.location_id,
              locationName: item.location_name || '',
              locationTypeId: item.location_type_id,
              arrivalTime: item.arrival_time,
              departureTime: item.departure_time,
              allAboardTime: item.all_aboard_time,
              imageUrl: imageUrl,
              description: item.description,
            };

            return transformed;
          });

          // Get schedule entries (for resort trips)
          const { data: rawScheduleData } = await supabaseAdmin
            .from('resort_schedules')
            .select('*')
            .eq('trip_id', trip.id)
            .order('day_number', { ascending: true });

          // Transform schedule data to camelCase
          const scheduleData = (rawScheduleData || []).map((item: any) => {
            // Format timestamp to YYYY-MM-DD date string
            let formattedDate = '';
            if (item.date) {
              const dateObj = new Date(item.date);
              const year = dateObj.getUTCFullYear();
              const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
              const day = String(dateObj.getUTCDate()).padStart(2, '0');
              formattedDate = `${year}-${month}-${day}`;
            }

            return {
              dayNumber: item.day_number,
              date: formattedDate,
              imageUrl: item.image_url,
              description: item.description,
            };
          });

          // Get amenity IDs based on trip type
          let amenitiesData = null;
          let venuesData = null;

          if (trip.ship_id) {
            // For cruise trips, use ship_amenities and ship_venues
            const { data: shipAmenities } = await supabaseAdmin
              .from('ship_amenities')
              .select('amenity_id')
              .eq('ship_id', trip.ship_id);
            amenitiesData = shipAmenities;

            const { data: shipVenues } = await supabaseAdmin
              .from('ship_venues')
              .select('venue_id')
              .eq('ship_id', trip.ship_id);
            venuesData = shipVenues;
          } else if (trip.resort_id) {
            // For resort trips, use resort_amenities and resort_venues
            const { data: resortAmenities } = await supabaseAdmin
              .from('resort_amenities')
              .select('amenity_id')
              .eq('resort_id', trip.resort_id);
            amenitiesData = resortAmenities;

            const { data: resortVenues } = await supabaseAdmin
              .from('resort_venues')
              .select('venue_id')
              .eq('resort_id', trip.resort_id);
            venuesData = resortVenues;
          }

          // Get ship data if this is a cruise trip
          let shipData = null;
          if (trip.ship_id) {
            const { data: rawShipData } = await supabaseAdmin
              .from('ships')
              .select(
                `
                *,
                cruise_lines (
                  id,
                  name
                )
              `
              )
              .eq('id', trip.ship_id)
              .single();

            if (rawShipData) {
              shipData = {
                id: rawShipData.id,
                name: rawShipData.name,
                cruiseLineId: rawShipData.cruise_line_id,
                cruiseLineName: rawShipData.cruise_lines?.name || '',
                imageUrl: rawShipData.image_url,
                description: rawShipData.description,
                capacity: rawShipData.capacity,
                decks: rawShipData.decks,
                deckPlansUrl: rawShipData.deck_plans_url,
              };
            }
          }

          // Get resort data if this is a resort trip
          let resortData = null;
          if (trip.resort_id) {
            const { data: rawResortData } = await supabaseAdmin
              .from('resorts')
              .select('*')
              .eq('id', trip.resort_id)
              .single();

            if (rawResortData) {
              resortData = {
                id: rawResortData.id,
                name: rawResortData.name,
                location: rawResortData.location,
                imageUrl: rawResortData.image_url,
                description: rawResortData.description,
                capacity: rawResortData.capacity,
                numberOfRooms: rawResortData.room_count,
                propertyMapUrl: rawResortData.property_map_url,
                checkInTime: rawResortData.check_in_time,
                checkOutTime: rawResortData.check_out_time,
              };
            }
          }

          return {
            ...trip,
            events_count: eventsCount || 0,
            parties_count: partiesCount || 0,
            talent_count: talentCount || 0,
            itinerary_entries: itineraryData || [],
            schedule_entries: scheduleData || [],
            amenity_ids: (amenitiesData || []).map((a: any) => a.amenity_id),
            venue_ids: (venuesData || []).map((v: any) => v.venue_id),
            ship_data: shipData,
            resort_data: resortData,
          };
        })
      );

      // Transform snake_case to camelCase for frontend
      const transformedTrips = tripsWithCounts.map((trip: any) =>
        tripStorage.transformTripData(trip)
      );

      return res.json({
        trips: transformedTrips,
        pagination: {
          total: total || 0,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil((total || 0) / limitNum),
        },
      });
    })
  );

  // Update trip status
  app.patch(
    '/api/admin/trips/:id/status',
    requireContentEditor,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;
      const { status } = req.body;

      if (!['draft', 'published', 'archived'].includes(status)) {
        throw ApiError.badRequest('Invalid status');
      }

      const trip = await tripStorage.updateTrip(parseInt(id || '0'), { status });
      return res.json(trip);
    })
  );

  // Approve trip (Preview → Active, sets is_active=true)
  app.patch(
    '/api/admin/trips/:id/approve',
    requireContentEditor,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const tripId = parseInt(req.params.id || '0');
      const supabaseAdmin = getSupabaseAdmin();

      // Get the active/upcoming status ID based on dates
      const { data: trip } = await supabaseAdmin
        .from('trips')
        .select('start_date, end_date')
        .eq('id', tripId)
        .single();

      if (!trip) {
        throw ApiError.notFound('Trip not found');
      }

      // Determine correct status based on dates
      const now = new Date();
      const startDate = new Date(trip.start_date);
      const endDate = new Date(trip.end_date);

      let statusName = 'Upcoming';
      if (now >= startDate && now <= endDate) {
        statusName = 'Current';
      } else if (now > endDate) {
        statusName = 'Past';
      }

      const { data: statusData } = await supabaseAdmin
        .from('trip_status')
        .select('id')
        .eq('status', statusName)
        .single();

      if (!statusData) {
        throw ApiError.internalError('Status not found');
      }

      // Update trip to active status and set is_active=true
      const { error } = await supabaseAdmin
        .from('trips')
        .update({
          trip_status_id: statusData.id,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tripId);

      if (error) {
        logger.error('Failed to approve trip', { tripId, error });
        throw ApiError.internalError('Failed to approve trip');
      }

      logger.info('Trip approved', { tripId, status: statusName });
      return res.json({ success: true, message: 'Trip approved and published' });
    })
  );

  // Activate trip (sets is_active=true)
  app.patch(
    '/api/admin/trips/:id/activate',
    requireContentEditor,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const tripId = parseInt(req.params.id || '0');
      const supabaseAdmin = getSupabaseAdmin();

      const { error } = await supabaseAdmin
        .from('trips')
        .update({
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tripId);

      if (error) {
        logger.error('Failed to activate trip', { tripId, error });
        throw ApiError.internalError('Failed to activate trip');
      }

      logger.info('Trip activated', { tripId });
      return res.json({ success: true, message: 'Trip activated' });
    })
  );

  // Deactivate trip (sets is_active=false)
  app.patch(
    '/api/admin/trips/:id/deactivate',
    requireContentEditor,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const tripId = parseInt(req.params.id || '0');
      const supabaseAdmin = getSupabaseAdmin();

      const { error } = await supabaseAdmin
        .from('trips')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tripId);

      if (error) {
        logger.error('Failed to deactivate trip', { tripId, error });
        throw ApiError.internalError('Failed to deactivate trip');
      }

      logger.info('Trip deactivated', { tripId });
      return res.json({ success: true, message: 'Trip deactivated' });
    })
  );

  // Get trip statistics for admin dashboard
  app.get(
    '/api/admin/trips/stats',
    requireContentEditor,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const supabaseAdmin = getSupabaseAdmin();
      const { data: trips, error } = await supabaseAdmin
        .from('trips')
        .select('status, start_date, end_date, max_capacity, current_bookings');

      if (error) {
        logger.error('Error fetching trip stats:', error, {
          method: req.method,
          path: req.path,
        });
        throw ApiError.internal('Failed to fetch trip statistics');
      }

      const now = new Date();
      const stats = {
        total: trips?.length || 0,
        published: trips?.filter(t => t.status === 'published').length || 0,
        draft: trips?.filter(t => t.status === 'draft').length || 0,
        archived: trips?.filter(t => t.status === 'archived').length || 0,
        upcoming:
          trips?.filter(t => new Date(t.start_date) > now && t.status === 'published').length || 0,
        ongoing:
          trips?.filter(
            t =>
              new Date(t.start_date) <= now &&
              new Date(t.end_date) >= now &&
              t.status === 'published'
          ).length || 0,
        past:
          trips?.filter(t => new Date(t.end_date) < now && t.status === 'published').length || 0,
        totalCapacity: trips?.reduce((sum, t) => sum + (t.max_capacity || 0), 0) || 0,
        totalBookings: trips?.reduce((sum, t) => sum + (t.current_bookings || 0), 0) || 0,
        avgOccupancy: trips?.length
          ? trips.reduce((sum, t) => {
              if (t.max_capacity > 0) {
                return sum + ((t.current_bookings || 0) / t.max_capacity) * 100;
              }
              return sum;
            }, 0) / trips.filter(t => t.max_capacity > 0).length
          : 0,
      };

      return res.json(stats);
    })
  );

  // Get trip by ID (public - excludes drafts)
  app.get(
    '/api/trips/id/:id',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const supabaseAdmin = getSupabaseAdmin();
      const tripId = parseInt(req.params.id || '0');

      // Get "Draft" status ID
      const { data: draftStatus } = await supabaseAdmin
        .from('trip_status')
        .select('id')
        .eq('status', 'Draft')
        .single();

      const draftStatusId = draftStatus?.id;

      // Fetch trip excluding drafts
      let query = supabaseAdmin.from('trips').select('*').eq('id', tripId);

      if (draftStatusId) {
        query = query.neq('trip_status_id', draftStatusId);
      }

      const { data, error } = await query.single();

      if (error || !data) {
        throw ApiError.notFound('Trip not found');
      }

      const trip = tripStorage.transformTripData(data);
      return res.json(trip);
    })
  );

  // Get trip by slug (public - excludes drafts)
  app.get(
    '/api/trips/:slug',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const supabaseAdmin = getSupabaseAdmin();
      const slug = req.params.slug || '';

      // Get "Draft" status ID
      const { data: draftStatus } = await supabaseAdmin
        .from('trip_status')
        .select('id')
        .eq('status', 'Draft')
        .single();

      const draftStatusId = draftStatus?.id;

      // Fetch trip excluding drafts
      let query = supabaseAdmin.from('trips').select('*').eq('slug', slug);

      if (draftStatusId) {
        query = query.neq('trip_status_id', draftStatusId);
      }

      const { data, error } = await query.single();

      if (error || !data) {
        throw ApiError.notFound('Trip not found');
      }

      const trip = tripStorage.transformTripData(data);
      return res.json(trip);
    })
  );

  // Create trip
  app.post(
    '/api/trips',
    requireContentEditor,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const trip = await tripStorage.createTrip(req.body);
      return res.json(trip);
    })
  );

  // Update trip
  app.put(
    '/api/trips/:id',
    requireContentEditor,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const trip = await tripStorage.updateTrip(parseInt(req.params.id || '0'), req.body);
      if (!trip) {
        throw ApiError.notFound('Trip not found');
      }
      return res.json(trip);
    })
  );

  // Delete trip
  app.delete(
    '/api/trips/:id',
    requireContentEditor,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      await tripStorage.deleteTrip(parseInt(req.params.id || '0'));
      return res.json({ message: 'Trip deleted' });
    })
  );

  // ============ TRIP ENDPOINTS ============

  // List all trips (public)
  app.get(
    '/api/trips',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const supabaseAdmin = getSupabaseAdmin();

      // Fetch all trips with ship, resort, and charter company data
      const { data: rawTrips, error } = await supabaseAdmin
        .from('trips')
        .select(
          `
          *,
          ships (
            name,
            cruise_lines (
              name
            )
          ),
          resorts (
            name,
            location
          ),
          charter_companies (
            name,
            logo_url
          )
        `
        )
        .not('trip_status_id', 'in', '(4,5)') // Exclude Draft (ID 4) and Preview (ID 5)
        .order('start_date', { ascending: true }); // Order by earliest first for featured trip selection

      if (error) {
        logger.error('Error fetching trips:', error, {
          method: req.method,
          path: req.path,
        });
        throw ApiError.internal('Failed to fetch trips');
      }

      // Transform trips and flatten ship/resort/charter data
      const transformedTrips = (rawTrips || []).map(trip => {
        const flattenedTrip = {
          ...trip,
          ship_name: trip.ships?.name || null,
          cruise_line: trip.ships?.cruise_lines?.name || null,
          resort_name: trip.resorts?.name || null,
          resort_location: trip.resorts?.location || null,
          charter_company_name: trip.charter_companies?.name || null,
          charter_company_logo: trip.charter_companies?.logo_url || null,
        };
        return tripStorage.transformTripData(flattenedTrip);
      });

      return res.json(transformedTrips);
    })
  );

  // Get upcoming trips
  app.get(
    '/api/trips/upcoming',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const supabaseAdmin = getSupabaseAdmin();
      const today = new Date().toISOString().split('T')[0];

      // Fetch upcoming trips excluding drafts and previews (IDs 4 and 5)
      const { data, error } = await supabaseAdmin
        .from('trips')
        .select('*')
        .gte('start_date', today)
        .not('trip_status_id', 'in', '(4,5)') // Exclude Draft (ID 4) and Preview (ID 5)
        .order('start_date', { ascending: true });

      if (error) {
        logger.error('Error fetching upcoming trips:', error, {
          method: req.method,
          path: req.path,
        });
        throw ApiError.internal('Failed to fetch upcoming trips');
      }

      const transformedTrips = (data || []).map(trip => tripStorage.transformTripData(trip));
      return res.json(transformedTrips);
    })
  );

  // Get past trips
  app.get(
    '/api/trips/past',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const supabaseAdmin = getSupabaseAdmin();
      const today = new Date().toISOString().split('T')[0];

      // Fetch past trips excluding drafts and previews (IDs 4 and 5)
      const { data, error } = await supabaseAdmin
        .from('trips')
        .select('*')
        .lt('end_date', today)
        .not('trip_status_id', 'in', '(4,5)') // Exclude Draft (ID 4) and Preview (ID 5)
        .order('start_date', { ascending: false });

      if (error) {
        logger.error('Error fetching past trips:', error, {
          method: req.method,
          path: req.path,
        });
        throw ApiError.internal('Failed to fetch past trips');
      }

      const transformedTrips = (data || []).map(trip => tripStorage.transformTripData(trip));
      return res.json(transformedTrips);
    })
  );

  // Get trip by ID
  app.get(
    '/api/trips/id/:id',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const trip = await tripStorage.getTripById(parseInt(req.params.id || '0'));
      if (!trip) {
        throw ApiError.notFound('Trip not found');
      }
      return res.json(trip);
    })
  );

  // Get trip by slug
  app.get(
    '/api/trips/:slug',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const trip = await tripStorage.getTripBySlug(req.params.slug || '');
      if (!trip) {
        throw ApiError.notFound('Trip not found');
      }
      return res.json(trip);
    })
  );

  // Create trip
  app.post(
    '/api/trips',
    adminRateLimit,
    requireContentEditor,
    validateBody(createTripSchema),
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const trip = await tripStorage.createTrip(req.body);
      return res.json(trip);
    })
  );

  // Update trip
  app.put(
    '/api/trips/:id',
    adminRateLimit,
    requireContentEditor,
    validateParams(idParamSchema as any),
    validateBody(updateTripSchema),
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const trip = await tripStorage.updateTrip(parseInt(req.params.id || '0'), req.body);
      if (!trip) {
        throw ApiError.notFound('Trip not found');
      }
      return res.json(trip);
    })
  );

  // Delete trip
  app.delete(
    '/api/trips/:id',
    requireContentEditor,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      await tripStorage.deleteTrip(parseInt(req.params.id || '0'));
      return res.json({ message: 'Trip deleted' });
    })
  );

  // ============ ITINERARY ENDPOINTS ============

  // Get itinerary for a trip
  app.get(
    '/api/trips/:tripId/itinerary',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const itinerary = await itineraryStorage.getItineraryByTrip(
        parseInt(req.params.tripId || '0')
      );
      return res.json(itinerary);
    })
  );

  // Create itinerary item for a trip
  app.post(
    '/api/trips/:tripId/itinerary',
    requireContentEditor,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const item = await itineraryStorage.createItineraryStop({
        ...req.body,
        tripId: parseInt(req.params.tripId!),
      });
      return res.json(item);
    })
  );

  // Update itinerary item
  app.put(
    '/api/itinerary/:id',
    requireContentEditor,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const item = await itineraryStorage.updateItineraryStop(parseInt(req.params.id!), req.body);
      if (!item) {
        throw ApiError.notFound('Itinerary item not found');
      }
      return res.json(item);
    })
  );

  // Delete itinerary item
  app.delete(
    '/api/itinerary/:id',
    requireContentEditor,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      await itineraryStorage.deleteItineraryStop(parseInt(req.params.id!));
      res.json({ message: 'Itinerary item deleted' });
    })
  );

  // ============ EVENT ENDPOINTS ============

  // Get event statistics
  app.get(
    '/api/events/stats',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const supabaseAdmin = getSupabaseAdmin();
      const { data: events, error } = await supabaseAdmin.from('events').select('type');

      if (error) {
        logger.error('Error fetching event stats:', error, {
          method: req.method,
          path: req.path,
        });
        throw ApiError.internal('Failed to fetch event statistics');
      }

      const total = events?.length || 0;
      const byType =
        events?.reduce((acc: Record<string, number>, event: any) => {
          acc[event.type] = (acc[event.type] || 0) + 1;
          return acc;
        }, {}) || {};

      return res.json({ total, byType });
    })
  );

  // List all events with optional filtering
  app.get(
    '/api/events',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { tripId, type, startDate, endDate, limit = '100', offset = '0' } = req.query;

      const supabaseAdmin = getSupabaseAdmin();
      let query = supabaseAdmin.from('events').select('*').order('start_time');

      // Apply filters
      if (tripId) {
        query = query.eq('trip_id', tripId as string);
      }
      if (type) {
        query = query.eq('type', type as string);
      }
      if (startDate) {
        query = query.gte('start_time', startDate as string);
      }
      if (endDate) {
        query = query.lte('end_time', endDate as string);
      }

      // Apply pagination
      const startIndex = parseInt(offset as string);
      const endIndex = startIndex + parseInt(limit as string) - 1;
      query = query.range(startIndex, endIndex);

      const { data: results, error } = await query;

      if (error) {
        logger.error('Error fetching events:', error, {
          method: req.method,
          path: req.path,
        });
        throw ApiError.internal('Failed to fetch events');
      }

      return res.json(results || []);
    })
  );

  // Get events for a trip
  app.get(
    '/api/trips/:tripId/events',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const tripId = req.params.tripId;
      if (!tripId) {
        throw ApiError.badRequest('Trip ID is required');
      }
      const eventsList = await eventStorage.getEventsByTrip(parseInt(tripId));
      return res.json(eventsList);
    })
  );

  // Get events by date
  app.get(
    '/api/trips/:tripId/events/date/:date',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const tripId = req.params.tripId;
      const date = req.params.date;
      if (!tripId || !date) {
        throw ApiError.badRequest('Trip ID and date are required');
      }
      const eventsList = await eventStorage.getEventsByDate(parseInt(tripId), new Date(date));
      return res.json(eventsList);
    })
  );

  // Get events by type
  app.get(
    '/api/trips/:tripId/events/type/:type',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const tripId = req.params.tripId;
      const type = req.params.type;
      if (!tripId || !type) {
        throw ApiError.badRequest('Trip ID and type are required');
      }
      const eventsList = await eventStorage.getEventsByType(parseInt(tripId), type);
      return res.json(eventsList);
    })
  );

  // Create event
  app.post(
    '/api/trips/:tripId/events',
    adminRateLimit,
    requireContentEditor,
    validateBody(createEventSchema),
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const tripId = req.params.tripId;
      if (!tripId) {
        throw ApiError.badRequest('Trip ID is required');
      }
      const event = await eventStorage.createEvent({
        ...req.body,
        tripId: parseInt(tripId),
      });
      return res.json(event);
    })
  );

  // Update event
  app.put(
    '/api/events/:id',
    adminRateLimit,
    requireContentEditor,
    validateParams(idParamSchema as any),
    validateBody(updateEventSchema),
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const id = req.params.id;
      if (!id) {
        throw ApiError.badRequest('Event ID is required');
      }
      const event = await eventStorage.updateEvent(parseInt(id), req.body);
      if (!event) {
        throw ApiError.notFound('Event not found');
      }
      return res.json(event);
    })
  );

  // Delete event
  app.delete(
    '/api/events/:id',
    requireContentEditor,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const id = req.params.id;
      if (!id) {
        throw ApiError.badRequest('Event ID is required');
      }
      await eventStorage.deleteEvent(parseInt(id));
      return res.json({ message: 'Event deleted' });
    })
  );

  // ============ PARTY THEMES ENDPOINTS ============

  // Get party themes for a trip
  app.get(
    '/api/trips/:tripId/party-themes',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const tripId = req.params.tripId;
      if (!tripId) {
        throw ApiError.badRequest('Trip ID is required');
      }

      const supabaseAdmin = getSupabaseAdmin();

      const { data: tripPartyThemes, error } = await supabaseAdmin
        .from('trip_party_themes')
        .select(
          `
          order_index,
          party_themes (
            id,
            name,
            long_description,
            short_description,
            costume_ideas,
            image_url,
            party_type
          )
        `
        )
        .eq('trip_id', tripId)
        .order('order_index');

      if (error) {
        logger.error('Error fetching trip party themes:', error, {
          method: req.method,
          path: req.path,
        });
        throw ApiError.internal('Failed to fetch party themes');
      }

      // Transform snake_case to camelCase
      const transformedThemes = (tripPartyThemes || []).map((item: any) => {
        const theme = item.party_themes;
        return {
          id: theme.id,
          name: theme.name,
          longDescription: theme.long_description,
          shortDescription: theme.short_description,
          costumeIdeas: theme.costume_ideas,
          imageUrl: theme.image_url,
          partyType: theme.party_type,
          orderIndex: item.order_index,
        };
      });

      return res.json(transformedThemes);
    })
  );

  // ============ TRIP INFO SECTIONS ============

  // Get complete trip info with all sections (public - excludes drafts, allows preview)
  app.get(
    '/api/trips/:slug/complete',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { slug } = req.params;
        logger.info('Fetching trip by slug', { slug });

        if (!slug) {
          throw ApiError.badRequest('Trip slug is required');
        }

        const supabaseAdmin = getSupabaseAdmin();

        // Get "Draft" status ID (ID 4) - we ONLY exclude Drafts, not Preview (ID 5)
        const { data: draftStatus, error: draftStatusError } = await supabaseAdmin
          .from('trip_status')
          .select('id')
          .eq('status', 'Draft')
          .single();

        if (draftStatusError) {
          logger.error('Failed to get draft status', { error: draftStatusError });
        }

        const draftStatusId = draftStatus?.id;
        logger.info('Draft status ID', { draftStatusId });

        // First check if trip exists and is not a draft
        // NOTE: Preview trips (ID 5) are allowed - they're visible via preview link
        let tripQuery = supabaseAdmin.from('trips').select('trip_status_id').eq('slug', slug);

        if (draftStatusId) {
          tripQuery = tripQuery.neq('trip_status_id', draftStatusId);
        }

        const { data: tripCheck, error: tripCheckError } = await tripQuery.single();

        if (tripCheckError) {
          logger.info('Trip query error', {
            slug,
            error: tripCheckError,
            code: tripCheckError.code,
          });
        }

        if (tripCheckError || !tripCheck) {
          logger.info('Trip not found or is draft', { slug, error: tripCheckError });
          throw ApiError.notFound('Trip not found');
        }

        logger.info('Trip status check passed', { slug, tripStatusId: tripCheck.trip_status_id });

        // If not a draft, fetch complete info
        try {
          const tripData = await tripInfoStorage.getCompleteInfo(slug, 'trips');
          if (!tripData) {
            logger.error('Trip data not found in tripInfoStorage', { slug });
            throw ApiError.notFound('Trip not found');
          }

          logger.info('Trip data fetched successfully', { slug, tripId: tripData.trip?.id });
          return res.json(tripData);
        } catch (storageError) {
          logger.error('Error in tripInfoStorage.getCompleteInfo', {
            slug,
            error: storageError,
            message: storageError instanceof Error ? storageError.message : String(storageError),
            stack: storageError instanceof Error ? storageError.stack : undefined,
          });
          throw storageError;
        }
      } catch (error) {
        logger.error('Error in /api/trips/:slug/complete', {
          slug: req.params.slug,
          error,
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        throw error;
      }
    })
  );

  // Get info sections for a trip
  app.get(
    '/api/trips/:tripId/info-sections',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const supabaseAdmin = getSupabaseAdmin();
      const { data: sections, error } = await supabaseAdmin
        .from('trip_info_sections')
        .select('*')
        .eq('trip_id', req.params.tripId)
        .order('display_order');

      if (error) {
        logger.error('Error fetching info sections:', error, {
          method: req.method,
          path: req.path,
        });
        throw ApiError.internal('Failed to fetch info sections');
      }

      return res.json(sections || []);
    })
  );

  // Create info section
  app.post(
    '/api/trips/:tripId/info-sections',
    requireContentEditor,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const supabaseAdmin = getSupabaseAdmin();
      const { data: section, error } = await supabaseAdmin
        .from('trip_info_sections')
        .insert({
          ...req.body,
          trip_id: req.params.tripId,
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating info section:', error, {
          method: req.method,
          path: req.path,
        });
        throw ApiError.internal('Failed to create info section');
      }

      return res.json(section);
    })
  );

  // Update info section
  app.put(
    '/api/info-sections/:id',
    requireContentEditor,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const supabaseAdmin = getSupabaseAdmin();
      const { data: section, error } = await supabaseAdmin
        .from('trip_info_sections')
        .update({
          ...req.body,
          updated_at: new Date().toISOString(),
        })
        .eq('id', req.params.id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw ApiError.notFound('Info section not found');
        }
        logger.error('Error updating info section:', error, {
          method: req.method,
          path: req.path,
        });
        throw ApiError.internal('Failed to update info section');
      }

      if (!section) {
        throw ApiError.notFound('Info section not found');
      }

      return res.json(section);
    })
  );

  // Delete info section
  app.delete(
    '/api/info-sections/:id',
    requireContentEditor,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const supabaseAdmin = getSupabaseAdmin();
      const { error } = await supabaseAdmin
        .from('trip_info_sections')
        .delete()
        .eq('id', req.params.id);

      if (error) {
        logger.error('Error deleting info section:', error, {
          method: req.method,
          path: req.path,
        });
        throw ApiError.internal('Failed to delete info section');
      }

      return res.json({ message: 'Info section deleted' });
    })
  );
}
