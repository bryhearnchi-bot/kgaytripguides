import type { Express } from "express";
import {
  tripStorage,
  itineraryStorage,
  eventStorage,
  tripInfoStorage,
  db
} from "../storage";
import { requireAuth, requireContentEditor, requireSuperAdmin, requireTripAdmin, type AuthenticatedRequest } from "../auth";
import * as schema from "../../shared/schema";
import { eq, ilike, or, count, sql } from "drizzle-orm";
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

      let query = db.select().from(schema.trips);

      // Apply filters
      if (search) {
        query = query.where(
          or(
            ilike(schema.trips.name, `%${search}%`),
            ilike(schema.trips.slug, `%${search}%`)
          )
        ) as typeof query;
      }

      if (status) {
        query = query.where(eq(schema.trips.status, status as any)) as typeof query;
      }

      // Get total count
      const countQuery = db.select({ count: count() }).from(schema.trips);
      if (search) {
        countQuery.where(
          or(
            ilike(schema.trips.name, `%${search}%`),
            ilike(schema.trips.slug, `%${search}%`)
          )
        );
      }
      if (status) {
        countQuery.where(eq(schema.trips.status, status as any));
      }

      const [{ count: total }] = await countQuery;

      // Apply pagination
      query = query.limit(limitNum).offset(offset) as typeof query;

      const results = await query;

      res.json({
        trips: results,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum)
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
      const stats = await db.select({
        total: count(),
        published: sql<number>`COUNT(CASE WHEN status = 'published' THEN 1 END)`,
        draft: sql<number>`COUNT(CASE WHEN status = 'draft' THEN 1 END)`,
        archived: sql<number>`COUNT(CASE WHEN status = 'archived' THEN 1 END)`,
        upcoming: sql<number>`COUNT(CASE WHEN start_date > CURRENT_DATE AND status = 'published' THEN 1 END)`,
        ongoing: sql<number>`COUNT(CASE WHEN start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE AND status = 'published' THEN 1 END)`,
        past: sql<number>`COUNT(CASE WHEN end_date < CURRENT_DATE AND status = 'published' THEN 1 END)`,
        totalCapacity: sql<number>`SUM(max_capacity)`,
        totalBookings: sql<number>`SUM(current_bookings)`,
        avgOccupancy: sql<number>`AVG(CASE WHEN max_capacity > 0 THEN (current_bookings::float / max_capacity * 100) ELSE 0 END)`
      }).from(schema.trips);

      res.json(stats[0]);
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
      const stats = await db.select({
        total: count(),
        byType: sql<any>`json_object_agg(type, type_count) FROM (SELECT type, COUNT(*) as type_count FROM ${schema.events} GROUP BY type) t`
      }).from(schema.events);

      res.json(stats[0] || { total: 0, byType: {} });
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

      let query = db.select().from(schema.events);

      // Apply filters
      const conditions = [];
      if (tripId) {
        conditions.push(eq(schema.events.tripId, tripId as string));
      }
      if (type) {
        conditions.push(eq(schema.events.type, type as any));
      }

      if (conditions.length > 0) {
        query = query.where(conditions.length === 1 ? conditions[0] : sql`${conditions.join(' AND ')}`) as typeof query;
      }

      // Apply pagination
      query = query.limit(parseInt(limit as string)).offset(parseInt(offset as string)) as typeof query;

      const results = await query;
      res.json(results);
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
      const sections = await db.select()
        .from(schema.tripInfoSections)
        .where(eq(schema.tripInfoSections.tripId, req.params.tripId));
      res.json(sections);
    } catch (error) {
      console.error('Error fetching info sections:', error);
      res.status(500).json({ error: 'Failed to fetch info sections' });
    }
  });


  // Create info section
  app.post("/api/trips/:tripId/info-sections", requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      const [section] = await db.insert(schema.tripInfoSections).values({
        ...req.body,
        tripId: req.params.tripId
      }).returning();
      res.json(section);
    } catch (error) {
      console.error('Error creating info section:', error);
      res.status(500).json({ error: 'Failed to create info section' });
    }
  });

  // Update info section
  app.put("/api/info-sections/:id", requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      const [section] = await db.update(schema.tripInfoSections)
        .set(req.body)
        .where(eq(schema.tripInfoSections.id, req.params.id))
        .returning();

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
      await db.delete(schema.tripInfoSections)
        .where(eq(schema.tripInfoSections.id, req.params.id));
      res.json({ message: 'Info section deleted' });
    } catch (error) {
      console.error('Error deleting info section:', error);
      res.status(500).json({ error: 'Failed to delete info section' });
    }
  });
}