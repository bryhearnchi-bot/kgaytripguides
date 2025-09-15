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

async function updateDragStarsHeroUrl() {
  console.log('🎭 Updating Drag Stars hero image URL...');

  try {
    await client.connect();
    console.log('✅ Connected to Railway PostgreSQL');

    // For now, I'll use a generic cruise/party image that exists on Cloudinary
    // You can replace this URL once you upload the actual Drag Stars image
    const heroImageUrl = 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_1200,h_600,c_fill,g_center,q_auto,f_auto/v1757882103/cruise-app/ships/cruise-app/ships/harmony-of-the-seas.jpg';

    console.log('🖼️  Using existing cruise hero image as placeholder...');

    // Update the cruise hero image
    await client.query(`
      UPDATE cruises
      SET hero_image_url = $1
      WHERE slug = 'drag-stars-at-sea-2025'
    `, [heroImageUrl]);

    // Verify the update
    const result = await client.query(`
      SELECT name, hero_image_url
      FROM cruises
      WHERE slug = 'drag-stars-at-sea-2025'
    `);

    if (result.rows.length > 0) {
      console.log('✅ Successfully updated hero image:');
      console.log(`  Cruise: ${result.rows[0].name}`);
      console.log(`  Hero Image: ${result.rows[0].hero_image_url}`);
    }

    console.log('\n📋 To upload the actual Drag Stars image:');
    console.log('1. Go to Cloudinary dashboard: https://cloudinary.com/console');
    console.log('2. Upload the Drag Stars promotional image');
    console.log('3. Set folder: cruise-app/hero/');
    console.log('4. Set public_id: drag-stars-at-sea-hero');
    console.log('5. Update database with new URL');

  } catch (error) {
    console.error('❌ Update failed:', error);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

updateDragStarsHeroUrl();