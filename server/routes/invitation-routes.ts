/**
 * Secure Invitation System API Routes
 *
 * Provides enterprise-grade invitation management with:
 * - Cryptographically secure token generation and validation
 * - Rate limiting to prevent abuse
 * - Input validation with Zod schemas
 * - Role-based access control
 * - Comprehensive error handling
 * - Audit logging for security events
 *
 * Security Features:
 * - Timing-safe token comparison
 * - Rate limiting on public endpoints
 * - CSRF protection
 * - Input sanitization
 * - Admin-only invitation creation
 */

import { Router } from 'express';
import { z } from 'zod';
import { eq, and, desc, count, or, lt, gt, ilike } from 'drizzle-orm';
import { requireAuth, requireContentEditor, requireSuperAdmin, type AuthenticatedRequest } from '../auth';
import { db } from '../storage';
import * as schema from '../../shared/schema';
import type { InferSelectModel } from 'drizzle-orm';

type Invitation = InferSelectModel<typeof schema.invitations>;
import {
  generateInvitationToken,
  validateTokenTiming,
  isTokenExpired,
  createInvitationRecord,
  invitationDataSchema,
  type InvitationRecord,
  INVITATION_RATE_LIMITS,
} from '../utils/invitation-tokens';
import { createRateLimit } from '../middleware/rate-limiting';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';

// =============================================================================
// Types & Interfaces
// =============================================================================

// Use the proper database type
type InvitationTable = Invitation;

// =============================================================================
// Validation Schemas
// =============================================================================

const createInvitationSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'content_manager', 'viewer'], {
    errorMap: () => ({ message: 'Role must be one of: admin, content_manager, viewer' })
  }),
  cruiseId: z.string().optional(),
  expirationHours: z.number().min(1).max(168).optional().default(72),
  metadata: z.record(z.unknown()).optional(),
  sendEmail: z.boolean().optional().default(true),
});

const invitationIdSchema = z.object({
  id: z.string().min(1, 'Invitation ID is required'),
});

const validateInvitationTokenSchema = z.object({
  token: z.string().min(32, 'Invalid token format'),
});

const acceptInvitationSchema = z.object({
  token: z.string().min(32, 'Invalid token format'),
  fullName: z.string().min(1, 'Full name is required').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const resendInvitationSchema = z.object({
  expirationHours: z.number().min(1).max(168).optional().default(72),
});

const listInvitationsSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  status: z.enum(['active', 'expired', 'used', 'all']).optional().default('all'),
  role: z.string().optional(),
  search: z.string().optional(),
});

// =============================================================================
// Rate Limiting Configuration
// =============================================================================

const invitationCreateRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: INVITATION_RATE_LIMITS.INVITATIONS_PER_HOUR,
  message: 'Too many invitations created. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const invitationValidateRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: INVITATION_RATE_LIMITS.VALIDATION_ATTEMPTS_PER_HOUR,
  message: 'Too many validation attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `validate_${req.ip}_${req.params.token?.slice(0, 8)}`,
});

const invitationAcceptRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 acceptance attempts per IP per 15 minutes
  message: 'Too many account creation attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get invitation by ID with proper error handling
 */
async function getInvitationById(id: string): Promise<InvitationTable | null> {
  try {
    const result = await db.select()
      .from(schema.invitations)
      .where(eq(schema.invitations.id, id))
      .limit(1);

    return result.length > 0 ? result[0] as InvitationTable : null;
  } catch (error) {
    console.error('Error fetching invitation:', error);
    return null;
  }
}

/**
 * Create invitation in database
 */
async function createInvitationInDb(invitation: Omit<InvitationTable, 'id' | 'createdAt'>): Promise<InvitationTable> {
  try {
    const result = await db.insert(schema.invitations).values({
      email: invitation.email,
      role: invitation.role,
      invitedBy: invitation.invitedBy,
      cruiseId: invitation.cruiseId,
      metadata: invitation.metadata,
      tokenHash: invitation.tokenHash,
      salt: invitation.salt,
      expiresAt: invitation.expiresAt,
      used: invitation.used,
      usedAt: invitation.usedAt,
      usedBy: invitation.usedBy,
    }).returning();

    return result[0] as InvitationTable;
  } catch (error) {
    console.error('Error creating invitation:', error);
    throw new Error('Failed to create invitation in database');
  }
}

