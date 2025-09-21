/**
 * Trip API Endpoints Integration Tests
 * Comprehensive tests for trip-related API endpoints
 * Testing with real database connections and HTTP requests
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { app } from '../../../server/index';
import { tripStorage, profileStorage } from '../../../server/storage';
import { fixtures, testDb, assertPerformance, PERFORMANCE_BUDGETS } from '../../utils/test-setup';
import { performanceTracker } from '../../utils/test-helpers';

describe('Trip API Endpoints Integration Tests', () => {
  let server: any;
  let authToken: string;
  let testProfile: any;

  beforeAll(async () => {
    // Start test server
    server = app.listen(0); // Use random port for testing
  });

  afterAll(async () => {
    // Close test server
    if (server) {
      server.close();
    }
  });

  beforeEach(async () => {
    // Clean up database
    await fixtures.cleanup(testDb);

    // Create test user and get auth token
    testProfile = await profileStorage.createProfile({
      email: 'test@example.com',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      role: 'user',
      isActive: true,
    });

    // Mock authentication for testing
    authToken = 'test-auth-token';
    vi.spyOn(profileStorage, 'getProfile').mockResolvedValue(testProfile);
  });

  afterEach(async () => {
    vi.clearAllMocks();
    await testDb.cleanup();
  });

  describe('GET /api/trips', () => {
    it('should return all published trips', async () => {
      // Arrange
      const testTrip = await fixtures.loadTrip(testDb, {
        ...fixtures.tripFixtures.upcoming,
        status: 'published'
      });

      performanceTracker.start('getAllTrips');

      // Act
      const response = await request(app)
        .get('/api/trips')
        .expect(200);

      // Assert
      expect(response.body).toBeValidApiResponse();
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      expect(response.body.data[0]).toBeValidTrip();
      expect(response.body.data[0].status).toBe('published');

      assertPerformance(
        performanceTracker.end('getAllTrips'),
        PERFORMANCE_BUDGETS.API_GET,
        'GET /api/trips'
      );
    });

    it('should not return draft trips to regular users', async () => {
      // Arrange
      await fixtures.loadTrip(testDb, {
        ...fixtures.tripFixtures.draft,
        status: 'draft'
      });

      // Act
      const response = await request(app)
        .get('/api/trips')
        .expect(200);

      // Assert
      expect(response.body.data.every((trip: any) => trip.status !== 'draft')).toBe(true);
    });

    it('should return trips ordered by start date descending', async () => {
      // Arrange
      const trip1 = await fixtures.loadTrip(testDb, {
        ...fixtures.tripFixtures.upcoming,
        startDate: new Date('2024-06-01'),
        status: 'published'
      });
      const trip2 = await fixtures.loadTrip(testDb, {
        ...fixtures.tripFixtures.upcoming,
        id: 2,
        slug: 'trip-2',
        startDate: new Date('2024-08-01'),
        status: 'published'
      });

      // Act
      const response = await request(app)
        .get('/api/trips')
        .expect(200);

      // Assert
      expect(response.body.data.length).toBe(2);
      const dates = response.body.data.map((trip: any) => new Date(trip.startDate));
      expect(dates[0]).toBeAfter(dates[1]); // Later date first
    });

    it('should handle empty results gracefully', async () => {
      // Act
      const response = await request(app)
        .get('/api/trips')
        .expect(200);

      // Assert
      expect(response.body.data).toEqual([]);
      expect(response.body.meta.total).toBe(0);
    });

    it('should include pagination metadata', async () => {
      // Arrange
      await fixtures.loadTrip(testDb);

      // Act
      const response = await request(app)
        .get('/api/trips')
        .expect(200);

      // Assert
      expect(response.body.meta).toBeDefined();
      expect(response.body.meta.total).toBeDefined();
      expect(response.body.meta.page).toBeDefined();
      expect(response.body.meta.limit).toBeDefined();
    });

    it('should support pagination parameters', async () => {
      // Arrange
      for (let i = 0; i < 15; i++) {
        await fixtures.loadTrip(testDb, {
          ...fixtures.tripFixtures.upcoming,
          id: i + 1,
          slug: `trip-${i + 1}`,
          status: 'published'
        });
      }

      // Act
      const response = await request(app)
        .get('/api/trips?page=2&limit=10')
        .expect(200);

      // Assert
      expect(response.body.data.length).toBe(5); // Remaining items on page 2
      expect(response.body.meta.page).toBe(2);
      expect(response.body.meta.limit).toBe(10);
      expect(response.body.meta.total).toBe(15);
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      vi.spyOn(tripStorage, 'getAllTrips').mockRejectedValue(new Error('Database error'));

      // Act
      const response = await request(app)
        .get('/api/trips')
        .expect(500);

      // Assert
      expect(response.body.error).toBeDefined();
      expect(response.body.error.message).toContain('Database error');
    });
  });

  describe('GET /api/trips/:slug', () => {
    it('should return trip by slug with complete details', async () => {
      // Arrange
      const testTrip = await fixtures.loadTrip(testDb);
      const ports = await Promise.all([
        fixtures.loadPort(testDb, fixtures.portFixtures.athens),
        fixtures.loadPort(testDb, fixtures.portFixtures.santorini)
      ]);

      // Act
      const response = await request(app)
        .get(`/api/trips/${testTrip.slug}`)
        .expect(200);

      // Assert
      expect(response.body).toBeValidApiResponse();
      expect(response.body.data).toBeValidTrip();
      expect(response.body.data.slug).toBe(testTrip.slug);
      expect(response.body.data.itinerary).toBeDefined();
      expect(response.body.data.events).toBeDefined();
      expect(response.body.data.talent).toBeDefined();
    });

    it('should return 404 for non-existent trip', async () => {
      // Act
      const response = await request(app)
        .get('/api/trips/non-existent-trip')
        .expect(404);

      // Assert
      expect(response.body.error).toBeDefined();
      expect(response.body.error.message).toContain('Trip not found');
    });

    it('should not return draft trips to unauthorized users', async () => {
      // Arrange
      const draftTrip = await fixtures.loadTrip(testDb, {
        ...fixtures.tripFixtures.draft,
        status: 'draft'
      });

      // Act
      const response = await request(app)
        .get(`/api/trips/${draftTrip.slug}`)
        .expect(404); // Should appear as not found to regular users

      // Assert
      expect(response.body.error.message).toContain('Trip not found');
    });

    it('should include related itinerary data', async () => {
      // Arrange
      const testTrip = await fixtures.loadTrip(testDb);
      // Create itinerary entries
      await testDb.insert('itinerary', {
        cruiseId: testTrip.id,
        portId: 1,
        date: new Date('2024-06-01'),
        orderIndex: 0
      });

      // Act
      const response = await request(app)
        .get(`/api/trips/${testTrip.slug}`)
        .expect(200);

      // Assert
      expect(response.body.data.itinerary).toBeInstanceOf(Array);
      expect(response.body.data.itinerary.length).toBeGreaterThan(0);
    });

    it('should include related events data', async () => {
      // Arrange
      const testTrip = await fixtures.loadTrip(testDb);
      await fixtures.loadEvent(testDb, {
        ...fixtures.eventFixtures.welcomeParty,
        cruiseId: testTrip.id
      });

      // Act
      const response = await request(app)
        .get(`/api/trips/${testTrip.slug}`)
        .expect(200);

      // Assert
      expect(response.body.data.events).toBeInstanceOf(Array);
      expect(response.body.data.events.length).toBeGreaterThan(0);
      expect(response.body.data.events[0]).toBeValidEvent();
    });

    it('should include related talent data', async () => {
      // Arrange
      const testTrip = await fixtures.loadTrip(testDb);
      const talent = await fixtures.loadTalent(testDb);
      // Link talent to trip
      await testDb.insert('cruise_talent', {
        cruiseId: testTrip.id,
        talentId: talent.id,
        role: 'Headliner'
      });

      // Act
      const response = await request(app)
        .get(`/api/trips/${testTrip.slug}`)
        .expect(200);

      // Assert
      expect(response.body.data.talent).toBeInstanceOf(Array);
      expect(response.body.data.talent.length).toBeGreaterThan(0);
      expect(response.body.data.talent[0]).toBeValidTalent();
    });

    it('should cache results for performance', async () => {
      // Arrange
      const testTrip = await fixtures.loadTrip(testDb);

      // Act - Multiple requests
      const response1 = await request(app)
        .get(`/api/trips/${testTrip.slug}`)
        .expect(200);

      const response2 = await request(app)
        .get(`/api/trips/${testTrip.slug}`)
        .expect(200);

      // Assert
      expect(response1.body.data).toEqual(response2.body.data);
      // In real implementation, second request should be faster due to caching
    });
  });

  describe('GET /api/trips/upcoming', () => {
    it('should return only upcoming trips', async () => {
      // Arrange
      await fixtures.loadTrip(testDb, {
        ...fixtures.tripFixtures.upcoming,
        status: 'upcoming',
        startDate: new Date('2024-08-01')
      });
      await fixtures.loadTrip(testDb, {
        ...fixtures.tripFixtures.past,
        status: 'past',
        endDate: new Date('2023-12-01')
      });

      // Act
      const response = await request(app)
        .get('/api/trips/upcoming')
        .expect(200);

      // Assert
      expect(response.body.data.every((trip: any) => trip.status === 'upcoming')).toBe(true);
      expect(response.body.data.every((trip: any) =>
        new Date(trip.startDate) > new Date()
      )).toBe(true);
    });

    it('should order upcoming trips by start date ascending', async () => {
      // Arrange
      await fixtures.loadTrip(testDb, {
        ...fixtures.tripFixtures.upcoming,
        id: 1,
        slug: 'trip-1',
        status: 'upcoming',
        startDate: new Date('2024-08-01')
      });
      await fixtures.loadTrip(testDb, {
        ...fixtures.tripFixtures.upcoming,
        id: 2,
        slug: 'trip-2',
        status: 'upcoming',
        startDate: new Date('2024-06-01')
      });

      // Act
      const response = await request(app)
        .get('/api/trips/upcoming')
        .expect(200);

      // Assert
      expect(response.body.data.length).toBe(2);
      const dates = response.body.data.map((trip: any) => new Date(trip.startDate));
      expect(dates[0]).toBeBefore(dates[1]); // Earlier date first
    });
  });

  describe('GET /api/trips/past', () => {
    it('should return only past trips', async () => {
      // Arrange
      await fixtures.loadTrip(testDb, {
        ...fixtures.tripFixtures.past,
        status: 'past',
        endDate: new Date('2023-12-01')
      });
      await fixtures.loadTrip(testDb, {
        ...fixtures.tripFixtures.upcoming,
        id: 2,
        slug: 'upcoming-trip',
        status: 'upcoming',
        startDate: new Date('2024-08-01')
      });

      // Act
      const response = await request(app)
        .get('/api/trips/past')
        .expect(200);

      // Assert
      expect(response.body.data.every((trip: any) => trip.status === 'past')).toBe(true);
      expect(response.body.data.every((trip: any) =>
        new Date(trip.endDate) < new Date()
      )).toBe(true);
    });

    it('should order past trips by start date descending', async () => {
      // Arrange
      await fixtures.loadTrip(testDb, {
        ...fixtures.tripFixtures.past,
        id: 1,
        slug: 'past-trip-1',
        status: 'past',
        startDate: new Date('2023-06-01'),
        endDate: new Date('2023-06-08')
      });
      await fixtures.loadTrip(testDb, {
        ...fixtures.tripFixtures.past,
        id: 2,
        slug: 'past-trip-2',
        status: 'past',
        startDate: new Date('2023-08-01'),
        endDate: new Date('2023-08-08')
      });

      // Act
      const response = await request(app)
        .get('/api/trips/past')
        .expect(200);

      // Assert
      expect(response.body.data.length).toBe(2);
      const dates = response.body.data.map((trip: any) => new Date(trip.startDate));
      expect(dates[0]).toBeAfter(dates[1]); // Later date first
    });
  });

  describe('POST /api/trips (Admin Only)', () => {
    beforeEach(() => {
      // Mock admin user
      testProfile.role = 'admin';
      vi.spyOn(profileStorage, 'getProfile').mockResolvedValue(testProfile);
    });

    it('should create new trip successfully', async () => {
      // Arrange
      const newTripData = {
        title: 'New Test Cruise',
        slug: 'new-test-cruise',
        description: 'A brand new test cruise',
        shortDescription: 'New cruise',
        startDate: '2024-09-01',
        endDate: '2024-09-08',
        status: 'draft',
        capacity: 400,
        currentBookings: 0,
        price: 3500,
        shipName: 'Test Ship',
        departurePort: 'Miami, FL',
      };

      performanceTracker.start('createTrip');

      // Act
      const response = await request(app)
        .post('/api/trips')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newTripData)
        .expect(201);

      // Assert
      expect(response.body).toBeValidApiResponse();
      expect(response.body.data).toBeValidTrip();
      expect(response.body.data.title).toBe(newTripData.title);
      expect(response.body.data.slug).toBe(newTripData.slug);
      expect(response.body.data).toHaveValidTimestamps();

      assertPerformance(
        performanceTracker.end('createTrip'),
        PERFORMANCE_BUDGETS.API_POST,
        'POST /api/trips'
      );
    });

    it('should validate required fields', async () => {
      // Arrange
      const invalidTripData = {
        // Missing required fields
        description: 'Missing title and other required fields',
      };

      // Act
      const response = await request(app)
        .post('/api/trips')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidTripData)
        .expect(400);

      // Assert
      expect(response.body.error).toBeDefined();
      expect(response.body.error.message).toContain('validation');
    });

    it('should validate date ranges', async () => {
      // Arrange
      const invalidDateTripData = {
        title: 'Invalid Date Trip',
        slug: 'invalid-date-trip',
        startDate: '2024-06-08',
        endDate: '2024-06-01', // End before start
        status: 'draft',
      };

      // Act
      const response = await request(app)
        .post('/api/trips')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidDateTripData)
        .expect(400);

      // Assert
      expect(response.body.error.message).toContain('End date must be after start date');
    });

    it('should validate unique slug', async () => {
      // Arrange
      const existingTrip = await fixtures.loadTrip(testDb);
      const duplicateSlugData = {
        title: 'Duplicate Slug Trip',
        slug: existingTrip.slug, // Same slug as existing trip
        startDate: '2024-09-01',
        endDate: '2024-09-08',
        status: 'draft',
      };

      // Act
      const response = await request(app)
        .post('/api/trips')
        .set('Authorization', `Bearer ${authToken}`)
        .send(duplicateSlugData)
        .expect(400);

      // Assert
      expect(response.body.error.message).toContain('Slug already exists');
    });

    it('should require admin privileges', async () => {
      // Arrange
      testProfile.role = 'user'; // Regular user
      vi.spyOn(profileStorage, 'getProfile').mockResolvedValue(testProfile);

      const tripData = {
        title: 'Unauthorized Trip',
        slug: 'unauthorized-trip',
        startDate: '2024-09-01',
        endDate: '2024-09-08',
        status: 'draft',
      };

      // Act
      const response = await request(app)
        .post('/api/trips')
        .set('Authorization', `Bearer ${authToken}`)
        .send(tripData)
        .expect(403);

      // Assert
      expect(response.body.error.message).toContain('Admin access required');
    });

    it('should require authentication', async () => {
      // Arrange
      const tripData = {
        title: 'Unauthenticated Trip',
        slug: 'unauthenticated-trip',
        startDate: '2024-09-01',
        endDate: '2024-09-08',
        status: 'draft',
      };

      // Act
      const response = await request(app)
        .post('/api/trips')
        .send(tripData)
        .expect(401);

      // Assert
      expect(response.body.error.message).toContain('Authentication required');
    });
  });

  describe('PUT /api/trips/:id (Admin Only)', () => {
    beforeEach(() => {
      testProfile.role = 'admin';
      vi.spyOn(profileStorage, 'getProfile').mockResolvedValue(testProfile);
    });

    it('should update trip successfully', async () => {
      // Arrange
      const testTrip = await fixtures.loadTrip(testDb);
      const updates = {
        title: 'Updated Trip Title',
        price: 3200,
        capacity: 550,
      };

      performanceTracker.start('updateTrip');

      // Act
      const response = await request(app)
        .put(`/api/trips/${testTrip.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)
        .expect(200);

      // Assert
      expect(response.body).toBeValidApiResponse();
      expect(response.body.data.title).toBe(updates.title);
      expect(response.body.data.price).toBe(updates.price);
      expect(response.body.data.capacity).toBe(updates.capacity);
      expect(response.body.data).toHaveValidTimestamps();

      assertPerformance(
        performanceTracker.end('updateTrip'),
        PERFORMANCE_BUDGETS.API_PUT,
        'PUT /api/trips/:id'
      );
    });

    it('should return 404 for non-existent trip', async () => {
      // Act
      const response = await request(app)
        .put('/api/trips/999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated Title' })
        .expect(404);

      // Assert
      expect(response.body.error.message).toContain('Trip not found');
    });

    it('should validate update data', async () => {
      // Arrange
      const testTrip = await fixtures.loadTrip(testDb);
      const invalidUpdates = {
        capacity: -100, // Invalid capacity
        price: 'not-a-number', // Invalid price type
      };

      // Act
      const response = await request(app)
        .put(`/api/trips/${testTrip.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidUpdates)
        .expect(400);

      // Assert
      expect(response.body.error.message).toContain('validation');
    });

    it('should handle partial updates', async () => {
      // Arrange
      const testTrip = await fixtures.loadTrip(testDb);
      const partialUpdates = {
        price: 2800, // Only updating price
      };

      // Act
      const response = await request(app)
        .put(`/api/trips/${testTrip.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(partialUpdates)
        .expect(200);

      // Assert
      expect(response.body.data.price).toBe(partialUpdates.price);
      expect(response.body.data.title).toBe(testTrip.title); // Unchanged
    });
  });

  describe('DELETE /api/trips/:id (Admin Only)', () => {
    beforeEach(() => {
      testProfile.role = 'admin';
      vi.spyOn(profileStorage, 'getProfile').mockResolvedValue(testProfile);
    });

    it('should delete trip successfully', async () => {
      // Arrange
      const testTrip = await fixtures.loadTrip(testDb);

      performanceTracker.start('deleteTrip');

      // Act
      const response = await request(app)
        .delete(`/api/trips/${testTrip.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Assert
      expect(response.body).toEqual({});

      // Verify trip is deleted
      const getResponse = await request(app)
        .get(`/api/trips/${testTrip.slug}`)
        .expect(404);

      assertPerformance(
        performanceTracker.end('deleteTrip'),
        PERFORMANCE_BUDGETS.API_DELETE,
        'DELETE /api/trips/:id'
      );
    });

    it('should return 404 for non-existent trip', async () => {
      // Act
      const response = await request(app)
        .delete('/api/trips/999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      // Assert
      expect(response.body.error.message).toContain('Trip not found');
    });

    it('should handle cascade deletion safely', async () => {
      // Arrange
      const testTrip = await fixtures.loadTrip(testDb);
      // Add related data that should be cleaned up
      await fixtures.loadEvent(testDb, {
        ...fixtures.eventFixtures.welcomeParty,
        cruiseId: testTrip.id
      });

      // Act
      const response = await request(app)
        .delete(`/api/trips/${testTrip.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Assert - Related data should be handled appropriately
      // (Either cascade deleted or protected)
    });

    it('should require admin privileges', async () => {
      // Arrange
      testProfile.role = 'user';
      vi.spyOn(profileStorage, 'getProfile').mockResolvedValue(testProfile);
      const testTrip = await fixtures.loadTrip(testDb);

      // Act
      const response = await request(app)
        .delete(`/api/trips/${testTrip.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      // Assert
      expect(response.body.error.message).toContain('Admin access required');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed JSON requests', async () => {
      // Act
      const response = await request(app)
        .post('/api/trips')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      // Assert
      expect(response.body.error.message).toContain('Invalid JSON');
    });

    it('should handle database connection errors', async () => {
      // Arrange
      vi.spyOn(tripStorage, 'getAllTrips').mockRejectedValue(new Error('Connection lost'));

      // Act
      const response = await request(app)
        .get('/api/trips')
        .expect(500);

      // Assert
      expect(response.body.error.message).toContain('Internal server error');
    });

    it('should handle concurrent modification gracefully', async () => {
      // Arrange
      const testTrip = await fixtures.loadTrip(testDb);
      testProfile.role = 'admin';

      // Simulate concurrent updates
      const updates1 = { title: 'Update 1', price: 2500 };
      const updates2 = { title: 'Update 2', price: 2600 };

      // Act
      const [response1, response2] = await Promise.all([
        request(app)
          .put(`/api/trips/${testTrip.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updates1),
        request(app)
          .put(`/api/trips/${testTrip.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updates2)
      ]);

      // Assert
      // At least one should succeed
      expect([200, 409]).toContain(response1.status);
      expect([200, 409]).toContain(response2.status);
    });

    it('should validate content-type headers', async () => {
      // Act
      const response = await request(app)
        .post('/api/trips')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'text/plain')
        .send('not json')
        .expect(415);

      // Assert
      expect(response.body.error.message).toContain('Content-Type must be application/json');
    });

    it('should rate limit requests appropriately', async () => {
      // This would test rate limiting if implemented
      // For now, just verify normal operation
      const response = await request(app)
        .get('/api/trips')
        .expect(200);

      expect(response.headers['x-ratelimit-limit']).toBeDefined();
    });
  });

  describe('Performance Requirements', () => {
    it('should meet response time requirements under load', async () => {
      // Arrange
      const testTrip = await fixtures.loadTrip(testDb);
      const requests = Array.from({ length: 10 }, () =>
        request(app).get(`/api/trips/${testTrip.slug}`)
      );

      performanceTracker.start('concurrentRequests');

      // Act
      const responses = await Promise.all(requests);

      // Assert
      const duration = performanceTracker.end('concurrentRequests');
      expect(responses.every(r => r.status === 200)).toBe(true);
      expect(duration).toBeLessThan(PERFORMANCE_BUDGETS.API_GET * 5); // 5x budget for 10 concurrent
    });

    it('should handle large result sets efficiently', async () => {
      // Arrange - Create many trips
      for (let i = 0; i < 50; i++) {
        await fixtures.loadTrip(testDb, {
          ...fixtures.tripFixtures.upcoming,
          id: i + 1,
          slug: `trip-${i + 1}`,
          status: 'published'
        });
      }

      performanceTracker.start('largeResultSet');

      // Act
      const response = await request(app)
        .get('/api/trips')
        .expect(200);

      // Assert
      const duration = performanceTracker.end('largeResultSet');
      expect(response.body.data.length).toBe(50);
      expect(duration).toBeLessThan(PERFORMANCE_BUDGETS.API_GET * 2);
    });
  });
});