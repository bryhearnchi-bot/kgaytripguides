/**
 * Admin User Management Routes - Using Profiles Table
 *
 * Provides comprehensive user management functionality for administrators using Supabase Auth.
 * Features:
 * - List all users with filtering and search
 * - Create new users with email invitations
 * - Update user information and roles
 * - Toggle user active/inactive status
 * - Delete users with proper cleanup
 * - Role-based access control
 */

import type { Express } from "express";
import { requireAuth, requireTripAdmin, type AuthenticatedRequest } from "../auth";
import { createClient } from '@supabase/supabase-js';
import { db } from "../storage";
import { profiles } from "../../shared/schema";
import { eq, ilike, or, count } from "drizzle-orm";
import { z } from "zod";
import { auditLogger } from "../logging/middleware";

// Initialize Supabase Admin Client (only if credentials are available)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Log environment check for debugging
if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️  Supabase credentials not found. Admin user management features will be limited.');
  console.warn('    Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
}

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

// Validation schemas
const createUserSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  email: z.string().email(),
  full_name: z.string().optional(),
  role: z.enum(['admin', 'content_manager', 'viewer']),
  password: z.string().min(8),
  is_active: z.boolean().default(true),
  account_status: z.enum(['active', 'suspended', 'pending_verification']).default('active')
});

const updateUserSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  email: z.string().email().optional(),
  full_name: z.string().optional(),
  role: z.enum(['admin', 'content_manager', 'viewer']).optional(),
  password: z.string().min(8).optional(),
  is_active: z.boolean().optional(),
  account_status: z.enum(['active', 'suspended', 'pending_verification']).optional()
});

const userStatusSchema = z.object({
  is_active: z.boolean()
});

const querySchema = z.object({
  search: z.string().optional(),
  role: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20)
});

