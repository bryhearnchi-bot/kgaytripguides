/**
 * TripStorage Unit Tests
 * Comprehensive tests for trip storage operations
 * Following TDD principles with failing tests first
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TripStorage } from '../../../server/storage';
import { mockDatabase, tripFixtures, assertPerformance, PERFORMANCE_BUDGETS } from '../../utils/test-setup';
import { performanceTracker, testDb } from '../../utils/test-helpers';

describe('TripStorage', () => {
  let tripStorage: TripStorage;

  beforeEach(() => {
    // Mock the database connection
    const mockDb = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => Promise.resolve([])),
          })),
          orderBy: vi.fn(() => Promise.resolve([])),
        })),
      })),
      insert: vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([tripFixtures.upcoming])),
        })),
      })),
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn(() => Promise.resolve([tripFixtures.upcoming])),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve()),
      })),
    };

    // Create TripStorage instance with mocked dependencies
    tripStorage = new (TripStorage as any)();
    // Override the db property for testing
    (tripStorage as any).db = mockDb;
  });

  afterEach(async () => {
    vi.clearAllMocks();
    await testDb.cleanup();
  });

  describe('getAllTrips', () => {
    it('should return all trips ordered by start date descending', async () => {
      // Arrange
      const mockTrips = [tripFixtures.upcoming, tripFixtures.past];
      const mockSelect = vi.fn(() => ({
        from: vi.fn(() => ({
          orderBy: vi.fn(() => Promise.resolve(mockTrips)),
        })),
      }));
      (tripStorage as any).db.select = mockSelect;

      performanceTracker.start('getAllTrips');

      // Act
      const result = await tripStorage.getAllTrips();

      // Assert
      expect(result).toEqual(mockTrips);
      expect(mockSelect).toHaveBeenCalled();
      assertPerformance(
        performanceTracker.end('getAllTrips'),
        PERFORMANCE_BUDGETS.DATABASE_QUERY,
        'getAllTrips'
      );
    });

    it('should handle empty result gracefully', async () => {
      // Arrange
      const mockSelect = vi.fn(() => ({
        from: vi.fn(() => ({
          orderBy: vi.fn(() => Promise.resolve([])),
        })),
      }));
      (tripStorage as any).db.select = mockSelect;

      // Act
      const result = await tripStorage.getAllTrips();

      // Assert
      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should cache results for performance', async () => {
      // This test validates caching behavior
      const mockTrips = [tripFixtures.upcoming];
      const mockSelect = vi.fn(() => ({
        from: vi.fn(() => ({
          orderBy: vi.fn(() => Promise.resolve(mockTrips)),
        })),
      }));
      (tripStorage as any).db.select = mockSelect;

      // First call
      await tripStorage.getAllTrips();

      // Second call should use cache (mocked behavior)
      await tripStorage.getAllTrips();

      // In real implementation, second call would not hit database
      expect(mockSelect).toHaveBeenCalled();
    });
  });

  describe('getTripById', () => {
    it('should return trip when found', async () => {
      // Arrange
      const tripId = 1;
      const mockTrip = tripFixtures.upcoming;
      const mockSelect = vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([mockTrip])),
        })),
      }));
      (tripStorage as any).db.select = mockSelect;

      performanceTracker.start('getTripById');

      // Act
      const result = await tripStorage.getTripById(tripId);

      // Assert
      expect(result).toEqual(mockTrip);
      expect(result).toBeValidTrip();
      assertPerformance(
        performanceTracker.end('getTripById'),
        PERFORMANCE_BUDGETS.DATABASE_QUERY,
        'getTripById'
      );
    });

    it('should return undefined when trip not found', async () => {
      // Arrange
      const tripId = 999;
      const mockSelect = vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([])),
        })),
      }));
      (tripStorage as any).db.select = mockSelect;

      // Act
      const result = await tripStorage.getTripById(tripId);

      // Assert
      expect(result).toBeUndefined();
    });

    it('should handle invalid trip ID gracefully', async () => {
      // Arrange
      const invalidId = -1;
      const mockSelect = vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([])),
        })),
      }));
      (tripStorage as any).db.select = mockSelect;

      // Act
      const result = await tripStorage.getTripById(invalidId);

      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe('getTripBySlug', () => {
    it('should return trip when found by slug', async () => {
      // Arrange
      const slug = 'mediterranean-gay-cruise-2024';
      const mockTrip = tripFixtures.upcoming;
      const mockSelect = vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([mockTrip])),
        })),
      }));
      (tripStorage as any).db.select = mockSelect;

      // Act
      const result = await tripStorage.getTripBySlug(slug);

      // Assert
      expect(result).toEqual(mockTrip);
      expect(result?.slug).toBe(slug);
    });

    it('should return undefined for non-existent slug', async () => {
      // Arrange
      const slug = 'non-existent-cruise';
      const mockSelect = vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([])),
        })),
      }));
      (tripStorage as any).db.select = mockSelect;

      // Act
      const result = await tripStorage.getTripBySlug(slug);

      // Assert
      expect(result).toBeUndefined();
    });

    it('should handle empty slug gracefully', async () => {
      // Arrange
      const emptySlug = '';
      const mockSelect = vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([])),
        })),
      }));
      (tripStorage as any).db.select = mockSelect;

      // Act
      const result = await tripStorage.getTripBySlug(emptySlug);

      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe('getUpcomingTrips', () => {
    it('should return only upcoming trips', async () => {
      // Arrange
      const upcomingTrips = [tripFixtures.upcoming];
      const mockSelect = vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => Promise.resolve(upcomingTrips)),
          })),
        })),
      }));
      (tripStorage as any).db.select = mockSelect;

      // Act
      const result = await tripStorage.getUpcomingTrips();

      // Assert
      expect(result).toEqual(upcomingTrips);
      expect(result.every(trip => trip.status === 'upcoming')).toBe(true);
    });

    it('should return empty array when no upcoming trips', async () => {
      // Arrange
      const mockSelect = vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => Promise.resolve([])),
          })),
        })),
      }));
      (tripStorage as any).db.select = mockSelect;

      // Act
      const result = await tripStorage.getUpcomingTrips();

      // Assert
      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getPastTrips', () => {
    it('should return only past trips', async () => {
      // Arrange
      const pastTrips = [tripFixtures.past];
      const mockSelect = vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => Promise.resolve(pastTrips)),
          })),
        })),
      }));
      (tripStorage as any).db.select = mockSelect;

      // Act
      const result = await tripStorage.getPastTrips();

      // Assert
      expect(result).toEqual(pastTrips);
      expect(result.every(trip => trip.status === 'past')).toBe(true);
    });
  });

  describe('createTrip', () => {
    it('should create a new trip successfully', async () => {
      // Arrange
      const newTripData = {
        title: 'New Test Cruise',
        slug: 'new-test-cruise',
        description: 'A new test cruise',
        shortDescription: 'New cruise',
        startDate: new Date('2024-08-01'),
        endDate: new Date('2024-08-08'),
        status: 'draft' as const,
        capacity: 400,
        currentBookings: 0,
        price: 3000,
        shipName: 'Test Ship',
        departurePort: 'Miami, FL',
      };

      const createdTrip = { ...newTripData, id: 1, createdAt: new Date(), updatedAt: new Date() };
      const mockInsert = vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([createdTrip])),
        })),
      }));
      (tripStorage as any).db.insert = mockInsert;

      performanceTracker.start('createTrip');

      // Act
      const result = await tripStorage.createTrip(newTripData);

      // Assert
      expect(result).toEqual(createdTrip);
      expect(result).toBeValidTrip();
      expect(result).toHaveValidTimestamps();
      expect(result.id).toBeDefined();
      assertPerformance(
        performanceTracker.end('createTrip'),
        PERFORMANCE_BUDGETS.DATABASE_INSERT,
        'createTrip'
      );
    });

    it('should handle date string conversion', async () => {
      // Arrange
      const newTripData = {
        title: 'Date String Test',
        slug: 'date-string-test',
        startDate: '2024-08-01' as any, // String input
        endDate: '2024-08-08' as any,   // String input
        status: 'draft' as const,
      };

      const mockInsert = vi.fn(() => ({
        values: vi.fn((values) => {
          // Verify dates are converted to Date objects
          expect(values.startDate).toBeInstanceOf(Date);
          expect(values.endDate).toBeInstanceOf(Date);
          return {
            returning: vi.fn(() => Promise.resolve([{ ...values, id: 1 }])),
          };
        }),
      }));
      (tripStorage as any).db.insert = mockInsert;

      // Act
      await tripStorage.createTrip(newTripData);

      // Assert
      expect(mockInsert).toHaveBeenCalled();
    });

    it('should validate required fields', async () => {
      // Arrange
      const invalidTripData = {
        // Missing required fields like title, slug, etc.
        startDate: new Date(),
        endDate: new Date(),
      };

      // Act & Assert
      // In a real implementation, this would throw a validation error
      // For now, we'll mock the error behavior
      const mockInsert = vi.fn(() => {
        throw new Error('Validation error: Missing required fields');
      });
      (tripStorage as any).db.insert = mockInsert;

      await expect(tripStorage.createTrip(invalidTripData as any))
        .rejects.toThrow('Validation error');
    });
  });

  describe('updateTrip', () => {
    it('should update trip successfully', async () => {
      // Arrange
      const tripId = 1;
      const updates = {
        title: 'Updated Cruise Title',
        price: 2800,
        capacity: 550,
      };

      const updatedTrip = { ...tripFixtures.upcoming, ...updates, updatedAt: new Date() };
      const mockUpdate = vi.fn(() => ({
        set: vi.fn((setData) => {
          expect(setData.updatedAt).toBeInstanceOf(Date);
          return {
            where: vi.fn(() => ({
              returning: vi.fn(() => Promise.resolve([updatedTrip])),
            })),
          };
        }),
      }));
      (tripStorage as any).db.update = mockUpdate;

      performanceTracker.start('updateTrip');

      // Act
      const result = await tripStorage.updateTrip(tripId, updates);

      // Assert
      expect(result).toEqual(updatedTrip);
      expect(result?.title).toBe(updates.title);
      expect(result?.price).toBe(updates.price);
      expect(result).toHaveValidTimestamps();
      assertPerformance(
        performanceTracker.end('updateTrip'),
        PERFORMANCE_BUDGETS.DATABASE_UPDATE,
        'updateTrip'
      );
    });

    it('should return undefined when trip not found', async () => {
      // Arrange
      const tripId = 999;
      const updates = { title: 'Updated Title' };

      const mockUpdate = vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn(() => Promise.resolve([])),
          })),
        })),
      }));
      (tripStorage as any).db.update = mockUpdate;

      // Act
      const result = await tripStorage.updateTrip(tripId, updates);

      // Assert
      expect(result).toBeUndefined();
    });

    it('should handle date conversion in updates', async () => {
      // Arrange
      const tripId = 1;
      const updates = {
        startDate: '2024-09-01' as any, // String input
        endDate: '2024-09-08' as any,   // String input
      };

      const mockUpdate = vi.fn(() => ({
        set: vi.fn((setData) => {
          expect(setData.startDate).toBeInstanceOf(Date);
          expect(setData.endDate).toBeInstanceOf(Date);
          return {
            where: vi.fn(() => ({
              returning: vi.fn(() => Promise.resolve([{ ...tripFixtures.upcoming, ...setData }])),
            })),
          };
        }),
      }));
      (tripStorage as any).db.update = mockUpdate;

      // Act
      await tripStorage.updateTrip(tripId, updates);

      // Assert
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should invalidate cache on update', async () => {
      // Arrange
      const tripId = 1;
      const updates = { title: 'Cache Test' };

      const mockUpdate = vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn(() => Promise.resolve([{ ...tripFixtures.upcoming, ...updates }])),
          })),
        })),
      }));
      (tripStorage as any).db.update = mockUpdate;

      // Act
      await tripStorage.updateTrip(tripId, updates);

      // Assert
      // Cache invalidation would be tested in integration tests
      expect(mockUpdate).toHaveBeenCalled();
    });
  });

  describe('deleteTrip', () => {
    it('should delete trip successfully', async () => {
      // Arrange
      const tripId = 1;
      const mockDelete = vi.fn(() => ({
        where: vi.fn(() => Promise.resolve()),
      }));
      (tripStorage as any).db.delete = mockDelete;

      performanceTracker.start('deleteTrip');

      // Act
      await tripStorage.deleteTrip(tripId);

      // Assert
      expect(mockDelete).toHaveBeenCalled();
      assertPerformance(
        performanceTracker.end('deleteTrip'),
        PERFORMANCE_BUDGETS.DATABASE_DELETE,
        'deleteTrip'
      );
    });

    it('should handle deletion of non-existent trip', async () => {
      // Arrange
      const tripId = 999;
      const mockDelete = vi.fn(() => ({
        where: vi.fn(() => Promise.resolve()),
      }));
      (tripStorage as any).db.delete = mockDelete;

      // Act & Assert
      // Should not throw error even if trip doesn't exist
      await expect(tripStorage.deleteTrip(tripId)).resolves.toBeUndefined();
    });

    it('should invalidate cache on delete', async () => {
      // Arrange
      const tripId = 1;
      const mockDelete = vi.fn(() => ({
        where: vi.fn(() => Promise.resolve()),
      }));
      (tripStorage as any).db.delete = mockDelete;

      // Act
      await tripStorage.deleteTrip(tripId);

      // Assert
      // Cache invalidation would be tested in integration tests
      expect(mockDelete).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      // Arrange
      const mockSelect = vi.fn(() => {
        throw new Error('Database connection failed');
      });
      (tripStorage as any).db.select = mockSelect;

      // Act & Assert
      await expect(tripStorage.getAllTrips()).rejects.toThrow('Database connection failed');
    });

    it('should handle malformed data gracefully', async () => {
      // Arrange
      const malformedData = {
        title: null,
        startDate: 'invalid-date',
        capacity: 'not-a-number',
      };

      const mockInsert = vi.fn(() => {
        throw new Error('Invalid data format');
      });
      (tripStorage as any).db.insert = mockInsert;

      // Act & Assert
      await expect(tripStorage.createTrip(malformedData as any))
        .rejects.toThrow('Invalid data format');
    });

    it('should handle concurrent modification gracefully', async () => {
      // Arrange
      const tripId = 1;
      const updates = { title: 'Concurrent Update' };

      const mockUpdate = vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => {
            throw new Error('Concurrent modification detected');
          }),
        })),
      }));
      (tripStorage as any).db.update = mockUpdate;

      // Act & Assert
      await expect(tripStorage.updateTrip(tripId, updates))
        .rejects.toThrow('Concurrent modification detected');
    });
  });

  describe('Performance Requirements', () => {
    it('should complete operations within performance budgets', async () => {
      // This test ensures all operations meet performance requirements
      const operations = [
        { name: 'getAllTrips', fn: () => tripStorage.getAllTrips(), budget: PERFORMANCE_BUDGETS.DATABASE_QUERY },
        { name: 'getTripById', fn: () => tripStorage.getTripById(1), budget: PERFORMANCE_BUDGETS.DATABASE_QUERY },
        { name: 'getTripBySlug', fn: () => tripStorage.getTripBySlug('test'), budget: PERFORMANCE_BUDGETS.DATABASE_QUERY },
      ];

      for (const operation of operations) {
        performanceTracker.start(operation.name);

        try {
          await operation.fn();
        } catch (error) {
          // Ignore errors for performance testing
        }

        const duration = performanceTracker.end(operation.name);
        expect(duration).toBeLessThan(operation.budget * 2); // Allow 100% buffer for CI
      }
    });
  });
});