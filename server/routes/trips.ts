import type { Express } from "express";
import {
  tripStorage,
  itineraryStorage,
  eventStorage,
  tripInfoStorage
} from "../storage";
import { requireAuth, requireContentEditor, requireSuperAdmin, requireTripAdmin, type AuthenticatedRequest } from "../auth";
import { getSupabaseAdmin } from "../supabase-admin";
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
  importTripSchema
} from "../middleware/validation";
import {
  adminRateLimit,
  bulkRateLimit
} from "../middleware/rate-limiting";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../middleware/errorHandler";
import {
  validateId,
  ensureResourceExists,
  executeDbOperation,
  validateRequiredFields
} from "../utils/errorUtils";

export function registerTripRoutes(app: Express) {
  // ============ TRIP MANAGEMENT ENDPOINTS ============

  // Duplicate a trip
  app.post("/api/trips/:id/duplicate",
    requireContentEditor,
    validateParams(idParamSchema),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
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
          updatedAt: new Date()
        };

        // Save the new trip
        const duplicatedTrip = await tripStorage.createTrip(newTrip as any);

        // Copy related data (itinerary, events, etc.) using batch operations
        const itinerary = await itineraryStorage.getItineraryByTrip(tripId);
        if (itinerary.length > 0) {
          const itineraryToCopy = itinerary.map(item => ({
            ...item,
            id: undefined,
            tripId: duplicatedTrip.id
          }));
          await itineraryStorage.bulkCreateItineraryStops(itineraryToCopy as any[]);
        }

        res.json(duplicatedTrip);
    })
  );

  // Bulk create/update events
  app.post("/api/events/bulk",
    bulkRateLimit,
    requireContentEditor,
    validateBody(bulkEventsSchema),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
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
  app.post("/api/export/trips/:id",
    requireContentEditor,
    validateParams(idParamSchema),
    validateBody(exportTripSchema),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const tripId = validateId(req.params.id, 'Trip');
      const { format = 'json', includeRelated = true } = req.body;

      const trip = await executeDbOperation(
        () => tripStorage.getTripById(tripId),
        'Failed to retrieve trip for export'
      );

      ensureResourceExists(trip, 'Trip');

        let exportData: any = { trip };

        if (includeRelated) {
          exportData.itinerary = await itineraryStorage.getItineraryByTrip(parseInt(id));
          exportData.events = await eventStorage.getEventsByTrip(parseInt(id));
          // Add more related data as needed
        }

        if (format === 'csv') {
          // Convert to CSV format
          // This would require a CSV library or custom implementation
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', `attachment; filename="trip-${id}.csv"`);
          // Send CSV data
          res.send('CSV export not yet implemented');
        } else {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Content-Disposition', `attachment; filename="trip-${tripId}.json"`);
          res.json(exportData);
        }
    })
  );

  // Import trip data
  app.post("/api/import/trips",
    bulkRateLimit,
    requireContentEditor,
    validateBody(importTripSchema),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
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
          const itineraryToImport = itinerary.map(item => ({
            ...item,
            id: undefined,
            tripId: importedTrip.id
          }));
          await itineraryStorage.bulkCreateItineraryStops(itineraryToImport);
        }

        if (events && events.length > 0) {
          const eventsToImport = events.map(event => ({
            ...event,
            id: undefined,
            tripId: importedTrip.id
          }));
          await eventStorage.bulkCreateEvents(eventsToImport);
        }

        res.json({ success: true, trip: importedTrip });
    })
  );

  // ============ ADMIN TRIP MANAGEMENT ============

  app.get("/api/admin/trips", requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      const { page = '1', limit = '20', search = '', status = '' } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      const supabaseAdmin = getSupabaseAdmin();

      // Build the query
      let query = supabaseAdmin
        .from('trips')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply filters
      if (search) {
        query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
      }

      if (status) {
        query = query.eq('status', status as string);
      }

      // Apply pagination
      query = query.range(offset, offset + limitNum - 1);

      const { data: results, error, count: total } = await query;

      if (error) {
        console.error('Error fetching admin trips:', error);
        return res.status(500).json({ error: 'Failed to fetch trips' });
      }

      res.json({
        trips: results || [],
        pagination: {
          total: total || 0,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil((total || 0) / limitNum)
        }
      });
    } catch (error) {
      console.error('Error fetching admin trips:', error);
      res.status(500).json({ error: 'Failed to fetch trips' });
    }
  });

  // Update trip status
  app.patch("/api/admin/trips/:id/status", requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['draft', 'published', 'archived'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      const trip = await tripStorage.updateTrip(parseInt(id), { status });
      res.json(trip);
    } catch (error) {
      console.error('Error updating trip status:', error);
      res.status(500).json({ error: 'Failed to update trip status' });
    }
  });

  // Get trip statistics for admin dashboard
  app.get("/api/admin/trips/stats", requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data: trips, error } = await supabaseAdmin
        .from('trips')
        .select('status, start_date, end_date, max_capacity, current_bookings');

      if (error) {
        console.error('Error fetching trip stats:', error);
        return res.status(500).json({ error: 'Failed to fetch trip statistics' });
      }

      const now = new Date();
      const stats = {
        total: trips?.length || 0,
        published: trips?.filter(t => t.status === 'published').length || 0,
        draft: trips?.filter(t => t.status === 'draft').length || 0,
        archived: trips?.filter(t => t.status === 'archived').length || 0,
        upcoming: trips?.filter(t =>
          new Date(t.start_date) > now && t.status === 'published'
        ).length || 0,
        ongoing: trips?.filter(t =>
          new Date(t.start_date) <= now && new Date(t.end_date) >= now && t.status === 'published'
        ).length || 0,
        past: trips?.filter(t =>
          new Date(t.end_date) < now && t.status === 'published'
        ).length || 0,
        totalCapacity: trips?.reduce((sum, t) => sum + (t.max_capacity || 0), 0) || 0,
        totalBookings: trips?.reduce((sum, t) => sum + (t.current_bookings || 0), 0) || 0,
        avgOccupancy: trips?.length ?
          trips.reduce((sum, t) => {
            if (t.max_capacity > 0) {
              return sum + ((t.current_bookings || 0) / t.max_capacity * 100);
            }
            return sum;
          }, 0) / trips.filter(t => t.max_capacity > 0).length : 0
      };

      res.json(stats);
    } catch (error) {
      console.error('Error fetching trip stats:', error);
      res.status(500).json({ error: 'Failed to fetch trip statistics' });
    }
  });


  // Get cruise by ID
  app.get("/api/trips/id/:id", async (req, res) => {
    const trip = await tripStorage.getTripById(parseInt(req.params.id));
    if (!trip) {
      return res.status(404).send("Trip not found");
    }
    res.json(trip);
  });

  // Get trip by slug
  app.get("/api/trips/:slug", async (req, res) => {
    const trip = await tripStorage.getTripBySlug(req.params.slug);
    if (!trip) {
      return res.status(404).send("Trip not found");
    }
    res.json(trip);
  });

  // Create trip
  app.post("/api/trips", requireContentEditor, async (req: AuthenticatedRequest, res) => {
    const trip = await tripStorage.createTrip(req.body);
    res.json(trip);
  });

  // Update trip
  app.put("/api/trips/:id", requireContentEditor, async (req: AuthenticatedRequest, res) => {
    const trip = await tripStorage.updateTrip(parseInt(req.params.id), req.body);
    if (!trip) {
      return res.status(404).send("Trip not found");
    }
    res.json(trip);
  });

  // Delete trip
  app.delete("/api/trips/:id", requireContentEditor, async (req: AuthenticatedRequest, res) => {
    await tripStorage.deleteTrip(parseInt(req.params.id));
    res.json({ message: "Trip deleted" });
  });

  // ============ TRIP ENDPOINTS ============

  // List all trips (public)
  app.get("/api/trips", async (req, res) => {
    try {
      const allTrips = await tripStorage.getAllTrips();
      res.json(allTrips);
    } catch (error) {
      console.error('Error fetching trips:', error);
      res.status(500).json({ error: 'Failed to fetch trips' });
    }
  });

  // Get upcoming trips
  app.get("/api/trips/upcoming", async (req, res) => {
    const upcomingTrips = await tripStorage.getUpcomingTrips();
    res.json(upcomingTrips);
  });

  // Get past trips
  app.get("/api/trips/past", async (req, res) => {
    const pastTrips = await tripStorage.getPastTrips();
    res.json(pastTrips);
  });

  // Get trip by ID
  app.get("/api/trips/id/:id", async (req, res) => {
    const trip = await tripStorage.getTripById(parseInt(req.params.id));
    if (!trip) {
      return res.status(404).send("Trip not found");
    }
    res.json(trip);
  });

  // Get trip by slug
  app.get("/api/trips/:slug", async (req, res) => {
    const trip = await tripStorage.getTripBySlug(req.params.slug);
    if (!trip) {
      return res.status(404).send("Trip not found");
    }
    res.json(trip);
  });

  // Create trip
  app.post("/api/trips", adminRateLimit, requireContentEditor, validateBody(createTripSchema), async (req: AuthenticatedRequest, res) => {
    const trip = await tripStorage.createTrip(req.body);
    res.json(trip);
  });

  // Update trip
  app.put("/api/trips/:id", adminRateLimit, requireContentEditor, validateParams(idParamSchema), validateBody(updateTripSchema), async (req: AuthenticatedRequest, res) => {
    const trip = await tripStorage.updateTrip(parseInt(req.params.id), req.body);
    if (!trip) {
      return res.status(404).send("Trip not found");
    }
    res.json(trip);
  });

  // Delete trip
  app.delete("/api/trips/:id", requireContentEditor, async (req: AuthenticatedRequest, res) => {
    await tripStorage.deleteTrip(parseInt(req.params.id));
    res.json({ message: "Trip deleted" });
  });

  // ============ ITINERARY ENDPOINTS ============


  // Get itinerary for a trip
  app.get("/api/trips/:tripId/itinerary", async (req, res) => {
    const itinerary = await itineraryStorage.getItineraryByTrip(parseInt(req.params.tripId));
    res.json(itinerary);
  });


  // Create itinerary item for a trip
  app.post("/api/trips/:tripId/itinerary", requireContentEditor, async (req: AuthenticatedRequest, res) => {
    const item = await itineraryStorage.createItineraryStop({
      ...req.body,
      tripId: parseInt(req.params.tripId),
    });
    res.json(item);
  });

  // Update itinerary item
  app.put("/api/itinerary/:id", requireContentEditor, async (req: AuthenticatedRequest, res) => {
    const item = await itineraryStorage.updateItineraryStop(parseInt(req.params.id), req.body);
    if (!item) {
      return res.status(404).send("Itinerary item not found");
    }
    res.json(item);
  });

  // Delete itinerary item
  app.delete("/api/itinerary/:id", requireContentEditor, async (req: AuthenticatedRequest, res) => {
    await itineraryStorage.deleteItineraryStop(parseInt(req.params.id));
    res.json({ message: "Itinerary item deleted" });
  });

  // ============ EVENT ENDPOINTS ============

  // Get event statistics
  app.get("/api/events/stats", async (req, res) => {
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data: events, error } = await supabaseAdmin
        .from('events')
        .select('type');

      if (error) {
        console.error('Error fetching event stats:', error);
        return res.status(500).json({ error: 'Failed to fetch event statistics' });
      }

      const total = events?.length || 0;
      const byType = events?.reduce((acc: Record<string, number>, event: any) => {
        acc[event.type] = (acc[event.type] || 0) + 1;
        return acc;
      }, {}) || {};

      res.json({ total, byType });
    } catch (error) {
      console.error('Error fetching event stats:', error);
      res.status(500).json({ error: 'Failed to fetch event statistics' });
    }
  });

  // List all events with optional filtering
  app.get("/api/events", async (req, res) => {
    try {
      const {
        tripId,
        type,
        startDate,
        endDate,
        limit = '100',
        offset = '0'
      } = req.query;

      const supabaseAdmin = getSupabaseAdmin();
      let query = supabaseAdmin
        .from('events')
        .select('*')
        .order('start_time');

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
        console.error('Error fetching events:', error);
        return res.status(500).json({ error: 'Failed to fetch events' });
      }

      res.json(results || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      res.status(500).json({ error: 'Failed to fetch events' });
    }
  });


  // Get events for a trip
  app.get("/api/trips/:tripId/events", async (req, res) => {
    const eventsList = await eventStorage.getEventsByTrip(parseInt(req.params.tripId));
    res.json(eventsList);
  });


  // Get events by date
  app.get("/api/trips/:tripId/events/date/:date", async (req, res) => {
    const eventsList = await eventStorage.getEventsByDate(parseInt(req.params.tripId), new Date(req.params.date));
    res.json(eventsList);
  });


  // Get events by type
  app.get("/api/trips/:tripId/events/type/:type", async (req, res) => {
    const eventsList = await eventStorage.getEventsByType(parseInt(req.params.tripId), req.params.type);
    res.json(eventsList);
  });


  // Create event
  app.post("/api/trips/:tripId/events", adminRateLimit, requireContentEditor, validateBody(createEventSchema), async (req: AuthenticatedRequest, res) => {
    const event = await eventStorage.createEvent({
      ...req.body,
      tripId: parseInt(req.params.tripId),
    });
    res.json(event);
  });

  // Update event
  app.put("/api/events/:id", adminRateLimit, requireContentEditor, validateParams(idParamSchema), validateBody(updateEventSchema), async (req: AuthenticatedRequest, res) => {
    const event = await eventStorage.updateEvent(parseInt(req.params.id), req.body);
    if (!event) {
      return res.status(404).send("Event not found");
    }
    res.json(event);
  });

  // Delete event
  app.delete("/api/events/:id", requireContentEditor, async (req: AuthenticatedRequest, res) => {
    await eventStorage.deleteEvent(parseInt(req.params.id));
    res.json({ message: "Event deleted" });
  });

  // ============ TRIP INFO SECTIONS ============

  // Get complete trip info with all sections
  app.get("/api/trips/:slug/complete", async (req, res) => {
    const { slug } = req.params;
    const tripData = await tripInfoStorage.getCompleteInfo(slug, 'trips');
    if (!tripData) {
      return res.status(404).json({ error: "Trip not found" });
    }
    res.json(tripData);
  });


  // Get info sections for a trip
  app.get("/api/trips/:tripId/info-sections", async (req, res) => {
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data: sections, error } = await supabaseAdmin
        .from('trip_info_sections')
        .select('*')
        .eq('trip_id', req.params.tripId)
        .order('display_order');

      if (error) {
        console.error('Error fetching info sections:', error);
        return res.status(500).json({ error: 'Failed to fetch info sections' });
      }

      res.json(sections || []);
    } catch (error) {
      console.error('Error fetching info sections:', error);
      res.status(500).json({ error: 'Failed to fetch info sections' });
    }
  });


  // Create info section
  app.post("/api/trips/:tripId/info-sections", requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data: section, error } = await supabaseAdmin
        .from('trip_info_sections')
        .insert({
          ...req.body,
          trip_id: req.params.tripId
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating info section:', error);
        return res.status(500).json({ error: 'Failed to create info section' });
      }

      res.json(section);
    } catch (error) {
      console.error('Error creating info section:', error);
      res.status(500).json({ error: 'Failed to create info section' });
    }
  });

  // Update info section
  app.put("/api/info-sections/:id", requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data: section, error } = await supabaseAdmin
        .from('trip_info_sections')
        .update({
          ...req.body,
          updated_at: new Date().toISOString()
        })
        .eq('id', req.params.id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Info section not found' });
        }
        console.error('Error updating info section:', error);
        return res.status(500).json({ error: 'Failed to update info section' });
      }

      if (!section) {
        return res.status(404).json({ error: 'Info section not found' });
      }

      res.json(section);
    } catch (error) {
      console.error('Error updating info section:', error);
      res.status(500).json({ error: 'Failed to update info section' });
    }
  });

  // Delete info section
  app.delete("/api/info-sections/:id", requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { error } = await supabaseAdmin
        .from('trip_info_sections')
        .delete()
        .eq('id', req.params.id);

      if (error) {
        console.error('Error deleting info section:', error);
        return res.status(500).json({ error: 'Failed to delete info section' });
      }

      res.json({ message: 'Info section deleted' });
    } catch (error) {
      console.error('Error deleting info section:', error);
      res.status(500).json({ error: 'Failed to delete info section' });
    }
  });
}