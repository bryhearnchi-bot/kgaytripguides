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
import { requireAuth, requireTripAdmin, requireSuperAdmin, type AuthenticatedRequest } from "../auth";
import { createClient } from '@supabase/supabase-js';
import { db } from "../storage";
import { profiles } from "../../shared/schema";
import { eq } from "drizzle-orm";
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

// Validation schemas - accept both camelCase and snake_case
const createUserSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  email: z.string().email(),
  fullName: z.string().optional(),
  full_name: z.string().optional(),
  role: z.enum(['admin', 'content_manager', 'viewer', 'super_admin']),
  password: z.string().min(8),
  isActive: z.boolean().default(true),
  is_active: z.boolean().default(true),
  accountStatus: z.enum(['active', 'suspended', 'pending_verification']).default('active'),
  account_status: z.enum(['active', 'suspended', 'pending_verification']).default('active')
}).transform(data => ({
  username: data.username,
  email: data.email,
  full_name: data.fullName || data.full_name,
  role: data.role,
  password: data.password,
  is_active: data.isActive ?? data.is_active,
  account_status: data.accountStatus || data.account_status
}));

const updateUserSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  email: z.string().email().optional(),
  fullName: z.string().optional(),
  full_name: z.string().optional(),
  role: z.enum(['admin', 'content_manager', 'viewer', 'super_admin']).optional(),
  password: z.string().min(8).optional(),
  isActive: z.boolean().optional(),
  is_active: z.boolean().optional(),
  accountStatus: z.enum(['active', 'suspended', 'pending_verification']).optional(),
  account_status: z.enum(['active', 'suspended', 'pending_verification']).optional()
}).transform(data => ({
  username: data.username,
  email: data.email,
  full_name: data.fullName || data.full_name,
  role: data.role,
  password: data.password,
  is_active: data.isActive ?? data.is_active,
  account_status: data.accountStatus || data.account_status
}));

