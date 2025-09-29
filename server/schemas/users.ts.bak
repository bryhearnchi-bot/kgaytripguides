/**
 * User Management Validation Schemas
 *
 * Comprehensive validation schemas for user management, authentication,
 * profile updates, and admin user operations.
 */

import { z } from 'zod';
import { emailSchema, passwordSchema, phoneSchema, uuidParamSchema, paginationSchema, searchSchema, sortingSchema } from './common';

// ============ USER ROLE & STATUS ENUMS ============

/**
 * User role enum
 */
export const userRoleEnum = z.enum(['admin', 'content_manager', 'viewer', 'super_admin']);

/**
 * Account status enum
 */
export const accountStatusEnum = z.enum(['active', 'suspended', 'pending_verification', 'deactivated', 'locked']);

/**
 * Auth provider enum
 */
export const authProviderEnum = z.enum(['email', 'google', 'facebook', 'apple', 'github']);

// ============ USER CREATION & REGISTRATION ============

/**
 * User registration schema (public signup)
 */
export const userRegistrationSchema = z.object({
  email: emailSchema,

  password: passwordSchema,

  confirmPassword: z.string(),

  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
    .trim()
    .toLowerCase()
    .optional(),

  name: z.string()
    .min(1, 'Full name is required')
    .max(255, 'Full name must be less than 255 characters')
    .trim(),

  phone: phoneSchema.optional(),

  acceptTerms: z.boolean()
    .refine(val => val === true, 'You must accept the terms and conditions'),

  marketingConsent: z.boolean().optional().default(false),

  referralCode: z.string().optional()

}).refine(
  data => data.password === data.confirmPassword,
  { message: 'Passwords do not match', path: ['confirmPassword'] }
);

/**
 * Admin user creation schema
 */
export const createUserSchema = z.object({
  email: emailSchema,

  password: passwordSchema.optional(), // Optional because admin might send invitation

  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
    .trim()
    .toLowerCase()
    .optional(),

  name: z.string()
    .min(1, 'Full name is required')
    .max(255, 'Full name must be less than 255 characters')
    .trim()
    .optional(),

  role: userRoleEnum,

  isActive: z.boolean().optional().default(true),

  accountStatus: accountStatusEnum.optional().default('active'),

  phone: phoneSchema.optional(),

  sendInvitation: z.boolean().optional().default(true),

  skipEmailVerification: z.boolean().optional().default(false),

  metadata: z.record(z.any()).optional()
});

// ============ USER UPDATE SCHEMAS ============

/**
 * Update user profile schema (self-update)
 */
export const updateProfileSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
    .trim()
    .toLowerCase()
    .optional(),

  // Structured name field
  name: z.object({
    first: z.string().max(100).optional(),
    last: z.string().max(100).optional(),
    middle: z.string().max(100).optional(),
    suffix: z.string().max(20).optional(),
    preferred: z.string().max(100).optional(),
    full: z.string().max(255).optional()
  }).optional(),

  bio: z.string()
    .max(2000, 'Bio must be less than 2000 characters')
    .optional(),

  avatarUrl: z.string()
    .url('Invalid avatar URL')
    .optional()
    .or(z.literal('')),

  phone: phoneSchema.optional().or(z.literal('')),
  phoneNumber: phoneSchema.optional().or(z.literal('')), // Alternative field name

  // Location fields following locations/resorts pattern
  locationText: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  stateProvince: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  countryCode: z.string().length(2).optional(),

  preferences: z.object({
    emailNotifications: z.boolean().optional(),
    smsNotifications: z.boolean().optional(),
    marketingEmails: z.boolean().optional(),
    language: z.string().length(2).optional(),
    timezone: z.string().optional(),
    theme: z.enum(['light', 'dark', 'auto']).optional()
  }).optional(),

  // Enhanced social links
  socialLinks: z.object({
    website: z.string().url().optional().or(z.literal('')),
    instagram: z.string().optional(),
    facebook: z.string().optional(),
    twitter: z.string().optional(),
    linkedin: z.string().optional(),
    youtube: z.string().optional(),
    tiktok: z.string().optional()
  }).optional(),

  // Communication preferences
  communicationPreferences: z.object({
    email: z.boolean().optional(),
    sms: z.boolean().optional()
  }).optional(),

  tripUpdatesOptIn: z.boolean().optional(),
  marketingEmails: z.boolean().optional()
});

