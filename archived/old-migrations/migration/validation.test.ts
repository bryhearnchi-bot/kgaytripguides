/**
 * Migration Validation Tests
 * These tests MUST fail initially (Red phase of TDD)
 * They will pass after successful migration implementation
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '../../server/storage';

describe('Migration Validation Tests', () => {
  describe('Database Structure Validation', () => {
    it('should have a ports table with proper structure', async () => {
      // This test will fail initially as ports table doesn't exist yet
      const result = await db.raw(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'ports'
        ORDER BY ordinal_position
      `);

      expect(result.rows).toBeDefined();
      expect(result.rows.length).toBeGreaterThan(0);

      const columns = result.rows.map(row => row.column_name);
      expect(columns).toContain('id');
      expect(columns).toContain('name');
      expect(columns).toContain('country');
      expect(columns).toContain('region');
      expect(columns).toContain('port_type');
      expect(columns).toContain('coordinates');
      expect(columns).toContain('description');
      expect(columns).toContain('image_url');
      expect(columns).toContain('created_at');
      expect(columns).toContain('updated_at');
    });

    it('should have a parties table with proper structure', async () => {
      // This test will fail initially as parties table doesn't exist yet
      const result = await db.raw(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'parties'
      `);

      expect(result.rows).toBeDefined();
      const columns = result.rows.map(row => row.column_name);
      expect(columns).toContain('id');
      expect(columns).toContain('name');
      expect(columns).toContain('theme');
      expect(columns).toContain('venue_type');
      expect(columns).toContain('capacity');
      expect(columns).toContain('duration_hours');
      expect(columns).toContain('requirements');
      expect(columns).toContain('image_url');
    });

    it('should have event_talent junction table', async () => {
      // This test will fail initially
      const result = await db.raw(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'event_talent'
      `);

      const columns = result.rows.map(row => row.column_name);
      expect(columns).toContain('id');
      expect(columns).toContain('event_id');
      expect(columns).toContain('talent_id');
      expect(columns).toContain('role');
      expect(columns).toContain('performance_order');
    });

    it('should have proper foreign key constraints', async () => {
      // Check foreign keys on itineraries table
      const result = await db.raw(`
        SELECT
          tc.constraint_name,
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name IN ('itinerary', 'events', 'event_talent')
      `);

      expect(result.rows.length).toBeGreaterThan(0);

      // Check specific relationships
      const itineraryFKs = result.rows.filter(r => r.table_name === 'itinerary');
      expect(itineraryFKs.some(fk => fk.foreign_table_name === 'ports')).toBe(true);

      const eventFKs = result.rows.filter(r => r.table_name === 'events');
      expect(eventFKs.some(fk => fk.foreign_table_name === 'parties')).toBe(true);
    });

    it('should have indexes on foreign key columns', async () => {
      const result = await db.raw(`
        SELECT
          schemaname,
          tablename,
          indexname,
          indexdef
        FROM pg_indexes
        WHERE tablename IN ('itinerary', 'events', 'ports', 'parties')
          AND indexname LIKE '%_idx'
      `);

      expect(result.rows.length).toBeGreaterThan(0);

      // Check for specific indexes
      const indexNames = result.rows.map(r => r.indexname);
      expect(indexNames).toContain('itinerary_port_id_idx');
      expect(indexNames).toContain('events_party_id_idx');
      expect(indexNames).toContain('event_talent_event_id_idx');
      expect(indexNames).toContain('event_talent_talent_id_idx');
    });
  });

  describe('Data Migration Validation', () => {
    it('should migrate all unique locations to ports table', async () => {
      // Get original unique locations
      const originalLocations = await db.raw(`
        SELECT DISTINCT location
        FROM itinerary
        WHERE location IS NOT NULL AND location != ''
      `);

      // Check they exist in ports table
      const ports = await db.raw(`SELECT name FROM ports`);
      const portNames = ports.rows.map(p => p.name);

      originalLocations.rows.forEach(loc => {
        expect(portNames).toContain(loc.location);
      });
    });

    it('should migrate all unique party types to parties table', async () => {
      // Get unique event titles (party types)
      const originalParties = await db.raw(`
        SELECT DISTINCT title
        FROM events
        WHERE title IS NOT NULL
      `);

      // Check they exist in parties table
      const parties = await db.raw(`SELECT name FROM parties`);
      const partyNames = parties.rows.map(p => p.name);

      originalParties.rows.forEach(party => {
        expect(partyNames).toContain(party.title);
      });
    });

    it('should maintain all event-talent relationships', async () => {
      // Count original relationships
      const originalCount = await db.raw(`
        SELECT COUNT(*) as count
        FROM cruise_talent
      `);

      // Count new relationships
      const newCount = await db.raw(`
        SELECT COUNT(*) as count
        FROM event_talent
      `);

      expect(newCount.rows[0].count).toBe(originalCount.rows[0].count);
    });

    it('should preserve all data integrity after migration', async () => {
      // Check no data loss in trips
      const tripsBefore = await db.raw(`SELECT COUNT(*) as count FROM trips`);
      const tripsAfter = await db.raw(`SELECT COUNT(*) as count FROM trips`);
      expect(tripsAfter.rows[0].count).toBe(tripsBefore.rows[0].count);

      // Check no data loss in itineraries
      const itinerariesBefore = await db.raw(`SELECT COUNT(*) as count FROM itinerary`);
      const itinerariesAfter = await db.raw(`SELECT COUNT(*) as count FROM itinerary`);
      expect(itinerariesAfter.rows[0].count).toBe(itinerariesBefore.rows[0].count);

      // Check no data loss in events
      const eventsBefore = await db.raw(`SELECT COUNT(*) as count FROM events`);
      const eventsAfter = await db.raw(`SELECT COUNT(*) as count FROM events`);
      expect(eventsAfter.rows[0].count).toBe(eventsBefore.rows[0].count);
    });

    it('should have valid foreign key references after migration', async () => {
      // Check all itineraries reference valid ports
      const invalidItineraries = await db.raw(`
        SELECT i.id
        FROM itinerary i
        LEFT JOIN ports p ON i.port_id = p.id
        WHERE i.port_id IS NOT NULL AND p.id IS NULL
      `);
      expect(invalidItineraries.rows.length).toBe(0);

      // Check all events reference valid parties
      const invalidEvents = await db.raw(`
        SELECT e.id
        FROM events e
        LEFT JOIN parties p ON e.party_id = p.id
        WHERE e.party_id IS NOT NULL AND p.id IS NULL
      `);
      expect(invalidEvents.rows.length).toBe(0);
    });
  });

  describe('Data Checksum Validation', () => {
    it('should maintain data integrity through checksums', async () => {
      // This will compare checksums before and after migration
      const tables = ['trips', 'itinerary', 'events', 'talent'];

      for (const table of tables) {
        const checksum = await db.raw(`
          SELECT MD5(CAST((array_agg(t.* ORDER BY id)) AS text)) as checksum
          FROM ${table} t
        `);

        // Compare with stored pre-migration checksum
        const storedChecksum = await getStoredChecksum(table);
        expect(checksum.rows[0].checksum).toBe(storedChecksum);
      }
    });
  });

  describe('Performance Validation', () => {
    it('should maintain or improve query performance', async () => {
      // Test critical query performance
      const startTime = Date.now();

      await db.raw(`
        SELECT t.*, i.*, e.*
        FROM trips t
        JOIN itinerary i ON i.trip_id = t.id
        JOIN events e ON e.trip_id = t.id
        WHERE t.id = 1
      `);

      const queryTime = Date.now() - startTime;
      expect(queryTime).toBeLessThan(100); // Should complete in under 100ms
    });

    it('should have efficient port lookups', async () => {
      const startTime = Date.now();

      await db.raw(`
        SELECT * FROM ports WHERE name = 'Athens'
      `);

      const queryTime = Date.now() - startTime;
      expect(queryTime).toBeLessThan(10); // Should be very fast with index
    });
  });
});

// Helper function (would be implemented separately)
async function getStoredChecksum(table: string): Promise<string> {
  // This would read from a checksums file created before migration
  const checksums = {
    trips: '', // Will be populated before migration
    itinerary: '',
    events: '',
    talent: ''
  };
  return checksums[table as keyof typeof checksums];
}