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

import type { Express, Response } from 'express';
import {
  requireAuth,
  requireTripAdmin,
  requireSuperAdmin,
  type AuthenticatedRequest,
} from '../auth';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { auditLogger } from '../logging/middleware';
import { logger } from '../logging/logger';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiError } from '../utils/ApiError';

// Initialize Supabase Admin Client lazily (after environment variables are loaded)
let _supabaseAdmin: ReturnType<typeof createClient> | null = null;

function getSupabaseAdmin() {
  if (_supabaseAdmin === null) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      logger.error('Supabase credentials not configured', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseServiceKey,
      });
      return null;
    }

    _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return _supabaseAdmin;
}

// Helper to get supabaseAdmin or throw error
const supabaseAdmin = () => {
  const client = getSupabaseAdmin();
  if (!client) {
    throw ApiError.serviceUnavailable(
      'Database service is not configured. Please set up Supabase credentials.'
    );
  }
  return client;
};

// Validation schemas
const createUserSchema = z
  .object({
    username: z.string().min(3).max(50).optional(),
    email: z.string().email(),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    role: z.enum(['viewer', 'content_manager', 'super_admin']),
    password: z.string().min(8),
    is_active: z.boolean().optional(),
    account_status: z.enum(['active', 'suspended', 'pending_verification']).optional(),
    // Profile fields
    avatar_url: z.string().optional(),
    bio: z.string().optional(),
    website: z.string().optional(),
    phone_number: z.string().optional(),
    // Location fields (support both camelCase and snake_case)
    location_text: z.string().optional(),
    locationText: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    state_province: z.string().optional(),
    stateProvince: z.string().optional(),
    country: z.string().optional(),
    country_code: z.string().optional(),
    countryCode: z.string().optional(),
    // Social links
    instagram: z.string().optional(),
    twitter: z.string().optional(),
    facebook: z.string().optional(),
    linkedin: z.string().optional(),
    tiktok: z.string().optional(),
    // Preferences
    marketing_emails: z.boolean().optional(),
    trip_updates_opt_in: z.boolean().optional(),
    // Legacy camelCase fields for backward compatibility
    isActive: z.boolean().default(true),
    accountStatus: z.enum(['active', 'suspended', 'pending_verification']).default('active'),
  })
  .transform(data => ({
    username: data.username,
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    role: data.role,
    password: data.password === '' ? undefined : data.password,
    is_active: data.is_active ?? data.isActive,
    account_status: data.account_status ?? data.accountStatus,
    // Profile fields
    avatar_url: data.avatar_url,
    bio: data.bio,
    website: data.website,
    phone_number: data.phone_number,
    // Individual location fields (support both camelCase and snake_case)
    location_text: data.location_text || data.locationText,
    city: data.city,
    state_province: data.state_province || data.stateProvince || data.state,
    country: data.country,
    country_code: data.country_code || data.countryCode,
    // Social links - combine into JSON object
    social_links:
      data.instagram || data.twitter || data.facebook || data.linkedin || data.tiktok
        ? {
            instagram: data.instagram,
            twitter: data.twitter,
            facebook: data.facebook,
            linkedin: data.linkedin,
            tiktok: data.tiktok,
          }
        : undefined,
    // Preferences
    marketing_emails: data.marketing_emails,
    trip_updates_opt_in: data.trip_updates_opt_in,
  }));

