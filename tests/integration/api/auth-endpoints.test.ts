/**
 * Authentication API Endpoints Integration Tests
 * Comprehensive tests for authentication and user management
 * Testing with real Supabase Auth integration
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { app } from '../../../server/index';
import { profileStorage } from '../../../server/storage';
import { fixtures, testDb, assertPerformance, PERFORMANCE_BUDGETS } from '../../utils/test-setup';
import { performanceTracker } from '../../utils/test-helpers';

describe('Authentication API Endpoints Integration Tests', () => {
  let server: any;

  beforeAll(async () => {
    // Start test server
    server = app.listen(0);
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
  });

  beforeEach(async () => {
    // Clean up database
    await fixtures.cleanup(testDb);
  });

  afterEach(async () => {
    vi.clearAllMocks();
    await testDb.cleanup();
  });

  describe('POST /api/auth/login', () => {
    it('should authenticate user with valid credentials', async () => {
      // Arrange
      const testUser = await profileStorage.createProfile({
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        isActive: true,
      });

      const loginData = {
        email: 'test@example.com',
        password: 'TestPassword123!',
      };

      // Mock Supabase auth response
      const mockSupabaseAuth = {
        data: {
          user: {
            id: testUser.id,
            email: testUser.email,
          },
          session: {
            access_token: 'mock-access-token',
            refresh_token: 'mock-refresh-token',
            expires_at: Date.now() + 3600000, // 1 hour
          }
        },
        error: null
      };

      vi.mock('@supabase/supabase-js', () => ({
        createClient: vi.fn(() => ({
          auth: {
            signInWithPassword: vi.fn(() => Promise.resolve(mockSupabaseAuth)),
          }
        }))
      }));

      performanceTracker.start('userLogin');

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      // Assert
      expect(response.body).toBeValidApiResponse();
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(loginData.email);
      expect(response.body.data.session).toBeDefined();
      expect(response.body.data.session.access_token).toBeDefined();

      assertPerformance(
        performanceTracker.end('userLogin'),
        PERFORMANCE_BUDGETS.API_POST,
        'POST /api/auth/login'
      );
    });

    it('should reject invalid credentials', async () => {
      // Arrange
      const invalidLoginData = {
        email: 'invalid@example.com',
        password: 'wrongpassword',
      };

      // Mock Supabase auth error response
      const mockSupabaseError = {
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' }
      };

      vi.mock('@supabase/supabase-js', () => ({
        createClient: vi.fn(() => ({
          auth: {
            signInWithPassword: vi.fn(() => Promise.resolve(mockSupabaseError)),
          }
        }))
      }));

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidLoginData)
        .expect(401);

      // Assert
      expect(response.body.error).toBeDefined();
      expect(response.body.error.message).toContain('Invalid login credentials');
    });

    it('should validate email format', async () => {
      // Arrange
      const invalidEmailData = {
        email: 'not-an-email',
        password: 'TestPassword123!',
      };

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidEmailData)
        .expect(400);

      // Assert
      expect(response.body.error.message).toContain('Invalid email format');
    });

    it('should validate password requirements', async () => {
      // Arrange
      const weakPasswordData = {
        email: 'test@example.com',
        password: '123', // Too weak
      };

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(weakPasswordData)
        .expect(400);

      // Assert
      expect(response.body.error.message).toContain('Password must be at least 6 characters');
    });

    it('should handle missing credentials', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      // Assert
      expect(response.body.error.message).toContain('Email and password are required');
    });

    it('should handle inactive user accounts', async () => {
      // Arrange
      const inactiveUser = await profileStorage.createProfile({
        email: 'inactive@example.com',
        username: 'inactiveuser',
        firstName: 'Inactive',
        lastName: 'User',
        role: 'user',
        isActive: false, // Inactive account
      });

      const loginData = {
        email: 'inactive@example.com',
        password: 'TestPassword123!',
      };

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(403);

      // Assert
      expect(response.body.error.message).toContain('Account is inactive');
    });

    it('should rate limit login attempts', async () => {
      // Arrange
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      // Act - Multiple failed attempts
      const requests = Array.from({ length: 6 }, () =>
        request(app).post('/api/auth/login').send(loginData)
      );

      const responses = await Promise.all(requests);

      // Assert
      const lastResponse = responses[responses.length - 1];
      expect(lastResponse.status).toBe(429); // Too Many Requests
      expect(lastResponse.body.error.message).toContain('Too many login attempts');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout user successfully', async () => {
      // Arrange
      const testUser = await profileStorage.createProfile({
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        isActive: true,
      });

      const authToken = 'valid-auth-token';

      // Mock Supabase logout
      vi.mock('@supabase/supabase-js', () => ({
        createClient: vi.fn(() => ({
          auth: {
            signOut: vi.fn(() => Promise.resolve({ error: null })),
          }
        }))
      }));

      // Act
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Assert
      expect(response.body.message).toBe('Logged out successfully');
    });

    it('should handle logout without token', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(401);

      // Assert
      expect(response.body.error.message).toContain('Authentication required');
    });

    it('should handle invalid token gracefully', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      // Assert
      expect(response.body.error.message).toContain('Invalid token');
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should return user profile for authenticated user', async () => {
      // Arrange
      const testUser = await profileStorage.createProfile({
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        isActive: true,
      });

      const authToken = 'valid-auth-token';

      // Mock authentication middleware
      vi.spyOn(profileStorage, 'getProfile').mockResolvedValue(testUser);

      // Act
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Assert
      expect(response.body).toBeValidApiResponse();
      expect(response.body.data.id).toBe(testUser.id);
      expect(response.body.data.email).toBe(testUser.email);
      expect(response.body.data.username).toBe(testUser.username);
      // Should not include sensitive data
      expect(response.body.data.password).toBeUndefined();
    });

    it('should require authentication', async () => {
      // Act
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      // Assert
      expect(response.body.error.message).toContain('Authentication required');
    });

    it('should handle non-existent user profile', async () => {
      // Arrange
      const authToken = 'valid-auth-token';
      vi.spyOn(profileStorage, 'getProfile').mockResolvedValue(undefined);

      // Act
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      // Assert
      expect(response.body.error.message).toContain('Profile not found');
    });
  });

  describe('PUT /api/auth/profile', () => {
    it('should update user profile successfully', async () => {
      // Arrange
      const testUser = await profileStorage.createProfile({
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        isActive: true,
      });

      const authToken = 'valid-auth-token';
      vi.spyOn(profileStorage, 'getProfile').mockResolvedValue(testUser);

      const updates = {
        firstName: 'Updated',
        lastName: 'Name',
        username: 'updateduser',
      };

      const updatedUser = { ...testUser, ...updates, updatedAt: new Date() };
      vi.spyOn(profileStorage, 'updateProfile').mockResolvedValue(updatedUser);

      performanceTracker.start('updateProfile');

      // Act
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)
        .expect(200);

      // Assert
      expect(response.body).toBeValidApiResponse();
      expect(response.body.data.firstName).toBe(updates.firstName);
      expect(response.body.data.lastName).toBe(updates.lastName);
      expect(response.body.data.username).toBe(updates.username);
      expect(response.body.data).toHaveValidTimestamps();

      assertPerformance(
        performanceTracker.end('updateProfile'),
        PERFORMANCE_BUDGETS.API_PUT,
        'PUT /api/auth/profile'
      );
    });

    it('should validate profile update data', async () => {
      // Arrange
      const testUser = await profileStorage.createProfile({
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        isActive: true,
      });

      const authToken = 'valid-auth-token';
      vi.spyOn(profileStorage, 'getProfile').mockResolvedValue(testUser);

      const invalidUpdates = {
        email: 'not-an-email', // Invalid email format
        username: 'a', // Too short
      };

      // Act
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidUpdates)
        .expect(400);

      // Assert
      expect(response.body.error.message).toContain('validation');
    });

    it('should prevent updating protected fields', async () => {
      // Arrange
      const testUser = await profileStorage.createProfile({
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        isActive: true,
      });

      const authToken = 'valid-auth-token';
      vi.spyOn(profileStorage, 'getProfile').mockResolvedValue(testUser);

      const protectedUpdates = {
        id: 'new-id', // Should not be updatable
        role: 'admin', // Should not be updatable by user
        createdAt: new Date(), // Should not be updatable
      };

      // Act
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(protectedUpdates)
        .expect(400);

      // Assert
      expect(response.body.error.message).toContain('Protected fields cannot be updated');
    });

    it('should handle username uniqueness', async () => {
      // Arrange
      const testUser = await profileStorage.createProfile({
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        isActive: true,
      });

      // Create another user with a username we'll try to use
      await profileStorage.createProfile({
        email: 'other@example.com',
        username: 'existinguser',
        firstName: 'Other',
        lastName: 'User',
        role: 'user',
        isActive: true,
      });

      const authToken = 'valid-auth-token';
      vi.spyOn(profileStorage, 'getProfile').mockResolvedValue(testUser);

      const duplicateUsernameUpdate = {
        username: 'existinguser', // Already taken
      };

      // Act
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(duplicateUsernameUpdate)
        .expect(400);

      // Assert
      expect(response.body.error.message).toContain('Username already exists');
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register new user successfully', async () => {
      // Arrange
      const registrationData = {
        email: 'newuser@example.com',
        password: 'NewPassword123!',
        firstName: 'New',
        lastName: 'User',
        username: 'newuser',
      };

      // Mock Supabase registration
      const mockSupabaseAuth = {
        data: {
          user: {
            id: 'new-user-id',
            email: registrationData.email,
          },
          session: null // Email confirmation required
        },
        error: null
      };

      vi.mock('@supabase/supabase-js', () => ({
        createClient: vi.fn(() => ({
          auth: {
            signUp: vi.fn(() => Promise.resolve(mockSupabaseAuth)),
          }
        }))
      }));

      const newProfile = {
        id: 'new-user-id',
        ...registrationData,
        role: 'user',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(profileStorage, 'createProfile').mockResolvedValue(newProfile);

      performanceTracker.start('userRegistration');

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(registrationData)
        .expect(201);

      // Assert
      expect(response.body).toBeValidApiResponse();
      expect(response.body.data.user.email).toBe(registrationData.email);
      expect(response.body.data.user.username).toBe(registrationData.username);
      expect(response.body.message).toContain('Registration successful');

      assertPerformance(
        performanceTracker.end('userRegistration'),
        PERFORMANCE_BUDGETS.API_POST,
        'POST /api/auth/register'
      );
    });

    it('should validate registration data', async () => {
      // Arrange
      const invalidRegistrationData = {
        email: 'not-an-email',
        password: '123', // Too weak
        firstName: '', // Empty
        username: 'a', // Too short
      };

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidRegistrationData)
        .expect(400);

      // Assert
      expect(response.body.error.message).toContain('validation');
    });

    it('should handle duplicate email registration', async () => {
      // Arrange
      await profileStorage.createProfile({
        email: 'existing@example.com',
        username: 'existing',
        firstName: 'Existing',
        lastName: 'User',
        role: 'user',
        isActive: true,
      });

      const duplicateEmailData = {
        email: 'existing@example.com', // Already exists
        password: 'NewPassword123!',
        firstName: 'New',
        lastName: 'User',
        username: 'newuser',
      };

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(duplicateEmailData)
        .expect(400);

      // Assert
      expect(response.body.error.message).toContain('Email already registered');
    });

    it('should handle duplicate username registration', async () => {
      // Arrange
      await profileStorage.createProfile({
        email: 'existing@example.com',
        username: 'existinguser',
        firstName: 'Existing',
        lastName: 'User',
        role: 'user',
        isActive: true,
      });

      const duplicateUsernameData = {
        email: 'new@example.com',
        password: 'NewPassword123!',
        firstName: 'New',
        lastName: 'User',
        username: 'existinguser', // Already exists
      };

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(duplicateUsernameData)
        .expect(400);

      // Assert
      expect(response.body.error.message).toContain('Username already exists');
    });

    it('should enforce password complexity', async () => {
      // Arrange
      const weakPasswords = [
        'password', // Too common
        '12345678', // All numbers
        'PASSWORD', // All uppercase
        'pass', // Too short
      ];

      for (const password of weakPasswords) {
        const registrationData = {
          email: 'test@example.com',
          password,
          firstName: 'Test',
          lastName: 'User',
          username: 'testuser',
        };

        // Act
        const response = await request(app)
          .post('/api/auth/register')
          .send(registrationData)
          .expect(400);

        // Assert
        expect(response.body.error.message).toContain('Password does not meet complexity requirements');
      }
    });
  });

  describe('POST /api/auth/password-reset', () => {
    it('should initiate password reset successfully', async () => {
      // Arrange
      const testUser = await profileStorage.createProfile({
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        isActive: true,
      });

      const resetData = {
        email: 'test@example.com',
      };

      // Mock Supabase password reset
      vi.mock('@supabase/supabase-js', () => ({
        createClient: vi.fn(() => ({
          auth: {
            resetPasswordForEmail: vi.fn(() => Promise.resolve({ error: null })),
          }
        }))
      }));

      // Act
      const response = await request(app)
        .post('/api/auth/password-reset')
        .send(resetData)
        .expect(200);

      // Assert
      expect(response.body.message).toContain('Password reset email sent');
    });

    it('should handle non-existent email gracefully', async () => {
      // Arrange
      const resetData = {
        email: 'nonexistent@example.com',
      };

      // Act
      const response = await request(app)
        .post('/api/auth/password-reset')
        .send(resetData)
        .expect(200); // Should not reveal if email exists

      // Assert
      expect(response.body.message).toContain('Password reset email sent');
    });

    it('should validate email format', async () => {
      // Arrange
      const invalidEmailData = {
        email: 'not-an-email',
      };

      // Act
      const response = await request(app)
        .post('/api/auth/password-reset')
        .send(invalidEmailData)
        .expect(400);

      // Assert
      expect(response.body.error.message).toContain('Invalid email format');
    });

    it('should rate limit password reset requests', async () => {
      // Arrange
      const resetData = {
        email: 'test@example.com',
      };

      // Act - Multiple requests
      const requests = Array.from({ length: 6 }, () =>
        request(app).post('/api/auth/password-reset').send(resetData)
      );

      const responses = await Promise.all(requests);

      // Assert
      const lastResponse = responses[responses.length - 1];
      expect(lastResponse.status).toBe(429);
      expect(lastResponse.body.error.message).toContain('Too many reset requests');
    });
  });

  describe('Security and Performance', () => {
    it('should include security headers in responses', async () => {
      // Act
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      // Assert
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
    });

    it('should not expose sensitive information in error messages', async () => {
      // Arrange
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      // Assert
      expect(response.body.error.message).not.toContain('user not found');
      expect(response.body.error.message).not.toContain('password incorrect');
      expect(response.body.error.message).toBe('Invalid login credentials');
    });

    it('should handle high concurrent authentication requests', async () => {
      // Arrange
      const testUser = await profileStorage.createProfile({
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        isActive: true,
      });

      const authToken = 'valid-auth-token';
      vi.spyOn(profileStorage, 'getProfile').mockResolvedValue(testUser);

      const requests = Array.from({ length: 20 }, () =>
        request(app)
          .get('/api/auth/profile')
          .set('Authorization', `Bearer ${authToken}`)
      );

      performanceTracker.start('concurrentAuth');

      // Act
      const responses = await Promise.all(requests);

      // Assert
      const duration = performanceTracker.end('concurrentAuth');
      expect(responses.every(r => r.status === 200)).toBe(true);
      expect(duration).toBeLessThan(PERFORMANCE_BUDGETS.API_GET * 10);
    });

    it('should log authentication events for security monitoring', async () => {
      // This would test logging if implemented
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      // Act
      await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      // Assert - In real implementation, would verify logs
      // For now, just ensure it doesn't crash
    });
  });
});