const userStatusSchema = z.object({
  isActive: z.boolean().optional(),
  is_active: z.boolean().optional()
}).transform(data => ({
  is_active: data.isActive ?? data.is_active
}));

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

      // Use Supabase Admin client to bypass RLS
      if (!supabaseAdmin) {
        return res.status(503).json({
          error: 'Database service is not configured. Please set up Supabase credentials.'
        });
      }

      // Build the query for Supabase
      let supabaseQuery = supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact' });

      // Apply filters
      if (query.search) {
        supabaseQuery = supabaseQuery.or(`username.ilike.%${query.search}%,email.ilike.%${query.search}%,full_name.ilike.%${query.search}%`);
      }

      if (query.role && query.role !== 'all') {
        supabaseQuery = supabaseQuery.eq('role', query.role);
      }

      if (query.status && query.status !== 'all') {
        if (query.status === 'active') {
          supabaseQuery = supabaseQuery.eq('is_active', true);
        } else if (query.status === 'inactive') {
          supabaseQuery = supabaseQuery.eq('is_active', false);
        }
      }

      // Apply pagination
      const offset = (query.page - 1) * query.limit;
      supabaseQuery = supabaseQuery
        .range(offset, offset + query.limit - 1)
        .order('created_at', { ascending: false });

      const { data: usersList, count: total, error } = await supabaseQuery;

      if (error) {
        console.error('Error fetching users from Supabase:', error);
        return res.status(500).json({
          error: 'Failed to fetch users',
          details: error.message
        });
      }

      // Data from Supabase is already in snake_case, just pass it through
      const transformedUsers = usersList || [];

      res.json({
        users: transformedUsers,
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

      // Only a super admin can create another super admin
      if (userData.role === 'super_admin' && req.user?.role !== 'super_admin') {
        return res.status(403).json({ error: 'Only super admin can assign super_admin role' });
      }
      console.log('[User Creation] Validated user data:', {
        ...userData,
        password: '***'
      });

      // Check if user already exists by email using Supabase Admin
      console.log('[User Creation] Checking for existing user with email:', userData.email);

      if (!supabaseAdmin) {
        console.log('[User Creation] Supabase Admin client not configured');
        return res.status(503).json({
          error: 'User management service is not configured. Please set up Supabase credentials.'
        });
      }

      const { data: existingUser, error: checkError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('email', userData.email)
        .single();

      if (existingUser && !checkError) {
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

      console.log('[User Creation] Auth user created successfully, ID:', authUser.user.id);

      // The trigger should have created the profile, let's wait and fetch it
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get the created profile using Supabase Admin
      const { data: newUser, error: fetchError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', authUser.user.id)
        .single();

      if (fetchError || !newUser) {
        console.error('[User Creation] Profile not found after auth user creation:', fetchError);

        // If profile wasn't created by trigger, create it manually
        console.log('[User Creation] Creating profile manually...');
        const profileData = {
          id: authUser.user.id,
          email: authUser.user.email,
          full_name: userData.full_name || null,
          username: userData.username || null,
          role: userData.role || 'user',
          is_active: true,
          account_status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data: createdProfile, error: createError } = await supabaseAdmin
          .from('profiles')
          .insert(profileData)
          .select()
          .single();

        if (createError) {
          console.error('[User Creation] Failed to create profile manually:', createError);
          // Try to clean up the auth user
          await supabaseAdmin.auth.admin.deleteUser(authUser.user.id).catch(console.error);
          return res.status(500).json({
            error: 'Failed to create user profile',
            details: createError.message
          });
        }

        console.log('[User Creation] Profile created manually');
        return res.status(201).json({
          user: createdProfile
        });
      }

      console.log('[User Creation] User created successfully with trigger');

      // Return the user data in snake_case as expected by frontend
      res.status(201).json({
        user: newUser  // Supabase already returns snake_case
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

      // Check if user exists using Supabase Admin
      if (!supabaseAdmin) {
        return res.status(503).json({
          error: 'User management service is not configured. Please set up Supabase credentials.'
        });
      }

      const { data: existingUser, error: fetchError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError || !existingUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Guard: only super admin can promote to super_admin or modify a super_admin
      if (!supabaseAdmin) {
        return res.status(503).json({ error: 'User management service is not configured. Please set up Supabase credentials.' });
      }

      // Fetch existing user (already done below), then enforce role change constraints
      // (We fetch first to know current role)
      
      // Check for email conflicts using Supabase Admin
      if (userData.email && userData.email !== existingUser.email) {
        const { data: conflicts } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('email', userData.email)
          .single();

        if (conflicts && conflicts.id !== userId) {
          return res.status(409).json({
            error: 'Email already taken by another user'
          });
        }
      }

      // If attempting to set role to super_admin, require requester to be super_admin
      if (userData.role === 'super_admin' && req.user?.role !== 'super_admin') {
        return res.status(403).json({ error: 'Only super admin can assign super_admin role' });
      }

      // If target is currently super_admin, only super_admin may modify
      if (existingUser.role === 'super_admin' && req.user?.role !== 'super_admin') {
        return res.status(403).json({ error: 'Only super admin can modify a super_admin account' });
      }

      // Update user in Supabase Auth if email or password changed
      if (userData.email || userData.password) {
        const updateData: any = {};
        if (userData.email) updateData.email = userData.email;
        if (userData.password) updateData.password = userData.password;

        updateData.user_metadata = {
          username: userData.username || existingUser.username,
          full_name: userData.full_name || existingUser.full_name,
          role: userData.role || existingUser.role
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

      // Update user in profiles table using Supabase Admin to bypass RLS
      const updateFields: any = { updated_at: new Date().toISOString() };

      // Map fields to database column names (snake_case)
      if (userData.username !== undefined) updateFields.username = userData.username;
      if (userData.email !== undefined) updateFields.email = userData.email;
      if (userData.full_name !== undefined) updateFields.full_name = userData.full_name;
      if (userData.fullName !== undefined) updateFields.full_name = userData.fullName;
      if (userData.role !== undefined) updateFields.role = userData.role;
      if (userData.is_active !== undefined) updateFields.is_active = userData.is_active;
      if (userData.isActive !== undefined) updateFields.is_active = userData.isActive;
      if (userData.account_status !== undefined) updateFields.account_status = userData.account_status;
      if (userData.accountStatus !== undefined) updateFields.account_status = userData.accountStatus;

      // Use Supabase Admin client to bypass RLS
      if (!supabaseAdmin) {
        return res.status(503).json({
          error: 'Database service is not configured. Please set up Supabase credentials.'
        });
      }

      console.log('[User Update] Updating user:', userId);
      console.log('[User Update] Update fields:', updateFields);

      const { data: updatedUser, error: updateError } = await supabaseAdmin
        .from('profiles')
        .update(updateFields)
        .eq('id', userId)
        .select()
        .single();

      console.log('[User Update] Result:', updatedUser ? 'Success' : 'Failed');
      if (updatedUser) {
        console.log('[User Update] Updated role:', updatedUser.role);
      }

      if (updateError || !updatedUser) {
        console.error('Profile update error:', updateError);
        return res.status(500).json({
          error: 'Failed to update user profile',
          details: updateError?.message
        });
      }

      // Return the user data directly from Supabase (already in snake_case)
      res.json({
        user: updatedUser
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
          fullName: updatedUser.fullName,
          role: updatedUser.role,
          isActive: updatedUser.isActive,
          accountStatus: updatedUser.accountStatus,
          createdAt: updatedUser.createdAt,
          updatedAt: updatedUser.updatedAt,
          lastSignInAt: updatedUser.lastSignInAt
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

  // DELETE /api/admin/users/:id - Delete user (super admin)
  app.delete("/api/admin/users/:id", requireSuperAdmin, auditLogger('admin.user.delete'), async (req: AuthenticatedRequest, res) => {
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