const updateUserSchema = z
  .object({
    username: z.string().min(3).max(50).optional(),
    email: z.string().email().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    role: z.enum(['viewer', 'content_manager', 'super_admin']).optional(),
    password: z
      .string()
      .optional()
      .refine(val => !val || val.length >= 8, {
        message: 'Password must be at least 8 characters long if provided',
      }),
    is_active: z.boolean().optional(),
    account_status: z.enum(['active', 'suspended', 'pending_verification']).optional(),
    // Profile fields
    avatar_url: z.string().optional(),
    bio: z.string().optional(),
    website: z.string().optional(),
    phone_number: z.string().optional(),
    // Location fields (following locations/resorts pattern)
    location_text: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    state_province: z.string().optional(),
    country: z.string().optional(),
    country_code: z.string().optional(),
    // Social links
    instagram: z.string().optional(),
    twitter: z.string().optional(),
    facebook: z.string().optional(),
    linkedin: z.string().optional(),
    tiktok: z.string().optional(),
    // Preferences
    marketing_emails: z.boolean().optional(),
    trip_updates_opt_in: z.boolean().optional(),
    // Legacy camelCase fields for backward compatibility
    isActive: z.boolean().optional(),
    accountStatus: z.enum(['active', 'suspended', 'pending_verification']).optional(),
    // CamelCase location fields for frontend compatibility
    locationText: z.string().optional(),
    stateProvince: z.string().optional(),
    countryCode: z.string().optional(),
  })
  .transform(data => ({
    username: data.username,
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    role: data.role,
    password: data.password === '' ? undefined : data.password,
    is_active: data.is_active ?? data.isActive,
    account_status: data.account_status ?? data.accountStatus,
    // Profile fields
    avatar_url: data.avatar_url,
    bio: data.bio,
    website: data.website,
    phone_number: data.phone_number,
    // Individual location fields (support both camelCase and snake_case)
    location_text: data.location_text || data.locationText,
    city: data.city,
    state_province: data.state_province || data.stateProvince || data.state,
    country: data.country,
    country_code: data.country_code || data.countryCode,
    // Social links - combine into JSON object
    social_links:
      data.instagram || data.twitter || data.facebook || data.linkedin || data.tiktok
        ? {
            instagram: data.instagram,
            twitter: data.twitter,
            facebook: data.facebook,
            linkedin: data.linkedin,
            tiktok: data.tiktok,
          }
        : undefined,
    // Preferences
    marketing_emails: data.marketing_emails,
    trip_updates_opt_in: data.trip_updates_opt_in,
  }));

const userStatusSchema = z
  .object({
    isActive: z.boolean().optional(),
    is_active: z.boolean().optional(),
  })
  .transform(data => ({
    is_active: data.isActive ?? data.is_active,
  }));

