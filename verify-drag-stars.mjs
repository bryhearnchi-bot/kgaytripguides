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

async function verifyDragStars() {
  console.log('🔍 Verifying Drag Stars cruise in Railway database...');

  try {
    await client.connect();
    console.log('✅ Connected to Railway PostgreSQL');

    // Check total cruises
    const totalResult = await client.query('SELECT COUNT(*) as count FROM cruises');
    console.log(`📊 Total cruises: ${totalResult.rows[0].count}`);

    // Check if Drag Stars cruise exists
    const dragStarsResult = await client.query(`
      SELECT id, name, slug, ship_name, cruise_line
      FROM cruises
      WHERE name LIKE '%Drag Stars%'
    `);

    if (dragStarsResult.rows.length > 0) {
      const cruise = dragStarsResult.rows[0];
      console.log(`✅ Drag Stars cruise found:`);
      console.log(`  - ID: ${cruise.id}`);
      console.log(`  - Name: ${cruise.name}`);
      console.log(`  - Slug: ${cruise.slug}`);
      console.log(`  - Ship: ${cruise.ship_name}`);
      console.log(`  - Cruise Line: ${cruise.cruise_line}`);

      // Check related data
      const itineraryCount = await client.query('SELECT COUNT(*) as count FROM itinerary WHERE cruise_id = $1', [cruise.id]);
      const eventsCount = await client.query('SELECT COUNT(*) as count FROM events WHERE cruise_id = $1', [cruise.id]);

      console.log(`  - Itinerary items: ${itineraryCount.rows[0].count}`);
      console.log(`  - Events: ${eventsCount.rows[0].count}`);
    } else {
      console.log('❌ Drag Stars cruise not found');
    }

    // List all cruises
    const allCruises = await client.query('SELECT id, name, ship_name FROM cruises ORDER BY id');
    console.log('\n📋 All cruises in database:');
    allCruises.rows.forEach(cruise => {
      console.log(`  ${cruise.id}: ${cruise.name} (${cruise.ship_name})`);
    });

  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

verifyDragStars();