/**
 * Admin update user schema
 */
export const adminUpdateUserSchema = z.object({
  email: emailSchema.optional(),

  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
    .trim()
    .toLowerCase()
    .optional(),

  name: z.string()
    .max(255, 'Full name must be less than 255 characters')
    .trim()
    .optional(),

  role: userRoleEnum.optional(),

  isActive: z.boolean().optional(),

  accountStatus: accountStatusEnum.optional(),

  phone: phoneSchema.optional().or(z.literal('')),

  emailVerified: z.boolean().optional(),

  phoneVerified: z.boolean().optional(),

  // Location fields following locations/resorts pattern
  locationText: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  stateProvince: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  countryCode: z.string().length(2).optional(),

  metadata: z.record(z.any()).optional(),

  notes: z.string().max(5000).optional()
});

// ============ PASSWORD & AUTHENTICATION SCHEMAS ============

/**
 * Change password schema (for logged-in users)
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),

  newPassword: passwordSchema,

  confirmNewPassword: z.string()

}).refine(
  data => data.newPassword === data.confirmNewPassword,
  { message: 'New passwords do not match', path: ['confirmNewPassword'] }
).refine(
  data => data.currentPassword !== data.newPassword,
  { message: 'New password must be different from current password', path: ['newPassword'] }
);

/**
 * Reset password request schema
 */
export const resetPasswordRequestSchema = z.object({
  email: emailSchema
});

/**
 * Reset password confirm schema
 */
export const resetPasswordConfirmSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),

  newPassword: passwordSchema,

  confirmPassword: z.string()

}).refine(
  data => data.newPassword === data.confirmPassword,
  { message: 'Passwords do not match', path: ['confirmPassword'] }
);

/**
 * Login schema
 */
export const loginSchema = z.object({
  email: emailSchema,

  password: z.string().min(1, 'Password is required'),

  rememberMe: z.boolean().optional().default(false),

  captchaToken: z.string().optional()
});

/**
 * OAuth login schema
 */
export const oauthLoginSchema = z.object({
  provider: authProviderEnum,

  accessToken: z.string().min(1, 'Access token is required'),

  idToken: z.string().optional(),

  refreshToken: z.string().optional(),

  expiresAt: z.string().datetime().optional()
});

/**
 * Two-factor authentication setup schema
 */
export const twoFactorSetupSchema = z.object({
  method: z.enum(['totp', 'sms', 'email']),

  phoneNumber: phoneSchema.optional()
}).refine(
  data => data.method !== 'sms' || !!data.phoneNumber,
  { message: 'Phone number is required for SMS authentication', path: ['phoneNumber'] }
);

/**
 * Two-factor authentication verify schema
 */
export const twoFactorVerifySchema = z.object({
  code: z.string()
    .length(6, 'Code must be 6 digits')
    .regex(/^\d+$/, 'Code must contain only numbers'),

  trustDevice: z.boolean().optional().default(false)
});

// ============ USER STATUS & PERMISSIONS ============

/**
 * Update user status schema
 */
export const updateUserStatusSchema = z.object({
  isActive: z.boolean().optional(),

  accountStatus: accountStatusEnum.optional(),

  reason: z.string()
    .max(500, 'Reason must be less than 500 characters')
    .optional(),

  suspendedUntil: z.string()
    .datetime()
    .optional()
    .refine(val => !val || new Date(val) > new Date(), 'Suspension end date must be in the future')
});

/**
 * User permissions update schema
 */
export const updateUserPermissionsSchema = z.object({
  permissions: z.array(z.string()).optional(),

  addPermissions: z.array(z.string()).optional(),

  removePermissions: z.array(z.string()).optional(),

  inheritFromRole: z.boolean().optional().default(true)
});