const querySchema = z.object({
  search: z.string().optional(),
  role: z.string().optional(),
  status: z.enum(['active', 'inactive', 'all']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export function registerAdminUsersRoutes(app: Express) {
  // GET /api/admin/users - List all users with filtering (OPTIMIZED)
  app.get(
    '/api/admin/users',
    requireTripAdmin,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      logger.info('=== USERS API CALLED ===');
      logger.info('Query params:', req.query);
      const query = querySchema.parse(req.query);

      const client = getSupabaseAdmin();

      // Direct query to profiles table
      const offset = (query.page - 1) * query.limit;
      let supabaseQuery = client.from('profiles').select('*', { count: 'exact' });

      // Apply filters
      if (query.search) {
        const searchTerm = query.search.trim();
        supabaseQuery = supabaseQuery.or(
          `username.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`
        );
      }

      if (query.role && query.role !== 'all') {
        supabaseQuery = supabaseQuery.eq('role', query.role);
      }

      if (query.status && query.status !== 'all') {
        supabaseQuery = supabaseQuery.eq('is_active', query.status === 'active');
      }

      // Apply pagination
      supabaseQuery = supabaseQuery
        .range(offset, offset + query.limit - 1)
        .order('created_at', { ascending: false });

      const { data: usersList, count: total, error } = await supabaseQuery;

      if (error) {
        logger.error('Error fetching users from Supabase:', error, {
          method: req.method,
          path: req.path,
        });
        throw ApiError.internal(
          'Failed to fetch users',
          error instanceof Error ? error : undefined
        );
      }

      // Map database fields to frontend expected format
      const mappedUsers = (usersList || []).map(user => ({
        ...user,
        name: {
          first: user.name?.first || '',
          last: user.name?.last || '',
        },
      }));

      return res.json({
        users: mappedUsers,
        pagination: {
          page: query.page,
          limit: query.limit,
          total: total || 0,
          pages: Math.ceil((total || 0) / query.limit),
        },
      });
    })
  );

  // POST /api/admin/users - Create new user
  app.post(
    '/api/admin/users',
    requireTripAdmin,
    auditLogger('admin.user.create'),
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      logger.info('🔍 POST /api/admin/users - Raw request body:', req.body);
      const userData = createUserSchema.parse(req.body);
      logger.info('🔍 Parsed userData:', userData);

      // Only a super admin can create another super admin
      if (userData.role === 'super_admin' && req.user?.role !== 'super_admin') {
        throw ApiError.forbidden('Only super admin can assign super_admin role');
      }

      // Check if user already exists by email using Supabase Admin
      if (!getSupabaseAdmin()) {
        throw ApiError.serviceUnavailable(
          'User management service is not configured. Please set up Supabase credentials.'
        );
      }

      const { data: existingUser, error: checkError } = await supabaseAdmin()
        .from('profiles')
        .select('*')
        .eq('email', userData.email)
        .single();

      if (existingUser && !checkError) {
        throw ApiError.conflict('User already exists with this email');
      }

      const createUserParams = {
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          username: userData.username || undefined,
          role: userData.role,
        },
      };

      const { data: authUser, error: authError } =
        await supabaseAdmin().auth.admin.createUser(createUserParams);

      if (authError) {
        logger.error('[User Creation] Supabase Auth error:', authError, {
          method: req.method,
          path: req.path,
        });
        logger.error('[User Creation] Error details', {
          code: authError.code,
          status: authError.status,
          message: authError.message,
          method: req.method,
          path: req.path,
        });
        throw ApiError.badRequest('Failed to create user account', authError.message);
      }

      if (!authUser.user) {
        throw ApiError.badRequest('Failed to create user account');
      }

      // The trigger should have created the profile, let's wait and fetch it
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get the created profile using Supabase Admin
      const { data: newUser, error: fetchError } = await supabaseAdmin()
        .from('profiles')
        .select('*')
        .eq('id', authUser.user.id)
        .single();

      if (fetchError || !newUser) {
        logger.error('[User Creation] Profile not found after auth user creation:', fetchError, {
          method: req.method,
          path: req.path,
        });

        // If profile wasn't created by trigger, create it manually
        const profileData = {
          id: authUser.user.id,
          email: authUser.user.email,
          name:
            userData.firstName || userData.lastName
              ? {
                  first: userData.firstName || '',
                  last: userData.lastName || '',
                }
              : null,
          username: userData.username || null,
          avatar_url: userData.avatar_url || null,
          role: userData.role || 'user',
          is_active: userData.is_active !== undefined ? userData.is_active : true,
          account_status: 'active',
          bio: userData.bio || null,
          website: userData.website || null,
          phone_number: userData.phone_number || null,
          // Individual location fields (no longer use JSONB location column)
          location_text: userData.location_text || null,
          city: userData.city || null,
          state_province: userData.state_province || null,
          country: userData.country || null,
          country_code: userData.country_code || null,
          social_links: userData.social_links || null,
          marketing_emails: userData.marketing_emails || false,
          trip_updates_opt_in: userData.trip_updates_opt_in || false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        logger.info('🔍 profileData being inserted to database', { profileData });

        const { data: createdProfile, error: createError } = await supabaseAdmin()
          .from('profiles')
          .insert(profileData)
          .select()
          .single();

        if (createError) {
          logger.error('[User Creation] Failed to create profile manually:', createError, {
            method: req.method,
            path: req.path,
          });
          // Try to clean up the auth user
          await supabaseAdmin()
            .auth.admin.deleteUser(authUser.user.id)
            .catch((err: any) =>
              logger.error('Failed to clean up auth user', err, {
                userId: authUser.user.id,
                method: req.method,
                path: req.path,
              })
            );
          throw ApiError.internal('Failed to create user profile');
        }

        return res.status(201).json({
          user: createdProfile,
        });
      }

      // Update the profile with all the additional fields
      const updateFields = {
        updated_at: new Date().toISOString(),
        name:
          userData.firstName || userData.lastName
            ? {
                first: userData.firstName || '',
                last: userData.lastName || '',
              }
            : null,
        username: userData.username || null,
        avatar_url: userData.avatar_url || null,
        role: userData.role || 'viewer',
        is_active: userData.is_active !== undefined ? userData.is_active : true,
        account_status: userData.account_status || 'active',
        bio: userData.bio || null,
        website: userData.website || null,
        phone_number: userData.phone_number || null,
        // Individual location fields (no longer use JSONB location column)
        location_text: userData.location_text || null,
        city: userData.city || null,
        state_province: userData.state_province || null,
        country: userData.country || null,
        country_code: userData.country_code || null,
        social_links: userData.social_links || null,
        marketing_emails: userData.marketing_emails || false,
        trip_updates_opt_in: userData.trip_updates_opt_in || false,
      };

      logger.info('🔍 Updating profile with additional fields', { updateFields });

      const { data: updatedUser, error: updateError } = await supabaseAdmin()
        .from('profiles')
        .update(updateFields)
        .eq('id', authUser.user.id)
        .select()
        .single();

      if (updateError) {
        logger.error(
          '[User Creation] Failed to update profile with additional fields:',
          updateError,
          {
            method: req.method,
            path: req.path,
          }
        );
        // Don't fail the entire creation, just return the basic profile
        return res.status(201).json({
          user: newUser,
        });
      }

      // Return the updated user data
      return res.status(201).json({
        user: updatedUser,
      });
    })
  );

  // PUT /api/admin/users/:id - Update user
  app.put(
    '/api/admin/users/:id',
    requireTripAdmin,
    auditLogger('admin.user.update'),
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.params.id;
      logger.info('🔍 PUT /api/admin/users/:id - Raw request body:', req.body);
      const userData = updateUserSchema.parse(req.body);
      logger.info('🔍 Parsed userData:', userData);

      // Check if user exists using Supabase Admin
      if (!getSupabaseAdmin()) {
        throw ApiError.serviceUnavailable(
          'User management service is not configured. Please set up Supabase credentials.'
        );
      }

      const { data: existingUser, error: fetchError } = await supabaseAdmin()
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError || !existingUser) {
        throw ApiError.notFound('User not found');
      }

      // Check for email conflicts using Supabase Admin
      if (userData.email && userData.email !== existingUser.email) {
        const { data: conflicts } = await supabaseAdmin()
          .from('profiles')
          .select('id')
          .eq('email', userData.email)
          .single();

        if (conflicts && conflicts.id !== userId) {
          throw ApiError.conflict('Email already taken by another user');
        }
      }

      // If attempting to set role to super_admin, require requester to be super_admin
      if (userData.role === 'super_admin' && req.user?.role !== 'super_admin') {
        throw ApiError.forbidden('Only super admin can assign super_admin role');
      }

      // If target is currently super_admin, only super_admin may modify
      if (existingUser.role === 'super_admin' && req.user?.role !== 'super_admin') {
        throw ApiError.forbidden('Only super admin can modify a super_admin account');
      }

      // Update user in Supabase Auth if email or password changed
      if (userData.email || userData.password) {
        const updateData: Record<string, unknown> = {};
        if (userData.email) updateData.email = userData.email;
        if (userData.password) updateData.password = userData.password;

        updateData.user_metadata = {
          username: userData.username || existingUser.username,
          role: userData.role || existingUser.role,
        };

        const { error: authError } = await supabaseAdmin().auth.admin.updateUserById(
          userId!,
          updateData
        );

        if (authError) {
          logger.error('Supabase Auth update error:', authError, {
            method: req.method,
            path: req.path,
          });
          throw ApiError.badRequest('Failed to update user account', authError.message);
        }
      }

      // Update user in profiles table using Supabase Admin to bypass RLS
      const updateFields: Record<string, unknown> = { updated_at: new Date().toISOString() };

      // Map fields to database column names (snake_case)
      if (userData.username !== undefined) updateFields.username = userData.username;
      if (userData.email !== undefined) updateFields.email = userData.email;
      if (userData.role !== undefined) updateFields.role = userData.role;
      if (userData.is_active !== undefined) updateFields.is_active = userData.is_active;
      if (userData.account_status !== undefined)
        updateFields.account_status = userData.account_status;

      // Handle name fields - construct name object from firstName/lastName
      if (userData.firstName !== undefined || userData.lastName !== undefined) {
        const nameObj: Record<string, string> = {};
        if (userData.firstName !== undefined) nameObj.first = userData.firstName;
        if (userData.lastName !== undefined) nameObj.last = userData.lastName;
        updateFields.name = nameObj;
      }

      // Profile fields
      if (userData.avatar_url !== undefined) updateFields.avatar_url = userData.avatar_url;
      if (userData.bio !== undefined) updateFields.bio = userData.bio;
      if (userData.website !== undefined) updateFields.website = userData.website;
      if (userData.phone_number !== undefined) updateFields.phone_number = userData.phone_number;

      // Location fields (individual fields only)
      if (userData.location_text !== undefined) updateFields.location_text = userData.location_text;
      if (userData.city !== undefined) updateFields.city = userData.city;
      if (userData.state_province !== undefined)
        updateFields.state_province = userData.state_province;
      if (userData.country !== undefined) updateFields.country = userData.country;
      if (userData.country_code !== undefined) updateFields.country_code = userData.country_code;

      // Social links
      if (userData.social_links !== undefined) updateFields.social_links = userData.social_links;

      // Preferences
      if (userData.marketing_emails !== undefined)
        updateFields.marketing_emails = userData.marketing_emails;
      if (userData.trip_updates_opt_in !== undefined)
        updateFields.trip_updates_opt_in = userData.trip_updates_opt_in;

      logger.info('🔍 updateFields being sent to database:', updateFields);

      const { data: updatedUser, error: updateError } = await supabaseAdmin()
        .from('profiles')
        .update(updateFields)
        .eq('id', userId)
        .select()
        .single();

      if (updateError || !updatedUser) {
        logger.error('Profile update error:', updateError, {
          method: req.method,
          path: req.path,
        });
        throw ApiError.internal('Failed to update user profile');
      }

      // Return the user data directly from Supabase (already in snake_case)
      return res.json({
        user: updatedUser,
      });
    })
  );

  // PATCH /api/admin/users/:id/status - Toggle user status
  app.patch(
    '/api/admin/users/:id/status',
    requireTripAdmin,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.params.id;
      const { is_active } = userStatusSchema.parse(req.body);

      // Check if user exists using Supabase Admin
      if (!getSupabaseAdmin()) {
        throw ApiError.serviceUnavailable(
          'User management service is not configured. Please set up Supabase credentials.'
        );
      }

      const { data: existingUser, error: fetchError } = await supabaseAdmin()
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError || !existingUser) {
        throw ApiError.notFound('User not found');
      }

      // Prevent self-deactivation
      if (req.user?.id === userId && !is_active) {
        throw ApiError.forbidden('Cannot deactivate your own account');
      }

      // Update user status using Supabase Admin
      const { data: updatedUser, error: updateError } = await supabaseAdmin()
        .from('profiles')
        .update({
          is_active: is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (updateError || !updatedUser) {
        throw ApiError.internal('Failed to update user status');
      }

      return res.json({
        user: updatedUser,
      });
    })
  );

  // DELETE /api/admin/users/:id - Delete user (super admin)
  app.delete(
    '/api/admin/users/:id',
    requireSuperAdmin,
    auditLogger('admin.user.delete'),
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.params.id;

      // Check if user exists using Supabase Admin
      if (!getSupabaseAdmin()) {
        throw ApiError.serviceUnavailable(
          'User management service is not configured. Please set up Supabase credentials.'
        );
      }

      const { data: existingUser, error: fetchError } = await supabaseAdmin()
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError || !existingUser) {
        throw ApiError.notFound('User not found');
      }

      // Prevent self-deletion
      if (req.user?.id === userId) {
        throw ApiError.forbidden('Cannot delete your own account');
      }

      // Delete user from Supabase Auth (this will cascade to profiles via trigger)
      const { error: authError } = await supabaseAdmin().auth.admin.deleteUser(userId!);
      if (authError) {
        logger.error('Supabase Auth delete error:', authError, {
          method: req.method,
          path: req.path,
        });
        throw ApiError.badRequest('Failed to delete user account', authError.message);
      }

      return res.json({ message: 'User deleted successfully' });
    })
  );

  // GET /api/admin/profile - Get current user's profile
  app.get(
    '/api/admin/profile',
    requireAuth,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      if (!getSupabaseAdmin()) {
        throw ApiError.serviceUnavailable('User management service is not configured');
      }

      const userId = req.user?.id;
      if (!userId) {
        throw ApiError.unauthorized('User not authenticated');
      }

      // Fetch user profile from Supabase
      const { data: profile, error } = await supabaseAdmin()
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        logger.error('Error fetching profile:', error, {
          method: req.method,
          path: req.path,
        });
        throw ApiError.internal('Failed to fetch profile');
      }

      if (!profile) {
        throw ApiError.notFound('Profile not found');
      }

      logger.debug('🔍 Raw profile from database', {
        city: profile.city,
        state_province: profile.state_province,
        country: profile.country,
        country_code: profile.country_code,
        location_text: profile.location_text,
      });

      // Transform snake_case to camelCase for frontend
      const transformedProfile = {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        username: profile.username,
        avatarUrl: profile.avatar_url,
        role: profile.role,
        bio: profile.bio,
        website: profile.website,
        phoneNumber: profile.phone_number,
        // Individual location fields (no longer use JSONB location column)
        locationText: profile.location_text,
        city: profile.city,
        stateProvince: profile.state_province,
        country: profile.country,
        countryCode: profile.country_code,
        socialLinks: profile.social_links,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
      };

      return res.json(transformedProfile);
    })
  );

  // PUT /api/admin/profile - Update current user's profile
  app.put(
    '/api/admin/profile',
    requireAuth,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      if (!getSupabaseAdmin()) {
        throw ApiError.serviceUnavailable('User management service is not configured');
      }

      const userId = req.user?.id;
      if (!userId) {
        throw ApiError.unauthorized('User not authenticated');
      }

      logger.info('🔍 PUT /api/admin/profile - Raw request body:', req.body);
      const userData = updateUserSchema.parse(req.body);
      logger.info('🔍 Parsed profile data:', userData);

      // Build the update fields object
      const updateFields: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      // Handle basic profile fields
      if (userData.email !== undefined) updateFields.email = userData.email;
      if (userData.username !== undefined) updateFields.username = userData.username;
      if (userData.bio !== undefined) updateFields.bio = userData.bio;
      if (userData.phone_number !== undefined) updateFields.phone_number = userData.phone_number;

      // Handle new location fields
      if (userData.location_text !== undefined) updateFields.location_text = userData.location_text;
      if (userData.city !== undefined) updateFields.city = userData.city;
      if (userData.state_province !== undefined)
        updateFields.state_province = userData.state_province;
      if (userData.country !== undefined) updateFields.country = userData.country;
      if (userData.country_code !== undefined) updateFields.country_code = userData.country_code;

      if (userData.trip_updates_opt_in !== undefined)
        updateFields.trip_updates_opt_in = userData.trip_updates_opt_in;
      if (userData.marketing_emails !== undefined)
        updateFields.marketing_emails = userData.marketing_emails;

      // Handle social links
      if (userData.social_links) {
        updateFields.social_links = userData.social_links;
      }

      logger.info('🔍 Profile updateFields being sent to database:', updateFields);

      // Update the profile in Supabase
      const { data: updatedProfile, error } = await supabaseAdmin()
        .from('profiles')
        .update(updateFields)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        logger.error('Profile update error:', error);
        throw ApiError.internal(
          'Failed to update profile',
          error instanceof Error ? error : undefined
        );
      }

      return res.json({
        success: true,
        profile: updatedProfile,
        message: 'Profile updated successfully',
      });
    })
  );
}
