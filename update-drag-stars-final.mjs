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

async function updateDragStarsWithActualImage() {
  console.log('🎭 Updating Drag Stars with the actual uploaded image...');

  try {
    await client.connect();
    console.log('✅ Connected to Railway PostgreSQL');

    // Use the actual uploaded Drag Stars image URL with proper transformations
    const dragStarsHeroUrl = 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_1200,h_600,c_fill,g_center,q_auto,f_auto/v1757901426/drag_stars_ngd64u.jpg';

    console.log('🌟 Updating to actual Drag Stars promotional image...');
    console.log(`URL: ${dragStarsHeroUrl}`);

    // Update the cruise hero image
    await client.query(`
      UPDATE cruises
      SET hero_image_url = $1
      WHERE slug = 'drag-stars-at-sea-2025'
    `, [dragStarsHeroUrl]);

    // Verify the update
    const result = await client.query(`
      SELECT name, hero_image_url
      FROM cruises
      WHERE slug = 'drag-stars-at-sea-2025'
    `);

    if (result.rows.length > 0) {
      console.log('✅ Successfully updated to actual Drag Stars hero image:');
      console.log(`  Cruise: ${result.rows[0].name}`);
      console.log(`  Hero Image: ${result.rows[0].hero_image_url}`);
    }

    console.log('\n🎉 Drag Stars cruise now has the correct promotional image!');
    console.log('💫 Image includes proper transformations: w_1200,h_600,c_fill,g_center,q_auto,f_auto');

  } catch (error) {
    console.error('❌ Update failed:', error);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

updateDragStarsWithActualImage();