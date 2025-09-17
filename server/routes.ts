import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import {
  profileStorage,
  storage,
  tripStorage,
  cruiseStorage, // Backward compatibility
  itineraryStorage,
  eventStorage,
  talentStorage,
  mediaStorage,
  settingsStorage,
  tripInfoStorage,
  portStorage
} from "./storage";
import { requireAuth, requireContentEditor, requireSuperAdmin, type AuthenticatedRequest } from "./auth";
// DISABLED: Custom JWT auth system - using Supabase Auth exclusively
// import { registerAuthRoutes } from "./auth-routes";
import { db } from "./storage";
import { partyTemplates, cruiseInfoSections, trips, events, talent, ports, ships } from "../shared/schema";
import { eq, ilike, or, count, sql } from "drizzle-orm";
import { z } from "zod";
import path from "path";
import { upload, getPublicImageUrl, deleteImage, isValidImageUrl, uploadToCloudinary } from "./image-utils";

// Import new middleware
import {
  validateBody,
  validateQuery,
  validateParams,
  idParamSchema,
  slugParamSchema,
  createTripSchema,
  updateTripSchema,
  createEventSchema,
  updateEventSchema,
  bulkEventsSchema,
  createTalentSchema,
  updateTalentSchema,
  bulkTalentAssignSchema,
  globalSearchSchema,
  exportTripSchema,
  importTripSchema,
  dashboardStatsSchema,
  systemHealthSchema
} from "./middleware/validation";
import {
  createRateLimit,
  generalRateLimit,
  authRateLimit,
  uploadRateLimit,
  searchRateLimit,
  adminRateLimit,
  bulkRateLimit
} from "./middleware/rate-limiting";
import { csrfProtection, csrfTokenEndpoint, doubleSubmitCsrf } from "./middleware/csrf";
import {
  validateVersion,
  createVersionedRouter,
  apiVersionsEndpoint,
  versionedRoute
} from "./middleware/versioning";

