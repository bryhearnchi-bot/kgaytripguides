import * as argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { storage, db } from './storage';
import type { User } from '@shared/schema';

// JWT secret - in production this should come from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-change-in-production';

export interface AuthenticatedRequest extends Request {
  user?: User;
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
    } catch (error) {
      return false;
    }
  }

  static generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
  }

  static generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });
  }

  static verifyAccessToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch (error) {
      return null;
    }
  }

  static verifyRefreshToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
    } catch (error) {
      return null;
    }
  }
}

// Authentication middleware - Supports both Supabase and custom JWT tokens
export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.cookies?.accessToken;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // First, try Supabase authentication
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://bxiiodeyqvqqcgzzqzvt.supabase.co';
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4aWlvZGV5cXZxcWNnenpxenZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NjcwMjksImV4cCI6MjA3MzU0MzAyOX0.Y9juoQm7q_6ky4EUvLI3YR9VIHuhJah5me85CwsKsVc';

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (user && !error) {
      // Get user profile from database
      const { profileStorage } = await import('./storage');
      const profile = await profileStorage.getProfile(user.id);

      if (profile) {
        console.log(`Auth: User ${user.email} has profile role: ${profile.role}`);
        req.user = {
          id: user.id,
          username: user.email || '',
          email: user.email || '',
          role: profile.role || 'viewer',
        } as User;
        return next();
      }
    }
  } catch (supabaseError) {
    console.debug('Supabase auth failed, trying custom JWT:', supabaseError);
  }

  // Fall back to custom JWT authentication
  const payload = AuthService.verifyAccessToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // Add user info to request for use in subsequent middleware/routes
  req.user = {
    id: payload.userId,
    username: payload.username,
    role: payload.role,
  } as User;

  next();
}

// Role-based authorization middleware
export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      console.log('Role check failed: No user in request');
      return res.status(401).json({ error: 'Authentication required' });
    }

    console.log(`Role check: User ${req.user.email} has role '${req.user.role}', allowed roles:`, allowedRoles);
    if (!allowedRoles.includes(req.user.role || '')) {
      console.log(`Role check failed: '${req.user.role}' not in allowed roles:`, allowedRoles);
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    console.log('Role check passed');
    next();
  };
}

// Middleware composition helper
function composeAuth(roleCheck: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    requireAuth(req, res, (error?: any) => {
      if (error) return next(error);
      roleCheck(req, res, next);
    });
  };
}

// Specific role checks - Updated for simplified role system
export const requireSuperAdmin = composeAuth(requireRole(['admin']));
export const requireTripAdmin = composeAuth(requireRole(['admin', 'content_manager']));
export const requireContentEditor = composeAuth(requireRole(['admin', 'content_manager']));
export const requireMediaManager = composeAuth(requireRole(['admin', 'content_manager']));

// Backward compatibility alias
export const requireCruiseAdmin = requireTripAdmin;

// Audit logging middleware (disabled for simplified schema)
export async function auditLog(action: string, tableName: string, recordId?: string, oldValues?: any, newValues?: any) {
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
    } catch (error) {
      console.error('Audit logging failed:', error);
      // Don't fail the request if audit logging fails
    }
    next();
  };
}