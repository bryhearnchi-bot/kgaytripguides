import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function fixItineraryPortLinks() {
  await client.connect();

  try {
    console.log('Fixing itinerary port links...\n');

    // Get port IDs
    const ports = await client.query('SELECT id, name FROM ports');
    const portMap = {};
    ports.rows.forEach(p => portMap[p.name] = p.id);

    // Port mappings for typical Mediterranean cruise
    const mappings = [
      [1, 'Embarkation'],
      [2, 'Athens (Piraeus)'],
      [3, 'Santorini'],
      [4, 'Sea Day'],
      [5, 'Alexandria'],
      [6, 'Kuşadası'],
      [7, 'Istanbul'],
      [8, 'Sea Day'],
      [9, 'Mykonos'],
      [10, 'Iraklion'],
      [11, 'Disembarkation']
    ];

    // Update for all cruises (since they follow similar Mediterranean routes)
    let totalUpdated = 0;

    for (const [day, portName] of mappings) {
      if (portMap[portName]) {
        // Update for any cruise with this day number
        const result = await client.query(
          'UPDATE itinerary SET port_id = $1 WHERE day = $2 AND port_id IS NULL',
          [portMap[portName], day]
        );
        totalUpdated += result.rowCount;
        if (result.rowCount > 0) {
          console.log(`  Day ${day} → ${portName}: ${result.rowCount} items updated`);
        }
      }
    }

    // Also try to match by port_name if it exists
    console.log('\nMatching by port names...');
    const portNameResult = await client.query(`
      UPDATE itinerary i
      SET port_id = p.id
      FROM ports p
      WHERE i.port_name IS NOT NULL
      AND i.port_id IS NULL
      AND (
        LOWER(i.port_name) LIKE '%' || LOWER(p.name) || '%'
        OR LOWER(p.name) LIKE '%' || LOWER(i.port_name) || '%'
      )
    `);

    if (portNameResult.rowCount > 0) {
      console.log(`  Matched ${portNameResult.rowCount} items by port name`);
      totalUpdated += portNameResult.rowCount;
    }

    // Final statistics
    const stats = await client.query(`
      SELECT
        COUNT(*) as total,
        COUNT(port_id) as with_port,
        COUNT(*) - COUNT(port_id) as without_port
      FROM itinerary
    `);

    console.log('\n=== Summary ===');
    console.log(`  Total itinerary items: ${stats.rows[0].total}`);
    console.log(`  With port links: ${stats.rows[0].with_port}`);
    console.log(`  Without port links: ${stats.rows[0].without_port}`);
    console.log(`  Updated in this run: ${totalUpdated}`);

    // Show sample of updated items
    const sampleResult = await client.query(`
      SELECT i.day, i.port_name, p.name as linked_port
      FROM itinerary i
      LEFT JOIN ports p ON i.port_id = p.id
      WHERE i.cruise_id = 1
      ORDER BY i.day
      LIMIT 5
    `);

    if (sampleResult.rows.length > 0) {
      console.log('\nSample itinerary (cruise 1):');
      sampleResult.rows.forEach(r => {
        console.log(`  Day ${r.day}: ${r.port_name || '(empty)'} → ${r.linked_port || '(no link)'}`);
      });
    }

    console.log('\n✅ Itinerary port links fixed!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

fixItineraryPortLinks();