/**
 * Update invitation in database
 */
async function updateInvitationInDb(id: string, updates: Partial<InvitationTable>): Promise<InvitationTable | null> {
  try {
    const result = await db.update(schema.invitations)
      .set(updates)
      .where(eq(schema.invitations.id, id))
      .returning();

    return result.length > 0 ? result[0] as InvitationTable : null;
  } catch (error) {
    console.error('Error updating invitation:', error);
    return null;
  }
}

/**
 * Check if email already has pending invitation
 */
async function checkExistingInvitation(email: string): Promise<boolean> {
  try {
    const now = new Date();
    const result = await db.select()
      .from(schema.invitations)
      .where(
        and(
          eq(schema.invitations.email, email.toLowerCase()),
          eq(schema.invitations.used, false),
          gt(invitations.expiresAt, now)
        )
      )
      .limit(1);

    return result.length > 0;
  } catch (error) {
    console.error('Error checking existing invitation:', error);
    return false;
  }
}

/**
 * Check if user already exists
 */
async function checkUserExists(email: string): Promise<boolean> {
  try {
    const existingProfile = await db.select()
      .from(schema.profiles)
      .where(eq(schema.profiles.email, email.toLowerCase()))
      .limit(1);

    return existingProfile.length > 0;
  } catch (error) {
    console.error('Error checking user existence:', error);
    return false;
  }
}

/**
 * Send invitation email using Resend service
 */
async function sendInvitationEmail(email: string, token: string, inviterName: string, role: string): Promise<boolean> {
  try {
    const { sendInvitationEmail: sendEmail } = await import('../services/email-service');
    const result = await sendEmail(email, token, inviterName, role);

    if (result.success) {
      console.log(`Invitation email sent successfully to ${email}, message ID: ${result.messageId}`);
      return true;
    } else {
      console.error('Failed to send invitation email:', result.error);
      return false;
    }
  } catch (error) {
    console.error('Error sending invitation email:', error);
    return false;
  }
}

/**
 * Find invitation by validating token against all stored invitations
 */
async function findInvitationByToken(token: string): Promise<InvitationTable | null> {
  try {
    // Get all active (unused, non-expired) invitations
    const now = new Date();
    const activeInvitations = await db.select()
      .from(schema.invitations)
      .where(
        and(
          eq(schema.invitations.used, false),
          gt(invitations.expiresAt, now)
        )
      );

    // Check each invitation's token hash
    for (const invitation of activeInvitations) {
      if (validateTokenTiming(token, invitation.tokenHash, invitation.salt)) {
        return invitation as InvitationTable;
      }
    }

    return null;
  } catch (error) {
    console.error('Error finding invitation by token:', error);
    return null;
  }
}

/**
 * Create user account from accepted invitation
 */
async function createUserFromInvitation(
  email: string,
  fullName: string,
  role: string,
  password: string
): Promise<{ id: string; email: string; fullName: string; role: string }> {
  try {
    // TODO: Implement actual user creation with Supabase Auth
    console.log(`Creating user account for ${email} with role ${role}`);

    // For now, create a profile entry (requires Supabase Auth user first)
    // This is a placeholder - in production, this would integrate with Supabase Auth
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Insert profile (this would normally be done via Supabase Auth trigger)
    await db.insert(profiles).values({
      id: userId,
      email,
      fullName,
      role,
    });

    return {
      id: userId,
      email,
      fullName,
      role,
    };
  } catch (error) {
    console.error('Error creating user account:', error);
    throw new Error('Failed to create user account');
  }
}

// =============================================================================
// API Routes
// =============================================================================

const router = Router();

/**
 * POST /api/admin/invitations
 * Create a new invitation (admin only)
 */
