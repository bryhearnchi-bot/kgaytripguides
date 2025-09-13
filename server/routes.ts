import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { 
  storage, 
  tripStorage,
  cruiseStorage, // Backward compatibility
  itineraryStorage, 
  eventStorage, 
  talentStorage,
  mediaStorage,
  settingsStorage
} from "./storage";
import { requireAuth, requireContentEditor, requireSuperAdmin, type AuthenticatedRequest } from "./auth";
import { registerAuthRoutes } from "./auth-routes";
import { db } from "./storage";
import { partyTemplates, cruiseInfoSections } from "../shared/schema";
import { eq, ilike, or } from "drizzle-orm";
import { z } from "zod";
import { upload, getPublicImageUrl, deleteImage, isValidImageUrl } from "./image-utils";
import { downloadImageFromUrl } from "./image-migration";

export async function registerRoutes(app: Express): Promise<Server> {
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
  app.post("/api/images/upload/:type", requireAuth, requireContentEditor, (req, res, next) => {
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
      const publicUrl = getPublicImageUrl(imageType, req.file.filename);
      
      res.json({
        success: true,
        imageUrl: publicUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size
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
      
      const localUrl = await downloadImageFromUrl(url, validImageType as any, imageName);
      
      res.json({
        success: true,
        imageUrl: localUrl,
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
  registerAuthRoutes(app);

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
  app.post("/api/trips", requireAuth, requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      const trip = await tripStorage.createTrip(req.body);
      res.status(201).json(trip);
    } catch (error) {
      console.error('Error creating trip:', error);
      res.status(500).json({ error: 'Failed to create trip' });
    }
  });

  // Update trip (protected route)
  app.put("/api/trips/:id", requireAuth, requireContentEditor, async (req: AuthenticatedRequest, res) => {
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
  app.post("/api/cruises/:cruiseId/events", requireAuth, requireContentEditor, async (req: AuthenticatedRequest, res) => {
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
  app.put("/api/events/:id", requireAuth, requireContentEditor, async (req: AuthenticatedRequest, res) => {
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
  
  // Get all talent with search and filtering
  app.get("/api/talent", async (req, res) => {
    try {
      const search = req.query.search as string;
      const performanceType = req.query.type as string;
      
      // Use enhanced talent storage with search and filtering
      const talent = await talentStorage.searchTalent(search, performanceType);
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

      const [itinerary, events, talent] = await Promise.all([
        itineraryStorage.getItineraryByCruise(trip.id),
        eventStorage.getEventsByCruise(trip.id),
        talentStorage.getTalentByCruise(trip.id)
      ]);

      res.json({
        trip,
        itinerary,
        events,
        talent
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

  const httpServer = createServer(app);

  return httpServer;
}