import type { Express } from "express";
import { storage, db } from "./storage";
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
      const userResults = await db
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
      await db
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
      const userResults = await db
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
      const userResults = await db
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
      // Require authentication
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.cookies?.accessToken;
      
      if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const payload = AuthService.verifyAccessToken(token);
      if (!payload) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      const userResults = await db
        .select()
        .from(users)
        .where(eq(users.id, payload.userId))
        .limit(1);
      
      const currentUser = userResults[0];
      if (!currentUser || currentUser?.role !== 'super_admin') {
        return res.status(403).json({ error: 'Only super admins can create users' });
      }

      // Validate input with allowed roles
      const allowedRoles = ['viewer', 'media_manager', 'content_editor', 'cruise_admin', 'super_admin'];
      const userData = req.body;
      
      if (!userData.username || !userData.password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      if (userData.role && !allowedRoles.includes(userData.role)) {
        return res.status(400).json({ error: 'Invalid role specified' });
      }

      // Parse with schema validation
      const validatedData = insertUserSchema.parse(userData);
      
      // Hash password
      const hashedPassword = await AuthService.hashPassword(validatedData.password);
      
      // Insert user
      const newUsers = await db
        .insert(users)
        .values({
          ...validatedData,
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

  // Get all users (protected - only super_admin can view users)
  app.get("/api/auth/users", async (req: AuthenticatedRequest, res) => {
    try {
      // Basic auth check
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.cookies?.accessToken;
      
      if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const payload = AuthService.verifyAccessToken(token);
      if (!payload) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      const userResults = await db
        .select()
        .from(users)
        .where(eq(users.id, payload.userId))
        .limit(1);
      
      const currentUser = userResults[0];
      if (!currentUser || currentUser?.role !== 'super_admin') {
        return res.status(403).json({ error: 'Only super admins can view users' });
      }

      // Fetch all users
      const allUsers = await db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          fullName: users.fullName,
          role: users.role,
          isActive: users.isActive,
          createdAt: users.createdAt,
          lastLogin: users.lastLogin,
        })
        .from(users)
        .orderBy(users.createdAt);

      res.json(allUsers);
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  // Update user (protected - only super_admin can update users)
  app.put("/api/auth/users/:id", async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.params.id;
      
      // Basic auth check
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.cookies?.accessToken;
      
      if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const payload = AuthService.verifyAccessToken(token);
      if (!payload) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      const userResults = await db
        .select()
        .from(users)
        .where(eq(users.id, payload.userId))
        .limit(1);
      
      const currentUser = userResults[0];
      if (!currentUser || currentUser?.role !== 'super_admin') {
        return res.status(403).json({ error: 'Only super admins can update users' });
      }

      const updateData = req.body;
      
      // Validate input and restrict updatable fields
      const allowedRoles = ['viewer', 'media_manager', 'content_editor', 'cruise_admin', 'super_admin'];
      const allowedFields = ['username', 'email', 'fullName', 'role', 'isActive', 'password'];
      
      // Filter to only allowed fields
      const filteredUpdateData: any = {};
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          filteredUpdateData[field] = updateData[field];
        }
      }

      // Validate role if provided
      if (filteredUpdateData.role && !allowedRoles.includes(filteredUpdateData.role)) {
        return res.status(400).json({ error: 'Invalid role specified' });
      }

      // Hash password if provided
      if (filteredUpdateData.password) {
        if (filteredUpdateData.password.trim() === '') {
          delete filteredUpdateData.password; // Remove empty password
        } else {
          filteredUpdateData.password = await AuthService.hashPassword(filteredUpdateData.password);
        }
      }

      // Update user
      const updatedUsers = await db
        .update(users)
        .set({
          ...filteredUpdateData,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();

      if (updatedUsers.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const updatedUser = updatedUsers[0];
      
      res.json({
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          fullName: updatedUser.fullName,
          role: updatedUser.role,
          isActive: updatedUser.isActive,
        },
      });
    } catch (error) {
      console.error('User update error:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  });

  // Delete user (protected - only super_admin can delete users)
  app.delete("/api/auth/users/:id", async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.params.id;
      
      // Basic auth check
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.cookies?.accessToken;
      
      if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const payload = AuthService.verifyAccessToken(token);
      if (!payload) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      const userResults = await db
        .select()
        .from(users)
        .where(eq(users.id, payload.userId))
        .limit(1);
      
      const currentUser = userResults[0];
      if (!currentUser || currentUser?.role !== 'super_admin') {
        return res.status(403).json({ error: 'Only super admins can delete users' });
      }

      // Prevent self-deletion
      if (userId === payload.userId) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
      }

      // Delete user
      const deletedUsers = await db
        .delete(users)
        .where(eq(users.id, userId))
        .returning();

      if (deletedUsers.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('User deletion error:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  });
}