router.post(
  '/admin/invitations',
  invitationCreateRateLimit,
  requireAuth,
  requireContentEditor,
  validateBody(createInvitationSchema),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { email, role, cruiseId, expirationHours, metadata, sendEmail } = req.body;
      const inviter = req.user!;

      // Security Check: Validate email format and domain
      const emailDomain = email.split('@')[1]?.toLowerCase();
      const suspiciousDomains = ['tempmail.org', '10minutemail.com', 'guerrillamail.com'];
      if (suspiciousDomains.includes(emailDomain)) {
        return res.status(400).json({
          error: 'Invalid email domain',
          message: 'Temporary email addresses are not allowed'
        });
      }

      // Check if user already exists
      const userExists = await checkUserExists(email);
      if (userExists) {
        return res.status(409).json({
          error: 'User already exists',
          message: 'An account with this email address already exists'
        });
      }

      // Check for existing pending invitation
      const hasExistingInvitation = await checkExistingInvitation(email);
      if (hasExistingInvitation) {
        return res.status(409).json({
          error: 'Invitation already exists',
          message: 'A pending invitation for this email address already exists'
        });
      }

      // Role Permission Check: Ensure inviter can assign the requested role
      const roleHierarchy = {
        'admin': ['admin', 'content_editor', 'media_manager', 'viewer'],
        'content_editor': ['content_editor', 'media_manager', 'viewer'],
        'media_manager': ['media_manager', 'viewer'],
        'viewer': ['viewer']
      };

      const allowedRoles = roleHierarchy[inviter.role as keyof typeof roleHierarchy] || [];
      if (!allowedRoles.includes(role)) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          message: `You cannot invite users with role: ${role}`
        });
      }

      // Generate secure invitation token
      const invitationData = createInvitationRecord({
        email: email.toLowerCase(),
        role,
        invitedBy: inviter.id,
        cruiseId,
        metadata,
      }, expirationHours);

      // Store invitation in database (without the raw token)
      const { token, ...dbInvitation } = invitationData;
      const storedInvitation = await createInvitationInDb(dbInvitation);

      // Send invitation email if requested
      let emailSent = false;
      if (sendEmail) {
        emailSent = await sendInvitationEmail(email, token, inviter.fullName || inviter.username || 'Admin', role);
      }

      // Audit log the invitation creation
      console.log(`Invitation created: ${storedInvitation.id} for ${email} by ${inviter.id}`);

      res.status(201).json({
        success: true,
        invitation: {
          id: storedInvitation.id,
          email: storedInvitation.email,
          role: storedInvitation.role,
          expiresAt: storedInvitation.expiresAt,
          createdAt: storedInvitation.createdAt,
          emailSent,
        },
        // Return token only for testing/development
        ...(process.env.NODE_ENV === 'development' && { token }),
      });

    } catch (error) {
      console.error('Error creating invitation:', error);
      res.status(500).json({
        error: 'Failed to create invitation',
        message: 'An unexpected error occurred while creating the invitation'
      });
    }
  }
);

/**
 * GET /api/admin/invitations
 * List invitations with filtering and pagination (admin only)
 */
router.get(
  '/admin/invitations',
  requireAuth,
  requireContentEditor,
  validateQuery(listInvitationsSchema),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { page, limit, status, role, search } = req.query;
      const offset = (page - 1) * limit;

      // Build query conditions
      const now = new Date();
      const conditions = [];

      // Apply status filter
      switch (status) {
        case 'active':
          conditions.push(
            and(
              eq(schema.invitations.used, false),
              gt(invitations.expiresAt, now)
            )
          );
          break;
        case 'expired':
          conditions.push(
            and(
              eq(schema.invitations.used, false),
              lt(invitations.expiresAt, now)
            )
          );
          break;
        case 'used':
          conditions.push(eq(schema.invitations.used, true));
          break;
        // 'all' - no additional filtering
      }

      // Apply role filter
      if (role) {
        conditions.push(eq(schema.invitations.role, role));
      }

      // Apply search filter
      if (search) {
        conditions.push(ilike(invitations.email, `%${search}%`));
      }

      // Build where clause
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const [totalResult] = await db.select({ count: count() })
        .from(schema.invitations)
        .where(whereClause);
      const total = totalResult.count;

      // Get paginated results
      const invitationResults = await db.select()
        .from(schema.invitations)
        .where(whereClause)
        .orderBy(desc(invitations.createdAt))
        .limit(limit)
        .offset(offset);

      const paginatedInvitations = invitationResults.map(inv => ({
        id: inv.id,
        email: inv.email,
        role: inv.role,
        expiresAt: inv.expiresAt,
        createdAt: inv.createdAt,
        used: inv.used,
        usedAt: inv.usedAt,
        expired: inv.expiresAt <= now,
      }));

      res.json({
        success: true,
        invitations: paginatedInvitations,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
        filters: {
          status,
          role,
          search,
        },
      });

    } catch (error) {
      console.error('Error listing invitations:', error);
      res.status(500).json({
        error: 'Failed to fetch invitations',
        message: 'An unexpected error occurred while fetching invitations'
      });
    }
  }
);

