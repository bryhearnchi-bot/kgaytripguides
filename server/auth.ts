import * as argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import type { Profile } from '../shared/supabase-types';
import { ApiError, ErrorCode } from './utils/ApiError';
import { logger } from './logging/logger';

// JWT secret getters - lazy evaluation to allow dotenv to load first
function getJWTSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('FATAL: SESSION_SECRET environment variable is required');
  }
  return secret;
}

function getJWTRefreshSecret(): string {
  return process.env.JWT_REFRESH_SECRET || getJWTSecret();
}

export interface AuthenticatedRequest extends Request {
  user?: Profile;
}

export interface TokenPayload {
  userId: string;
  username: string;
  role: string;
}

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return argon2.hash(password);
  }

  static async verifyPassword(hashedPassword: string, plainPassword: string): Promise<boolean> {
    try {
      return await argon2.verify(hashedPassword, plainPassword);
    } catch (error: unknown) {
      return false;
    }
  }

  static generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, getJWTSecret(), { expiresIn: '15m' });
  }

  static generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, getJWTRefreshSecret(), { expiresIn: '7d' });
  }

  static verifyAccessToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, getJWTSecret()) as TokenPayload;
    } catch (error: unknown) {
      // Provide more specific error information
      if (error instanceof Error && error.name === 'TokenExpiredError') {
        throw new ApiError(401, 'Token has expired', { code: ErrorCode.TOKEN_EXPIRED });
      }
      if (error instanceof Error && error.name === 'JsonWebTokenError') {
        throw new ApiError(401, 'Invalid token', { code: ErrorCode.INVALID_TOKEN });
      }
      return null;
    }
  }

  static verifyRefreshToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, getJWTRefreshSecret()) as TokenPayload;
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'TokenExpiredError') {
        throw new ApiError(401, 'Refresh token has expired', { code: ErrorCode.TOKEN_EXPIRED });
      }
      if (error instanceof Error && error.name === 'JsonWebTokenError') {
        throw new ApiError(401, 'Invalid refresh token', { code: ErrorCode.INVALID_TOKEN });
      }
      return null;
    }
  }
}

// Authentication middleware - Supports both Supabase and custom JWT tokens
export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : req.cookies?.accessToken;

    if (!token) {
      throw ApiError.unauthorized('Authentication required');
    }

    // First, try Supabase authentication
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase credentials not configured');
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      if (user && !error) {
        // Get user profile from database using Supabase Admin
        const { getSupabaseAdmin } = await import('./supabase-admin');
        const supabaseAdmin = getSupabaseAdmin();
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) {
          req.user = {
            id: user.id,
            username: user.email || '',
            email: user.email || '',
            role: profile.role || 'viewer',
          } as Profile;
          return next();
        }

        // Fallback when profile is unavailable (e.g., mock mode): use Supabase user metadata
        const metaRole = (user.user_metadata as Record<string, unknown>)?.role;
        if (typeof metaRole === 'string') {
          req.user = {
            id: user.id,
            username: user.email || '',
            email: user.email || '',
            role: metaRole,
          } as Profile;
          return next();
        }
      }
    } catch (supabaseError) {
      // Supabase auth failed, try custom JWT
    }

    // Fall back to custom JWT authentication
    try {
      const payload = AuthService.verifyAccessToken(token);
      if (!payload) {
        throw new ApiError(401, 'Invalid or expired token', { code: ErrorCode.INVALID_TOKEN });
      }

      // Add user info to request for use in subsequent middleware/routes
      req.user = {
        id: payload.userId,
        username: payload.username,
        role: payload.role,
      } as Profile;

      next();
    } catch (error: unknown) {
      // Pass JWT verification errors to the error handler
      if (error instanceof ApiError) {
        return next(error);
      }
      // For backwards compatibility, return standard error format
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  } catch (error: unknown) {
    // Handle any errors in the auth middleware
    if (error instanceof ApiError) {
      return next(error);
    }
    return next(ApiError.unauthorized());
  }
}

// Role-based authorization middleware
export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw ApiError.unauthorized('Authentication required');
      }

      if (!allowedRoles.includes(req.user.role || '')) {
        throw new ApiError(403, 'Insufficient permissions', {
          code: ErrorCode.INSUFFICIENT_PERMISSIONS,
          details: { userRole: req.user.role, requiredRoles: allowedRoles },
        });
      }

      return next();
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        // For backwards compatibility, return JSON response
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
  };
}

// Middleware composition helper
function composeAuth(
  roleCheck: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void
) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    requireAuth(req, res, (error?: unknown) => {
      if (error) return next(error);
      roleCheck(req, res, next);
    });
  };
}

// Specific role checks
export const requireAdmin = composeAuth(requireRole(['admin', 'super_admin']));
// Super admin enforcement is optional and guarded via feature flag
export const requireSuperAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (process.env.ENFORCE_SUPER_ADMIN === '1') {
    return composeAuth(requireRole(['super_admin']))(req, res, next);
  }
  // Default to admin-level access to preserve current behavior
  return composeAuth(requireRole(['admin', 'super_admin']))(req, res, next);
};
export const requireTripAdmin = composeAuth(
  requireRole(['admin', 'super_admin', 'content_manager'])
);
export const requireContentEditor = composeAuth(
  requireRole(['admin', 'super_admin', 'content_manager'])
);
export const requireMediaManager = composeAuth(
  requireRole(['admin', 'super_admin', 'content_manager'])
);

// Backward compatibility alias
export const requireCruiseAdmin = requireTripAdmin;

// Audit logging middleware (disabled for simplified schema)
export async function auditLog(
  action: string,
  tableName: string,
  recordId?: string,
  oldValues?: Record<string, unknown>,
  newValues?: Record<string, unknown>
) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // TODO: Re-enable when audit log table is added back
      // if (req.user) {
      //   await db.insert(auditLogTable).values({
      //     userId: req.user.id,
      //     action,
      //     tableName,
      //     recordId: recordId?.toString(),
      //     oldValues,
      //     newValues,
      //     ipAddress: req.ip || req.connection.remoteAddress,
      //   });
      // }
    } catch (error: unknown) {
      logger.error('Audit logging failed', { error });
      // Don't fail the request if audit logging fails
    }
    next();
  };
}
