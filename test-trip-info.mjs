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

async function testTripInfoSections() {
  console.log('🔍 Testing trip_info_sections in Railway database...');

  try {
    await client.connect();
    console.log('✅ Connected to Railway PostgreSQL');

    // Check if data exists
    const result = await client.query('SELECT id, cruise_id, title FROM trip_info_sections ORDER BY id');
    console.log(`📊 Found ${result.rows.length} trip_info_sections records:`);

    result.rows.forEach(row => {
      console.log(`  - ID: ${row.id}, Cruise: ${row.cruise_id}, Title: ${row.title}`);
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

testTripInfoSections();