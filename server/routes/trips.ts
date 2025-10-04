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
        .order('created_at', { ascending: false });

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

      // Transform snake_case to camelCase for frontend
      const transformedTrips = (results || []).map((trip: any) =>
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

      // Get "Draft" status ID
      const { data: draftStatus } = await supabaseAdmin
        .from('trip_status')
        .select('id')
        .eq('status', 'Draft')
        .single();

      const draftStatusId = draftStatus?.id;

      // Fetch all trips excluding drafts
      let query = supabaseAdmin.from('trips').select('*').order('start_date', { ascending: false });

      if (draftStatusId) {
        query = query.neq('trip_status_id', draftStatusId);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching trips:', error, {
          method: req.method,
          path: req.path,
        });
        throw ApiError.internal('Failed to fetch trips');
      }

      const transformedTrips = (data || []).map(trip => tripStorage.transformTripData(trip));
      return res.json(transformedTrips);
    })
  );

  // Get upcoming trips
  app.get(
    '/api/trips/upcoming',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const supabaseAdmin = getSupabaseAdmin();
      const today = new Date().toISOString().split('T')[0];

      // Get "Draft" status ID
      const { data: draftStatus } = await supabaseAdmin
        .from('trip_status')
        .select('id')
        .eq('status', 'Draft')
        .single();

      const draftStatusId = draftStatus?.id;

      // Fetch upcoming trips excluding drafts
      let query = supabaseAdmin
        .from('trips')
        .select('*')
        .gte('start_date', today)
        .order('start_date', { ascending: true });

      if (draftStatusId) {
        query = query.neq('trip_status_id', draftStatusId);
      }

      const { data, error } = await query;

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

      // Get "Draft" status ID
      const { data: draftStatus } = await supabaseAdmin
        .from('trip_status')
        .select('id')
        .eq('status', 'Draft')
        .single();

      const draftStatusId = draftStatus?.id;

      // Fetch past trips excluding drafts
      let query = supabaseAdmin
        .from('trips')
        .select('*')
        .lt('end_date', today)
        .order('start_date', { ascending: false });

      if (draftStatusId) {
        query = query.neq('trip_status_id', draftStatusId);
      }

      const { data, error } = await query;

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

  // ============ TRIP INFO SECTIONS ============

  // Get complete trip info with all sections (public - excludes drafts)
  app.get(
    '/api/trips/:slug/complete',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { slug } = req.params;
      if (!slug) {
        throw ApiError.badRequest('Trip slug is required');
      }

      const supabaseAdmin = getSupabaseAdmin();

      // Get "Draft" status ID
      const { data: draftStatus } = await supabaseAdmin
        .from('trip_status')
        .select('id')
        .eq('status', 'Draft')
        .single();

      const draftStatusId = draftStatus?.id;

      // First check if trip exists and is not a draft
      let tripQuery = supabaseAdmin.from('trips').select('trip_status_id').eq('slug', slug);

      if (draftStatusId) {
        tripQuery = tripQuery.neq('trip_status_id', draftStatusId);
      }

      const { data: tripCheck } = await tripQuery.single();

      if (!tripCheck) {
        throw ApiError.notFound('Trip not found');
      }

      // If not a draft, fetch complete info
      const tripData = await tripInfoStorage.getCompleteInfo(slug, 'trips');
      if (!tripData) {
        throw ApiError.notFound('Trip not found');
      }
      return res.json(tripData);
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
