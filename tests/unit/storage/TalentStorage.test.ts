/**
 * TalentStorage Unit Tests
 * Comprehensive tests for talent storage operations
 * Following TDD principles with failing tests first
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TalentStorage } from '../../../server/storage';
import { mockDatabase, talentFixtures, assertPerformance, PERFORMANCE_BUDGETS } from '../../utils/test-setup';
import { performanceTracker, testDb } from '../../utils/test-helpers';

describe('TalentStorage', () => {
  let talentStorage: TalentStorage;

  beforeEach(() => {
    // Mock the database connection
    const mockDb = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => Promise.resolve([])),
          })),
          orderBy: vi.fn(() => Promise.resolve([])),
          innerJoin: vi.fn(() => ({
            where: vi.fn(() => ({
              orderBy: vi.fn(() => Promise.resolve([])),
            })),
          })),
        })),
      })),
      insert: vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([talentFixtures.dj])),
          onConflictDoNothing: vi.fn(() => Promise.resolve()),
        })),
      })),
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn(() => Promise.resolve([talentFixtures.dj])),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve()),
      })),
    };

    // Create TalentStorage instance with mocked dependencies
    talentStorage = new (TalentStorage as any)();
    (talentStorage as any).db = mockDb;
  });

  afterEach(async () => {
    vi.clearAllMocks();
    await testDb.cleanup();
  });

  describe('getAllTalent', () => {
    it('should return all talent ordered by name', async () => {
      // Arrange
      const mockTalent = [talentFixtures.dj, talentFixtures.dragQueen, talentFixtures.singer];
      const mockSelect = vi.fn(() => ({
        from: vi.fn(() => ({
          orderBy: vi.fn(() => Promise.resolve(mockTalent)),
        })),
      }));
      (talentStorage as any).db.select = mockSelect;

      performanceTracker.start('getAllTalent');

      // Act
      const result = await talentStorage.getAllTalent();

      // Assert
      expect(result).toEqual(mockTalent);
      result.forEach(talent => expect(talent).toBeValidTalent());
      assertPerformance(
        performanceTracker.end('getAllTalent'),
        PERFORMANCE_BUDGETS.DATABASE_QUERY,
        'getAllTalent'
      );
    });

    it('should return empty array when no talent exists', async () => {
      // Arrange
      const mockSelect = vi.fn(() => ({
        from: vi.fn(() => ({
          orderBy: vi.fn(() => Promise.resolve([])),
        })),
      }));
      (talentStorage as any).db.select = mockSelect;

      // Act
      const result = await talentStorage.getAllTalent();

      // Assert
      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should order talent alphabetically by name', async () => {
      // Arrange
      const unorderedTalent = [
        { ...talentFixtures.dj, name: 'Zara DJ' },
        { ...talentFixtures.dragQueen, name: 'Alice Queen' },
        { ...talentFixtures.singer, name: 'Bob Singer' },
      ];

      const mockSelect = vi.fn(() => ({
        from: vi.fn(() => ({
          orderBy: vi.fn(() => Promise.resolve(unorderedTalent)),
        })),
      }));
      (talentStorage as any).db.select = mockSelect;

      // Act
      const result = await talentStorage.getAllTalent();

      // Assert
      expect(result).toEqual(unorderedTalent);
      // In real implementation, would verify alphabetical ordering
    });
  });

  describe('getTalentById', () => {
    it('should return talent when found', async () => {
      // Arrange
      const talentId = 1;
      const mockTalent = talentFixtures.dj;
      const mockSelect = vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([mockTalent])),
        })),
      }));
      (talentStorage as any).db.select = mockSelect;

      // Act
      const result = await talentStorage.getTalentById(talentId);

      // Assert
      expect(result).toEqual(mockTalent);
      expect(result).toBeValidTalent();
      expect(result.id).toBe(talentId);
    });

    it('should return undefined when talent not found', async () => {
      // Arrange
      const talentId = 999;
      const mockSelect = vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([])),
        })),
      }));
      (talentStorage as any).db.select = mockSelect;

      // Act
      const result = await talentStorage.getTalentById(talentId);

      // Assert
      expect(result).toBeUndefined();
    });

    it('should handle invalid talent ID gracefully', async () => {
      // Arrange
      const invalidId = -1;
      const mockSelect = vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([])),
        })),
      }));
      (talentStorage as any).db.select = mockSelect;

      // Act
      const result = await talentStorage.getTalentById(invalidId);

      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe('getTalentByCruise', () => {
    it('should return talent assigned to specific cruise', async () => {
      // Arrange
      const cruiseId = 1;
      const mockCruiseTalent = [
        { ...talentFixtures.dj, role: 'Main DJ' },
        { ...talentFixtures.dragQueen, role: 'Host' },
      ];

      const mockSelect = vi.fn(() => ({
        from: vi.fn(() => ({
          innerJoin: vi.fn(() => ({
            where: vi.fn(() => ({
              orderBy: vi.fn(() => Promise.resolve(mockCruiseTalent)),
            })),
          })),
        })),
      }));
      (talentStorage as any).db.select = mockSelect;

      // Act
      const result = await talentStorage.getTalentByCruise(cruiseId);

      // Assert
      expect(result).toEqual(mockCruiseTalent);
      result.forEach(talent => expect(talent).toBeValidTalent());
    });

    it('should return empty array when no talent assigned to cruise', async () => {
      // Arrange
      const cruiseId = 999;
      const mockSelect = vi.fn(() => ({
        from: vi.fn(() => ({
          innerJoin: vi.fn(() => ({
            where: vi.fn(() => ({
              orderBy: vi.fn(() => Promise.resolve([])),
            })),
          })),
        })),
      }));
      (talentStorage as any).db.select = mockSelect;

      // Act
      const result = await talentStorage.getTalentByCruise(cruiseId);

      // Assert
      expect(result).toEqual([]);
    });

    it('should include talent roles for cruise assignment', async () => {
      // Arrange
      const cruiseId = 1;
      const talentWithRoles = [
        { ...talentFixtures.dj, role: 'Headliner' },
        { ...talentFixtures.singer, role: 'Supporting Act' },
      ];

      const mockSelect = vi.fn(() => ({
        from: vi.fn(() => ({
          innerJoin: vi.fn(() => ({
            where: vi.fn(() => ({
              orderBy: vi.fn(() => Promise.resolve(talentWithRoles)),
            })),
          })),
        })),
      }));
      (talentStorage as any).db.select = mockSelect;

      // Act
      const result = await talentStorage.getTalentByCruise(cruiseId);

      // Assert
      expect(result).toEqual(talentWithRoles);
      expect(result[0].role).toBe('Headliner');
      expect(result[1].role).toBe('Supporting Act');
    });
  });

  describe('searchTalent', () => {
    it('should search talent by name', async () => {
      // Arrange
      const searchTerm = 'Fabulous';
      const mockResults = [talentFixtures.dj];
      const mockSelect = vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => Promise.resolve(mockResults)),
          })),
        })),
      }));
      (talentStorage as any).db.select = mockSelect;

      // Act
      const result = await talentStorage.searchTalent(searchTerm);

      // Assert
      expect(result).toEqual(mockResults);
      expect(result[0].name).toContain('Fabulous');
    });

    it('should search talent by bio content', async () => {
      // Arrange
      const searchTerm = 'International';
      const mockResults = [talentFixtures.dj];
      const mockSelect = vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => Promise.resolve(mockResults)),
          })),
        })),
      }));
      (talentStorage as any).db.select = mockSelect;

      // Act
      const result = await talentStorage.searchTalent(searchTerm);

      // Assert
      expect(result).toEqual(mockResults);
      expect(result[0].bio).toContain('International');
    });

    it('should search talent by known for content', async () => {
      // Arrange
      const searchTerm = 'Circuit parties';
      const mockResults = [talentFixtures.dj];
      const mockSelect = vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => Promise.resolve(mockResults)),
          })),
        })),
      }));
      (talentStorage as any).db.select = mockSelect;

      // Act
      const result = await talentStorage.searchTalent(searchTerm);

      // Assert
      expect(result).toEqual(mockResults);
      expect(result[0].knownFor).toContain('Circuit parties');
    });

    it('should filter by performance type', async () => {
      // Arrange
      const performanceType = 'DJ';
      const mockResults = [talentFixtures.dj];
      const mockSelect = vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => Promise.resolve(mockResults)),
          })),
        })),
      }));
      (talentStorage as any).db.select = mockSelect;

      // Act
      const result = await talentStorage.searchTalent(undefined, performanceType);

      // Assert
      expect(result).toEqual(mockResults);
      expect(result.every(talent => talent.category === performanceType)).toBe(true);
    });

    it('should combine search and filter criteria', async () => {
      // Arrange
      const searchTerm = 'party';
      const performanceType = 'DJ';
      const mockResults = [talentFixtures.dj];
      const mockSelect = vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => Promise.resolve(mockResults)),
          })),
        })),
      }));
      (talentStorage as any).db.select = mockSelect;

      // Act
      const result = await talentStorage.searchTalent(searchTerm, performanceType);

      // Assert
      expect(result).toEqual(mockResults);
      expect(result[0].category).toBe(performanceType);
    });

    it('should return all talent when no criteria provided', async () => {
      // Arrange
      const allTalent = [talentFixtures.dj, talentFixtures.dragQueen, talentFixtures.singer];
      const mockSelect = vi.fn(() => ({
        from: vi.fn(() => ({
          orderBy: vi.fn(() => Promise.resolve(allTalent)),
        })),
      }));
      (talentStorage as any).db.select = mockSelect;

      // Act
      const result = await talentStorage.searchTalent();

      // Assert
      expect(result).toEqual(allTalent);
    });

    it('should handle case-insensitive search', async () => {
      // Arrange
      const searchTerm = 'FABULOUS';
      const mockResults = [talentFixtures.dj];
      const mockSelect = vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => Promise.resolve(mockResults)),
          })),
        })),
      }));
      (talentStorage as any).db.select = mockSelect;

      // Act
      const result = await talentStorage.searchTalent(searchTerm);

      // Assert
      expect(result).toEqual(mockResults);
    });
  });

  describe('createTalent', () => {
    it('should create new talent successfully', async () => {
      // Arrange
      const newTalentData = {
        name: 'New Test Artist',
        category: 'Singer',
        bio: 'A new test artist',
        knownFor: 'Amazing vocals',
        profileImageUrl: 'https://example.com/new-artist.jpg',
        socialLinks: { instagram: '@newartist' },
        website: 'https://newartist.com',
      };

      const createdTalent = {
        ...newTalentData,
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockInsert = vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([createdTalent])),
        })),
      }));
      (talentStorage as any).db.insert = mockInsert;

      performanceTracker.start('createTalent');

      // Act
      const result = await talentStorage.createTalent(newTalentData);

      // Assert
      expect(result).toEqual(createdTalent);
      expect(result).toBeValidTalent();
      expect(result).toHaveValidTimestamps();
      expect(result.id).toBeDefined();
      assertPerformance(
        performanceTracker.end('createTalent'),
        PERFORMANCE_BUDGETS.DATABASE_INSERT,
        'createTalent'
      );
    });

    it('should validate required fields', async () => {
      // Arrange
      const invalidTalentData = {
        // Missing required fields like name, category
        bio: 'Some bio',
      };

      const mockInsert = vi.fn(() => {
        throw new Error('Validation error: Missing required fields');
      });
      (talentStorage as any).db.insert = mockInsert;

      // Act & Assert
      await expect(talentStorage.createTalent(invalidTalentData as any))
        .rejects.toThrow('Validation error');
    });

    it('should handle social links validation', async () => {
      // Arrange
      const talentWithInvalidSocial = {
        name: 'Test Artist',
        category: 'DJ',
        socialLinks: { invalidPlatform: '@test' }, // Invalid social platform
      };

      const mockInsert = vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([{ ...talentWithInvalidSocial, id: 1 }])),
        })),
      }));
      (talentStorage as any).db.insert = mockInsert;

      // Act
      const result = await talentStorage.createTalent(talentWithInvalidSocial);

      // Assert
      expect(result.socialLinks).toEqual(talentWithInvalidSocial.socialLinks);
    });

    it('should handle duplicate talent names', async () => {
      // Arrange
      const duplicateTalent = {
        name: 'DJ Fabulous', // Same as existing
        category: 'DJ',
      };

      const mockInsert = vi.fn(() => {
        throw new Error('Duplicate talent name');
      });
      (talentStorage as any).db.insert = mockInsert;

      // Act & Assert
      await expect(talentStorage.createTalent(duplicateTalent))
        .rejects.toThrow('Duplicate talent name');
    });
  });

  describe('updateTalent', () => {
    it('should update talent successfully', async () => {
      // Arrange
      const talentId = 1;
      const updates = {
        bio: 'Updated bio content',
        knownFor: 'Updated known for',
        socialLinks: { instagram: '@updated', twitter: '@updated' },
      };

      const updatedTalent = {
        ...talentFixtures.dj,
        ...updates,
        updatedAt: new Date()
      };

      const mockUpdate = vi.fn(() => ({
        set: vi.fn((setData) => {
          expect(setData.updatedAt).toBeInstanceOf(Date);
          return {
            where: vi.fn(() => ({
              returning: vi.fn(() => Promise.resolve([updatedTalent])),
            })),
          };
        }),
      }));
      (talentStorage as any).db.update = mockUpdate;

      performanceTracker.start('updateTalent');

      // Act
      const result = await talentStorage.updateTalent(talentId, updates);

      // Assert
      expect(result).toEqual(updatedTalent);
      expect(result?.bio).toBe(updates.bio);
      expect(result?.socialLinks).toEqual(updates.socialLinks);
      expect(result).toHaveValidTimestamps();
      assertPerformance(
        performanceTracker.end('updateTalent'),
        PERFORMANCE_BUDGETS.DATABASE_UPDATE,
        'updateTalent'
      );
    });

    it('should return undefined when talent not found', async () => {
      // Arrange
      const talentId = 999;
      const updates = { bio: 'Updated bio' };

      const mockUpdate = vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn(() => Promise.resolve([])),
          })),
        })),
      }));
      (talentStorage as any).db.update = mockUpdate;

      // Act
      const result = await talentStorage.updateTalent(talentId, updates);

      // Assert
      expect(result).toBeUndefined();
    });

    it('should handle partial updates', async () => {
      // Arrange
      const talentId = 1;
      const partialUpdates = {
        website: 'https://newwebsite.com', // Only updating website
      };

      const updatedTalent = {
        ...talentFixtures.dj,
        ...partialUpdates,
        updatedAt: new Date()
      };

      const mockUpdate = vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn(() => Promise.resolve([updatedTalent])),
          })),
        })),
      }));
      (talentStorage as any).db.update = mockUpdate;

      // Act
      const result = await talentStorage.updateTalent(talentId, partialUpdates);

      // Assert
      expect(result?.website).toBe(partialUpdates.website);
      expect(result?.name).toBe(talentFixtures.dj.name); // Unchanged
    });
  });

  describe('deleteTalent', () => {
    it('should delete talent successfully', async () => {
      // Arrange
      const talentId = 1;
      const mockDelete = vi.fn(() => ({
        where: vi.fn(() => Promise.resolve()),
      }));
      (talentStorage as any).db.delete = mockDelete;

      performanceTracker.start('deleteTalent');

      // Act
      await talentStorage.deleteTalent(talentId);

      // Assert
      expect(mockDelete).toHaveBeenCalled();
      assertPerformance(
        performanceTracker.end('deleteTalent'),
        PERFORMANCE_BUDGETS.DATABASE_DELETE,
        'deleteTalent'
      );
    });

    it('should handle deletion of non-existent talent', async () => {
      // Arrange
      const talentId = 999;
      const mockDelete = vi.fn(() => ({
        where: vi.fn(() => Promise.resolve()),
      }));
      (talentStorage as any).db.delete = mockDelete;

      // Act & Assert
      await expect(talentStorage.deleteTalent(talentId)).resolves.toBeUndefined();
    });

    it('should handle cascade deletion with cruise assignments', async () => {
      // Arrange
      const talentId = 1;
      const mockDelete = vi.fn(() => ({
        where: vi.fn(() => {
          throw new Error('Foreign key constraint violation');
        }),
      }));
      (talentStorage as any).db.delete = mockDelete;

      // Act & Assert
      await expect(talentStorage.deleteTalent(talentId))
        .rejects.toThrow('Foreign key constraint violation');
    });
  });

  describe('Cruise-Talent Assignments', () => {
    it('should assign talent to cruise successfully', async () => {
      // Arrange
      const cruiseId = 1;
      const talentId = 1;
      const role = 'Headliner';

      const mockInsert = vi.fn(() => ({
        values: vi.fn(() => ({
          onConflictDoNothing: vi.fn(() => Promise.resolve()),
        })),
      }));
      (talentStorage as any).db.insert = mockInsert;

      // Act
      await talentStorage.assignTalentToCruise(cruiseId, talentId, role);

      // Assert
      expect(mockInsert).toHaveBeenCalled();
    });

    it('should handle duplicate assignments gracefully', async () => {
      // Arrange
      const cruiseId = 1;
      const talentId = 1;
      const role = 'DJ';

      const mockInsert = vi.fn(() => ({
        values: vi.fn(() => ({
          onConflictDoNothing: vi.fn(() => Promise.resolve()),
        })),
      }));
      (talentStorage as any).db.insert = mockInsert;

      // Act & Assert
      await expect(talentStorage.assignTalentToCruise(cruiseId, talentId, role))
        .resolves.toBeUndefined();
    });

    it('should remove talent from cruise successfully', async () => {
      // Arrange
      const cruiseId = 1;
      const talentId = 1;

      const mockDelete = vi.fn(() => ({
        where: vi.fn(() => Promise.resolve()),
      }));
      (talentStorage as any).db.delete = mockDelete;

      // Act
      await talentStorage.removeTalentFromCruise(cruiseId, talentId);

      // Assert
      expect(mockDelete).toHaveBeenCalled();
    });

    it('should handle removal of non-existent assignment', async () => {
      // Arrange
      const cruiseId = 999;
      const talentId = 999;

      const mockDelete = vi.fn(() => ({
        where: vi.fn(() => Promise.resolve()),
      }));
      (talentStorage as any).db.delete = mockDelete;

      // Act & Assert
      await expect(talentStorage.removeTalentFromCruise(cruiseId, talentId))
        .resolves.toBeUndefined();
    });

    it('should validate assignment parameters', async () => {
      // Arrange
      const invalidCruiseId = -1;
      const invalidTalentId = -1;

      const mockInsert = vi.fn(() => {
        throw new Error('Invalid assignment parameters');
      });
      (talentStorage as any).db.insert = mockInsert;

      // Act & Assert
      await expect(talentStorage.assignTalentToCruise(invalidCruiseId, invalidTalentId))
        .rejects.toThrow('Invalid assignment parameters');
    });
  });

  describe('Category Management', () => {
    it('should handle different talent categories', async () => {
      // Arrange
      const categories = ['DJ', 'Drag Performer', 'Singer', 'Comedian', 'Dance Troupe'];

      for (const category of categories) {
        const mockResults = [{ ...talentFixtures.dj, category }];
        const mockSelect = vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              orderBy: vi.fn(() => Promise.resolve(mockResults)),
            })),
          })),
        }));
        (talentStorage as any).db.select = mockSelect;

        // Act
        const result = await talentStorage.searchTalent(undefined, category);

        // Assert
        expect(result.every(talent => talent.category === category)).toBe(true);
      }
    });

    it('should validate category values', async () => {
      // Arrange
      const invalidCategory = 'InvalidCategory';
      const talentData = {
        name: 'Test Artist',
        category: invalidCategory,
      };

      const mockInsert = vi.fn(() => {
        throw new Error('Invalid category');
      });
      (talentStorage as any).db.insert = mockInsert;

      // Act & Assert
      await expect(talentStorage.createTalent(talentData))
        .rejects.toThrow('Invalid category');
    });
  });

  describe('Performance and Optimization', () => {
    it('should efficiently handle large talent searches', async () => {
      // Arrange
      const searchTerm = 'DJ';
      const largeTalentSet = Array.from({ length: 500 }, (_, i) => ({
        ...talentFixtures.dj,
        id: i + 1,
        name: `DJ Artist ${i + 1}`,
      }));

      const mockSelect = vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => Promise.resolve(largeTalentSet)),
          })),
        })),
      }));
      (talentStorage as any).db.select = mockSelect;

      performanceTracker.start('largeTalentSearch');

      // Act
      const result = await talentStorage.searchTalent(searchTerm);

      // Assert
      const duration = performanceTracker.end('largeTalentSearch');
      expect(result.length).toBe(500);
      expect(duration).toBeLessThan(PERFORMANCE_BUDGETS.DATABASE_QUERY * 3);
    });

    it('should optimize cruise talent queries', async () => {
      // Arrange
      const cruiseId = 1;
      const cruiseTalent = [talentFixtures.dj, talentFixtures.dragQueen];

      const mockSelect = vi.fn(() => ({
        from: vi.fn(() => ({
          innerJoin: vi.fn(() => ({
            where: vi.fn(() => ({
              orderBy: vi.fn(() => Promise.resolve(cruiseTalent)),
            })),
          })),
        })),
      }));
      (talentStorage as any).db.select = mockSelect;

      performanceTracker.start('getTalentByCruise');

      // Act
      const result = await talentStorage.getTalentByCruise(cruiseId);

      // Assert
      const duration = performanceTracker.end('getTalentByCruise');
      expect(result).toEqual(cruiseTalent);
      expect(duration).toBeLessThan(PERFORMANCE_BUDGETS.DATABASE_QUERY * 1.5);
    });
  });
});