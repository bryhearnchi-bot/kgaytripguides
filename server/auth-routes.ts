import type { Express } from "express";
import { storage, db } from "./storage";
import { AuthService, type AuthenticatedRequest } from "./auth";
import { insertUserSchema, users, passwordResetTokens } from "@shared/schema";
import { eq, gt } from "drizzle-orm";
import { sendEmail } from "./utils/replitmail";
import { randomBytes, createHash } from 'crypto';

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
      const allowedRoles = ['viewer', 'media_manager', 'content_editor', 'trip_admin', 'super_admin'];
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
      const allowedRoles = ['viewer', 'media_manager', 'content_editor', 'trip_admin', 'super_admin'];
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

  // Password reset request
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      // Find user by email
      const userResults = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      const user = userResults[0];
      
      // Always return success to prevent email enumeration
      if (!user || !user.isActive) {
        return res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
      }

      // Generate secure random token
      const resetToken = randomBytes(32).toString('hex');
      const hashedToken = createHash('sha256').update(resetToken).digest('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      // Clean up any existing tokens for this user
      await db
        .delete(passwordResetTokens)
        .where(eq(passwordResetTokens.userId, user.id));

      // Insert new reset token (hashed)
      await db
        .insert(passwordResetTokens)
        .values({
          userId: user.id,
          token: hashedToken,
          expiresAt,
        });

      // Send email with reset link
      const resetUrl = `${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/admin/reset-password/${resetToken}`;
      
      try {
        await sendEmail({
          to: email,
          subject: 'Reset Your Admin Password',
          html: `
            <h2>Reset Your Password</h2>
            <p>Hi ${user.fullName || user.username},</p>
            <p>You requested a password reset for your admin account. Click the link below to reset your password:</p>
            <p><a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a></p>
            <p>Or copy and paste this URL into your browser: ${resetUrl}</p>
            <p>This link will expire in 1 hour for security reasons.</p>
            <p>If you didn't request this password reset, you can safely ignore this email.</p>
            <hr>
            <p><small>This is an automated message from the Cruise Guide Admin System.</small></p>
          `,
          text: `
            Reset Your Password
            
            Hi ${user.fullName || user.username},
            
            You requested a password reset for your admin account. Visit the following link to reset your password:
            
            ${resetUrl}
            
            This link will expire in 1 hour for security reasons.
            
            If you didn't request this password reset, you can safely ignore this email.
            
            This is an automated message from the Cruise Guide Admin System.
          `,
        });
      } catch (emailError) {
        console.error('Failed to send reset email:', emailError);
        // Don't return error to prevent email enumeration - log internally instead
      }

      res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
    } catch (error) {
      console.error('Password reset request error:', error);
      res.status(500).json({ error: 'Failed to process password reset request' });
    }
  });

  // Validate reset token
  app.get("/api/auth/validate-reset-token/:token", async (req, res) => {
    try {
      const { token } = req.params;

      if (!token) {
        return res.status(400).json({ error: 'Token is required' });
      }

      // Hash the provided token to compare with stored hash
      const hashedToken = createHash('sha256').update(token).digest('hex');
      
      // Find valid token
      const tokenResults = await db
        .select()
        .from(passwordResetTokens)
        .where(eq(passwordResetTokens.token, hashedToken))
        .limit(1);

      const resetToken = tokenResults[0];

      if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
        return res.status(400).json({ error: 'Invalid or expired token' });
      }

      res.json({ valid: true });
    } catch (error) {
      console.error('Token validation error:', error);
      res.status(500).json({ error: 'Failed to validate token' });
    }
  });

  // Reset password with token
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({ error: 'Token and password are required' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
      }

      // Hash the provided token to compare with stored hash
      const hashedToken = createHash('sha256').update(token).digest('hex');
      
      // Find valid token
      const tokenResults = await db
        .select()
        .from(passwordResetTokens)
        .where(eq(passwordResetTokens.token, hashedToken))
        .limit(1);

      const resetToken = tokenResults[0];

      if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
        return res.status(400).json({ error: 'Invalid or expired token' });
      }

      // Hash new password
      const hashedPassword = await AuthService.hashPassword(password);

      // Update user password
      await db
        .update(users)
        .set({
          password: hashedPassword,
          updatedAt: new Date(),
        })
        .where(eq(users.id, resetToken.userId));

      // Mark token as used
      await db
        .update(passwordResetTokens)
        .set({
          usedAt: new Date(),
        })
        .where(eq(passwordResetTokens.id, resetToken.id));

      res.json({ message: 'Password reset successfully' });
    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({ error: 'Failed to reset password' });
    }
  });
}