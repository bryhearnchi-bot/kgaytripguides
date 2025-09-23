import type { Express } from "express";
import {
  talentStorage,
  db,
  talentCategories
} from "../storage";
import { requireAuth, requireContentEditor, requireSuperAdmin, type AuthenticatedRequest } from "../auth";
import * as schema from "../../shared/schema";
import { eq, ilike, or, count, sql, asc, and } from "drizzle-orm";
import { upload, getPublicImageUrl, deleteImage, isValidImageUrl, uploadToCloudinary } from "../image-utils";
import {
  validateBody,
  validateParams,
  idParamSchema,
  createTalentSchema,
  updateTalentSchema,
  bulkTalentAssignSchema
} from "../middleware/validation";
import {
  uploadRateLimit,
  adminRateLimit,
  bulkRateLimit
} from "../middleware/rate-limiting";

export function registerMediaRoutes(app: Express) {
  // ============ IMAGE UPLOAD ENDPOINTS ============

  // Upload an image
  app.post("/api/images/upload/:type", uploadRateLimit, requireContentEditor, (req, res, next) => {
    const uploadHandler = upload.single('image');
    uploadHandler(req, res, (err: any) => {
      if (err) {
        console.error('Upload error:', err);
        return res.status(400).json({
          error: err.message || 'Failed to upload image'
        });
      }

      const file = (req as any).file;
      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const publicUrl = getPublicImageUrl(file.filename);
      res.json({
        url: publicUrl,
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        type: req.params.type
      });
    });
  });

  // Download image from URL
  app.post("/api/images/download-from-url", requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      const { url, type = 'general' } = req.body;

      if (!url || !isValidImageUrl(url)) {
        return res.status(400).json({ error: 'Invalid image URL' });
      }

      const uploadedUrl = await uploadToCloudinary(url, type);
      res.json({ url: uploadedUrl });
    } catch (error) {
      console.error('Error downloading image from URL:', error);
      res.status(500).json({ error: 'Failed to download image' });
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
        const { cruiseId, talentIds, action = 'add' } = req.body;

        if (!cruiseId || !talentIds || !Array.isArray(talentIds)) {
          return res.status(400).json({ error: 'Invalid request data' });
        }

        // This would need to be implemented based on how talent is linked to cruises
        // For now, returning a placeholder response
        res.json({
          success: true,
          message: `${action === 'add' ? 'Added' : 'Removed'} ${talentIds.length} talent to/from cruise`,
          cruiseId,
          talentIds
        });
      } catch (error) {
        console.error('Error bulk assigning talent:', error);
        res.status(500).json({ error: 'Failed to assign talent' });
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

  // Get talent for a cruise
  app.get("/api/cruises/:cruiseId/talent", async (req, res) => {
    try {
      const cruiseId = parseInt(req.params.cruiseId);
      if (isNaN(cruiseId)) {
        return res.status(400).json({ error: "Invalid cruise ID" });
      }
      const talentList = await talentStorage.getTalentByCruise(cruiseId);
      res.json(talentList);
    } catch (error) {
      console.error('Error fetching talent for cruise:', error);
      res.status(500).json({ error: 'Failed to fetch talent for cruise' });
    }
  });

  // Create talent
  app.post("/api/talent", requireContentEditor, async (req: AuthenticatedRequest, res) => {
    const talentItem = await talentStorage.createTalent(req.body);
    res.json(talentItem);
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

  // Assign talent to cruise
  app.post("/api/cruises/:cruiseId/talent/:talentId", requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      const cruiseId = parseInt(req.params.cruiseId);
      const talentId = parseInt(req.params.talentId);
      if (isNaN(cruiseId) || isNaN(talentId)) {
        return res.status(400).json({ error: "Invalid cruise or talent ID" });
      }
      await talentStorage.assignTalentToCruise(cruiseId, talentId, req.body.role);
      res.json({ message: "Talent assigned to cruise" });
    } catch (error) {
      console.error('Error assigning talent to cruise:', error);
      res.status(500).json({ error: 'Failed to assign talent to cruise' });
    }
  });

  // Remove talent from cruise
  app.delete("/api/cruises/:cruiseId/talent/:talentId", requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      const cruiseId = parseInt(req.params.cruiseId);
      const talentId = parseInt(req.params.talentId);
      if (isNaN(cruiseId) || isNaN(talentId)) {
        return res.status(400).json({ error: "Invalid cruise or talent ID" });
      }
      await talentStorage.removeTalentFromCruise(cruiseId, talentId);
      res.json({ message: "Talent removed from cruise" });
    } catch (error) {
      console.error('Error removing talent from cruise:', error);
      res.status(500).json({ error: 'Failed to remove talent from cruise' });
    }
  });

}