import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import { z } from 'zod';

/**
 * Secure Invitation Token Utility
 *
 * Provides cryptographically secure token generation and validation
 * with timing-safe comparison and proper TypeScript types.
 *
 * Security Features:
 * - Cryptographically secure random token generation
 * - SHA-256 hashing with salt
 * - Timing-safe comparison to prevent timing attacks
 * - Input validation with Zod schemas
 */

// =============================================================================
// TypeScript Interfaces & Schemas
// =============================================================================

/**
 * Represents a generated invitation token with its hash
 */
export interface InvitationToken {
  /** The raw token string to be sent to the user */
  token: string;
  /** The hashed token to be stored in the database */
  hash: string;
  /** The salt used for hashing */
  salt: string;
  /** When the token expires (ISO string) */
  expiresAt: string;
}

/**
 * Data associated with an invitation
 */
export interface InvitationData {
  /** Email address of the invitee */
  email: string;
  /** Role to be assigned (admin, user, etc.) */
  role: string;
  /** ID of the user who created the invitation */
  invitedBy: string;
  /** Optional cruise ID if invitation is cruise-specific */
  cruiseId?: string;
  /** Optional additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Complete invitation record for database storage
 */
export interface InvitationRecord extends InvitationData {
  /** Unique invitation ID */
  id: string;
  /** Hashed token (never store raw token) */
  tokenHash: string;
  /** Salt used for hashing */
  salt: string;
  /** When the invitation expires */
  expiresAt: Date;
  /** When the invitation was created */
  createdAt: Date;
  /** Whether the invitation has been used */
  used: boolean;
  /** When the invitation was used (if applicable) */
  usedAt?: Date;
}

// Zod schemas for runtime validation
export const invitationDataSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'user', 'content_editor', 'media_manager', 'viewer']),
  invitedBy: z.string().min(1, 'Inviter ID is required'),
  cruiseId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const tokenValidationSchema = z.object({
  token: z.string().min(32, 'Token must be at least 32 characters'),
  hash: z.string().min(64, 'Hash must be at least 64 characters'),
  salt: z.string().min(32, 'Salt must be at least 32 characters'),
});

// =============================================================================
// Core Token Functions
// =============================================================================

/**
 * Generates a cryptographically secure invitation token
 *
 * @param expirationHours - Hours until the token expires (default: 72)
 * @returns InvitationToken object with token, hash, salt, and expiration
 *
 * @example
 * ```typescript
 * const { token, hash, salt, expiresAt } = generateInvitationToken(48);
 * // Send `token` to user, store `hash` and `salt` in database
 * ```
 */
export function generateInvitationToken(expirationHours: number = 72): InvitationToken {
  // Input validation
  if (expirationHours <= 0 || expirationHours > 168) { // Max 1 week
    throw new Error('Expiration hours must be between 1 and 168 (1 week)');
  }

  // Generate cryptographically secure random token (256 bits = 32 bytes)
  const tokenBytes = randomBytes(32);
  const token = tokenBytes.toString('hex'); // 64 character hex string

  // Generate cryptographically secure salt (128 bits = 16 bytes)
  const saltBytes = randomBytes(16);
  const salt = saltBytes.toString('hex'); // 32 character hex string

  // Hash the token with salt
  const hash = hashToken(token, salt);

  // Calculate expiration
  const expiresAt = new Date(Date.now() + expirationHours * 60 * 60 * 1000).toISOString();

  return {
    token,
    hash,
    salt,
    expiresAt,
  };
}

/**
 * Creates a SHA-256 hash of a token with salt
 *
 * @param token - The raw token to hash
 * @param salt - The salt to use for hashing
 * @returns Hex-encoded SHA-256 hash
 *
 * @example
 * ```typescript
 * const hash = hashToken('my-secret-token', 'random-salt');
 * ```
 */
export function hashToken(token: string, salt: string): string {
  // Input validation
  if (!token || token.length < 8) {
    throw new Error('Token must be at least 8 characters long');
  }
  if (!salt || salt.length < 8) {
    throw new Error('Salt must be at least 8 characters long');
  }

  // Create hash with salt prepended to token
  const hash = createHash('sha256');
  hash.update(salt + token);
  return hash.digest('hex');
}