export function registerAdminUsersRoutes(app: Express) {

  // GET /api/admin/users - List all users with filtering
  app.get("/api/admin/users", requireTripAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const query = querySchema.parse(req.query);

      // Build query conditions
      let conditions = [];

      if (query.search) {
        conditions.push(
          or(
            ilike(profiles.username, `%${query.search}%`),
            ilike(profiles.email, `%${query.search}%`),
            ilike(profiles.fullName, `%${query.search}%`)
          )
        );
      }

      if (query.role) {
        conditions.push(eq(profiles.role, query.role));
      }

      if (query.status) {
        conditions.push(eq(profiles.isActive, query.status === 'active'));
      }

      // Get total count for pagination
      const totalQuery = db.select({ count: count() }).from(profiles);
      if (conditions.length > 0) {
        conditions.forEach(condition => totalQuery.where(condition));
      }
      const [{ count: total }] = await totalQuery;

      // Get users with pagination
      const offset = (query.page - 1) * query.limit;
      let usersQuery = db
        .select({
          id: profiles.id,
          username: profiles.username,
          email: profiles.email,
          full_name: profiles.fullName,
          role: profiles.role,
          is_active: profiles.isActive,
          account_status: profiles.accountStatus,
          created_at: profiles.createdAt,
          updated_at: profiles.updatedAt,
          last_sign_in_at: profiles.lastSignInAt
        })
        .from(profiles)
        .limit(query.limit)
        .offset(offset)
        .orderBy(profiles.createdAt);

      if (conditions.length > 0) {
        conditions.forEach(condition => usersQuery.where(condition));
      }

      const usersList = await usersQuery;

      res.json({
        users: usersList,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          pages: Math.ceil(total / query.limit)
        }
      });

    } catch (error) {
      console.error('Error fetching users:', error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid query parameters',
          details: error.errors
        });
      }

      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  // POST /api/admin/users - Create new user
  app.post("/api/admin/users", requireTripAdmin, auditLogger('admin.user.create'), async (req: AuthenticatedRequest, res) => {
    try {
      console.log('[User Creation] Received request body:', {
        ...req.body,
        password: req.body.password ? '***' : undefined
      });

      const userData = createUserSchema.parse(req.body);
      console.log('[User Creation] Validated user data:', {
        ...userData,
        password: '***'
      });

      // Check if user already exists by email
      console.log('[User Creation] Checking for existing user with email:', userData.email);
      const existingUser = await db
        .select()
        .from(profiles)
        .where(eq(profiles.email, userData.email))
        .limit(1);

      if (existingUser.length > 0) {
        console.log('[User Creation] User already exists with email:', userData.email);
        return res.status(409).json({
          error: 'User already exists with this email'
        });
      }

      // Create user in Supabase Auth (if available)
      if (!supabaseAdmin) {
        console.log('[User Creation] Supabase Admin client not configured');
        return res.status(503).json({
          error: 'User management service is not configured. Please set up Supabase credentials.'
        });
      }

      console.log('[User Creation] Creating user in Supabase Auth...');
      console.log('[User Creation] Supabase Admin initialized:', !!supabaseAdmin);
      console.log('[User Creation] Auth admin available:', !!supabaseAdmin.auth.admin);

      const createUserParams = {
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          username: userData.username || undefined,
          full_name: userData.full_name || undefined,
          role: userData.role
        }
      };

      console.log('[User Creation] Parameters:', {
        ...createUserParams,
        password: '***'
      });

      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser(createUserParams);

      if (authError) {
        console.error('[User Creation] Supabase Auth error:', authError);
        console.error('[User Creation] Error details:', {
          code: authError.code,
          status: authError.status,
          message: authError.message
        });
        return res.status(400).json({
          error: 'Failed to create user account',
          details: authError.message
        });
      }

      if (!authUser.user) {
        return res.status(400).json({ error: 'Failed to create user account' });
      }

      // The trigger should have created the profile, now let's fetch it
      // Wait a moment for the trigger to complete
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get the created profile
      const profileResult = await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, authUser.user.id))
        .limit(1);

      if (profileResult.length === 0) {
        console.error('[User Creation] Profile not found after auth user creation');
        return res.status(500).json({
          error: 'Failed to create user profile',
          details: 'Profile record was not created by database trigger'
        });
      }

      const newUser = profileResult[0];

      res.status(201).json({
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          full_name: newUser.fullName,
          role: newUser.role,
          is_active: newUser.isActive,
          account_status: newUser.accountStatus,
          created_at: newUser.createdAt,
          updated_at: newUser.updatedAt,
          last_sign_in_at: newUser.lastSignInAt
        }
      });

    } catch (error) {
      console.error('Error creating user:', error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid user data',
          details: error.errors
        });
      }

      res.status(500).json({ error: 'Failed to create user' });
    }
  });

  // PUT /api/admin/users/:id - Update user
  app.put("/api/admin/users/:id", requireTripAdmin, auditLogger('admin.user.update'), async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.params.id;
      const userData = updateUserSchema.parse(req.body);

      // Check if user exists
      const existingUser = await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, userId))
        .limit(1);

      if (existingUser.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check for email conflicts
      if (userData.email) {
        const conflicts = await db
          .select()
          .from(profiles)
          .where(eq(profiles.email, userData.email))
          .limit(1);

        if (conflicts.length > 0 && conflicts[0].id !== userId) {
          return res.status(409).json({
            error: 'Email already taken by another user'
          });
        }
      }

      // Update user in Supabase Auth if email or password changed
      if (userData.email || userData.password) {
        const updateData: any = {};
        if (userData.email) updateData.email = userData.email;
        if (userData.password) updateData.password = userData.password;

        updateData.user_metadata = {
          username: userData.username || existingUser[0].username,
          full_name: userData.full_name || existingUser[0].fullName,
          role: userData.role || existingUser[0].role
        };

        if (!supabaseAdmin) {
          return res.status(503).json({
            error: 'User management service is not configured. Please set up Supabase credentials.'
          });
        }

        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          updateData
        );

        if (authError) {
          console.error('Supabase Auth update error:', authError);
          return res.status(400).json({
            error: 'Failed to update user account',
            details: authError.message
          });
        }
      }

      // Update user in profiles table
      const updateFields: any = { updatedAt: new Date() };
      if (userData.username !== undefined) updateFields.username = userData.username;
      if (userData.email !== undefined) updateFields.email = userData.email;
      if (userData.full_name !== undefined) updateFields.fullName = userData.full_name;
      if (userData.role !== undefined) updateFields.role = userData.role;
      if (userData.is_active !== undefined) updateFields.isActive = userData.is_active;
      if (userData.account_status !== undefined) updateFields.accountStatus = userData.account_status;

      const [updatedUser] = await db
        .update(profiles)
        .set(updateFields)
        .where(eq(profiles.id, userId))
        .returning();

      res.json({
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          full_name: updatedUser.fullName,
          role: updatedUser.role,
          is_active: updatedUser.isActive,
          account_status: updatedUser.accountStatus,
          created_at: updatedUser.createdAt,
          updated_at: updatedUser.updatedAt,
          last_sign_in_at: updatedUser.lastSignInAt
        }
      });

    } catch (error) {
      console.error('Error updating user:', error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid user data',
          details: error.errors
        });
      }

      res.status(500).json({ error: 'Failed to update user' });
    }
  });

  // PATCH /api/admin/users/:id/status - Toggle user status
  app.patch("/api/admin/users/:id/status", requireTripAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.params.id;
      const { is_active } = userStatusSchema.parse(req.body);

      // Check if user exists
      const existingUser = await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, userId))
        .limit(1);

      if (existingUser.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Prevent self-deactivation
      if (req.user?.id === userId && !is_active) {
        return res.status(403).json({
          error: 'Cannot deactivate your own account'
        });
      }

      // Update user status
      const [updatedUser] = await db
        .update(profiles)
        .set({
          isActive: is_active,
          updatedAt: new Date()
        })
        .where(eq(profiles.id, userId))
        .returning();

      res.json({
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          full_name: updatedUser.fullName,
          role: updatedUser.role,
          is_active: updatedUser.isActive,
          account_status: updatedUser.accountStatus,
          created_at: updatedUser.createdAt,
          updated_at: updatedUser.updatedAt,
          last_sign_in_at: updatedUser.lastSignInAt
        }
      });

    } catch (error) {
      console.error('Error updating user status:', error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid status data',
          details: error.errors
        });
      }

      res.status(500).json({ error: 'Failed to update user status' });
    }
  });

  // DELETE /api/admin/users/:id - Delete user
  app.delete("/api/admin/users/:id", requireTripAdmin, auditLogger('admin.user.delete'), async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.params.id;

      // Check if user exists
      const existingUser = await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, userId))
        .limit(1);

      if (existingUser.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Prevent self-deletion
      if (req.user?.id === userId) {
        return res.status(403).json({
          error: 'Cannot delete your own account'
        });
      }

      // Delete user from Supabase Auth (this will cascade to profiles via trigger)
      if (!supabaseAdmin) {
        return res.status(503).json({
          error: 'User management service is not configured. Please set up Supabase credentials.'
        });
      }

      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (authError) {
        console.error('Supabase Auth delete error:', authError);
        return res.status(400).json({
          error: 'Failed to delete user account',
          details: authError.message
        });
      }

      res.json({ message: 'User deleted successfully' });

    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  });

  console.log('✅ Admin user management routes registered (using profiles table)');
}