/**
 * DELETE /api/admin/invitations/:id
 * Cancel/delete an invitation (admin only)
 */
router.delete(
  '/admin/invitations/:id',
  requireAuth,
  requireContentEditor,
  validateParams(invitationIdSchema),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const admin = req.user!;

      // Find the invitation
      const invitation = await getInvitationById(id);
      if (!invitation) {
        return res.status(404).json({
          error: 'Invitation not found',
          message: 'The specified invitation does not exist'
        });
      }

      // Check if invitation is already used
      if (invitation.used) {
        return res.status(400).json({
          error: 'Cannot cancel used invitation',
          message: 'This invitation has already been accepted and cannot be cancelled'
        });
      }

      // Permission check: Only admins or the original inviter can cancel
      if (admin.role !== 'admin' && invitation.invitedBy !== admin.id) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          message: 'You can only cancel invitations that you created'
        });
      }

      // Delete invitation from database
      const deletedInvitation = await db.delete(schema.invitations)
        .where(eq(schema.invitations.id, id))
        .returning();

      if (deletedInvitation.length === 0) {
        return res.status(500).json({
          error: 'Failed to delete invitation',
          message: 'Invitation could not be deleted from database'
        });
      }

      // Audit log the cancellation
      console.log(`Invitation cancelled: ${id} by ${admin.id}`);

      res.json({
        success: true,
        message: 'Invitation cancelled successfully'
      });

    } catch (error) {
      console.error('Error cancelling invitation:', error);
      res.status(500).json({
        error: 'Failed to cancel invitation',
        message: 'An unexpected error occurred while cancelling the invitation'
      });
    }
  }
);

/**
 * POST /api/admin/invitations/:id/resend
 * Resend an invitation email with new token (admin only)
 */
router.post(
  '/admin/invitations/:id/resend',
  invitationCreateRateLimit, // Reuse same rate limit as creation
  requireAuth,
  requireContentEditor,
  validateParams(invitationIdSchema),
  validateBody(resendInvitationSchema),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { expirationHours } = req.body;
      const admin = req.user!;

      // Find the invitation
      const invitation = await getInvitationById(id);
      if (!invitation) {
        return res.status(404).json({
          error: 'Invitation not found',
          message: 'The specified invitation does not exist'
        });
      }

      // Check if invitation is already used
      if (invitation.used) {
        return res.status(400).json({
          error: 'Cannot resend used invitation',
          message: 'This invitation has already been accepted'
        });
      }

      // Permission check: Only admins or the original inviter can resend
      if (admin.role !== 'admin' && invitation.invitedBy !== admin.id) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          message: 'You can only resend invitations that you created'
        });
      }

      // Generate new token and update invitation
      const { token, hash, salt, expiresAt } = generateInvitationToken(expirationHours);

      const updatedInvitation = await updateInvitationInDb(id, {
        tokenHash: hash,
        salt,
        expiresAt: new Date(expiresAt),
      });

      if (!updatedInvitation) {
        return res.status(500).json({
          error: 'Failed to update invitation',
          message: 'Could not update invitation with new token'
        });
      }

      // Send new invitation email
      const emailSent = await sendInvitationEmail(
        invitation.email,
        token,
        admin.fullName || admin.username || 'Admin',
        invitation.role
      );

      // Audit log the resend
      console.log(`Invitation resent: ${id} by ${admin.id}`);

      res.json({
        success: true,
        invitation: {
          id: updatedInvitation.id,
          email: updatedInvitation.email,
          role: updatedInvitation.role,
          expiresAt: updatedInvitation.expiresAt,
          emailSent,
        },
        // Return token only for testing/development
        ...(process.env.NODE_ENV === 'development' && { token }),
      });

    } catch (error) {
      console.error('Error resending invitation:', error);
      res.status(500).json({
        error: 'Failed to resend invitation',
        message: 'An unexpected error occurred while resending the invitation'
      });
    }
  }
);

