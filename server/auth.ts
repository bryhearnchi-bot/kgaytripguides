import * as argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { storage, db, auditLog as auditLogTable } from './storage';
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

// Authentication middleware
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.cookies?.accessToken;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

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
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role || '')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

// Specific role checks
export const requireSuperAdmin = requireRole(['super_admin']);
export const requireCruiseAdmin = requireRole(['super_admin', 'cruise_admin']);
export const requireContentEditor = requireRole(['super_admin', 'cruise_admin', 'content_editor']);
export const requireMediaManager = requireRole(['super_admin', 'cruise_admin', 'content_editor', 'media_manager']);

// Audit logging middleware
export async function auditLog(action: string, tableName: string, recordId?: string, oldValues?: any, newValues?: any) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (req.user) {
        await db.insert(auditLogTable).values({
          userId: req.user.id,
          action,
          tableName,
          recordId: recordId?.toString(),
          oldValues,
          newValues,
          ipAddress: req.ip || req.connection.remoteAddress,
        });
      }
    } catch (error) {
      console.error('Audit logging failed:', error);
      // Don't fail the request if audit logging fails
    }
    next();
  };
}