/**
 * Validates a token against its hash using timing-safe comparison
 *
 * This function uses constant-time comparison to prevent timing attacks
 * that could be used to gradually determine the correct token.
 *
 * @param token - The token to validate
 * @param storedHash - The hash stored in the database
 * @param salt - The salt used for the original hash
 * @returns True if token is valid, false otherwise
 *
 * @example
 * ```typescript
 * const isValid = validateTokenTiming('user-provided-token', storedHash, storedSalt);
 * if (isValid) {
 *   // Token is valid, proceed with invitation acceptance
 * } else {
 *   // Invalid token, reject request
 * }
 * ```
 */
export function validateTokenTiming(token: string, storedHash: string, salt: string): boolean {
  try {
    // Validate inputs using schema
    const validation = tokenValidationSchema.safeParse({ token, hash: storedHash, salt });
    if (!validation.success) {
      return false;
    }

    // Hash the provided token with the stored salt
    const providedHash = hashToken(token, salt);

    // Convert hex strings to buffers for timing-safe comparison
    const providedBuffer = Buffer.from(providedHash, 'hex');
    const storedBuffer = Buffer.from(storedHash, 'hex');

    // Ensure buffers are the same length (they should be for SHA-256)
    if (providedBuffer.length !== storedBuffer.length) {
      return false;
    }

    // Perform timing-safe comparison
    return timingSafeEqual(providedBuffer, storedBuffer);
  } catch (error) {
    // Any error in validation should result in rejection
    console.error('Token validation error:', error);
    return false;
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Checks if an invitation token has expired
 *
 * @param expiresAt - The expiration date (Date object or ISO string)
 * @returns True if expired, false if still valid
 */
export function isTokenExpired(expiresAt: Date | string): boolean {
  const expiration = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
  return expiration.getTime() < Date.now();
}

/**
 * Generates a secure invitation ID for database storage
 *
 * @returns A unique identifier for the invitation
 */
export function generateInvitationId(): string {
  return `inv_${randomBytes(16).toString('hex')}`;
}

/**
 * Creates a complete invitation record ready for database insertion
 *
 * @param data - The invitation data
 * @param expirationHours - Hours until expiration (default: 72)
 * @returns Complete invitation record
 *
 * @example
 * ```typescript
 * const invitation = createInvitationRecord({
 *   email: 'user@example.com',
 *   role: 'admin',
 *   invitedBy: 'admin-user-id',
 *   cruiseId: 'cruise-123'
 * }, 48);
 * ```
 */
export function createInvitationRecord(
  data: InvitationData,
  expirationHours: number = 72
): InvitationRecord & { token: string } {
  // Validate input data
  const validatedData = invitationDataSchema.parse(data);

  // Generate secure token
  const tokenData = generateInvitationToken(expirationHours);

  return {
    id: generateInvitationId(),
    email: validatedData.email,
    role: validatedData.role,
    invitedBy: validatedData.invitedBy,
    cruiseId: validatedData.cruiseId,
    metadata: validatedData.metadata,
    tokenHash: tokenData.hash,
    salt: tokenData.salt,
    expiresAt: new Date(tokenData.expiresAt),
    createdAt: new Date(),
    used: false,
    token: tokenData.token, // Return token for sending to user
  };
}

// =============================================================================
// Security Constants
// =============================================================================

/**
 * Security configuration constants
 */
export const SECURITY_CONFIG = {
  /** Minimum token length in characters */
  MIN_TOKEN_LENGTH: 32,
  /** Maximum token length in characters */
  MAX_TOKEN_LENGTH: 128,
  /** Default expiration hours */
  DEFAULT_EXPIRATION_HOURS: 72,
  /** Maximum expiration hours (1 week) */
  MAX_EXPIRATION_HOURS: 168,
  /** Token byte length for generation */
  TOKEN_BYTE_LENGTH: 32,
  /** Salt byte length for generation */
  SALT_BYTE_LENGTH: 16,
} as const;

/**
 * Rate limiting configuration for invitation endpoints
 */
export const INVITATION_RATE_LIMITS = {
  /** Max invitations per hour per user */
  INVITATIONS_PER_HOUR: 10,
  /** Max validation attempts per token per hour */
  VALIDATION_ATTEMPTS_PER_HOUR: 5,
  /** Lockout duration after failed attempts (minutes) */
  LOCKOUT_DURATION_MINUTES: 30,
} as const;