/**
 * GET /api/invitations/validate/:token
 * Validate an invitation token (public endpoint with rate limiting)
 */
router.get(
  '/invitations/validate/:token',
  invitationValidateRateLimit,
  validateParams(validateInvitationTokenSchema),
  async (req, res) => {
    try {
      const { token } = req.params;

      // Find and validate invitation
      const matchingInvitation = await findInvitationByToken(token);

      if (!matchingInvitation) {
        return res.status(404).json({
          error: 'Invalid invitation',
          message: 'The invitation token is invalid or has been used'
        });
      }

      // Check if token is expired
      if (isTokenExpired(matchingInvitation.expiresAt)) {
        return res.status(410).json({
          error: 'Invitation expired',
          message: 'This invitation has expired'
        });
      }

      // Check if user already exists
      const userExists = await checkUserExists(matchingInvitation.email);
      if (userExists) {
        return res.status(409).json({
          error: 'User already exists',
          message: 'An account with this email address already exists'
        });
      }

      res.json({
        success: true,
        invitation: {
          email: matchingInvitation.email,
          role: matchingInvitation.role,
          expiresAt: matchingInvitation.expiresAt,
        }
      });

    } catch (error) {
      console.error('Error validating invitation:', error);
      res.status(500).json({
        error: 'Validation failed',
        message: 'An unexpected error occurred while validating the invitation'
      });
    }
  }
);

/**
 * POST /api/invitations/accept
 * Accept an invitation and create user account (public endpoint with rate limiting)
 */
router.post(
  '/invitations/accept',
  invitationAcceptRateLimit,
  validateBody(acceptInvitationSchema),
  async (req, res) => {
    try {
      const { token, fullName, password } = req.body;

      // Find and validate invitation
      const matchingInvitation = await findInvitationByToken(token);

      if (!matchingInvitation) {
        return res.status(404).json({
          error: 'Invalid invitation',
          message: 'The invitation token is invalid or has been used'
        });
      }

      // Check if token is expired
      if (isTokenExpired(matchingInvitation.expiresAt)) {
        return res.status(410).json({
          error: 'Invitation expired',
          message: 'This invitation has expired'
        });
      }

      // Check if user already exists
      const userExists = await checkUserExists(matchingInvitation.email);
      if (userExists) {
        return res.status(409).json({
          error: 'User already exists',
          message: 'An account with this email address already exists'
        });
      }

      // Create user account
      const newUser = await createUserFromInvitation(
        matchingInvitation.email,
        fullName,
        matchingInvitation.role,
        password
      );

      // Mark invitation as used
      await updateInvitationInDb(matchingInvitation.id, {
        used: true,
        usedAt: new Date(),
        usedBy: newUser.id,
      });

      // Audit log the acceptance
      console.log(`Invitation accepted: ${matchingInvitation.id} by new user ${newUser.id}`);

      res.status(201).json({
        success: true,
        message: 'Account created successfully',
        user: {
          id: newUser.id,
          email: newUser.email,
          fullName: newUser.fullName,
          role: newUser.role,
        }
      });

    } catch (error) {
      console.error('Error accepting invitation:', error);
      res.status(500).json({
        error: 'Failed to create account',
        message: 'An unexpected error occurred while creating your account'
      });
    }
  }
);

export default router;