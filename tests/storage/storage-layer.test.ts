/**
 * Storage Layer Tests
 * Tests for new storage classes that will be created during migration
 * These tests will fail initially (TDD Red phase)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '../../server/storage';
import type { Port } from '../../shared/schema';

// Storage class for ports
import { PortStorage } from '../../server/storage/PortStorage';

describe('PortStorage', () => {
  let portStorage: PortStorage;

  beforeEach(() => {
    portStorage = new PortStorage(db);
  });

  afterEach(async () => {
    // Clean up test data
    await db.raw('DELETE FROM ports WHERE name LIKE $1', ['TEST_%']);
  });

  describe('CRUD Operations', () => {
    it('should create a new port', async () => {
      const newPort = {
        name: 'TEST_Athens',
        country: 'Greece',
        region: 'Mediterranean',
        port_type: 'port' as const,
        coordinates: { lat: 37.9838, lng: 23.7275 },
        description: 'Capital of Greece',
        image_url: 'https://example.com/athens.jpg'
      };

      const created = await portStorage.create(newPort);

      expect(created).toBeDefined();
      expect(created.id).toBeDefined();
      expect(created.name).toBe(newPort.name);
      expect(created.country).toBe(newPort.country);
      expect(created.coordinates).toEqual(newPort.coordinates);
    });

    it('should get a port by id', async () => {
      const port = await portStorage.create({
        name: 'TEST_Santorini',
        country: 'Greece',
        region: 'Mediterranean',
        port_type: 'port' as const
      });

      const retrieved = await portStorage.getById(port.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(port.id);
      expect(retrieved?.name).toBe('TEST_Santorini');
    });

    it('should update a port', async () => {
      const port = await portStorage.create({
        name: 'TEST_Istanbul',
        country: 'Turkey',
        region: 'Mediterranean',
        port_type: 'port' as const
      });

      const updated = await portStorage.update(port.id, {
        description: 'Where East meets West',
        coordinates: { lat: 41.0082, lng: 28.9784 }
      });

      expect(updated.description).toBe('Where East meets West');
      expect(updated.coordinates).toEqual({ lat: 41.0082, lng: 28.9784 });
    });

    it('should delete a port', async () => {
      const port = await portStorage.create({
        name: 'TEST_ToDelete',
        country: 'Test',
        region: 'Test',
        port_type: 'port' as const
      });

      const deleted = await portStorage.delete(port.id);
      expect(deleted).toBe(true);

      const retrieved = await portStorage.getById(port.id);
      expect(retrieved).toBeNull();
    });

    it('should list all ports with filtering', async () => {
      // Create test ports
      await portStorage.create({
        name: 'TEST_Port1',
        country: 'Greece',
        region: 'Mediterranean',
        port_type: 'port' as const
      });

      await portStorage.create({
        name: 'TEST_Port2',
        country: 'Greece',
        region: 'Mediterranean',
        port_type: 'sea_day' as const
      });

      // Test filtering by region
      const mediterraneanPorts = await portStorage.list({
        region: 'Mediterranean'
      });
      expect(mediterraneanPorts.length).toBeGreaterThanOrEqual(2);

      // Test filtering by port_type
      const seaDays = await portStorage.list({
        port_type: 'sea_day'
      });
      expect(seaDays.some(p => p.port_type === 'sea_day')).toBe(true);
    });
  });

  describe('Special Operations', () => {
    it('should find port by name (case-insensitive)', async () => {
      await portStorage.create({
        name: 'TEST_Mykonos',
        country: 'Greece',
        region: 'Mediterranean',
        port_type: 'port' as const
      });

      const found = await portStorage.findByName('test_mykonos');
      expect(found).toBeDefined();
      expect(found?.name).toBe('TEST_Mykonos');
    });

    it('should get ports by trip', async () => {
      // This would get all ports for a specific trip's itinerary
      const tripId = 1;
      const ports = await portStorage.getByTrip(tripId);

      expect(Array.isArray(ports)).toBe(true);
      // Should return ports in itinerary order
      if (ports.length > 1) {
        expect(ports[0].order).toBeLessThan(ports[1].order);
      }
    });

    it('should validate port data before saving', async () => {
      // Should throw error for invalid data
      await expect(portStorage.create({
        name: '', // Empty name not allowed
        country: 'Greece',
        region: 'Mediterranean',
        port_type: 'invalid' as any // Invalid port type
      })).rejects.toThrow('Validation error');
    });
  });
});

describe.skip('PartyStorage - Table Removed', () => {
  let partyStorage: PartyStorage;

  beforeEach(() => {
    partyStorage = new PartyStorage(db);
  });

  afterEach(async () => {
    await db.raw('DELETE FROM parties WHERE name LIKE $1', ['TEST_%']);
  });

  describe('CRUD Operations', () => {
    it('should create a new party template', async () => {
      const newParty = {
        name: 'TEST_White Party',
        theme: 'All White Attire',
        venue_type: 'pool' as const,
        capacity: 500,
        duration_hours: 4,
        requirements: ['DJ', 'Sound System', 'Lighting'],
        image_url: 'https://example.com/white-party.jpg'
      };

      const created = await partyStorage.create(newParty);

      expect(created).toBeDefined();
      expect(created.id).toBeDefined();
      expect(created.name).toBe(newParty.name);
      expect(created.venue_type).toBe('pool');
      expect(created.requirements).toEqual(newParty.requirements);
    });

    it('should update party template', async () => {
      const party = await partyStorage.create({
        name: 'TEST_Glow Party',
        theme: 'UV Lights',
        venue_type: 'club' as const,
        capacity: 300
      });

      const updated = await partyStorage.update(party.id, {
        capacity: 400,
        duration_hours: 5
      });

      expect(updated.capacity).toBe(400);
      expect(updated.duration_hours).toBe(5);
    });

    it('should track party usage count', async () => {
      const party = await partyStorage.create({
        name: 'TEST_Popular Party',
        theme: 'Test',
        venue_type: 'deck' as const
      });

      const usage = await partyStorage.getUsageCount(party.id);
      expect(typeof usage).toBe('number');
    });

    it('should duplicate a party template', async () => {
      const original = await partyStorage.create({
        name: 'TEST_Original',
        theme: 'Original Theme',
        venue_type: 'pool' as const,
        capacity: 200,
        requirements: ['DJ', 'Bar']
      });

      const duplicate = await partyStorage.duplicate(original.id, 'TEST_Copy');

      expect(duplicate.name).toBe('TEST_Copy');
      expect(duplicate.theme).toBe(original.theme);
      expect(duplicate.venue_type).toBe(original.venue_type);
      expect(duplicate.requirements).toEqual(original.requirements);
      expect(duplicate.id).not.toBe(original.id);
    });
  });

  describe('Search and Filter', () => {
    it('should search parties by venue type', async () => {
      await partyStorage.create({
        name: 'TEST_Pool Party',
        venue_type: 'pool' as const
      });

      await partyStorage.create({
        name: 'TEST_Club Party',
        venue_type: 'club' as const
      });

      const poolParties = await partyStorage.findByVenue('pool');
      expect(poolParties.every(p => p.venue_type === 'pool')).toBe(true);
    });

    it('should get most used party templates', async () => {
      const popular = await partyStorage.getMostUsed(5);

      expect(Array.isArray(popular)).toBe(true);
      expect(popular.length).toBeLessThanOrEqual(5);

      // Should be sorted by usage count
      if (popular.length > 1) {
        expect(popular[0].usage_count).toBeGreaterThanOrEqual(popular[1].usage_count);
      }
    });
  });
});

describe.skip('EventTalentStorage - Table Removed', () => {
  let eventTalentStorage: EventTalentStorage;

  beforeEach(() => {
    eventTalentStorage = new EventTalentStorage(db);
  });

  describe('Relationship Management', () => {
    it('should create event-talent relationship', async () => {
      const relationship = {
        event_id: 1,
        talent_id: 1,
        role: 'headliner' as const,
        performance_order: 1
      };

      const created = await eventTalentStorage.create(relationship);

      expect(created).toBeDefined();
      expect(created.event_id).toBe(1);
      expect(created.talent_id).toBe(1);
      expect(created.role).toBe('headliner');
    });

    it('should get all talent for an event', async () => {
      const eventId = 1;
      const talent = await eventTalentStorage.getTalentForEvent(eventId);

      expect(Array.isArray(talent)).toBe(true);
      // Should be ordered by performance_order
      if (talent.length > 1) {
        expect(talent[0].performance_order).toBeLessThanOrEqual(talent[1].performance_order);
      }
    });

    it('should get all events for talent', async () => {
      const talentId = 1;
      const events = await eventTalentStorage.getEventsForTalent(talentId);

      expect(Array.isArray(events)).toBe(true);
    });

    it('should update performance order', async () => {
      const eventId = 1;
      const newOrder = [
        { talent_id: 3, order: 1 },
        { talent_id: 1, order: 2 },
        { talent_id: 2, order: 3 }
      ];

      const updated = await eventTalentStorage.updatePerformanceOrder(eventId, newOrder);

      expect(updated).toBe(true);

      const talent = await eventTalentStorage.getTalentForEvent(eventId);
      expect(talent[0].talent_id).toBe(3);
      expect(talent[1].talent_id).toBe(1);
      expect(talent[2].talent_id).toBe(2);
    });

    it('should remove talent from event', async () => {
      const removed = await eventTalentStorage.removeTalentFromEvent(1, 1);
      expect(removed).toBe(true);
    });

    it('should prevent duplicate talent in same event', async () => {
      await eventTalentStorage.create({
        event_id: 1,
        talent_id: 1,
        role: 'headliner' as const
      });

      // Should throw error for duplicate
      await expect(eventTalentStorage.create({
        event_id: 1,
        talent_id: 1,
        role: 'support' as const
      })).rejects.toThrow('Talent already assigned to this event');
    });
  });
});

describe('Transaction Support', () => {
  it('should support transactional operations', async () => {
    const portStorage = new PortStorage(db);
    const partyStorage = new PartyStorage(db);

    // This should all succeed or all fail
    const result = await db.transaction(async (trx) => {
      const port = await portStorage.withTransaction(trx).create({
        name: 'TEST_Transaction Port',
        country: 'Test',
        region: 'Test',
        port_type: 'port' as const
      });

      const party = await partyStorage.withTransaction(trx).create({
        name: 'TEST_Transaction Party',
        venue_type: 'pool' as const
      });

      // Simulate error to test rollback
      if (port && party) {
        throw new Error('Test rollback');
      }

      return { port, party };
    }).catch(err => {
      expect(err.message).toBe('Test rollback');
      return null;
    });

    // Verify nothing was saved due to rollback
    const ports = await db.raw('SELECT * FROM ports WHERE name = $1', ['TEST_Transaction Port']);
    expect(ports.rows.length).toBe(0);

    const parties = await db.raw('SELECT * FROM parties WHERE name = $1', ['TEST_Transaction Party']);
    expect(parties.rows.length).toBe(0);
  });
});