export async function registerRoutes(app: Express): Promise<Server> {
  // ============ MIDDLEWARE SETUP ============

  // Apply general rate limiting to all API routes
  app.use('/api', generalRateLimit);

  // API versioning support
  app.use('/api', validateVersion(['v1']));

  // CSRF protection for unsafe methods (exclude auth routes for now)
  app.use('/api', (req, res, next) => {
    // Skip CSRF for auth routes initially
    if (req.path.startsWith('/api/auth/')) {
      return next();
    }
    return doubleSubmitCsrf()(req, res, next);
  });

  // API versions endpoint
  app.get('/api/versions', apiVersionsEndpoint);

  // CSRF token endpoint
  app.get('/api/csrf-token', csrfTokenEndpoint());

  // ============ STATIC FILE SERVING ============
  // Serve cruise hero images from local filesystem
  app.use('/cruise-images', express.static('server/public/cruise-images', {
    maxAge: '24h', // Cache for 24 hours
    etag: false
  }));
  
  // Serve talent profile images
  app.use('/talent-images', express.static('server/public/talent-images', {
    maxAge: '24h',
    etag: false
  }));
  
  // Serve event images
  app.use('/event-images', express.static('server/public/event-images', {
    maxAge: '24h',
    etag: false
  }));
  
  // Serve itinerary/port images
  app.use('/itinerary-images', express.static('server/public/itinerary-images', {
    maxAge: '24h',
    etag: false
  }));
  
  // Serve general uploads (fallback)
  app.use('/uploads', express.static('server/public/uploads', {
    maxAge: '24h',
    etag: false
  }));
  
  // ============ IMAGE MANAGEMENT ROUTES ============
  
  // Upload image endpoint with type parameter
  app.post("/api/images/upload/:type", uploadRateLimit, requireAuth, requireContentEditor, (req, res, next) => {
    const imageType = req.params.type;
    if (!['talent', 'event', 'itinerary', 'trip', 'cruise'].includes(imageType)) {
      return res.status(400).json({ error: 'Invalid image type. Must be one of: talent, event, itinerary, trip, cruise' });
    }
    
    // Add imageType to request for multer to use
    req.body.imageType = imageType;
    next();
  }, upload.single('image'), async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
      }

      const imageType = req.params.type;

      // Upload to Cloudinary
      const cloudinaryUrl = await uploadToCloudinary(req.file, imageType);

      res.json({
        success: true,
        imageUrl: cloudinaryUrl,
        filename: path.basename(cloudinaryUrl),
        originalName: req.file.originalname,
        size: req.file.size,
        cloudinaryUrl: cloudinaryUrl
      });
    } catch (error) {
      console.error('Image upload error:', error);
      res.status(500).json({ error: 'Failed to upload image' });
    }
  });
  
  // Download image from URL endpoint
  app.post("/api/images/download-from-url", requireAuth, requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      const { url, imageType, name } = req.body;
      
      if (!url || !isValidImageUrl(url)) {
        return res.status(400).json({ error: 'Invalid URL provided' });
      }
      
      if (!['talent', 'event', 'itinerary', 'trip', 'cruise'].includes(imageType)) {
        return res.status(400).json({ error: 'Invalid image type. Must be one of: talent, event, itinerary, trip, cruise' });
      }
      const validImageType = imageType;
      const imageName = name || 'downloaded-image';
      
      // For now, just return the URL as-is since we're using Supabase storage
      // TODO: Implement Supabase storage upload if needed

      res.json({
        success: true,
        imageUrl: url,
        originalUrl: url
      });
    } catch (error) {
      console.error('Image download error:', error);
      res.status(500).json({ error: 'Failed to download image from URL' });
    }
  });
  
  // Delete image endpoint
  app.delete("/api/images", requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      const { imageUrl } = req.body;
      
      if (!imageUrl) {
        return res.status(400).json({ error: 'Image URL required' });
      }
      
      await deleteImage(imageUrl);
      
      res.json({ success: true, message: 'Image deleted successfully' });
    } catch (error) {
      console.error('Image deletion error:', error);
      res.status(500).json({ error: 'Failed to delete image' });
    }
  });
  
  // ============ AUTHENTICATION ROUTES ============
  // DISABLED: Custom JWT auth system - using Supabase Auth exclusively
  // registerAuthRoutes(app);

  // ============ ADMIN ENDPOINTS ============

  // Admin dashboard statistics
  app.post("/api/admin/dashboard/stats",
    adminRateLimit,
    requireAuth,
    requireContentEditor,
    validateBody(dashboardStatsSchema),
    async (req: AuthenticatedRequest, res) => {
      try {
        const { dateRange, metrics } = req.body;

        const stats: any = {};

        // Get basic counts
        if (!metrics || metrics.includes('trips')) {
          const [tripCount] = await db.select({ count: count() }).from(trips);
          const [upcomingTrips] = await db.select({ count: count() })
            .from(trips)
            .where(sql`${trips.status} = 'upcoming'`);

          stats.trips = {
            total: tripCount.count,
            upcoming: upcomingTrips.count,
            past: tripCount.count - upcomingTrips.count
          };
        }

        if (!metrics || metrics.includes('events')) {
          const [eventCount] = await db.select({ count: count() }).from(events);
          stats.events = {
            total: eventCount.count
          };
        }

        if (!metrics || metrics.includes('talent')) {
          const [talentCount] = await db.select({ count: count() }).from(talent);
          stats.talent = {
            total: talentCount.count
          };
        }

        // System health info
        stats.system = {
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          nodeVersion: process.version
        };

        res.json(stats);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
      }
    }
  );

  // System health check
  app.get("/api/admin/system/health",
    adminRateLimit,
    requireAuth,
    requireContentEditor,
    validateQuery(systemHealthSchema),
    async (req: AuthenticatedRequest, res) => {
      try {
        const { includeDetails, checkServices } = req.query;

        const health: any = {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          version: process.env.npm_package_version || '1.0.0'
        };

        if (includeDetails) {
          health.details = {
            memory: process.memoryUsage(),
            cpu: process.cpuUsage(),
            platform: process.platform,
            nodeVersion: process.version
          };
        }

        // Check services if requested
        if (checkServices) {
          health.services = {};

          if (checkServices.includes('database')) {
            try {
              // Simple DB health check
              await db.select({ count: count() }).from(trips).limit(1);
              health.services.database = { status: 'healthy' };
            } catch (error) {
              health.services.database = { status: 'unhealthy', error: 'Database connection failed' };
              health.status = 'degraded';
            }
          }

          // Add other service checks as needed
        }

        const statusCode = health.status === 'healthy' ? 200 : 503;
        res.status(statusCode).json(health);
      } catch (error) {
        console.error('Error checking system health:', error);
        res.status(503).json({
          status: 'unhealthy',
          error: 'Health check failed',
          timestamp: new Date().toISOString()
        });
      }
    }
  );

  // Duplicate trip endpoint
  app.post("/api/trips/:id/duplicate",
    adminRateLimit,
    requireAuth,
    requireContentEditor,
    validateParams(idParamSchema),
    async (req: AuthenticatedRequest, res) => {
      try {
        const originalTrip = await tripStorage.getTripById(req.params.id);
        if (!originalTrip) {
          return res.status(404).json({ error: 'Trip not found' });
        }

        // Create new trip with modified data
        const newTripData = {
          ...originalTrip,
          name: `${originalTrip.name} (Copy)`,
          slug: `${originalTrip.slug}-copy-${Date.now()}`,
          status: 'upcoming' as const,
          createdBy: req.user!.id
        };

        // Remove fields that shouldn't be copied
        delete (newTripData as any).id;
        delete (newTripData as any).createdAt;
        delete (newTripData as any).updatedAt;

        const newTrip = await tripStorage.createTrip(newTripData);

        // Copy related data (itinerary, events, etc.)
        const [itinerary, tripEvents, tripTalent] = await Promise.all([
          itineraryStorage.getItineraryByCruise(originalTrip.id),
          eventStorage.getEventsByCruise(originalTrip.id),
          talentStorage.getTalentByCruise(originalTrip.id)
        ]);

        // Copy itinerary
        for (const stop of itinerary) {
          const newStop = { ...stop, cruiseId: newTrip.id };
          delete (newStop as any).id;
          await itineraryStorage.createItineraryStop(newStop);
        }

        // Copy events
        for (const event of tripEvents) {
          const newEvent = { ...event, cruiseId: newTrip.id };
          delete (newEvent as any).id;
          delete (newEvent as any).createdAt;
          delete (newEvent as any).updatedAt;
          await eventStorage.createEvent(newEvent);
        }

        // Copy talent assignments
        for (const talentAssignment of tripTalent) {
          await talentStorage.assignTalentToCruise(
            newTrip.id,
            talentAssignment.talentId,
            talentAssignment.role
          );
        }

        res.status(201).json(newTrip);
      } catch (error) {
        console.error('Error duplicating trip:', error);
        res.status(500).json({ error: 'Failed to duplicate trip' });
      }
    }
  );

  // Bulk events creation
  app.post("/api/events/bulk",
    bulkRateLimit,
    requireAuth,
    requireContentEditor,
    validateBody(bulkEventsSchema),
    async (req: AuthenticatedRequest, res) => {
      try {
        const { events: eventsToCreate } = req.body;
        const createdEvents = [];

        for (const eventData of eventsToCreate) {
          const event = await eventStorage.createEvent(eventData);
          createdEvents.push(event);
        }

        res.status(201).json({
          message: `Successfully created ${createdEvents.length} events`,
          events: createdEvents
        });
      } catch (error) {
        console.error('Error creating bulk events:', error);
        res.status(500).json({ error: 'Failed to create bulk events' });
      }
    }
  );

  // Bulk talent assignment
  app.post("/api/talent/bulk-assign",
    bulkRateLimit,
    requireAuth,
    requireContentEditor,
    validateBody(bulkTalentAssignSchema),
    async (req: AuthenticatedRequest, res) => {
      try {
        const { assignments } = req.body;
        const results = [];

        for (const assignment of assignments) {
          try {
            await talentStorage.assignTalentToCruise(
              assignment.cruiseId,
              assignment.talentId,
              assignment.role
            );
            results.push({
              success: true,
              cruiseId: assignment.cruiseId,
              talentId: assignment.talentId
            });
          } catch (error) {
            results.push({
              success: false,
              cruiseId: assignment.cruiseId,
              talentId: assignment.talentId,
              error: (error as Error).message
            });
          }
        }

        const successCount = results.filter(r => r.success).length;
        res.json({
          message: `Successfully assigned ${successCount} of ${assignments.length} talent assignments`,
          results
        });
      } catch (error) {
        console.error('Error bulk assigning talent:', error);
        res.status(500).json({ error: 'Failed to bulk assign talent' });
      }
    }
  );

  // Global search endpoint
  app.get("/api/search/global",
    searchRateLimit,
    validateQuery(globalSearchSchema),
    async (req, res) => {
      try {
        const { query, types, limit } = req.query;
        const results: any = {};

        if (!types || types.includes('trips')) {
          const tripResults = await db.select()
            .from(trips)
            .where(
              or(
                ilike(trips.name, `%${query}%`),
                ilike(trips.description, `%${query}%`)
              )
            )
            .limit(Math.floor(limit / (types?.length || 4)));
          results.trips = tripResults;
        }

        if (!types || types.includes('events')) {
          const eventResults = await db.select()
            .from(events)
            .where(
              or(
                ilike(events.title, `%${query}%`),
                ilike(events.description, `%${query}%`)
              )
            )
            .limit(Math.floor(limit / (types?.length || 4)));
          results.events = eventResults;
        }

        if (!types || types.includes('talent')) {
          const talentResults = await db.select()
            .from(talent)
            .where(
              or(
                ilike(talent.name, `%${query}%`),
                ilike(talent.bio, `%${query}%`)
              )
            )
            .limit(Math.floor(limit / (types?.length || 4)));
          results.talent = talentResults;
        }

        if (!types || types.includes('ports')) {
          const portResults = await db.select()
            .from(ports)
            .where(
              or(
                ilike(ports.name, `%${query}%`),
                ilike(ports.description, `%${query}%`)
              )
            )
            .limit(Math.floor(limit / (types?.length || 4)));
          results.ports = portResults;
        }

        if (!types || types.includes('ships')) {
          const shipResults = await db.select()
            .from(ships)
            .where(
              or(
                ilike(ships.name, `%${query}%`),
                ilike(ships.description, `%${query}%`)
              )
            )
            .limit(Math.floor(limit / (types?.length || 4)));
          results.ships = shipResults;
        }

        res.json({
          query,
          results,
          totalResults: Object.values(results).reduce((sum, arr: any) => sum + arr.length, 0)
        });
      } catch (error) {
        console.error('Error performing global search:', error);
        res.status(500).json({ error: 'Failed to perform search' });
      }
    }
  );

  // Export trip data
  app.post("/api/export/trips/:id",
    adminRateLimit,
    requireAuth,
    requireContentEditor,
    validateParams(idParamSchema),
    validateBody(exportTripSchema),
    async (req: AuthenticatedRequest, res) => {
      try {
        const trip = await tripStorage.getTripById(req.params.id);
        if (!trip) {
          return res.status(404).json({ error: 'Trip not found' });
        }

        const { format, includeData } = req.body;
        const exportData: any = { trip };

        // Include additional data if requested
        if (includeData?.includes('itinerary')) {
          exportData.itinerary = await itineraryStorage.getItineraryByCruise(trip.id);
        }
        if (includeData?.includes('events')) {
          exportData.events = await eventStorage.getEventsByCruise(trip.id);
        }
        if (includeData?.includes('talent')) {
          exportData.talent = await talentStorage.getTalentByCruise(trip.id);
        }

        // Set appropriate headers based on format
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `trip-${trip.slug}-${timestamp}`;

        switch (format) {
          case 'csv':
            res.set({
              'Content-Type': 'text/csv',
              'Content-Disposition': `attachment; filename="${filename}.csv"`
            });
            // For CSV, we'd need to implement proper CSV conversion
            res.send('CSV export not yet implemented');
            break;
          case 'excel':
            res.set({
              'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              'Content-Disposition': `attachment; filename="${filename}.xlsx"`
            });
            res.send('Excel export not yet implemented');
            break;
          default: // json
            res.set({
              'Content-Type': 'application/json',
              'Content-Disposition': `attachment; filename="${filename}.json"`
            });
            res.json(exportData);
        }
      } catch (error) {
        console.error('Error exporting trip:', error);
        res.status(500).json({ error: 'Failed to export trip' });
      }
    }
  );

  // Import trip data
  app.post("/api/import/trips",
    bulkRateLimit,
    requireAuth,
    requireSuperAdmin,
    validateBody(importTripSchema),
    async (req: AuthenticatedRequest, res) => {
      try {
        const { data, options } = req.body;
        const { overwrite, mergeStrategy } = options || {};

        // Basic validation of import data
        if (!data.trip) {
          return res.status(400).json({ error: 'Invalid import data: trip data required' });
        }

        let importedTrip;

        if (overwrite && data.trip.id) {
          // Update existing trip
          importedTrip = await tripStorage.updateTrip(data.trip.id, data.trip);
        } else {
          // Create new trip
          const tripData = { ...data.trip };
          delete tripData.id; // Remove ID for new trip
          tripData.createdBy = req.user!.id;
          importedTrip = await tripStorage.createTrip(tripData);
        }

        if (!importedTrip) {
          return res.status(400).json({ error: 'Failed to import trip' });
        }

        // Import related data if provided
        const importResults: any = { trip: importedTrip };

        if (data.itinerary) {
          importResults.itinerary = [];
          for (const stop of data.itinerary) {
            const stopData = { ...stop, cruiseId: importedTrip.id };
            delete stopData.id;
            const importedStop = await itineraryStorage.createItineraryStop(stopData);
            importResults.itinerary.push(importedStop);
          }
        }

        if (data.events) {
          importResults.events = [];
          for (const event of data.events) {
            const eventData = { ...event, cruiseId: importedTrip.id };
            delete eventData.id;
            const importedEvent = await eventStorage.createEvent(eventData);
            importResults.events.push(importedEvent);
          }
        }

        res.status(201).json({
          message: 'Trip imported successfully',
          data: importResults
        });
      } catch (error) {
        console.error('Error importing trip:', error);
        res.status(500).json({ error: 'Failed to import trip' });
      }
    }
  );

  // ============ CRUISE ROUTES ============
  
  // Get all cruises
  app.get("/api/cruises", async (req, res) => {
    try {
      const cruises = await cruiseStorage.getAllCruises();
      res.json(cruises);
    } catch (error) {
      console.error('Error fetching cruises:', error);
      res.status(500).json({ error: 'Failed to fetch cruises' });
    }
  });

  // Get upcoming cruises
  app.get("/api/cruises/upcoming", async (req, res) => {
    try {
      const cruises = await cruiseStorage.getUpcomingCruises();
      res.json(cruises);
    } catch (error) {
      console.error('Error fetching upcoming cruises:', error);
      res.status(500).json({ error: 'Failed to fetch upcoming cruises' });
    }
  });

  // Get past cruises
  app.get("/api/cruises/past", async (req, res) => {
    try {
      const cruises = await cruiseStorage.getPastCruises();
      res.json(cruises);
    } catch (error) {
      console.error('Error fetching past cruises:', error);
      res.status(500).json({ error: 'Failed to fetch past cruises' });
    }
  });

  // Get cruise by ID
  app.get("/api/cruises/id/:id", async (req, res) => {
    try {
      const cruise = await cruiseStorage.getCruiseById(parseInt(req.params.id));
      if (!cruise) {
        return res.status(404).json({ error: 'Cruise not found' });
      }
      res.json(cruise);
    } catch (error) {
      console.error('Error fetching cruise:', error);
      res.status(500).json({ error: 'Failed to fetch cruise' });
    }
  });

  // Get cruise by slug (for public viewing)
  app.get("/api/cruises/:slug", async (req, res) => {
    try {
      const cruise = await cruiseStorage.getCruiseBySlug(req.params.slug);
      if (!cruise) {
        return res.status(404).json({ error: 'Cruise not found' });
      }
      res.json(cruise);
    } catch (error) {
      console.error('Error fetching cruise:', error);
      res.status(500).json({ error: 'Failed to fetch cruise' });
    }
  });

  // Create new cruise (protected route)
  app.post("/api/cruises", requireAuth, requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      const cruise = await cruiseStorage.createCruise(req.body);
      res.status(201).json(cruise);
    } catch (error) {
      console.error('Error creating cruise:', error);
      res.status(500).json({ error: 'Failed to create cruise' });
    }
  });

  // Update cruise (protected route)
  app.put("/api/cruises/:id", requireAuth, requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      const cruise = await cruiseStorage.updateCruise(parseInt(req.params.id), req.body);
      if (!cruise) {
        return res.status(404).json({ error: 'Cruise not found' });
      }
      res.json(cruise);
    } catch (error) {
      console.error('Error updating cruise:', error);
      res.status(500).json({ error: 'Failed to update cruise' });
    }
  });

  // Delete cruise (protected route)
  app.delete("/api/cruises/:id", requireAuth, requireSuperAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      await cruiseStorage.deleteCruise(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting cruise:', error);
      res.status(500).json({ error: 'Failed to delete cruise' });
    }
  });

  // ============ TRIP ROUTES (new trip-based API) ============
  
  // Get all trips
  app.get("/api/trips", async (req, res) => {
    try {
      const trips = await tripStorage.getAllTrips();
      res.json(trips);
    } catch (error) {
      console.error('Error fetching trips:', error);
      res.status(500).json({ error: 'Failed to fetch trips' });
    }
  });

  // Get upcoming trips
  app.get("/api/trips/upcoming", async (req, res) => {
    try {
      const trips = await tripStorage.getUpcomingTrips();
      res.json(trips);
    } catch (error) {
      console.error('Error fetching upcoming trips:', error);
      res.status(500).json({ error: 'Failed to fetch upcoming trips' });
    }
  });

  // Get past trips
  app.get("/api/trips/past", async (req, res) => {
    try {
      const trips = await tripStorage.getPastTrips();
      res.json(trips);
    } catch (error) {
      console.error('Error fetching past trips:', error);
      res.status(500).json({ error: 'Failed to fetch past trips' });
    }
  });

  // Get trip by ID
  app.get("/api/trips/id/:id", async (req, res) => {
    try {
      const trip = await tripStorage.getTripById(parseInt(req.params.id));
      if (!trip) {
        return res.status(404).json({ error: 'Trip not found' });
      }
      res.json(trip);
    } catch (error) {
      console.error('Error fetching trip:', error);
      res.status(500).json({ error: 'Failed to fetch trip' });
    }
  });

  // Get trip by slug (for public viewing)
  app.get("/api/trips/:slug", async (req, res) => {
    try {
      const trip = await tripStorage.getTripBySlug(req.params.slug);
      if (!trip) {
        return res.status(404).json({ error: 'Trip not found' });
      }
      res.json(trip);
    } catch (error) {
      console.error('Error fetching trip:', error);
      res.status(500).json({ error: 'Failed to fetch trip' });
    }
  });

  // Create new trip (protected route)
  app.post("/api/trips", adminRateLimit, requireAuth, requireContentEditor, validateBody(createTripSchema), async (req: AuthenticatedRequest, res) => {
    try {
      const trip = await tripStorage.createTrip(req.body);
      res.status(201).json(trip);
    } catch (error) {
      console.error('Error creating trip:', error);
      res.status(500).json({ error: 'Failed to create trip' });
    }
  });

  // Update trip (protected route)
  app.put("/api/trips/:id", adminRateLimit, requireAuth, requireContentEditor, validateParams(idParamSchema), validateBody(updateTripSchema), async (req: AuthenticatedRequest, res) => {
    try {
      const trip = await tripStorage.updateTrip(parseInt(req.params.id), req.body);
      if (!trip) {
        return res.status(404).json({ error: 'Trip not found' });
      }
      res.json(trip);
    } catch (error) {
      console.error('Error updating trip:', error);
      res.status(500).json({ error: 'Failed to update trip' });
    }
  });

  // Delete trip (protected route)
  app.delete("/api/trips/:id", requireAuth, requireSuperAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      await tripStorage.deleteTrip(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting trip:', error);
      res.status(500).json({ error: 'Failed to delete trip' });
    }
  });

  // ============ ITINERARY ROUTES ============
  
  // Get itinerary for a cruise
  app.get("/api/cruises/:cruiseId/itinerary", async (req, res) => {
    try {
      const itinerary = await itineraryStorage.getItineraryByCruise(parseInt(req.params.cruiseId));
      res.json(itinerary);
    } catch (error) {
      console.error('Error fetching itinerary:', error);
      res.status(500).json({ error: 'Failed to fetch itinerary' });
    }
  });

  // Get itinerary for a trip (new trip-based API)
  app.get("/api/trips/:tripId/itinerary", async (req, res) => {
    try {
      const itinerary = await itineraryStorage.getItineraryByCruise(parseInt(req.params.tripId));
      res.json(itinerary);
    } catch (error) {
      console.error('Error fetching trip itinerary:', error);
      res.status(500).json({ error: 'Failed to fetch trip itinerary' });
    }
  });

  // Add itinerary stop (protected route)
  app.post("/api/cruises/:cruiseId/itinerary", requireAuth, requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      const stop = await itineraryStorage.createItineraryStop({
        ...req.body,
        cruiseId: parseInt(req.params.cruiseId)
      });
      res.status(201).json(stop);
    } catch (error) {
      console.error('Error creating itinerary stop:', error);
      res.status(500).json({ error: 'Failed to create itinerary stop' });
    }
  });

  // Update itinerary stop (protected route)
  app.put("/api/itinerary/:id", requireAuth, requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      const stop = await itineraryStorage.updateItineraryStop(parseInt(req.params.id), req.body);
      if (!stop) {
        return res.status(404).json({ error: 'Itinerary stop not found' });
      }
      res.json(stop);
    } catch (error) {
      console.error('Error updating itinerary stop:', error);
      res.status(500).json({ error: 'Failed to update itinerary stop' });
    }
  });

  // Delete itinerary stop (protected route)
  app.delete("/api/itinerary/:id", requireAuth, requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      await itineraryStorage.deleteItineraryStop(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting itinerary stop:', error);
      res.status(500).json({ error: 'Failed to delete itinerary stop' });
    }
  });

  // ============ EVENT ROUTES ============

  // Get event statistics
  app.get("/api/events/stats", async (req, res) => {
    try {
      const tripId = req.query.tripId ? parseInt(req.query.tripId as string) : undefined;
      const allEvents = tripId
        ? await eventStorage.getEventsByCruise(tripId)
        : await eventStorage.getAllEvents();

      const stats = {
        total: allEvents.length,
        featured: allEvents.filter((e: any) => e.featured).length,
        totalCapacity: allEvents.reduce((acc: number, e: any) => acc + (e.capacity || 0), 0),
        avgPrice: allEvents.reduce((acc: number, e: any) => acc + (e.price || 0), 0) / (allEvents.length || 1)
      };
      res.json(stats);
    } catch (error) {
      console.error('Error fetching event stats:', error);
      res.status(500).json({ error: 'Failed to fetch event statistics' });
    }
  });

  // Get all events with filtering
  app.get("/api/events", async (req, res) => {
    try {
      const { tripId, search, type, date } = req.query;

      let events = tripId
        ? await eventStorage.getEventsByCruise(parseInt(tripId as string))
        : await eventStorage.getAllEvents();

      // Apply filters
      if (search) {
        const searchLower = (search as string).toLowerCase();
        events = events.filter((e: any) =>
          e.title?.toLowerCase().includes(searchLower) ||
          e.description?.toLowerCase().includes(searchLower) ||
          e.location?.toLowerCase().includes(searchLower) ||
          e.tags?.toLowerCase().includes(searchLower)
        );
      }

      if (type && type !== 'all') {
        events = events.filter((e: any) => e.type === type);
      }

      if (date) {
        const filterDate = (date as string).split('T')[0];
        events = events.filter((e: any) => e.date?.split('T')[0] === filterDate);
      }

      res.json(events);
    } catch (error) {
      console.error('Error fetching events:', error);
      res.status(500).json({ error: 'Failed to fetch events' });
    }
  });

  // Get all events for a cruise
  app.get("/api/cruises/:cruiseId/events", async (req, res) => {
    try {
      const events = await eventStorage.getEventsByCruise(parseInt(req.params.cruiseId));
      res.json(events);
    } catch (error) {
      console.error('Error fetching events:', error);
      res.status(500).json({ error: 'Failed to fetch events' });
    }
  });

  // Get events by date
  app.get("/api/cruises/:cruiseId/events/date/:date", async (req, res) => {
    try {
      const date = new Date(req.params.date);
      const events = await eventStorage.getEventsByDate(parseInt(req.params.cruiseId), date);
      res.json(events);
    } catch (error) {
      console.error('Error fetching events:', error);
      res.status(500).json({ error: 'Failed to fetch events' });
    }
  });

  // Get events by type
  app.get("/api/cruises/:cruiseId/events/type/:type", async (req, res) => {
    try {
      const events = await eventStorage.getEventsByType(parseInt(req.params.cruiseId), req.params.type);
      res.json(events);
    } catch (error) {
      console.error('Error fetching events:', error);
      res.status(500).json({ error: 'Failed to fetch events' });
    }
  });

  // Create event (protected route)
  app.post("/api/cruises/:cruiseId/events", adminRateLimit, requireAuth, requireContentEditor, validateBody(createEventSchema), async (req: AuthenticatedRequest, res) => {
    try {
      const event = await eventStorage.createEvent({
        ...req.body,
        cruiseId: parseInt(req.params.cruiseId)
      });
      res.status(201).json(event);
    } catch (error) {
      console.error('Error creating event:', error);
      res.status(500).json({ error: 'Failed to create event' });
    }
  });

  // Update event (protected route)
  app.put("/api/events/:id", adminRateLimit, requireAuth, requireContentEditor, validateParams(idParamSchema), validateBody(updateEventSchema), async (req: AuthenticatedRequest, res) => {
    try {
      const event = await eventStorage.updateEvent(parseInt(req.params.id), req.body);
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }
      res.json(event);
    } catch (error) {
      console.error('Error updating event:', error);
      res.status(500).json({ error: 'Failed to update event' });
    }
  });

  // Delete event (protected route)
  app.delete("/api/events/:id", requireAuth, requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      await eventStorage.deleteEvent(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting event:', error);
      res.status(500).json({ error: 'Failed to delete event' });
    }
  });

  // ============ TALENT ROUTES ============
  
  // Get talent statistics
  app.get("/api/talent/stats", async (req, res) => {
    try {
      const allTalent = await talentStorage.getAllTalent();
      const stats = {
        total: allTalent.length,
        featured: allTalent.filter((t: any) => t.featured).length,
        countries: new Set(allTalent.map((t: any) => t.country).filter(Boolean)).size,
        avgRating: allTalent.reduce((acc: number, t: any) => acc + (t.rating || 0), 0) / (allTalent.length || 1)
      };
      res.json(stats);
    } catch (error) {
      console.error('Error fetching talent stats:', error);
      res.status(500).json({ error: 'Failed to fetch talent statistics' });
    }
  });

  // Get all talent with search and filtering
  app.get("/api/talent", async (req, res) => {
    try {
      const search = req.query.search as string;
      const role = req.query.role as string;

      let talent;
      if (search || role) {
        // Filter talent based on search and role
        talent = await talentStorage.getAllTalent();
        if (search) {
          const searchLower = search.toLowerCase();
          talent = talent.filter((t: any) =>
            t.name?.toLowerCase().includes(searchLower) ||
            t.bio?.toLowerCase().includes(searchLower) ||
            t.specialties?.toLowerCase().includes(searchLower) ||
            t.country?.toLowerCase().includes(searchLower)
          );
        }
        if (role && role !== 'all') {
          talent = talent.filter((t: any) => t.role === role);
        }
      } else {
        talent = await talentStorage.getAllTalent();
      }

      res.json(talent);
    } catch (error) {
      console.error('Error fetching talent:', error);
      res.status(500).json({ error: 'Failed to fetch talent' });
    }
  });

  // Get talent by ID
  app.get("/api/talent/:id", async (req, res) => {
    try {
      const talent = await talentStorage.getTalentById(parseInt(req.params.id));
      if (!talent) {
        return res.status(404).json({ error: 'Talent not found' });
      }
      res.json(talent);
    } catch (error) {
      console.error('Error fetching talent:', error);
      res.status(500).json({ error: 'Failed to fetch talent' });
    }
  });

  // Get talent for a cruise
  app.get("/api/cruises/:cruiseId/talent", async (req, res) => {
    try {
      const talent = await talentStorage.getTalentByCruise(parseInt(req.params.cruiseId));
      res.json(talent);
    } catch (error) {
      console.error('Error fetching cruise talent:', error);
      res.status(500).json({ error: 'Failed to fetch cruise talent' });
    }
  });

  // Create talent (protected route)
  app.post("/api/talent", requireAuth, requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      const talent = await talentStorage.createTalent(req.body);
      res.status(201).json(talent);
    } catch (error) {
      console.error('Error creating talent:', error);
      res.status(500).json({ error: 'Failed to create talent' });
    }
  });

  // Update talent (protected route)
  app.put("/api/talent/:id", requireAuth, requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      const talent = await talentStorage.updateTalent(parseInt(req.params.id), req.body);
      if (!talent) {
        return res.status(404).json({ error: 'Talent not found' });
      }
      res.json(talent);
    } catch (error) {
      console.error('Error updating talent:', error);
      res.status(500).json({ error: 'Failed to update talent' });
    }
  });

  // Delete talent (protected route)
  app.delete("/api/talent/:id", requireAuth, requireSuperAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      await talentStorage.deleteTalent(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting talent:', error);
      res.status(500).json({ error: 'Failed to delete talent' });
    }
  });

  // Assign talent to cruise (protected route)
  app.post("/api/cruises/:cruiseId/talent/:talentId", requireAuth, requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      const cruiseId = parseInt(req.params.cruiseId);
      const talentId = parseInt(req.params.talentId);
      const { role } = req.body;
      
      if (isNaN(cruiseId) || isNaN(talentId)) {
        return res.status(400).json({ error: 'Invalid cruise ID or talent ID' });
      }

      await talentStorage.assignTalentToCruise(cruiseId, talentId, role);
      res.status(201).json({ message: 'Talent assigned to cruise successfully' });
    } catch (error) {
      console.error('Error assigning talent:', error);
      res.status(500).json({ error: 'Failed to assign talent' });
    }
  });

  // Remove talent from cruise (protected route)
  app.delete("/api/cruises/:cruiseId/talent/:talentId", requireAuth, requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      const cruiseId = parseInt(req.params.cruiseId);
      const talentId = parseInt(req.params.talentId);

      if (isNaN(cruiseId) || isNaN(talentId)) {
        return res.status(400).json({ error: 'Invalid cruise ID or talent ID' });
      }

      await talentStorage.removeTalentFromCruise(cruiseId, talentId);
      res.status(204).send();
    } catch (error) {
      console.error('Error removing talent:', error);
      res.status(500).json({ error: 'Failed to remove talent' });
    }
  });

  // ============ SHIPS ROUTES ============

  // Get all ships with search and filtering
  app.get("/api/ships", async (req, res) => {
    try {
      const { shipStorage } = await import("./ships-storage");
      const search = req.query.search as string;
      const cruiseLine = req.query.cruiseLine as string;

      let ships;
      if (search) {
        ships = await shipStorage.search(search);
      } else if (cruiseLine) {
        ships = await shipStorage.getByCruiseLine(cruiseLine);
      } else {
        ships = await shipStorage.getAll();
      }
      res.json(ships);
    } catch (error) {
      console.error('Error fetching ships:', error);
      res.status(500).json({ error: 'Failed to fetch ships' });
    }
  });

  // Get ship statistics
  app.get("/api/ships/stats", async (req, res) => {
    try {
      const { shipStorage } = await import("./ships-storage");
      const stats = await shipStorage.getStatistics();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching ship statistics:', error);
      res.status(500).json({ error: 'Failed to fetch ship statistics' });
    }
  });

  // Get ship by ID
  app.get("/api/ships/:id", async (req, res) => {
    try {
      const { shipStorage } = await import("./ships-storage");
      const ship = await shipStorage.getById(parseInt(req.params.id));
      if (!ship) {
        return res.status(404).json({ error: 'Ship not found' });
      }
      res.json(ship);
    } catch (error) {
      console.error('Error fetching ship:', error);
      res.status(500).json({ error: 'Failed to fetch ship' });
    }
  });

  // Create ship (protected route)
  app.post("/api/ships", requireAuth, requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      const { shipStorage } = await import("./ships-storage");
      const ship = await shipStorage.create(req.body);
      res.status(201).json(ship);
    } catch (error) {
      console.error('Error creating ship:', error);
      res.status(500).json({ error: 'Failed to create ship' });
    }
  });

  // Update ship (protected route)
  app.put("/api/ships/:id", requireAuth, requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      const { shipStorage } = await import("./ships-storage");
      const ship = await shipStorage.update(parseInt(req.params.id), req.body);
      if (!ship) {
        return res.status(404).json({ error: 'Ship not found' });
      }
      res.json(ship);
    } catch (error) {
      console.error('Error updating ship:', error);
      res.status(500).json({ error: 'Failed to update ship' });
    }
  });

  // Delete ship (protected route)
  app.delete("/api/ships/:id", requireAuth, requireSuperAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { shipStorage } = await import("./ships-storage");
      await shipStorage.delete(parseInt(req.params.id));
      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting ship:', error);
      if (error.message?.includes('Cannot delete ship')) {
        res.status(409).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to delete ship' });
      }
    }
  });

  // ============ PORT ROUTES ============

  // Get all ports with search and filtering
  app.get("/api/ports", async (req, res) => {
    try {
      const search = req.query.search as string;
      const type = req.query.type as string;
      const region = req.query.region as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      let ports;
      if (search) {
        ports = await portStorage.search(search);
      } else if (type) {
        ports = await portStorage.getByType(type as 'port' | 'sea_day' | 'embark' | 'disembark');
      } else {
        ports = await portStorage.getAll();
      }
      res.json(ports);
    } catch (error) {
      console.error('Error fetching ports:', error);
      res.status(500).json({ error: 'Failed to fetch ports' });
    }
  });

  // Get port statistics (must come before :id route)
  app.get("/api/ports/stats", async (req, res) => {
    try {
      const stats = await portStorage.getStatistics();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching port statistics:', error);
      res.status(500).json({ error: 'Failed to fetch port statistics' });
    }
  });

  // Get port by ID
  app.get("/api/ports/:id", async (req, res) => {
    try {
      const port = await portStorage.getById(parseInt(req.params.id));
      if (!port) {
        return res.status(404).json({ error: 'Port not found' });
      }
      res.json(port);
    } catch (error) {
      console.error('Error fetching port:', error);
      res.status(500).json({ error: 'Failed to fetch port' });
    }
  });

  // Create port (protected route)
  app.post("/api/ports", requireAuth, requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      const port = await portStorage.create(req.body);
      res.status(201).json(port);
    } catch (error) {
      console.error('Error creating port:', error);
      res.status(500).json({ error: 'Failed to create port' });
    }
  });

  // Update port (protected route)
  app.put("/api/ports/:id", requireAuth, requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      const port = await portStorage.update(parseInt(req.params.id), req.body);
      if (!port) {
        return res.status(404).json({ error: 'Port not found' });
      }
      res.json(port);
    } catch (error) {
      console.error('Error updating port:', error);
      res.status(500).json({ error: 'Failed to update port' });
    }
  });

  // Delete port (protected route)
  app.delete("/api/ports/:id", requireAuth, requireSuperAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const deleted = await portStorage.delete(parseInt(req.params.id));
      if (!deleted) {
        return res.status(404).json({ error: 'Port not found' });
      }
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting port:', error);
      res.status(500).json({ error: 'Failed to delete port' });
    }
  });

  // ============ MEDIA ROUTES ============
  
  // Get media by type
  app.get("/api/media/type/:type", async (req, res) => {
    try {
      const media = await mediaStorage.getMediaByType(req.params.type);
      res.json(media);
    } catch (error) {
      console.error('Error fetching media:', error);
      res.status(500).json({ error: 'Failed to fetch media' });
    }
  });

  // Get media by association
  app.get("/api/media/:associatedType/:associatedId", async (req, res) => {
    try {
      const media = await mediaStorage.getMediaByAssociation(
        req.params.associatedType,
        parseInt(req.params.associatedId)
      );
      res.json(media);
    } catch (error) {
      console.error('Error fetching media:', error);
      res.status(500).json({ error: 'Failed to fetch media' });
    }
  });

  // Upload media (protected route)
  app.post("/api/media", requireAuth, requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      const media = await mediaStorage.createMedia(req.body);
      res.status(201).json(media);
    } catch (error) {
      console.error('Error creating media:', error);
      res.status(500).json({ error: 'Failed to create media' });
    }
  });

  // Delete media (protected route)
  app.delete("/api/media/:id", requireAuth, requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      await mediaStorage.deleteMedia(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting media:', error);
      res.status(500).json({ error: 'Failed to delete media' });
    }
  });

  // ============ COMPLETE CRUISE DATA ENDPOINT ============
  
  // Get complete cruise data (itinerary, events, talent, media)
  app.get("/api/cruises/:slug/complete", async (req, res) => {
    try {
      const cruise = await cruiseStorage.getCruiseBySlug(req.params.slug);
      if (!cruise) {
        return res.status(404).json({ error: 'Cruise not found' });
      }

      const [itinerary, events, talent] = await Promise.all([
        itineraryStorage.getItineraryByCruise(cruise.id),
        eventStorage.getEventsByCruise(cruise.id),
        talentStorage.getTalentByCruise(cruise.id)
      ]);

      res.json({
        cruise,
        itinerary,
        events,
        talent
      });
    } catch (error) {
      console.error('Error fetching complete cruise data:', error);
      res.status(500).json({ error: 'Failed to fetch cruise data' });
    }
  });

  // ============ COMPLETE TRIP DATA ENDPOINT (new trip-based API) ============
  
  // Get complete trip data (itinerary, events, talent, media)
  app.get("/api/trips/:slug/complete", async (req, res) => {
    try {
      const trip = await tripStorage.getTripBySlug(req.params.slug);
      if (!trip) {
        return res.status(404).json({ error: 'Trip not found' });
      }

      const [itinerary, events, talent, tripInfoSections] = await Promise.all([
        itineraryStorage.getItineraryByCruise(trip.id),
        eventStorage.getEventsByCruise(trip.id),
        talentStorage.getTalentByCruise(trip.id),
        tripInfoStorage.getTripInfoSectionsByCruise(trip.id)
      ]);

      res.json({
        trip,
        itinerary,
        events,
        talent,
        tripInfoSections
      });
    } catch (error) {
      console.error('Error fetching complete trip data:', error);
      res.status(500).json({ error: 'Failed to fetch trip data' });
    }
  });

  // ============ PARTY TEMPLATES ROUTES ============
  
  // Get all party templates with optional search
  app.get("/api/party-templates", requireAuth, async (req, res) => {
    try {
      const search = req.query.search as string;
      
      let templates;
      
      if (search) {
        templates = await db.select().from(partyTemplates).where(
          or(
            ilike(partyTemplates.name, `%${search}%`),
            ilike(partyTemplates.themeDescription, `%${search}%`),
            ilike(partyTemplates.dressCode, `%${search}%`)
          )
        ).orderBy(partyTemplates.name);
      } else {
        templates = await db.select().from(partyTemplates).orderBy(partyTemplates.name);
      }
      
      res.json(templates);
    } catch (error) {
      console.error('Error fetching party templates:', error);
      res.status(500).json({ error: 'Failed to fetch party templates' });
    }
  });

  // Create party template (protected route)
  app.post("/api/party-templates", requireAuth, requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      const partyTemplateSchema = z.object({
        name: z.string().min(1, 'Name is required').max(255),
        themeDescription: z.string().max(1000).optional(),
        dressCode: z.string().max(255).optional(),
        defaultImageUrl: z.string().url().optional().or(z.literal('')),
        tags: z.array(z.string()).optional(),
        defaults: z.record(z.any()).optional(),
      });

      const validationResult = partyTemplateSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid input', 
          details: validationResult.error.errors 
        });
      }

      const { name, themeDescription, dressCode, defaultImageUrl, tags, defaults } = validationResult.data;
      
      const newTemplate = await db.insert(partyTemplates).values({
        name,
        themeDescription,
        dressCode,
        defaultImageUrl: defaultImageUrl || null,
        tags,
        defaults,
        createdBy: req.user!.id,
      }).returning();
      
      res.status(201).json(newTemplate[0]);
    } catch (error) {
      console.error('Error creating party template:', error);
      res.status(500).json({ error: 'Failed to create party template' });
    }
  });

  // Update party template (protected route)
  app.put("/api/party-templates/:id", requireAuth, requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      const templateId = parseInt(req.params.id);
      if (isNaN(templateId)) {
        return res.status(400).json({ error: 'Invalid template ID' });
      }

      const partyTemplateSchema = z.object({
        name: z.string().min(1, 'Name is required').max(255),
        themeDescription: z.string().max(1000).optional(),
        dressCode: z.string().max(255).optional(),
        defaultImageUrl: z.string().url().optional().or(z.literal('')),
        tags: z.array(z.string()).optional(),
        defaults: z.record(z.any()).optional(),
      });

      const validationResult = partyTemplateSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid input', 
          details: validationResult.error.errors 
        });
      }

      const { name, themeDescription, dressCode, defaultImageUrl, tags, defaults } = validationResult.data;
      
      const updatedTemplate = await db.update(partyTemplates)
        .set({
          name,
          themeDescription,
          dressCode,
          defaultImageUrl: defaultImageUrl || null,
          tags,
          defaults,
          updatedAt: new Date(),
        })
        .where(eq(partyTemplates.id, templateId))
        .returning();
      
      if (updatedTemplate.length === 0) {
        return res.status(404).json({ error: 'Party template not found' });
      }
      
      res.json(updatedTemplate[0]);
    } catch (error) {
      console.error('Error updating party template:', error);
      res.status(500).json({ error: 'Failed to update party template' });
    }
  });

  // Delete party template (protected route)
  app.delete("/api/party-templates/:id", requireAuth, requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      const templateId = parseInt(req.params.id);
      if (isNaN(templateId)) {
        return res.status(400).json({ error: 'Invalid template ID' });
      }
      
      const deletedTemplate = await db.delete(partyTemplates)
        .where(eq(partyTemplates.id, templateId))
        .returning();
      
      if (deletedTemplate.length === 0) {
        return res.status(404).json({ error: 'Party template not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting party template:', error);
      res.status(500).json({ error: 'Failed to delete party template' });
    }
  });

  // ============ CRUISE INFO SECTIONS ROUTES ============
  
  // Get info sections for a cruise
  app.get("/api/cruises/:cruiseId/info-sections", requireAuth, async (req, res) => {
    try {
      const cruiseId = parseInt(req.params.cruiseId);
      const sections = await db.select()
        .from(cruiseInfoSections)
        .where(eq(cruiseInfoSections.cruiseId, cruiseId))
        .orderBy(cruiseInfoSections.orderIndex);
      
      res.json(sections);
    } catch (error) {
      console.error('Error fetching info sections:', error);
      res.status(500).json({ error: 'Failed to fetch info sections' });
    }
  });

  // Create info section (protected route)
  app.post("/api/cruises/:cruiseId/info-sections", requireAuth, requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      const cruiseId = parseInt(req.params.cruiseId);
      const { title, content, orderIndex } = req.body;
      
      const newSection = await db.insert(cruiseInfoSections).values({
        cruiseId,
        title,
        content,
        orderIndex: orderIndex || 0,
        updatedBy: req.user!.id,
      }).returning();
      
      res.status(201).json(newSection[0]);
    } catch (error) {
      console.error('Error creating info section:', error);
      res.status(500).json({ error: 'Failed to create info section' });
    }
  });

  // Update info section (protected route)
  app.put("/api/info-sections/:id", requireAuth, requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      const sectionId = parseInt(req.params.id);
      const { title, content, orderIndex } = req.body;
      
      const updatedSection = await db.update(cruiseInfoSections)
        .set({
          title,
          content,
          orderIndex,
          updatedAt: new Date(),
          updatedBy: req.user!.id,
        })
        .where(eq(cruiseInfoSections.id, sectionId))
        .returning();
      
      if (updatedSection.length === 0) {
        return res.status(404).json({ error: 'Info section not found' });
      }
      
      res.json(updatedSection[0]);
    } catch (error) {
      console.error('Error updating info section:', error);
      res.status(500).json({ error: 'Failed to update info section' });
    }
  });

  // Delete info section (protected route)
  app.delete("/api/info-sections/:id", requireAuth, requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      const sectionId = parseInt(req.params.id);
      
      const deletedSection = await db.delete(cruiseInfoSections)
        .where(eq(cruiseInfoSections.id, sectionId))
        .returning();
      
      if (deletedSection.length === 0) {
        return res.status(404).json({ error: 'Info section not found' });
      }
      
      res.json({ message: 'Info section deleted successfully' });
    } catch (error) {
      console.error('Error deleting info section:', error);
      res.status(500).json({ error: 'Failed to delete info section' });
    }
  });

  // ============ SETTINGS ROUTES ============
  
  // Get all settings for a category
  app.get("/api/settings/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const settings = await settingsStorage.getSettingsByCategory(category);
      res.json(settings);
    } catch (error) {
      console.error('Error fetching settings by category:', error);
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  });

  // Get only active settings for a category
  app.get("/api/settings/:category/active", async (req, res) => {
    try {
      const { category } = req.params;
      const settings = await settingsStorage.getAllActiveSettingsByCategory(category);
      res.json(settings);
    } catch (error) {
      console.error('Error fetching active settings:', error);
      res.status(500).json({ error: 'Failed to fetch active settings' });
    }
  });

  // Get a specific setting by category and key
  app.get("/api/settings/:category/:key", async (req, res) => {
    try {
      const { category, key } = req.params;
      const setting = await settingsStorage.getSettingByCategoryAndKey(category, key);
      
      if (!setting) {
        return res.status(404).json({ error: 'Setting not found' });
      }
      
      res.json(setting);
    } catch (error) {
      console.error('Error fetching setting:', error);
      res.status(500).json({ error: 'Failed to fetch setting' });
    }
  });

  // Create a new setting (protected route)
  app.post("/api/settings/:category", requireAuth, requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      const { category } = req.params;
      const { key, label, value, metadata, orderIndex } = req.body;
      
      // Validate required fields
      if (!key || !label) {
        return res.status(400).json({ error: 'Key and label are required' });
      }
      
      // Check if setting with this category/key already exists
      const existingSetting = await settingsStorage.getSettingByCategoryAndKey(category, key);
      if (existingSetting) {
        return res.status(409).json({ error: 'Setting with this key already exists in category' });
      }
      
      const setting = await settingsStorage.createSetting({
        category,
        key,
        label,
        value,
        metadata,
        orderIndex: orderIndex || 0,
        isActive: true,
        createdBy: req.user!.id,
      });
      
      res.status(201).json(setting);
    } catch (error) {
      console.error('Error creating setting:', error);
      res.status(500).json({ error: 'Failed to create setting' });
    }
  });

  // Update a setting (protected route)
  app.put("/api/settings/:category/:key", requireAuth, requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      const { category, key } = req.params;
      const { label, value, metadata, orderIndex, isActive } = req.body;
      
      const setting = await settingsStorage.updateSetting(category, key, {
        label,
        value,
        metadata,
        orderIndex,
        isActive,
      });
      
      if (!setting) {
        return res.status(404).json({ error: 'Setting not found' });
      }
      
      res.json(setting);
    } catch (error) {
      console.error('Error updating setting:', error);
      res.status(500).json({ error: 'Failed to update setting' });
    }
  });

  // Delete a setting (protected route)
  app.delete("/api/settings/:category/:key", requireAuth, requireSuperAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { category, key } = req.params;
      
      // Check if setting exists before trying to delete
      const setting = await settingsStorage.getSettingByCategoryAndKey(category, key);
      if (!setting) {
        return res.status(404).json({ error: 'Setting not found' });
      }
      
      await settingsStorage.deleteSetting(category, key);
      res.json({ message: 'Setting deleted successfully' });
    } catch (error) {
      console.error('Error deleting setting:', error);
      res.status(500).json({ error: 'Failed to delete setting' });
    }
  });

  // Deactivate a setting (protected route)
  app.post("/api/settings/:category/:key/deactivate", requireAuth, requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      const { category, key } = req.params;
      
      const setting = await settingsStorage.deactivateSetting(category, key);
      if (!setting) {
        return res.status(404).json({ error: 'Setting not found' });
      }
      
      res.json(setting);
    } catch (error) {
      console.error('Error deactivating setting:', error);
      res.status(500).json({ error: 'Failed to deactivate setting' });
    }
  });

  // Reorder settings in a category (protected route)
  app.post("/api/settings/:category/reorder", requireAuth, requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      const { category } = req.params;
      const { orderedKeys } = req.body;
      
      if (!Array.isArray(orderedKeys)) {
        return res.status(400).json({ error: 'orderedKeys must be an array' });
      }
      
      await settingsStorage.reorderSettings(category, orderedKeys);
      
      // Return updated settings for confirmation
      const settings = await settingsStorage.getSettingsByCategory(category);
      res.json({
        message: 'Settings reordered successfully',
        settings
      });
    } catch (error) {
      console.error('Error reordering settings:', error);
      res.status(500).json({ error: 'Failed to reorder settings' });
    }
  });

  // ============ API VERSIONING STRUCTURE ============

  // Create versioned router for v1
  const v1Router = createVersionedRouter('v1');

  // Example of versioned endpoints
  v1Router.get('/trips', versionedRoute({
    'v1': async (req, res) => {
      try {
        const trips = await tripStorage.getAllTrips();
        res.json(trips);
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch trips' });
      }
    }
  }));

  v1Router.get('/trips/:slug', versionedRoute({
    'v1': async (req, res) => {
      try {
        const trip = await tripStorage.getTripBySlug(req.params.slug);
        if (!trip) {
          return res.status(404).json({ error: 'Trip not found' });
        }
        res.json(trip);
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch trip' });
      }
    }
  }));

  // Profile endpoint for Supabase Auth integration testing
  v1Router.get('/profile/:id', versionedRoute({
    'v1': async (req, res) => {
      try {
        const profile = await profileStorage.getProfile(req.params.id);
        if (!profile) {
          return res.status(404).json({ error: 'Profile not found' });
        }
        res.json(profile);
      } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
      }
    }
  }));

  // Mount versioned router
  app.use('/api/v1', v1Router);

  // ============ ERROR HANDLING ============

  // 404 handler for API routes
  app.use('/api/*', (req, res) => {
    res.status(404).json({
      error: 'API endpoint not found',
      path: req.path,
      method: req.method,
      message: 'The requested API endpoint does not exist'
    });
  });

  // Global error handler
  app.use((error: any, req: any, res: any, next: any) => {
    console.error('Unhandled error:', error);

    // Don't leak error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';

    res.status(error.status || 500).json({
      error: 'Internal server error',
      message: isDevelopment ? error.message : 'An unexpected error occurred',
      ...(isDevelopment && { stack: error.stack })
    });
  });

  const httpServer = createServer(app);

  return httpServer;
}