// ============ INVITATION SCHEMAS ============

/**
 * Send invitation schema
 */
export const sendInvitationSchema = z.object({
  email: emailSchema,

  role: userRoleEnum,

  personalMessage: z.string()
    .max(1000, 'Message must be less than 1000 characters')
    .optional(),

  expiresInDays: z.number()
    .int('Expiry days must be an integer')
    .min(1, 'Expiry must be at least 1 day')
    .max(30, 'Expiry cannot exceed 30 days')
    .optional()
    .default(7),

  metadata: z.record(z.any()).optional()
});

/**
 * Accept invitation schema
 */
export const acceptInvitationSchema = z.object({
  token: z.string().min(1, 'Invitation token is required'),

  password: passwordSchema,

  confirmPassword: z.string(),

  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
    .trim()
    .toLowerCase()
    .optional(),

  name: z.string()
    .min(1, 'Full name is required')
    .max(255, 'Full name must be less than 255 characters')
    .trim()

}).refine(
  data => data.password === data.confirmPassword,
  { message: 'Passwords do not match', path: ['confirmPassword'] }
);

// ============ USER SEARCH & FILTER SCHEMAS ============

/**
 * User list/search schema
 */
export const userFilterSchema = z.object({})
  .merge(paginationSchema)
  .merge(searchSchema)
  .merge(sortingSchema)
  .extend({
    role: userRoleEnum.optional(),

    accountStatus: accountStatusEnum.optional(),

    isActive: z.string()
      .transform(val => val === 'true')
      .optional(),

    emailVerified: z.string()
      .transform(val => val === 'true')
      .optional(),

    hasPhone: z.string()
      .transform(val => val === 'true')
      .optional(),

    createdAfter: z.string()
      .datetime()
      .optional(),

    createdBefore: z.string()
      .datetime()
      .optional(),

    lastLoginAfter: z.string()
      .datetime()
      .optional(),

    lastLoginBefore: z.string()
      .datetime()
      .optional(),

    includeDeleted: z.string()
      .transform(val => val === 'true')
      .optional()
      .default('false')
  });

// ============ BULK OPERATIONS ============

/**
 * Bulk user operations schema
 */
export const bulkUserOperationSchema = z.object({
  userIds: z.array(z.string().uuid())
    .min(1, 'At least one user ID is required')
    .max(100, 'Maximum 100 users can be processed at once'),

  operation: z.enum([
    'activate',
    'deactivate',
    'suspend',
    'delete',
    'verify_email',
    'reset_password',
    'change_role'
  ]),

  params: z.object({
    role: userRoleEnum.optional(),

    suspendedUntil: z.string()
      .datetime()
      .optional(),

    reason: z.string()
      .max(500)
      .optional(),

    sendNotification: z.boolean()
      .optional()
      .default(true)
  }).optional()
});

// ============ SESSION MANAGEMENT ============

/**
 * Session management schema
 */
export const sessionManagementSchema = z.object({
  action: z.enum(['revoke', 'revoke_all', 'list']),

  sessionId: z.string().optional(),

  excludeCurrent: z.boolean().optional().default(true)
});

// ============ EXPORT SCHEMAS ============

export default {
  // Enums
  userRoleEnum,
  accountStatusEnum,
  authProviderEnum,

  // Registration & Creation
  userRegistrationSchema,
  createUserSchema,

  // Updates
  updateProfileSchema,
  adminUpdateUserSchema,

  // Password & Auth
  changePasswordSchema,
  resetPasswordRequestSchema,
  resetPasswordConfirmSchema,
  loginSchema,
  oauthLoginSchema,
  twoFactorSetupSchema,
  twoFactorVerifySchema,

  // Status & Permissions
  updateUserStatusSchema,
  updateUserPermissionsSchema,

  // Invitations
  sendInvitationSchema,
  acceptInvitationSchema,

  // Search & Filter
  userFilterSchema,

  // Bulk Operations
  bulkUserOperationSchema,

  // Sessions
  sessionManagementSchema
};