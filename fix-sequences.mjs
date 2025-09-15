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

async function fixSequences() {
  console.log('🔧 Fixing database sequences...');

  try {
    await client.connect();
    console.log('✅ Connected to Railway PostgreSQL');

    // Fix cruises sequence
    const maxCruiseId = await client.query('SELECT COALESCE(MAX(id), 0) FROM cruises');
    const nextCruiseId = maxCruiseId.rows[0].coalesce + 1;

    await client.query(`SELECT setval('cruises_id_seq', $1, false)`, [nextCruiseId]);
    console.log(`✅ Set cruises_id_seq to ${nextCruiseId}`);

    // Fix talent sequence
    const maxTalentId = await client.query('SELECT COALESCE(MAX(id), 0) FROM talent');
    const nextTalentId = maxTalentId.rows[0].coalesce + 1;

    await client.query(`SELECT setval('talent_id_seq', $1, false)`, [nextTalentId]);
    console.log(`✅ Set talent_id_seq to ${nextTalentId}`);

    // Fix events sequence
    const maxEventId = await client.query('SELECT COALESCE(MAX(id), 0) FROM events');
    const nextEventId = maxEventId.rows[0].coalesce + 1;

    await client.query(`SELECT setval('events_id_seq', $1, false)`, [nextEventId]);
    console.log(`✅ Set events_id_seq to ${nextEventId}`);

    // Fix itinerary sequence
    const maxItineraryId = await client.query('SELECT COALESCE(MAX(id), 0) FROM itinerary');
    const nextItineraryId = maxItineraryId.rows[0].coalesce + 1;

    await client.query(`SELECT setval('itinerary_id_seq', $1, false)`, [nextItineraryId]);
    console.log(`✅ Set itinerary_id_seq to ${nextItineraryId}`);

    console.log('\n🎉 All sequences fixed!');

  } catch (error) {
    console.error('❌ Failed to fix sequences:', error);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

fixSequences();