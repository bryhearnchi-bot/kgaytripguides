import type { Express } from "express";
import { createServer, type Server } from "http";
import { 
  storage, 
  cruiseStorage, 
  itineraryStorage, 
  eventStorage, 
  talentStorage,
  mediaStorage 
} from "./storage";
import { requireAuth, requireContentEditor, requireSuperAdmin, type AuthenticatedRequest } from "./auth";
import { registerAuthRoutes } from "./auth-routes";

export async function registerRoutes(app: Express): Promise<Server> {
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
  
  // Get all talent
  app.get("/api/talent", async (req, res) => {
    try {
      const talent = await talentStorage.getAllTalent();
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
      await talentStorage.assignTalentToCruise(
        parseInt(req.params.cruiseId),
        parseInt(req.params.talentId),
        req.body.role
      );
      res.status(201).json({ message: 'Talent assigned to cruise' });
    } catch (error) {
      console.error('Error assigning talent:', error);
      res.status(500).json({ error: 'Failed to assign talent' });
    }
  });

  // Remove talent from cruise (protected route)
  app.delete("/api/cruises/:cruiseId/talent/:talentId", requireAuth, requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      await talentStorage.removeTalentFromCruise(
        parseInt(req.params.cruiseId),
        parseInt(req.params.talentId)
      );
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

  const httpServer = createServer(app);

  return httpServer;
}