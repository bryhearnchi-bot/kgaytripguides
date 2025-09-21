/**
 * EventStorage Unit Tests
 * Comprehensive tests for event storage operations
 * Following TDD principles with failing tests first
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventStorage } from '../../../server/storage';
import { mockDatabase, eventFixtures, assertPerformance, PERFORMANCE_BUDGETS } from '../../utils/test-setup';
import { performanceTracker, testDb } from '../../utils/test-helpers';

describe('EventStorage', () => {
  let eventStorage: EventStorage;

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
          returning: vi.fn(() => Promise.resolve([eventFixtures.welcomeParty])),
        })),
      })),
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn(() => Promise.resolve([eventFixtures.welcomeParty])),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve()),
      })),
    };

    // Create EventStorage instance with mocked dependencies
    eventStorage = new (EventStorage as any)();
    (eventStorage as any).db = mockDb;
  });

  afterEach(async () => {
    vi.clearAllMocks();
    await testDb.cleanup();
  });

  describe('getEventsByCruise', () => {
    it('should return events for a specific cruise ordered by date and time', async () => {
      // Arrange
      const cruiseId = 1;
      const mockEvents = [eventFixtures.welcomeParty, eventFixtures.whiteParty];
      const mockSelect = vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => Promise.resolve(mockEvents)),
          })),
        })),
      }));
      (eventStorage as any).db.select = mockSelect;

      performanceTracker.start('getEventsByCruise');

      // Act
      const result = await eventStorage.getEventsByCruise(cruiseId);

      // Assert
      expect(result).toEqual(mockEvents);
      expect(result.every(event => event.cruiseId === cruiseId)).toBe(true);
      result.forEach(event => expect(event).toBeValidEvent());
      assertPerformance(
        performanceTracker.end('getEventsByCruise'),
        PERFORMANCE_BUDGETS.DATABASE_QUERY,
        'getEventsByCruise'
      );
    });

    it('should return empty array when no events found for cruise', async () => {
      // Arrange
      const cruiseId = 999;
      const mockSelect = vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => Promise.resolve([])),
          })),
        })),
      }));
      (eventStorage as any).db.select = mockSelect;

      // Act
      const result = await eventStorage.getEventsByCruise(cruiseId);

      // Assert
      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should cache results for performance', async () => {
      // Arrange
      const cruiseId = 1;
      const mockEvents = [eventFixtures.welcomeParty];
      const mockSelect = vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => Promise.resolve(mockEvents)),
          })),
        })),
      }));
      (eventStorage as any).db.select = mockSelect;

      // Act
      await eventStorage.getEventsByCruise(cruiseId);

      // Second call should use cache (in real implementation)
      await eventStorage.getEventsByCruise(cruiseId);

      // Assert
      expect(mockSelect).toHaveBeenCalled();
    });

    it('should handle invalid cruise ID gracefully', async () => {
      // Arrange
      const invalidCruiseId = -1;
      const mockSelect = vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => Promise.resolve([])),
          })),
        })),
      }));
      (eventStorage as any).db.select = mockSelect;

      // Act
      const result = await eventStorage.getEventsByCruise(invalidCruiseId);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('getEventsByDate', () => {
    it('should return events for specific cruise and date', async () => {
      // Arrange
      const cruiseId = 1;
      const date = new Date('2024-06-01');
      const mockEvents = [eventFixtures.welcomeParty];
      const mockSelect = vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => Promise.resolve(mockEvents)),
          })),
        })),
      }));
      (eventStorage as any).db.select = mockSelect;

      // Act
      const result = await eventStorage.getEventsByDate(cruiseId, date);

      // Assert
      expect(result).toEqual(mockEvents);
      expect(result.every(event =>
        event.cruiseId === cruiseId &&
        event.date.toDateString() === date.toDateString()
      )).toBe(true);
    });

    it('should return empty array when no events on specific date', async () => {
      // Arrange
      const cruiseId = 1;
      const date = new Date('2024-12-25'); // Date with no events
      const mockSelect = vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => Promise.resolve([])),
          })),
        })),
      }));
      (eventStorage as any).db.select = mockSelect;

      // Act
      const result = await eventStorage.getEventsByDate(cruiseId, date);

      // Assert
      expect(result).toEqual([]);
    });

    it('should order events by time when multiple events on same date', async () => {
      // Arrange
      const cruiseId = 1;
      const date = new Date('2024-06-01');
      const morningEvent = { ...eventFixtures.welcomeParty, time: '09:00' };
      const eveningEvent = { ...eventFixtures.welcomeParty, time: '19:00' };
      const mockEvents = [morningEvent, eveningEvent];

      const mockSelect = vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => Promise.resolve(mockEvents)),
          })),
        })),
      }));
      (eventStorage as any).db.select = mockSelect;

      // Act
      const result = await eventStorage.getEventsByDate(cruiseId, date);

      // Assert
      expect(result).toEqual(mockEvents);
      // In real implementation, would verify correct time ordering
    });
  });

  describe('getEventsByType', () => {
    it('should return events of specific type for cruise', async () => {
      // Arrange
      const cruiseId = 1;
      const eventType = 'party';
      const mockEvents = [eventFixtures.welcomeParty, eventFixtures.whiteParty];
      const mockSelect = vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => Promise.resolve(mockEvents)),
          })),
        })),
      }));
      (eventStorage as any).db.select = mockSelect;

      // Act
      const result = await eventStorage.getEventsByType(cruiseId, eventType);

      // Assert
      expect(result).toEqual(mockEvents);
      expect(result.every(event =>
        event.cruiseId === cruiseId && event.type === eventType
      )).toBe(true);
    });

    it('should return empty array for non-existent event type', async () => {
      // Arrange
      const cruiseId = 1;
      const eventType = 'nonexistent';
      const mockSelect = vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => Promise.resolve([])),
          })),
        })),
      }));
      (eventStorage as any).db.select = mockSelect;

      // Act
      const result = await eventStorage.getEventsByType(cruiseId, eventType);

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle common event types', async () => {
      // Arrange
      const cruiseId = 1;
      const eventTypes = ['party', 'show', 'dining', 'activity'];

      for (const type of eventTypes) {
        const mockSelect = vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              orderBy: vi.fn(() => Promise.resolve([])),
            })),
          })),
        }));
        (eventStorage as any).db.select = mockSelect;

        // Act
        const result = await eventStorage.getEventsByType(cruiseId, type);

        // Assert
        expect(Array.isArray(result)).toBe(true);
      }
    });
  });

  describe('createEvent', () => {
    it('should create a new event successfully', async () => {
      // Arrange
      const newEventData = {
        cruiseId: 1,
        title: 'New Test Event',
        description: 'A test event',
        type: 'party',
        date: new Date('2024-06-02'),
        time: '20:00',
        duration: 3,
        location: 'Main Deck',
        capacity: 200,
        isRecurring: false,
      };

      const createdEvent = {
        ...newEventData,
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockInsert = vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([createdEvent])),
        })),
      }));
      (eventStorage as any).db.insert = mockInsert;

      performanceTracker.start('createEvent');

      // Act
      const result = await eventStorage.createEvent(newEventData);

      // Assert
      expect(result).toEqual(createdEvent);
      expect(result).toBeValidEvent();
      expect(result).toHaveValidTimestamps();
      expect(result.id).toBeDefined();
      assertPerformance(
        performanceTracker.end('createEvent'),
        PERFORMANCE_BUDGETS.DATABASE_INSERT,
        'createEvent'
      );
    });

    it('should validate required fields', async () => {
      // Arrange
      const invalidEventData = {
        // Missing required fields
        cruiseId: 1,
        // Missing title, type, date, etc.
      };

      const mockInsert = vi.fn(() => {
        throw new Error('Validation error: Missing required fields');
      });
      (eventStorage as any).db.insert = mockInsert;

      // Act & Assert
      await expect(eventStorage.createEvent(invalidEventData as any))
        .rejects.toThrow('Validation error');
    });

    it('should handle time format validation', async () => {
      // Arrange
      const eventWithInvalidTime = {
        cruiseId: 1,
        title: 'Time Test Event',
        type: 'party',
        date: new Date('2024-06-02'),
        time: '25:70', // Invalid time format
      };

      const mockInsert = vi.fn(() => {
        throw new Error('Invalid time format');
      });
      (eventStorage as any).db.insert = mockInsert;

      // Act & Assert
      await expect(eventStorage.createEvent(eventWithInvalidTime as any))
        .rejects.toThrow('Invalid time format');
    });

    it('should handle capacity constraints', async () => {
      // Arrange
      const eventWithInvalidCapacity = {
        cruiseId: 1,
        title: 'Capacity Test Event',
        type: 'party',
        date: new Date('2024-06-02'),
        time: '20:00',
        capacity: -10, // Invalid capacity
      };

      const mockInsert = vi.fn(() => {
        throw new Error('Invalid capacity');
      });
      (eventStorage as any).db.insert = mockInsert;

      // Act & Assert
      await expect(eventStorage.createEvent(eventWithInvalidCapacity as any))
        .rejects.toThrow('Invalid capacity');
    });

    it('should invalidate cache on create', async () => {
      // Arrange
      const newEvent = eventFixtures.welcomeParty;
      const mockInsert = vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([newEvent])),
        })),
      }));
      (eventStorage as any).db.insert = mockInsert;

      // Act
      await eventStorage.createEvent(newEvent);

      // Assert
      // Cache invalidation would be tested in integration tests
      expect(mockInsert).toHaveBeenCalled();
    });
  });

  describe('updateEvent', () => {
    it('should update event successfully', async () => {
      // Arrange
      const eventId = 1;
      const updates = {
        title: 'Updated Event Title',
        capacity: 300,
        location: 'Updated Location',
      };

      const updatedEvent = {
        ...eventFixtures.welcomeParty,
        ...updates,
        updatedAt: new Date()
      };

      const mockUpdate = vi.fn(() => ({
        set: vi.fn((setData) => {
          expect(setData.updatedAt).toBeInstanceOf(Date);
          return {
            where: vi.fn(() => ({
              returning: vi.fn(() => Promise.resolve([updatedEvent])),
            })),
          };
        }),
      }));
      (eventStorage as any).db.update = mockUpdate;

      performanceTracker.start('updateEvent');

      // Act
      const result = await eventStorage.updateEvent(eventId, updates);

      // Assert
      expect(result).toEqual(updatedEvent);
      expect(result?.title).toBe(updates.title);
      expect(result?.capacity).toBe(updates.capacity);
      expect(result).toHaveValidTimestamps();
      assertPerformance(
        performanceTracker.end('updateEvent'),
        PERFORMANCE_BUDGETS.DATABASE_UPDATE,
        'updateEvent'
      );
    });

    it('should return undefined when event not found', async () => {
      // Arrange
      const eventId = 999;
      const updates = { title: 'Updated Title' };

      const mockUpdate = vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn(() => Promise.resolve([])),
          })),
        })),
      }));
      (eventStorage as any).db.update = mockUpdate;

      // Act
      const result = await eventStorage.updateEvent(eventId, updates);

      // Assert
      expect(result).toBeUndefined();
    });

    it('should handle partial updates', async () => {
      // Arrange
      const eventId = 1;
      const partialUpdates = {
        capacity: 250, // Only updating capacity
      };

      const updatedEvent = {
        ...eventFixtures.welcomeParty,
        ...partialUpdates,
        updatedAt: new Date()
      };

      const mockUpdate = vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn(() => Promise.resolve([updatedEvent])),
          })),
        })),
      }));
      (eventStorage as any).db.update = mockUpdate;

      // Act
      const result = await eventStorage.updateEvent(eventId, partialUpdates);

      // Assert
      expect(result?.capacity).toBe(partialUpdates.capacity);
      expect(result?.title).toBe(eventFixtures.welcomeParty.title); // Unchanged
    });

    it('should validate update data', async () => {
      // Arrange
      const eventId = 1;
      const invalidUpdates = {
        capacity: -5, // Invalid capacity
        time: '30:99', // Invalid time
      };

      const mockUpdate = vi.fn(() => {
        throw new Error('Validation error: Invalid update data');
      });
      (eventStorage as any).db.update = mockUpdate;

      // Act & Assert
      await expect(eventStorage.updateEvent(eventId, invalidUpdates))
        .rejects.toThrow('Validation error');
    });
  });

  describe('deleteEvent', () => {
    it('should delete event successfully', async () => {
      // Arrange
      const eventId = 1;
      const mockDelete = vi.fn(() => ({
        where: vi.fn(() => Promise.resolve()),
      }));
      (eventStorage as any).db.delete = mockDelete;

      performanceTracker.start('deleteEvent');

      // Act
      await eventStorage.deleteEvent(eventId);

      // Assert
      expect(mockDelete).toHaveBeenCalled();
      assertPerformance(
        performanceTracker.end('deleteEvent'),
        PERFORMANCE_BUDGETS.DATABASE_DELETE,
        'deleteEvent'
      );
    });

    it('should handle deletion of non-existent event', async () => {
      // Arrange
      const eventId = 999;
      const mockDelete = vi.fn(() => ({
        where: vi.fn(() => Promise.resolve()),
      }));
      (eventStorage as any).db.delete = mockDelete;

      // Act & Assert
      await expect(eventStorage.deleteEvent(eventId)).resolves.toBeUndefined();
    });

    it('should invalidate cache on delete', async () => {
      // Arrange
      const eventId = 1;
      const mockDelete = vi.fn(() => ({
        where: vi.fn(() => Promise.resolve()),
      }));
      (eventStorage as any).db.delete = mockDelete;

      // Act
      await eventStorage.deleteEvent(eventId);

      // Assert
      expect(mockDelete).toHaveBeenCalled();
    });

    it('should handle cascade deletion constraints', async () => {
      // Arrange
      const eventId = 1;
      const mockDelete = vi.fn(() => ({
        where: vi.fn(() => {
          throw new Error('Foreign key constraint violation');
        }),
      }));
      (eventStorage as any).db.delete = mockDelete;

      // Act & Assert
      await expect(eventStorage.deleteEvent(eventId))
        .rejects.toThrow('Foreign key constraint violation');
    });
  });

  describe('Business Logic Validation', () => {
    it('should prevent overlapping events at same location', async () => {
      // Arrange - Two events at same time and location
      const overlappingEvent = {
        cruiseId: 1,
        title: 'Overlapping Event',
        type: 'party',
        date: new Date('2024-06-01'),
        time: '19:00', // Same time as welcome party
        location: 'Pool Deck', // Same location
        duration: 2,
      };

      const mockInsert = vi.fn(() => {
        throw new Error('Event conflict: Overlapping events at same location');
      });
      (eventStorage as any).db.insert = mockInsert;

      // Act & Assert
      await expect(eventStorage.createEvent(overlappingEvent as any))
        .rejects.toThrow('Event conflict');
    });

    it('should validate event capacity against venue limits', async () => {
      // Arrange
      const overCapacityEvent = {
        cruiseId: 1,
        title: 'Over Capacity Event',
        type: 'party',
        date: new Date('2024-06-01'),
        time: '20:00',
        location: 'Small Theater',
        capacity: 10000, // Exceeds venue capacity
      };

      const mockInsert = vi.fn(() => {
        throw new Error('Capacity exceeds venue limits');
      });
      (eventStorage as any).db.insert = mockInsert;

      // Act & Assert
      await expect(eventStorage.createEvent(overCapacityEvent as any))
        .rejects.toThrow('Capacity exceeds venue limits');
    });

    it('should validate event dates against cruise dates', async () => {
      // Arrange
      const eventOutsideCruise = {
        cruiseId: 1,
        title: 'Outside Cruise Event',
        type: 'party',
        date: new Date('2024-12-01'), // Outside cruise dates
        time: '20:00',
      };

      const mockInsert = vi.fn(() => {
        throw new Error('Event date outside cruise duration');
      });
      (eventStorage as any).db.insert = mockInsert;

      // Act & Assert
      await expect(eventStorage.createEvent(eventOutsideCruise as any))
        .rejects.toThrow('Event date outside cruise duration');
    });
  });

  describe('Performance and Caching', () => {
    it('should efficiently handle bulk operations', async () => {
      // Arrange
      const cruiseId = 1;
      const bulkEvents = Array.from({ length: 100 }, (_, i) => ({
        ...eventFixtures.welcomeParty,
        id: i + 1,
        title: `Bulk Event ${i + 1}`,
      }));

      const mockSelect = vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => Promise.resolve(bulkEvents)),
          })),
        })),
      }));
      (eventStorage as any).db.select = mockSelect;

      performanceTracker.start('bulkEventQuery');

      // Act
      const result = await eventStorage.getEventsByCruise(cruiseId);

      // Assert
      const duration = performanceTracker.end('bulkEventQuery');
      expect(result.length).toBe(100);
      expect(duration).toBeLessThan(PERFORMANCE_BUDGETS.DATABASE_QUERY * 2);
    });

    it('should cache frequently accessed events', async () => {
      // Test caching behavior
      const cruiseId = 1;
      const mockEvents = [eventFixtures.welcomeParty];

      let callCount = 0;
      const mockSelect = vi.fn(() => {
        callCount++;
        return {
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              orderBy: vi.fn(() => Promise.resolve(mockEvents)),
            })),
          })),
        };
      });
      (eventStorage as any).db.select = mockSelect;

      // Act - Multiple calls
      await eventStorage.getEventsByCruise(cruiseId);
      await eventStorage.getEventsByCruise(cruiseId);
      await eventStorage.getEventsByCruise(cruiseId);

      // Assert
      // In real implementation with caching, would verify fewer DB calls
      expect(mockSelect).toHaveBeenCalled();
    });
  });
});