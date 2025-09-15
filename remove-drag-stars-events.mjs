import pg from 'pg';

const { Client } = pg;

// Railway connection configuration
const client = new Client({
  host: 'trolley.proxy.rlwy.net',
  port: 16776,
  user: 'postgres',
  password: 'ZMxXTsAbduhdjAQmOtdLiMgUuHTMHDMB',
  database: 'railway',
  ssl: false
});

async function removeDragStarsEvents() {
  console.log('🗑️ Removing Drag Stars events (they are not real)...');

  try {
    await client.connect();
    console.log('✅ Connected to Railway PostgreSQL');

    // First, let's see what Drag Stars events exist
    console.log('🔍 Finding Drag Stars cruise events...');
    const eventsQuery = `
      SELECT id, title, time, venue, type, description
      FROM events
      WHERE cruise_id = (SELECT id FROM cruises WHERE slug = 'drag-stars-at-sea-2025')
      ORDER BY date, time
    `;

    const existingEvents = await client.query(eventsQuery);

    if (existingEvents.rows.length === 0) {
      console.log('ℹ️ No Drag Stars events found to remove');
      return;
    }

    console.log(`📋 Found ${existingEvents.rows.length} Drag Stars events:`);
    existingEvents.rows.forEach((event, index) => {
      console.log(`  ${index + 1}. ${event.title} (${event.time}) at ${event.venue}`);
    });

    // Remove all events for the Drag Stars cruise
    console.log('\n🗑️ Removing all Drag Stars events...');
    const deleteResult = await client.query(`
      DELETE FROM events
      WHERE cruise_id = (SELECT id FROM cruises WHERE slug = 'drag-stars-at-sea-2025')
    `);

    console.log(`✅ Successfully removed ${deleteResult.rowCount} events from Drag Stars cruise`);

    // Verify deletion
    console.log('\n🔍 Verifying events are removed...');
    const verifyResult = await client.query(eventsQuery);

    if (verifyResult.rows.length === 0) {
      console.log('✅ Confirmed: All Drag Stars events have been removed');
    } else {
      console.log(`⚠️ Warning: ${verifyResult.rows.length} events still remain`);
    }

    console.log('\n🎉 Drag Stars events cleanup completed!');
    console.log('🔄 The cruise still exists but has no scheduled events');

  } catch (error) {
    console.error('❌ Removal failed:', error);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

removeDragStarsEvents();