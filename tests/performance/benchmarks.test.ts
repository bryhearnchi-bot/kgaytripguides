/**
 * Performance Benchmark Tests
 * Ensures migration doesn't degrade performance
 * Establishes baselines and compares before/after migration
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '../../server/storage';

// Performance thresholds (in milliseconds)
const THRESHOLDS = {
  simpleQuery: 10,      // Simple SELECT
  joinQuery: 50,        // Multi-table JOIN
  complexQuery: 100,    // Complex aggregation
  bulkInsert: 500,      // Insert 100 records
  bulkUpdate: 300,      // Update 100 records
  indexLookup: 5,       // Index-based lookup
  fullTextSearch: 50    // Text search
};

describe('Performance Benchmarks', () => {
  beforeAll(async () => {
    // Warm up database connection
    await db.raw('SELECT 1');
  });

  afterAll(async () => {
    // Clean up test data
    await db.raw('DELETE FROM ports WHERE name LIKE $1', ['PERF_%']);
    await db.raw('DELETE FROM parties WHERE name LIKE $1', ['PERF_%']);
  });

  describe('Query Performance', () => {
    it('should execute simple SELECT within threshold', async () => {
      const runs = 10;
      const times: number[] = [];

      for (let i = 0; i < runs; i++) {
        const start = performance.now();
        await db.raw('SELECT * FROM trips LIMIT 10');
        const end = performance.now();
        times.push(end - start);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / runs;
      expect(avgTime).toBeLessThan(THRESHOLDS.simpleQuery);

      console.log(`Simple SELECT: ${avgTime.toFixed(2)}ms (threshold: ${THRESHOLDS.simpleQuery}ms)`);
    });

    it('should execute JOIN queries within threshold', async () => {
      const runs = 5;
      const times: number[] = [];

      for (let i = 0; i < runs; i++) {
        const start = performance.now();
        await db.raw(`
          SELECT
            t.id,
            t.name,
            COUNT(i.id) as itinerary_count,
            COUNT(e.id) as event_count
          FROM trips t
          LEFT JOIN itinerary i ON i.trip_id = t.id
          LEFT JOIN events e ON e.trip_id = t.id
          GROUP BY t.id, t.name
        `);
        const end = performance.now();
        times.push(end - start);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / runs;
      expect(avgTime).toBeLessThan(THRESHOLDS.joinQuery);

      console.log(`JOIN query: ${avgTime.toFixed(2)}ms (threshold: ${THRESHOLDS.joinQuery}ms)`);
    });

    it('should execute complex aggregation within threshold', async () => {
      const runs = 5;
      const times: number[] = [];

      for (let i = 0; i < runs; i++) {
        const start = performance.now();
        await db.raw(`
          WITH trip_stats AS (
            SELECT
              t.id,
              t.name,
              COUNT(DISTINCT i.id) as port_count,
              COUNT(DISTINCT e.id) as event_count,
              COUNT(DISTINCT et.talent_id) as talent_count
            FROM trips t
            LEFT JOIN itinerary i ON i.trip_id = t.id
            LEFT JOIN events e ON e.trip_id = t.id
            LEFT JOIN event_talent et ON et.event_id = e.id
            GROUP BY t.id, t.name
          )
          SELECT
            *,
            port_count + event_count + talent_count as total_items
          FROM trip_stats
          ORDER BY total_items DESC
        `);
        const end = performance.now();
        times.push(end - start);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / runs;
      expect(avgTime).toBeLessThan(THRESHOLDS.complexQuery);

      console.log(`Complex aggregation: ${avgTime.toFixed(2)}ms (threshold: ${THRESHOLDS.complexQuery}ms)`);
    });
  });

  describe('Index Performance', () => {
    it('should perform index lookups within threshold', async () => {
      // Create test data with known IDs
      await db.raw(`
        INSERT INTO ports (name, country, region, port_type)
        VALUES ('PERF_TestPort', 'Test', 'Test', 'port')
        ON CONFLICT (name) DO NOTHING
      `);

      const runs = 20;
      const times: number[] = [];

      for (let i = 0; i < runs; i++) {
        const start = performance.now();
        await db.raw('SELECT * FROM ports WHERE name = $1', ['PERF_TestPort']);
        const end = performance.now();
        times.push(end - start);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / runs;
      expect(avgTime).toBeLessThan(THRESHOLDS.indexLookup);

      console.log(`Index lookup: ${avgTime.toFixed(2)}ms (threshold: ${THRESHOLDS.indexLookup}ms)`);
    });

    it('should perform foreign key lookups efficiently', async () => {
      const runs = 10;
      const times: number[] = [];

      for (let i = 0; i < runs; i++) {
        const start = performance.now();
        await db.raw(`
          SELECT i.*, p.name as port_name
          FROM itinerary i
          JOIN ports p ON i.port_id = p.id
          WHERE i.trip_id = $1
          ORDER BY i.day, i.order
        `, [1]);
        const end = performance.now();
        times.push(end - start);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / runs;
      expect(avgTime).toBeLessThan(THRESHOLDS.joinQuery);

      console.log(`FK lookup: ${avgTime.toFixed(2)}ms (threshold: ${THRESHOLDS.joinQuery}ms)`);
    });

    it('should handle concurrent lookups efficiently', async () => {
      const concurrentQueries = 10;

      const start = performance.now();
      const promises = Array(concurrentQueries).fill(null).map((_, i) =>
        db.raw('SELECT * FROM ports WHERE id = $1', [i + 1])
      );

      await Promise.all(promises);
      const end = performance.now();

      const totalTime = end - start;
      const avgTime = totalTime / concurrentQueries;

      expect(avgTime).toBeLessThan(THRESHOLDS.indexLookup * 2); // Allow some overhead

      console.log(`Concurrent lookups: ${avgTime.toFixed(2)}ms avg per query`);
    });
  });

  describe('Write Performance', () => {
    it('should perform bulk inserts within threshold', async () => {
      const recordCount = 100;
      const ports = Array(recordCount).fill(null).map((_, i) => ({
        name: `PERF_Port_${i}`,
        country: 'Test',
        region: 'Test',
        port_type: 'port'
      }));

      const start = performance.now();

      // Use batch insert
      await db.raw(`
        INSERT INTO ports (name, country, region, port_type)
        VALUES ${ports.map((_, i) => `($${i*4+1}, $${i*4+2}, $${i*4+3}, $${i*4+4})`).join(', ')}
        ON CONFLICT (name) DO NOTHING
      `, ports.flatMap(p => [p.name, p.country, p.region, p.port_type]));

      const end = performance.now();
      const totalTime = end - start;

      expect(totalTime).toBeLessThan(THRESHOLDS.bulkInsert);

      console.log(`Bulk insert (${recordCount} records): ${totalTime.toFixed(2)}ms (threshold: ${THRESHOLDS.bulkInsert}ms)`);
    });

    it('should perform bulk updates within threshold', async () => {
      const start = performance.now();

      await db.raw(`
        UPDATE ports
        SET description = 'Performance test update'
        WHERE name LIKE 'PERF_%'
      `);

      const end = performance.now();
      const totalTime = end - start;

      expect(totalTime).toBeLessThan(THRESHOLDS.bulkUpdate);

      console.log(`Bulk update: ${totalTime.toFixed(2)}ms (threshold: ${THRESHOLDS.bulkUpdate}ms)`);
    });

    it('should handle transactions efficiently', async () => {
      const start = performance.now();

      await db.transaction(async (trx) => {
        // Insert port
        const portResult = await trx.raw(`
          INSERT INTO ports (name, country, region, port_type)
          VALUES ('PERF_Transaction_Port', 'Test', 'Test', 'port')
          ON CONFLICT (name) DO UPDATE SET country = EXCLUDED.country
          RETURNING id
        `);

        // Insert party
        await trx.raw(`
          INSERT INTO parties (name, theme, venue_type)
          VALUES ('PERF_Transaction_Party', 'Test', 'pool')
          ON CONFLICT (name) DO UPDATE SET theme = EXCLUDED.theme
        `);

        // Update something
        await trx.raw(`
          UPDATE trips SET updated_at = NOW() WHERE id = 1
        `);
      });

      const end = performance.now();
      const totalTime = end - start;

      expect(totalTime).toBeLessThan(100); // Transaction overhead

      console.log(`Transaction: ${totalTime.toFixed(2)}ms`);
    });
  });

  describe('Search Performance', () => {
    it('should perform text searches within threshold', async () => {
      const runs = 10;
      const times: number[] = [];

      for (let i = 0; i < runs; i++) {
        const start = performance.now();
        await db.raw(`
          SELECT * FROM ports
          WHERE name ILIKE $1 OR description ILIKE $1
        `, ['%athens%']);
        const end = performance.now();
        times.push(end - start);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / runs;
      expect(avgTime).toBeLessThan(THRESHOLDS.fullTextSearch);

      console.log(`Text search: ${avgTime.toFixed(2)}ms (threshold: ${THRESHOLDS.fullTextSearch}ms)`);
    });

    it('should handle complex filters efficiently', async () => {
      const start = performance.now();

      await db.raw(`
        SELECT p.*, COUNT(i.id) as usage_count
        FROM ports p
        LEFT JOIN itinerary i ON i.port_id = p.id
        WHERE p.region = $1
          AND p.port_type IN ('port', 'embark', 'disembark')
          AND (p.name ILIKE $2 OR p.country ILIKE $2)
        GROUP BY p.id
        HAVING COUNT(i.id) > 0
        ORDER BY usage_count DESC
        LIMIT 10
      `, ['Mediterranean', '%a%']);

      const end = performance.now();
      const queryTime = end - start;

      expect(queryTime).toBeLessThan(THRESHOLDS.complexQuery);

      console.log(`Complex filter: ${queryTime.toFixed(2)}ms (threshold: ${THRESHOLDS.complexQuery}ms)`);
    });
  });

  describe('Cache Performance', () => {
    it('should benefit from query caching', async () => {
      const query = 'SELECT * FROM trips WHERE id = 1';

      // First run (cold cache)
      const coldStart = performance.now();
      await db.raw(query);
      const coldEnd = performance.now();
      const coldTime = coldEnd - coldStart;

      // Subsequent runs (warm cache)
      const warmTimes: number[] = [];
      for (let i = 0; i < 5; i++) {
        const start = performance.now();
        await db.raw(query);
        const end = performance.now();
        warmTimes.push(end - start);
      }

      const avgWarmTime = warmTimes.reduce((a, b) => a + b, 0) / warmTimes.length;

      // Warm cache should be faster
      expect(avgWarmTime).toBeLessThanOrEqual(coldTime);

      console.log(`Cache benefit: Cold ${coldTime.toFixed(2)}ms vs Warm ${avgWarmTime.toFixed(2)}ms`);
    });
  });

  describe('Scalability Tests', () => {
    it('should handle increasing data volume gracefully', async () => {
      const dataSizes = [10, 50, 100, 200];
      const times: Record<number, number> = {};

      for (const size of dataSizes) {
        const start = performance.now();
        await db.raw(`
          SELECT * FROM ports
          LIMIT $1
        `, [size]);
        const end = performance.now();
        times[size] = end - start;
      }

      // Time should not increase linearly with data size (due to limits)
      const timeIncrease = times[200] / times[10];
      expect(timeIncrease).toBeLessThan(5); // Should not be 20x slower

      console.log('Scalability:', Object.entries(times)
        .map(([size, time]) => `${size} records: ${time.toFixed(2)}ms`)
        .join(', '));
    });

    it('should maintain performance with complex joins on larger datasets', async () => {
      const start = performance.now();

      await db.raw(`
        WITH RECURSIVE trip_hierarchy AS (
          SELECT t.*, 0 as level
          FROM trips t
          WHERE t.id = 1

          UNION ALL

          SELECT t.*, th.level + 1
          FROM trips t
          JOIN trip_hierarchy th ON t.id != th.id
          WHERE th.level < 2
        )
        SELECT * FROM trip_hierarchy
      `);

      const end = performance.now();
      const queryTime = end - start;

      expect(queryTime).toBeLessThan(200); // Recursive queries are slower

      console.log(`Recursive query: ${queryTime.toFixed(2)}ms`);
    });
  });

  describe('Connection Pool Performance', () => {
    it('should handle concurrent connections efficiently', async () => {
      const connections = 20;
      const start = performance.now();

      const promises = Array(connections).fill(null).map(async (_, i) => {
        return db.raw('SELECT $1::int as connection_id', [i]);
      });

      await Promise.all(promises);
      const end = performance.now();

      const totalTime = end - start;
      const avgTime = totalTime / connections;

      expect(avgTime).toBeLessThan(10); // Each connection should be fast

      console.log(`Connection pool: ${connections} concurrent, ${avgTime.toFixed(2)}ms avg`);
    });
  });
});

// Performance comparison helper
export async function comparePerformance(
  beforeQuery: string,
  afterQuery: string,
  params: any[] = []
): Promise<{ before: number; after: number; improvement: number }> {
  const runs = 10;

  // Measure before
  const beforeTimes: number[] = [];
  for (let i = 0; i < runs; i++) {
    const start = performance.now();
    await db.raw(beforeQuery, params);
    const end = performance.now();
    beforeTimes.push(end - start);
  }
  const beforeAvg = beforeTimes.reduce((a, b) => a + b, 0) / runs;

  // Measure after
  const afterTimes: number[] = [];
  for (let i = 0; i < runs; i++) {
    const start = performance.now();
    await db.raw(afterQuery, params);
    const end = performance.now();
    afterTimes.push(end - start);
  }
  const afterAvg = afterTimes.reduce((a, b) => a + b, 0) / runs;

  const improvement = ((beforeAvg - afterAvg) / beforeAvg) * 100;

  return {
    before: beforeAvg,
    after: afterAvg,
    improvement
  };
}