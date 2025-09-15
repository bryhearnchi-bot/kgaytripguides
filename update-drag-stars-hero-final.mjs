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

async function updateDragStarsHeroFinal() {
  console.log('🚢✨ Updating Drag Stars cruise hero image with Virgin Voyages image...');

  try {
    await client.connect();
    console.log('✅ Connected to Railway PostgreSQL');

    // New Virgin Voyages hero image for Drag Stars cruise
    const dragStarsHeroUrl = 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_1200,h_600,c_fill,g_center,q_auto,f_auto/v1757903567/VIRGIN_qlcjqg.jpg';

    console.log('🌟 Updating Drag Stars cruise hero image...');
    console.log(`URL: ${dragStarsHeroUrl}`);

    // Update the Drag Stars cruise hero image
    const result = await client.query(`
      UPDATE cruises
      SET hero_image_url = $1, updated_at = NOW()
      WHERE slug = 'drag-stars-at-sea-2025'
      RETURNING id, name, hero_image_url
    `, [dragStarsHeroUrl]);

    if (result.rows.length > 0) {
      console.log('✅ Successfully updated Drag Stars cruise hero image:');
      console.log(`  Cruise: ${result.rows[0].name}`);
      console.log(`  ID: ${result.rows[0].id}`);
      console.log(`  Hero Image: ${result.rows[0].hero_image_url}`);
    } else {
      console.log('❌ Drag Stars cruise not found');
    }

    console.log('\n🎉 Drag Stars cruise now has the perfect Virgin Voyages hero image!');
    console.log('🚢 Ready to sail with style and drag excellence!');
    console.log('✨ Image sized perfectly for hero display: 1200x600 with optimal cropping');

  } catch (error) {
    console.error('❌ Update failed:', error);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

updateDragStarsHeroFinal();