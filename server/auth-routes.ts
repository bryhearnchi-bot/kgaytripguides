import type { Express } from "express";
import { storage } from "./storage";
import { AuthService, type AuthenticatedRequest } from "./auth";
import { insertUserSchema, users } from "@shared/schema";
import { eq } from "drizzle-orm";

export function registerAuthRoutes(app: Express) {
  // Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      // Find user by username
      const userResults = await storage.db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      const user = userResults[0];
      if (!user || !user.isActive) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Verify password
      const isValidPassword = await AuthService.verifyPassword(user.password, password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate tokens
      const tokenPayload = {
        userId: user.id,
        username: user.username,
        role: user.role || 'viewer',
      };

      const accessToken = AuthService.generateAccessToken(tokenPayload);
      const refreshToken = AuthService.generateRefreshToken(tokenPayload);

      // Update last login
      await storage.db
        .update(users)
        .set({ lastLogin: new Date() })
        .where(eq(users.id, user.id));

      // Set httpOnly cookies for security
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
        accessToken, // Also return in response for authorization header usage
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Refresh token
  app.post("/api/auth/refresh", async (req, res) => {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({ error: 'Refresh token required' });
      }

      const payload = AuthService.verifyRefreshToken(refreshToken);
      if (!payload) {
        return res.status(401).json({ error: 'Invalid refresh token' });
      }

      // Verify user still exists and is active
      const userResults = await storage.db
        .select()
        .from(users)
        .where(eq(users.id, payload.userId))
        .limit(1);

      const user = userResults[0];
      if (!user || !user.isActive) {
        return res.status(401).json({ error: 'User not found or inactive' });
      }

      // Generate new tokens
      const newTokenPayload = {
        userId: user.id,
        username: user.username,
        role: user.role || 'viewer',
      };

      const newAccessToken = AuthService.generateAccessToken(newTokenPayload);
      const newRefreshToken = AuthService.generateRefreshToken(newTokenPayload);

      // Set new cookies
      res.cookie('accessToken', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000,
      });

      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
        accessToken: newAccessToken,
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
  });

  // Get current user info
  app.get("/api/auth/me", async (req: AuthenticatedRequest, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.cookies?.accessToken;

      if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const payload = AuthService.verifyAccessToken(token);
      if (!payload) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      // Get current user data
      const userResults = await storage.db
        .select()
        .from(users)
        .where(eq(users.id, payload.userId))
        .limit(1);

      const user = userResults[0];
      if (!user || !user.isActive) {
        return res.status(401).json({ error: 'User not found or inactive' });
      }

      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Get user info error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Create admin user (protected - only super_admin can create users)
  app.post("/api/auth/users", async (req: AuthenticatedRequest, res) => {
    try {
      // Basic auth check - we'll add proper middleware later
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.cookies?.accessToken;
      
      if (token) {
        const payload = AuthService.verifyAccessToken(token);
        if (payload) {
          const users = await storage.db
            .select()
            .from(storage.users)
            .where(eq(storage.users.id, payload.userId))
            .limit(1);
          
          const currentUser = users[0];
          if (currentUser?.role !== 'super_admin') {
            return res.status(403).json({ error: 'Only super admins can create users' });
          }
        }
      }

      const userData = insertUserSchema.parse(req.body);
      
      // Hash password
      const hashedPassword = await AuthService.hashPassword(userData.password);
      
      // Insert user
      const newUsers = await storage.db
        .insert(storage.users)
        .values({
          ...userData,
          password: hashedPassword,
        })
        .returning();

      const newUser = newUsers[0];
      
      res.status(201).json({
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          fullName: newUser.fullName,
          role: newUser.role,
        },
      });
    } catch (error) {
      console.error('User creation error:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  });
}