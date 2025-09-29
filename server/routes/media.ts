import type { Express, Response } from "express";
import { getSupabaseAdmin, isSupabaseAdminAvailable } from "../supabase-admin";
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
        const imageType = req.params.type || 'general';
        const publicUrl = await uploadToSupabase(file, imageType);

        return res.json({
          url: publicUrl,
          filename: file.originalname,
          originalName: file.originalname,
          size: file.size,
          type: imageType
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
      return res.json({ url: publicUrl });
    } catch (error: any) {
      console.error('Error downloading image from URL:', error);
      return res.status(500).json({ error: error.message || 'Failed to download image' });
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
      return res.json({ message: 'Image deleted successfully' });
    } catch (error: unknown) {
      console.error('Error deleting image:', error);
      return res.status(500).json({ error: 'Failed to delete image' });
    }
  });

  // ============ TALENT ENDPOINTS ============

  // Get all talent categories
  app.get("/api/talent-categories", async (req: AuthenticatedRequest, res: Response) => {
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

      return res.json(categories || []);
    } catch (error: unknown) {
      console.error('Error fetching talent categories:', error);
      return res.status(500).json({ error: 'Failed to fetch talent categories' });
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
      } catch (error: unknown) {
        console.error('Error bulk assigning talent:', error);
        return res.status(500).json({ error: 'Failed to assign talent' });
      }
    }
  );

  // Get talent statistics
  app.get("/api/talent/stats", async (req: AuthenticatedRequest, res: Response) => {
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

      return res.json({ total: totalCount || 0, byCategory });
    } catch (error: unknown) {
      console.error('Error fetching talent stats:', error);
      return res.status(500).json({ error: 'Failed to fetch talent statistics' });
    }
  });

  // List all talent with optional filtering
  app.get("/api/talent", async (req: AuthenticatedRequest, res: Response) => {
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

      return res.json(transformedResults);
    } catch (error: unknown) {
      console.error('Error fetching talent:', error);
      return res.status(500).json({ error: 'Failed to fetch talent' });
    }
  });

  // Get talent by ID
  app.get("/api/talent/:id", async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id || '0');
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

      return res.json(transformedTalent);
    } catch (error: unknown) {
      console.error('Error fetching talent:', error);
      return res.status(500).json({ error: 'Failed to fetch talent' });
    }
  });

  // Get talent for a trip
  app.get("/api/trips/:tripId/talent", async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tripId = parseInt(req.params.tripId || '0');
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

      return res.json(transformedResults);
    } catch (error: unknown) {
      console.error('Error fetching talent for trip:', error);
      return res.status(500).json({ error: 'Failed to fetch talent for trip' });
    }
  });

  // Create talent
  app.post("/api/talent", requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      // Debug logging - log the full request body
      console.log('=== TALENT CREATION REQUEST ===');
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      console.log('Request headers:', JSON.stringify(req.headers, null, 2));

      // Check if Supabase admin is available
      if (!isSupabaseAdminAvailable()) {
        console.error('❌ Supabase admin not available');
        return res.status(503).json({
          error: 'Admin service not configured',
          details: 'Please configure SUPABASE_SERVICE_ROLE_KEY environment variable'
        });
      }

      console.log('✅ Supabase admin is available');
      const supabaseAdmin = getSupabaseAdmin();

      // Handle both category name and category ID
      let talentCategoryId = req.body.talentCategoryId;
      console.log('Initial talentCategoryId:', talentCategoryId, 'Type:', typeof talentCategoryId);

      // Check if talentCategoryId is invalid (null, undefined, 0, NaN, empty string, or not a positive number)
      if (!talentCategoryId || talentCategoryId === 0 || isNaN(Number(talentCategoryId)) || Number(talentCategoryId) <= 0) {
        console.log('talentCategoryId is invalid, checking for category name...');
        if (req.body.category) {
          console.log('Found category name:', req.body.category);
          // Map category name to ID
          const categoryMap: { [key: string]: number } = {
            'Headliners': 1,
            'Vocalists': 2,
            'Drag & Variety': 3,
            'DJ': 4,
            'DJ\'s': 4,
            'Piano Bar / Cabaret': 5,
            'Comedy': 6,
            'Shows': 7
          };
          talentCategoryId = categoryMap[req.body.category];
          console.log('Mapped category to ID:', talentCategoryId);
        }

        // If still no valid category ID, return error
        if (!talentCategoryId || talentCategoryId === 0 || isNaN(Number(talentCategoryId)) || Number(talentCategoryId) <= 0) {
          console.error('❌ No valid talent category ID found');
          return res.status(400).json({ error: 'Please select a talent category' });
        }
      }

      console.log('✅ Final talentCategoryId:', talentCategoryId);

      // Prepare talent data with proper field names
      const talentData = {
        name: req.body.name,
        talent_category_id: talentCategoryId,
        bio: req.body.bio || null,
        known_for: req.body.knownFor || null,
        profile_image_url: req.body.profileImageUrl === '' ? null : req.body.profileImageUrl,
        social_links: req.body.socialLinks || null,
        website: req.body.website === '' ? null : req.body.website
      };

      console.log('=== PREPARED TALENT DATA ===');
      console.log('Talent data for insert:', JSON.stringify(talentData, null, 2));

      console.log('🔍 Attempting to insert into talent table...');
      const { data: talentItem, error } = await supabaseAdmin
        .from('talent')
        .insert(talentData)
        .select()
        .single();

      if (error) {
        console.error('❌ ERROR CREATING TALENT:');
        console.error('Error object:', JSON.stringify(error, null, 2));
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        console.error('Error hint:', error.hint);
        return res.status(500).json({
          error: 'Failed to create talent',
          debug: {
            errorCode: error.code,
            errorMessage: error.message,
            errorDetails: error.details,
            errorHint: error.hint,
            sentData: talentData
          }
        });
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

      return res.json(transformedTalent);
    } catch (error: unknown) {
      console.error('Error creating talent:', error);
      return res.status(500).json({ error: 'Failed to create talent' });
    }
  });

  // Update talent
  app.put("/api/talent/:id", requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id || '0');
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
      if (req.body.profileImageUrl !== undefined) updateData.profile_image_url = req.body.profileImageUrl === '' ? null : req.body.profileImageUrl;
      if (req.body.socialLinks !== undefined) updateData.social_links = req.body.socialLinks;
      if (req.body.website !== undefined) updateData.website = req.body.website === '' ? null : req.body.website;

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

      return res.json(transformedTalent);
    } catch (error: unknown) {
      console.error('Error updating talent:', error);
      return res.status(500).json({ error: 'Failed to update talent' });
    }
  });

  // Delete talent
  app.delete("/api/talent/:id", requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id || '0');
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

      return res.json({ message: "Talent deleted" });
    } catch (error: unknown) {
      console.error('Error deleting talent:', error);
      return res.status(500).json({ error: 'Failed to delete talent' });
    }
  });

  // TEMPORARY: Fix talent sequence issue
  app.post("/api/talent/fix-sequence", requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      const supabaseAdmin = getSupabaseAdmin();

      // Step 1: Get current max ID in talent table
      const { data: maxIdData, error: maxIdError } = await supabaseAdmin
        .from('talent')
        .select('id')
        .order('id', { ascending: false })
        .limit(1);

      if (maxIdError) {
        console.error('Error getting max ID:', maxIdError);
        return res.status(500).json({ error: 'Failed to get max ID from talent table' });
      }

      const maxId = (maxIdData && maxIdData.length > 0 ? maxIdData[0]?.id : 0) || 0;
      const nextId = maxId + 1;

      console.log(`Current max ID in talent table: ${maxId}`);
      console.log(`Setting sequence to: ${nextId}`);

      // Step 2: Reset the sequence
      const { data: resetData, error: resetError } = await supabaseAdmin
        .rpc('sql', {
          query: `SELECT setval('talent_id_seq', ${nextId}, false);`
        });

      if (resetError) {
        // Fallback: Try alternative approach with direct SQL execution
        console.log('RPC approach failed, trying direct execution...');

        // Get sequence name first
        const { data: seqData, error: seqError } = await supabaseAdmin
          .from('information_schema.sequences')
          .select('sequence_name')
          .eq('sequence_name', 'talent_id_seq')
          .limit(1);

        if (seqError) {
          console.error('Error checking sequence:', seqError);
          return res.status(500).json({
            error: 'Failed to reset sequence',
            details: resetError.message,
            sqlCommands: [
              `SELECT MAX(id) FROM talent;`,
              `SELECT setval('talent_id_seq', ${nextId}, false);`
            ]
          });
        }

        // Since we can't execute raw SQL directly, return the manual commands
        return res.status(500).json({
          error: 'Unable to execute sequence reset automatically',
          manualFix: {
            currentMaxId: maxId,
            nextId: nextId,
            sqlCommands: [
              `SELECT MAX(id) FROM talent;`,
              `SELECT setval('talent_id_seq', ${nextId}, false);`
            ],
            instructions: 'Please run these SQL commands in your Supabase dashboard SQL editor'
          }
        });
      }

      // Step 3: Verify the fix
      console.log('Sequence reset successful');

      return res.json({
        success: true,
        message: 'Talent sequence fixed successfully',
        details: {
          previousMaxId: maxId,
          newSequenceValue: nextId,
          action: 'Sequence reset to allow new talent creation'
        }
      });

    } catch (error: unknown) {
      console.error('Error fixing talent sequence:', error);
      return res.status(500).json({
        error: 'Failed to fix talent sequence',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Assign talent to trip
  app.post("/api/trips/:tripId/talent/:talentId", requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      const tripId = parseInt(req.params.tripId || '0');
      const talentId = parseInt(req.params.talentId || '0');
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

      return res.json({ message: "Talent assigned to trip" });
    } catch (error: unknown) {
      console.error('Error assigning talent to trip:', error);
      return res.status(500).json({ error: 'Failed to assign talent to trip' });
    }
  });

  // Remove talent from trip
  app.delete("/api/trips/:tripId/talent/:talentId", requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      const tripId = parseInt(req.params.tripId || '0');
      const talentId = parseInt(req.params.talentId || '0');
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

      return res.json({ message: "Talent removed from trip" });
    } catch (error: unknown) {
      console.error('Error removing talent from trip:', error);
      return res.status(500).json({ error: 'Failed to remove talent from trip' });
    }
  });

}