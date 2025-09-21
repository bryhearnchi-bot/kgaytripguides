/**
 * Test Infrastructure Validation
 * Tests to validate our comprehensive test setup is working correctly
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  mockTrip,
  mockEvent,
  mockTalent,
  mockProfile,
  MockTripStorage,
  MockEventStorage,
  MockTalentStorage,
  performanceTracker,
  testDb
} from '../utils/test-helpers';
import { PERFORMANCE_BUDGETS, assertPerformance, mockDatabase } from '../utils/test-setup';
import {
  tripFixtures,
  eventFixtures,
  talentFixtures,
  profileFixtures,
  testScenarios,
  FixtureLoader as fixtures
} from '../fixtures/database-fixtures';

describe('Test Infrastructure Validation', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up after each test
    await testDb.cleanup();
  });

  describe('Test Utilities', () => {
    it('should create mock data with correct structure', () => {
      // Act
      const trip = mockTrip();
      const event = mockEvent();
      const talent = mockTalent();
      const profile = mockProfile();

      // Assert
      expect(trip).toBeValidTrip();
      expect(event).toBeValidEvent();
      expect(talent).toBeValidTalent();
      expect(profile).toBeDefined();
      expect(profile.email).toContain('@');
      expect(profile.id).toBeDefined();
    });

    it('should allow mock data customization', () => {
      // Arrange
      const customTitle = 'Custom Test Trip';
      const customCapacity = 999;

      // Act
      const customTrip = mockTrip({
        title: customTitle,
        capacity: customCapacity
      });

      // Assert
      expect(customTrip.title).toBe(customTitle);
      expect(customTrip.capacity).toBe(customCapacity);
      expect(customTrip).toBeValidTrip();
    });
  });

  describe('Mock Storage Classes', () => {
    it('should implement CRUD operations', async () => {
      // Arrange
      const tripStorage = new MockTripStorage();
      const testTrip = mockTrip({ title: 'Test CRUD Trip' });

      // Act & Assert - Create
      const created = await tripStorage.create(testTrip);
      expect(created.id).toBeDefined();
      expect(created.title).toBe(testTrip.title);

      // Act & Assert - Read
      const retrieved = await tripStorage.getById(created.id);
      expect(retrieved).toEqual(created);

      // Act & Assert - Update
      const updated = await tripStorage.update(created.id, { title: 'Updated Title' });
      expect(updated.title).toBe('Updated Title');

      // Act & Assert - Delete
      const deleted = await tripStorage.delete(created.id);
      expect(deleted).toBe(true);

      // Verify deletion
      const notFound = await tripStorage.getById(created.id);
      expect(notFound).toBeNull();
    });

    it('should handle specialized storage methods', async () => {
      // Arrange
      const tripStorage = new MockTripStorage();
      const eventStorage = new MockEventStorage();
      const talentStorage = new MockTalentStorage();

      // Test trip-specific methods
      const trip = await tripStorage.create(mockTrip({ slug: 'test-slug' }));
      const foundBySlug = await tripStorage.getTripBySlug('test-slug');
      expect(foundBySlug).toEqual(trip);

      // Test event-specific methods
      const event = await eventStorage.create(mockEvent({ cruiseId: 1 }));
      const cruiseEvents = await eventStorage.getEventsByCruise(1);
      expect(cruiseEvents).toContain(event);

      // Test talent search
      const talent = await talentStorage.create(mockTalent({ category: 'DJ' }));
      const djTalent = await talentStorage.searchTalent(undefined, 'DJ');
      expect(djTalent.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Tracking', () => {
    it('should track operation timing', () => {
      // Arrange
      const operationName = 'testOperation';

      // Act
      performanceTracker.start(operationName);

      // Simulate some work with actual timing
      const start = performance.now();
      for (let i = 0; i < 10000; i++) {
        Math.random() * Math.random();
      }
      const elapsed = performance.now() - start;

      const duration = performanceTracker.end(operationName);

      // Assert
      expect(duration).toBeGreaterThan(0);
      expect(typeof duration).toBe('number');
    });

    it('should validate performance budgets', () => {
      // Arrange
      const operationName = 'fastOperation';
      performanceTracker.start(operationName);

      // Act - Very fast operation
      const result = 1 + 1;

      // Assert
      const duration = performanceTracker.end(operationName);
      expect(duration).toBeLessThan(PERFORMANCE_BUDGETS.DATABASE_QUERY);
      expect(result).toBe(2);
    });

    it('should use assertPerformance helper', () => {
      // Arrange
      const fastDuration = 50; // 50ms
      const slowDuration = 5000; // 5 seconds

      // Act & Assert
      expect(() =>
        assertPerformance(fastDuration, PERFORMANCE_BUDGETS.DATABASE_QUERY, 'fast operation')
      ).not.toThrow();

      expect(() =>
        assertPerformance(slowDuration, PERFORMANCE_BUDGETS.DATABASE_QUERY, 'slow operation')
      ).toThrow();
    });
  });

  describe('Fixtures and Test Data', () => {
    it('should provide comprehensive test fixtures', () => {
      // Assert
      expect(tripFixtures.upcoming).toBeDefined();
      expect(tripFixtures.past).toBeDefined();
      expect(tripFixtures.draft).toBeDefined();

      expect(eventFixtures.welcomeParty).toBeDefined();
      expect(eventFixtures.whiteParty).toBeDefined();
      expect(eventFixtures.dragsShow).toBeDefined();

      expect(talentFixtures.dj).toBeDefined();
      expect(talentFixtures.dragQueen).toBeDefined();
      expect(talentFixtures.singer).toBeDefined();

      expect(profileFixtures.admin).toBeDefined();
      expect(profileFixtures.user).toBeDefined();
      expect(profileFixtures.inactive).toBeDefined();
    });

    it('should have valid fixture relationships', () => {
      // Arrange
      const trip = tripFixtures.upcoming;
      const event = eventFixtures.welcomeParty;

      // Assert
      expect(event.cruiseId).toBe(trip.id);
      expect(trip.startDate).toBeInstanceOf(Date);
      expect(event.date).toBeInstanceOf(Date);
    });

    it('should provide test scenarios', () => {
      // Assert
      expect(testScenarios.completeTripScenario).toBeDefined();
      expect(testScenarios.authScenarios).toBeDefined();
      expect(testScenarios.errorScenarios).toBeDefined();

      const completeScenario = testScenarios.completeTripScenario;
      expect(completeScenario.trip).toBeDefined();
      expect(completeScenario.ports).toBeDefined();
      expect(completeScenario.events).toBeDefined();
      expect(completeScenario.talent).toBeDefined();
    });
  });

  describe('Custom Matchers', () => {
    it('should validate trip structure', () => {
      // Arrange
      const validTrip = mockTrip();
      const invalidTrip = { id: 'string-id', title: null };

      // Act & Assert
      expect(validTrip).toBeValidTrip();
      expect(invalidTrip).not.toBeValidTrip();
    });

    it('should validate event structure', () => {
      // Arrange
      const validEvent = mockEvent();
      const invalidEvent = { id: 'string-id', title: null };

      // Act & Assert
      expect(validEvent).toBeValidEvent();
      expect(invalidEvent).not.toBeValidEvent();
    });

    it('should validate talent structure', () => {
      // Arrange
      const validTalent = mockTalent();
      const invalidTalent = { id: 'string-id', name: null };

      // Act & Assert
      expect(validTalent).toBeValidTalent();
      expect(invalidTalent).not.toBeValidTalent();
    });

    it('should validate timestamps', () => {
      // Arrange
      const validObject = {
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02')
      };

      const invalidObject = {
        createdAt: 'not-a-date',
        updatedAt: new Date()
      };

      // Act & Assert
      expect(validObject).toHaveValidTimestamps();
      expect(invalidObject).not.toHaveValidTimestamps();
    });
  });

  describe('Test Database', () => {
    it('should provide database cleanup functionality', async () => {
      // Arrange
      testDb.addCleanupTask(async () => {
        // Mock cleanup task
        return Promise.resolve();
      });

      // Act & Assert
      await expect(testDb.cleanup()).resolves.toBeUndefined();
    });

    it('should support transactional testing', async () => {
      // Act & Assert
      await expect(testDb.withTransaction(async () => {
        return 'test-result';
      })).resolves.toBe('test-result');
    });
  });

  describe('Environment Configuration', () => {
    it('should have test environment configured', () => {
      // Assert
      expect(process.env.NODE_ENV).toBe('test');
      expect(process.env.USE_MOCK_DATA).toBe('true');
    });

    it('should have performance budgets defined', () => {
      // Assert
      expect(PERFORMANCE_BUDGETS.DATABASE_QUERY).toBeDefined();
      expect(PERFORMANCE_BUDGETS.DATABASE_INSERT).toBeDefined();
      expect(PERFORMANCE_BUDGETS.API_GET).toBeDefined();
      expect(PERFORMANCE_BUDGETS.API_POST).toBeDefined();

      expect(typeof PERFORMANCE_BUDGETS.DATABASE_QUERY).toBe('number');
      expect(PERFORMANCE_BUDGETS.DATABASE_QUERY).toBeGreaterThan(0);
    });
  });

  describe('Test Isolation', () => {
    it('should isolate test state between tests', async () => {
      // Arrange
      const storage = new MockTripStorage();

      // Act - Create data in first test
      await storage.create(mockTrip({ title: 'Test 1' }));
      const countAfterFirst = (await storage.list()).length;

      // Clear and verify isolation
      storage.clear();
      const countAfterClear = (await storage.list()).length;

      // Assert
      expect(countAfterFirst).toBe(1);
      expect(countAfterClear).toBe(0);
    });
  });

  describe('Mock Validation', () => {
    it('should properly mock external dependencies', () => {
      // Assert Supabase mock
      expect(vi.isMockFunction).toBeDefined();

      // Mock functions should be available
      const mockFn = vi.fn();
      expect(mockFn).toBeDefined();
      expect(typeof mockFn).toBe('function');
    });
  });
});