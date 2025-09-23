import type { Express } from "express";
import {
  talentStorage,
  db
} from "../storage";
import { requireContentEditor, type AuthenticatedRequest } from "../auth";
import * as schema from "../../shared/schema";
const talentCategories = schema.talentCategories;
const talent = schema.talent;
import { eq, ilike, or, count, sql, asc, and } from "drizzle-orm";
import { upload, uploadToSupabase, getPublicImageUrl, deleteImage, isValidImageUrl, downloadImageFromUrl } from "../image-utils";
import {
  validateBody,
  bulkTalentAssignSchema
} from "../middleware/validation";
import {
  uploadRateLimit,
  bulkRateLimit
} from "../middleware/rate-limiting";

export function registerMediaRoutes(app: Express) {
  // ============ IMAGE UPLOAD ENDPOINTS ============

  // Upload an image
  app.post("/api/images/upload/:type", uploadRateLimit, requireContentEditor, async (req, res, next) => {
    const uploadHandler = upload.single('image');
    uploadHandler(req, res, async (err: any) => {
      if (err) {
        return res.status(400).json({
          error: err.message || 'Failed to upload image'
        });
      }

      const file = (req as any).file;
      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      try {
        // Upload to Supabase Storage
        const publicUrl = await uploadToSupabase(file, req.params.type);

        res.json({
          url: publicUrl,
          filename: file.originalname,
          originalName: file.originalname,
          size: file.size,
          type: req.params.type
        });
      } catch (uploadError: any) {
        return res.status(500).json({
          error: uploadError.message || 'Failed to upload image to storage'
        });
      }
    });
  });

  // Download image from URL
  app.post("/api/images/download-from-url", requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      const { url, type = 'general', name = 'image' } = req.body;

      if (!url || !isValidImageUrl(url)) {
        return res.status(400).json({ error: 'Invalid image URL' });
      }

      // Download and upload to Supabase Storage
      const publicUrl = await downloadImageFromUrl(url, type, name);
      res.json({ url: publicUrl });
    } catch (error: any) {
      console.error('Error downloading image from URL:', error);
      res.status(500).json({ error: error.message || 'Failed to download image' });
    }
  });

  // Delete an image
  app.delete("/api/images", requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      const { url } = req.body;

      if (!url) {
        return res.status(400).json({ error: 'Image URL is required' });
      }

      await deleteImage(url);
      res.json({ message: 'Image deleted successfully' });
    } catch (error) {
      console.error('Error deleting image:', error);
      res.status(500).json({ error: 'Failed to delete image' });
    }
  });

  // ============ TALENT ENDPOINTS ============

  // Get all talent categories
  app.get("/api/talent-categories", async (req, res) => {
    try {
      const categories = await db.select().from(talentCategories).orderBy(asc(talentCategories.id));
      res.json(categories);
    } catch (error) {
      console.error('Error fetching talent categories:', error);
      res.status(500).json({ error: 'Failed to fetch talent categories' });
    }
  });

  // Bulk assign talent
  app.post("/api/talent/bulk-assign",
    bulkRateLimit,
    requireContentEditor,
    validateBody(bulkTalentAssignSchema),
    async (req: AuthenticatedRequest, res) => {
      try {
        const { tripId, talentIds, action = 'add' } = req.body;

        if (!tripId || !talentIds || !Array.isArray(talentIds)) {
          return res.status(400).json({ error: 'Invalid request data' });
        }

        // This would need to be implemented based on how talent is linked to trips
        // For now, returning a placeholder response
        return res.json({
          success: true,
          message: `${action === 'add' ? 'Added' : 'Removed'} ${talentIds.length} talent to/from trip`,
          tripId,
          talentIds
        });
      } catch (error) {
        console.error('Error bulk assigning talent:', error);
        return res.status(500).json({ error: 'Failed to assign talent' });
      }
    }
  );

  // Get talent statistics
  app.get("/api/talent/stats", async (req, res) => {
    try {
      const stats = await db.select({
        total: count(),
        byCategory: sql<any>`json_object_agg(tc.category, category_count) FROM (
          SELECT tc.category, COUNT(*) as category_count
          FROM ${talent} t
          LEFT JOIN ${talentCategories} tc ON t.talent_category_id = tc.id
          GROUP BY tc.category
        ) subq`
      }).from(schema.talent);

      res.json(stats[0] || { total: 0, byCategory: {} });
    } catch (error) {
      console.error('Error fetching talent stats:', error);
      res.status(500).json({ error: 'Failed to fetch talent statistics' });
    }
  });

  // List all talent with optional filtering
  app.get("/api/talent", async (req, res) => {
    try {
      const {
        search = '',
        categoryId,
        category,  // Accept category name for backward compatibility
        limit = '50',
        offset = '0'
      } = req.query;

      // Build query with joins
      let query = db.select({
        id: talent.id,
        name: talent.name,
        talentCategoryId: talent.talentCategoryId,
        bio: talent.bio,
        knownFor: talent.knownFor,
        profileImageUrl: talent.profileImageUrl,
        socialLinks: talent.socialLinks,
        website: talent.website,
        createdAt: talent.createdAt,
        updatedAt: talent.updatedAt,
        category: talentCategories.category
      })
      .from(schema.talent)
      .leftJoin(talentCategories, eq(schema.talent.talentCategoryId, talentCategories.id));

      // Apply filters
      const conditions = [];
      if (search) {
        conditions.push(
          or(
            ilike(talent.name, `%${search}%`),
            ilike(talent.bio, `%${search}%`)
          )
        );
      }

      // Handle category filter by ID
      if (categoryId) {
        conditions.push(eq(schema.talent.talentCategoryId, parseInt(categoryId as string)));
      }
      // Handle category filter by name (backward compatibility)
      else if (category) {
        conditions.push(ilike(talentCategories.category, category as string));
      }

      if (conditions.length > 0) {
        query = query.where(conditions.length === 1 ? conditions[0] : and(...conditions)) as typeof query;
      }

      // Apply pagination and ordering
      query = query.orderBy(asc(talent.name)).limit(parseInt(limit as string)).offset(parseInt(offset as string)) as typeof query;

      const results = await query;
      res.json(results);
    } catch (error) {
      console.error('Error fetching talent:', error);
      res.status(500).json({ error: 'Failed to fetch talent' });
    }
  });

  // Get talent by ID
  app.get("/api/talent/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid talent ID" });
      }
      const talentItem = await talentStorage.getTalentById(id);
      if (!talentItem) {
        return res.status(404).json({ error: "Talent not found" });
      }
      res.json(talentItem);
    } catch (error) {
      console.error('Error fetching talent:', error);
      res.status(500).json({ error: 'Failed to fetch talent' });
    }
  });

  // Get talent for a trip
  app.get("/api/trips/:tripId/talent", async (req, res) => {
    try {
      const tripId = parseInt(req.params.tripId);
      if (isNaN(tripId)) {
        return res.status(400).json({ error: "Invalid trip ID" });
      }
      const talentList = await talentStorage.getTalentByTrip(tripId);
      res.json(talentList);
    } catch (error) {
      console.error('Error fetching talent for trip:', error);
      res.status(500).json({ error: 'Failed to fetch talent for trip' });
    }
  });

  // Create talent
  app.post("/api/talent", requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      const talentItem = await talentStorage.createTalent(req.body);
      return res.json(talentItem);
    } catch (error) {
      console.error('Error creating talent:', error);
      return res.status(500).json({ error: 'Failed to create talent' });
    }
  });

  // Update talent
  app.put("/api/talent/:id", requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid talent ID" });
      }
      const talentItem = await talentStorage.updateTalent(id, req.body);
      if (!talentItem) {
        return res.status(404).json({ error: "Talent not found" });
      }
      res.json(talentItem);
    } catch (error) {
      console.error('Error updating talent:', error);
      res.status(500).json({ error: 'Failed to update talent' });
    }
  });

  // Delete talent
  app.delete("/api/talent/:id", requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid talent ID" });
      }
      await talentStorage.deleteTalent(id);
      res.json({ message: "Talent deleted" });
    } catch (error) {
      console.error('Error deleting talent:', error);
      res.status(500).json({ error: 'Failed to delete talent' });
    }
  });

  // Assign talent to trip
  app.post("/api/trips/:tripId/talent/:talentId", requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      const tripId = parseInt(req.params.tripId);
      const talentId = parseInt(req.params.talentId);
      if (isNaN(tripId) || isNaN(talentId)) {
        return res.status(400).json({ error: "Invalid trip or talent ID" });
      }
      await talentStorage.assignTalentToTrip(tripId, talentId, req.body.role);
      res.json({ message: "Talent assigned to trip" });
    } catch (error) {
      console.error('Error assigning talent to trip:', error);
      res.status(500).json({ error: 'Failed to assign talent to trip' });
    }
  });

  // Remove talent from trip
  app.delete("/api/trips/:tripId/talent/:talentId", requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      const tripId = parseInt(req.params.tripId);
      const talentId = parseInt(req.params.talentId);
      if (isNaN(tripId) || isNaN(talentId)) {
        return res.status(400).json({ error: "Invalid trip or talent ID" });
      }
      await talentStorage.removeTalentFromTrip(tripId, talentId);
      res.json({ message: "Talent removed from trip" });
    } catch (error) {
      console.error('Error removing talent from trip:', error);
      res.status(500).json({ error: 'Failed to remove talent from trip' });
    }
  });

}