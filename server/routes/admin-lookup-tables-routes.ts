/**
 * Admin Lookup Tables Management Routes
 *
 * Provides comprehensive management functionality for lookup tables used throughout the application.
 * Features:
 * - Manage venue types, trip types, trip status, talent categories, and location types
 * - List, create, and update operations (no delete for data integrity)
 * - Input validation and proper error handling
 * - Role-based access control
 */

import type { Express } from "express";
import { requireAuth, requireTripAdmin, requireSuperAdmin, type AuthenticatedRequest } from "../auth";
import { createClient } from '@supabase/supabase-js';
import { z } from "zod";
import { auditLogger } from "../logging/middleware";

// Initialize Supabase Admin Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = (supabaseUrl && supabaseServiceKey)
  ? createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  : null;

// Validation schemas for each table type
const venueTypeSchema = z.object({
  name: z.string().min(1).max(100).trim()
});

const tripTypeSchema = z.object({
  trip_type: z.string().min(1).max(100).trim()
});

const tripStatusSchema = z.object({
  status: z.string().min(1).max(100).trim()
});

const talentCategorySchema = z.object({
  category: z.string().min(1).max(100).trim()
});

const locationTypeSchema = z.object({
  type: z.string().min(1).max(100).trim()
});

const charterCompanySchema = z.object({
  name: z.string().min(1).max(100).trim()
});

// Table configuration
const TABLES = {
  'venue-types': {
    table: 'venue_types',
    schema: venueTypeSchema,
    nameField: 'name',
    displayName: 'Venue Types'
  },
  'trip-types': {
    table: 'trip_types',
    schema: tripTypeSchema,
    nameField: 'trip_type',
    displayName: 'Trip Types'
  },
  'trip-status': {
    table: 'trip_status',
    schema: tripStatusSchema,
    nameField: 'status',
    displayName: 'Trip Status'
  },
  'talent-categories': {
    table: 'talent_categories',
    schema: talentCategorySchema,
    nameField: 'category',
    displayName: 'Talent Categories'
  },
  'location-types': {
    table: 'location_types',
    schema: locationTypeSchema,
    nameField: 'type',
    displayName: 'Location Types'
  },
  'charter-companies': {
    table: 'charter_companies',
    schema: charterCompanySchema,
    nameField: 'name',
    displayName: 'Charter Companies'
  }
};

