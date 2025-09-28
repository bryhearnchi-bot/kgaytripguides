import type { Express } from "express";
import { getSupabaseAdmin } from "../supabase-admin";
import { requireContentEditor, type AuthenticatedRequest } from "../auth";
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
      const supabaseAdmin = getSupabaseAdmin();
      const { data: categories, error } = await supabaseAdmin
        .from('talent_categories')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        console.error('Error fetching talent categories:', error);
        return res.status(500).json({ error: 'Failed to fetch talent categories' });
      }

      res.json(categories || []);
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
      const supabaseAdmin = getSupabaseAdmin();

      // Get total count
      const { count: totalCount, error: countError } = await supabaseAdmin
        .from('talent')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.error('Error fetching talent count:', countError);
        return res.status(500).json({ error: 'Failed to fetch talent statistics' });
      }

      // Get counts by category
      const { data: categoryStats, error: categoryError } = await supabaseAdmin
        .from('talent')
        .select(`
          talent_categories!inner(category),
          count
        `)
        .eq('count', 'exact');

      if (categoryError) {
        console.error('Error fetching category stats:', categoryError);
        return res.status(500).json({ error: 'Failed to fetch talent statistics' });
      }

      // Format category stats as object
      const byCategory: Record<string, number> = {};
      if (categoryStats) {
        for (const stat of categoryStats) {
          const categoryName = (stat as any).talent_categories?.category;
          if (categoryName) {
            byCategory[categoryName] = (byCategory[categoryName] || 0) + 1;
          }
        }
      }

      res.json({ total: totalCount || 0, byCategory });
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

      const supabaseAdmin = getSupabaseAdmin();
      let query = supabaseAdmin
        .from('talent')
        .select(`
          id,
          name,
          talent_category_id,
          bio,
          known_for,
          profile_image_url,
          social_links,
          website,
          created_at,
          updated_at,
          talent_categories(category)
        `);

      // Apply search filter
      if (search) {
        query = query.or(`name.ilike.%${search}%,bio.ilike.%${search}%`);
      }

      // Apply category filter by ID
      if (categoryId) {
        query = query.eq('talent_category_id', parseInt(categoryId as string));
      }
      // Apply category filter by name (backward compatibility)
      else if (category) {
        query = query.eq('talent_categories.category', category as string);
      }

      // Apply pagination and ordering
      const { data: results, error } = await query
        .order('name', { ascending: true })
        .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

      if (error) {
        console.error('Error fetching talent:', error);
        return res.status(500).json({ error: 'Failed to fetch talent' });
      }

      // Transform results to match expected format
      const transformedResults = (results || []).map((talent: any) => ({
        id: talent.id,
        name: talent.name,
        talentCategoryId: talent.talent_category_id,
        bio: talent.bio,
        knownFor: talent.known_for,
        profileImageUrl: talent.profile_image_url,
        socialLinks: talent.social_links,
        website: talent.website,
        createdAt: talent.created_at,
        updatedAt: talent.updated_at,
        category: talent.talent_categories?.category
      }));

      res.json(transformedResults);
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

      const supabaseAdmin = getSupabaseAdmin();
      const { data: talentItem, error } = await supabaseAdmin
        .from('talent')
        .select(`
          id,
          name,
          talent_category_id,
          bio,
          known_for,
          profile_image_url,
          social_links,
          website,
          created_at,
          updated_at,
          talent_categories(category)
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: "Talent not found" });
        }
        console.error('Error fetching talent:', error);
        return res.status(500).json({ error: 'Failed to fetch talent' });
      }

      // Transform result to match expected format
      const transformedTalent = {
        id: talentItem.id,
        name: talentItem.name,
        talentCategoryId: talentItem.talent_category_id,
        bio: talentItem.bio,
        knownFor: talentItem.known_for,
        profileImageUrl: talentItem.profile_image_url,
        socialLinks: talentItem.social_links,
        website: talentItem.website,
        createdAt: talentItem.created_at,
        updatedAt: talentItem.updated_at,
        category: (talentItem as any).talent_categories?.category
      };

      res.json(transformedTalent);
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

      const supabaseAdmin = getSupabaseAdmin();
      const { data: talentList, error } = await supabaseAdmin
        .from('talent')
        .select(`
          id,
          name,
          talent_category_id,
          bio,
          known_for,
          profile_image_url,
          social_links,
          website,
          created_at,
          updated_at,
          talent_categories(category),
          trip_talent!inner(trip_id, role)
        `)
        .eq('trip_talent.trip_id', tripId)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching talent for trip:', error);
        return res.status(500).json({ error: 'Failed to fetch talent for trip' });
      }

      // Transform results to match expected format
      const transformedResults = (talentList || []).map((talent: any) => ({
        id: talent.id,
        name: talent.name,
        talentCategoryId: talent.talent_category_id,
        bio: talent.bio,
        knownFor: talent.known_for,
        profileImageUrl: talent.profile_image_url,
        socialLinks: talent.social_links,
        website: talent.website,
        createdAt: talent.created_at,
        updatedAt: talent.updated_at,
        category: talent.talent_categories?.category,
        role: talent.trip_talent?.role
      }));

      res.json(transformedResults);
    } catch (error) {
      console.error('Error fetching talent for trip:', error);
      res.status(500).json({ error: 'Failed to fetch talent for trip' });
    }
  });

  // Create talent
  app.post("/api/talent", requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data: talentItem, error } = await supabaseAdmin
        .from('talent')
        .insert({
          name: req.body.name,
          talent_category_id: req.body.talentCategoryId,
          bio: req.body.bio,
          known_for: req.body.knownFor,
          profile_image_url: req.body.profileImageUrl,
          social_links: req.body.socialLinks,
          website: req.body.website
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating talent:', error);
        return res.status(500).json({ error: 'Failed to create talent' });
      }

      // Transform result to match expected format
      const transformedTalent = {
        id: talentItem.id,
        name: talentItem.name,
        talentCategoryId: talentItem.talent_category_id,
        bio: talentItem.bio,
        knownFor: talentItem.known_for,
        profileImageUrl: talentItem.profile_image_url,
        socialLinks: talentItem.social_links,
        website: talentItem.website,
        createdAt: talentItem.created_at,
        updatedAt: talentItem.updated_at
      };

      res.json(transformedTalent);
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

      const supabaseAdmin = getSupabaseAdmin();
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      // Map camelCase to snake_case
      if (req.body.name !== undefined) updateData.name = req.body.name;
      if (req.body.talentCategoryId !== undefined) updateData.talent_category_id = req.body.talentCategoryId;
      if (req.body.bio !== undefined) updateData.bio = req.body.bio;
      if (req.body.knownFor !== undefined) updateData.known_for = req.body.knownFor;
      if (req.body.profileImageUrl !== undefined) updateData.profile_image_url = req.body.profileImageUrl;
      if (req.body.socialLinks !== undefined) updateData.social_links = req.body.socialLinks;
      if (req.body.website !== undefined) updateData.website = req.body.website;

      const { data: talentItem, error } = await supabaseAdmin
        .from('talent')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: "Talent not found" });
        }
        console.error('Error updating talent:', error);
        return res.status(500).json({ error: 'Failed to update talent' });
      }

      // Transform result to match expected format
      const transformedTalent = {
        id: talentItem.id,
        name: talentItem.name,
        talentCategoryId: talentItem.talent_category_id,
        bio: talentItem.bio,
        knownFor: talentItem.known_for,
        profileImageUrl: talentItem.profile_image_url,
        socialLinks: talentItem.social_links,
        website: talentItem.website,
        createdAt: talentItem.created_at,
        updatedAt: talentItem.updated_at
      };

      res.json(transformedTalent);
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

      const supabaseAdmin = getSupabaseAdmin();
      const { error } = await supabaseAdmin
        .from('talent')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting talent:', error);
        return res.status(500).json({ error: 'Failed to delete talent' });
      }

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

      const supabaseAdmin = getSupabaseAdmin();
      const { error } = await supabaseAdmin
        .from('trip_talent')
        .upsert({
          trip_id: tripId,
          talent_id: talentId,
          role: req.body.role
        });

      if (error) {
        console.error('Error assigning talent to trip:', error);
        return res.status(500).json({ error: 'Failed to assign talent to trip' });
      }

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

      const supabaseAdmin = getSupabaseAdmin();
      const { error } = await supabaseAdmin
        .from('trip_talent')
        .delete()
        .eq('trip_id', tripId)
        .eq('talent_id', talentId);

      if (error) {
        console.error('Error removing talent from trip:', error);
        return res.status(500).json({ error: 'Failed to remove talent from trip' });
      }

      res.json({ message: "Talent removed from trip" });
    } catch (error) {
      console.error('Error removing talent from trip:', error);
      res.status(500).json({ error: 'Failed to remove talent from trip' });
    }
  });

}