export function registerAdminLookupTablesRoutes(app: Express) {

  // GET /api/admin/lookup-tables/:table - List all items for a specific table (viewers and above can view)
  app.get("/api/admin/lookup-tables/:table", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      // Check if user has viewer role or above
      const userRole = req.user?.role;
      const allowedRoles = ['viewer', 'content_manager', 'admin', 'super_admin'];
      if (!userRole || !allowedRoles.includes(userRole)) {
        return res.status(403).json({ error: 'Insufficient permissions to view lookup tables' });
      }

      const tableKey = req.params.table as keyof typeof TABLES;
      const tableConfig = TABLES[tableKey];

      if (!tableConfig) {
        return res.status(404).json({ error: 'Invalid table type' });
      }

      if (!supabaseAdmin) {
        return res.status(503).json({
          error: 'Database service is not configured. Please set up Supabase credentials.'
        });
      }

      // Fetch all items from the table
      const { data: items, error } = await supabaseAdmin
        .from(tableConfig.table)
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        console.error(`Error fetching ${tableConfig.displayName}:`, error);
        return res.status(500).json({
          error: `Failed to fetch ${tableConfig.displayName.toLowerCase()}`,
          details: error.message
        });
      }

      res.json({
        items: items || [],
        total: items?.length || 0
      });

    } catch (error) {
      console.error('Error fetching settings items:', error);
      res.status(500).json({ error: 'Failed to fetch items' });
    }
  });

  // POST /api/admin/lookup-tables/:table - Create new item (super admin only)
  app.post("/api/admin/lookup-tables/:table", requireSuperAdmin, auditLogger('admin.lookup_tables.create'), async (req: AuthenticatedRequest, res) => {
    try {
      const tableKey = req.params.table as keyof typeof TABLES;
      const tableConfig = TABLES[tableKey];

      if (!tableConfig) {
        return res.status(404).json({ error: 'Invalid table type' });
      }

      // Validate input data
      const itemData = tableConfig.schema.parse(req.body);

      if (!supabaseAdmin) {
        return res.status(503).json({
          error: 'Database service is not configured. Please set up Supabase credentials.'
        });
      }

      // Check if item already exists (case-insensitive)
      const nameValue = itemData[tableConfig.nameField as keyof typeof itemData] as string;
      const { data: existingItem } = await supabaseAdmin
        .from(tableConfig.table)
        .select('*')
        .ilike(tableConfig.nameField, nameValue)
        .single();

      if (existingItem) {
        return res.status(409).json({
          error: `${tableConfig.displayName.slice(0, -1)} with this name already exists`
        });
      }

      // Create new item
      const insertData = {
        ...itemData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: newItem, error: createError } = await supabaseAdmin
        .from(tableConfig.table)
        .insert(insertData)
        .select()
        .single();

      if (createError) {
        console.error(`Error creating ${tableConfig.displayName.slice(0, -1)}:`, createError);
        return res.status(500).json({
          error: `Failed to create ${tableConfig.displayName.slice(0, -1).toLowerCase()}`,
          details: createError.message
        });
      }

      res.status(201).json({
        item: newItem,
        message: `${tableConfig.displayName.slice(0, -1)} created successfully`
      });

    } catch (error) {
      console.error('Error creating settings item:', error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid item data',
          details: error.errors
        });
      }

      res.status(500).json({ error: 'Failed to create item' });
    }
  });

  // PUT /api/admin/lookup-tables/:table/:id - Update existing item (super admin only)
  app.put("/api/admin/lookup-tables/:table/:id", requireSuperAdmin, auditLogger('admin.lookup_tables.update'), async (req: AuthenticatedRequest, res) => {
    try {
      const tableKey = req.params.table as keyof typeof TABLES;
      const itemId = req.params.id;
      const tableConfig = TABLES[tableKey];

      if (!tableConfig) {
        return res.status(404).json({ error: 'Invalid table type' });
      }

      // Validate input data
      const itemData = tableConfig.schema.parse(req.body);

      if (!supabaseAdmin) {
        return res.status(503).json({
          error: 'Database service is not configured. Please set up Supabase credentials.'
        });
      }

      // Check if item exists
      const { data: existingItem, error: fetchError } = await supabaseAdmin
        .from(tableConfig.table)
        .select('*')
        .eq('id', itemId)
        .single();

      if (fetchError || !existingItem) {
        return res.status(404).json({
          error: `${tableConfig.displayName.slice(0, -1)} not found`
        });
      }

      // Check for name conflicts (case-insensitive, excluding current item)
      const nameValue = itemData[tableConfig.nameField as keyof typeof itemData] as string;
      const { data: conflictingItem } = await supabaseAdmin
        .from(tableConfig.table)
        .select('*')
        .ilike(tableConfig.nameField, nameValue)
        .neq('id', itemId)
        .single();

      if (conflictingItem) {
        return res.status(409).json({
          error: `Another ${tableConfig.displayName.slice(0, -1).toLowerCase()} with this name already exists`
        });
      }

      // Update item
      const updateData = {
        ...itemData,
        updated_at: new Date().toISOString()
      };

      const { data: updatedItem, error: updateError } = await supabaseAdmin
        .from(tableConfig.table)
        .update(updateData)
        .eq('id', itemId)
        .select()
        .single();

      if (updateError) {
        console.error(`Error updating ${tableConfig.displayName.slice(0, -1)}:`, updateError);
        return res.status(500).json({
          error: `Failed to update ${tableConfig.displayName.slice(0, -1).toLowerCase()}`,
          details: updateError.message
        });
      }

      res.json({
        item: updatedItem,
        message: `${tableConfig.displayName.slice(0, -1)} updated successfully`
      });

    } catch (error) {
      console.error('Error updating settings item:', error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid item data',
          details: error.errors
        });
      }

      res.status(500).json({ error: 'Failed to update item' });
    }
  });

  // GET /api/admin/lookup-tables/counts - Get count of items in each table (viewers and above can view)
  app.get("/api/admin/lookup-tables/counts", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      // Check if user has viewer role or above
      const userRole = req.user?.role;
      const allowedRoles = ['viewer', 'content_manager', 'admin', 'super_admin'];
      if (!userRole || !allowedRoles.includes(userRole)) {
        return res.status(403).json({ error: 'Insufficient permissions to view lookup tables' });
      }

      if (!supabaseAdmin) {
        return res.status(503).json({
          error: 'Database service is not configured. Please set up Supabase credentials.'
        });
      }

      const counts: Record<string, number> = {};

      // Get counts for all tables
      for (const [key, config] of Object.entries(TABLES)) {
        const { count, error } = await supabaseAdmin
          .from(config.table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          console.error(`Error counting ${config.displayName}:`, error);
          counts[key] = 0;
        } else {
          counts[key] = count || 0;
        }
      }

      res.json(counts);

    } catch (error) {
      console.error('Error fetching counts:', error);
      res.status(500).json({ error: 'Failed to fetch counts' });
    }
  });

}