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

async function updateDragStarsImages() {
  console.log('🖼️  Updating Drag Stars cruise with hero image and port images...');

  try {
    await client.connect();
    console.log('✅ Connected to Railway PostgreSQL');

    // 1. Update the cruise hero image with the provided Drag Stars image
    console.log('🎭 Updating cruise hero image...');
    await client.query(`
      UPDATE cruises
      SET hero_image_url = $1
      WHERE slug = 'drag-stars-at-sea-2025'
    `, [
      'https://res.cloudinary.com/dfqoebbyj/image/upload/w_1200,h_600,c_fill,g_center,q_auto,f_auto/v1/cruise-app/hero/drag-stars-at-sea-hero.jpg'
    ]);
    console.log('✅ Updated cruise hero image');

    // 2. Update port images for each itinerary item
    console.log('🏝️  Updating port images...');

    // Miami port image
    await client.query(`
      UPDATE itinerary
      SET port_image_url = $1
      WHERE cruise_id = (SELECT id FROM cruises WHERE slug = 'drag-stars-at-sea-2025')
      AND port_name = 'Miami'
    `, [
      'https://res.cloudinary.com/dfqoebbyj/image/upload/w_600,h_400,c_fill,g_center,q_auto,f_auto/v1/cruise-app/ports/miami-florida.jpg'
    ]);
    console.log('  ✅ Updated Miami port image');

    // Day at Sea image (ship/cruise themed)
    await client.query(`
      UPDATE itinerary
      SET port_image_url = $1
      WHERE cruise_id = (SELECT id FROM cruises WHERE slug = 'drag-stars-at-sea-2025')
      AND port_name = 'Day at Sea'
    `, [
      'https://res.cloudinary.com/dfqoebbyj/image/upload/w_600,h_400,c_fill,g_center,q_auto,f_auto/v1/cruise-app/ports/day-at-sea-valiant-lady.jpg'
    ]);
    console.log('  ✅ Updated Day at Sea image');

    // Key West port image
    await client.query(`
      UPDATE itinerary
      SET port_image_url = $1
      WHERE cruise_id = (SELECT id FROM cruises WHERE slug = 'drag-stars-at-sea-2025')
      AND port_name = 'Key West'
    `, [
      'https://res.cloudinary.com/dfqoebbyj/image/upload/w_600,h_400,c_fill,g_center,q_auto,f_auto/v1/cruise-app/ports/key-west-florida.jpg'
    ]);
    console.log('  ✅ Updated Key West port image');

    // Bimini port image
    await client.query(`
      UPDATE itinerary
      SET port_image_url = $1
      WHERE cruise_id = (SELECT id FROM cruises WHERE slug = 'drag-stars-at-sea-2025')
      AND port_name = 'Bimini'
    `, [
      'https://res.cloudinary.com/dfqoebbyj/image/upload/w_600,h_400,c_fill,g_center,q_auto,f_auto/v1/cruise-app/ports/bimini-bahamas.jpg'
    ]);
    console.log('  ✅ Updated Bimini port image');

    // Verify the updates
    console.log('\n🔍 Verifying updates...');
    const cruiseResult = await client.query(`
      SELECT name, hero_image_url
      FROM cruises
      WHERE slug = 'drag-stars-at-sea-2025'
    `);

    if (cruiseResult.rows.length > 0) {
      console.log(`✅ Cruise: ${cruiseResult.rows[0].name}`);
      console.log(`✅ Hero Image: ${cruiseResult.rows[0].hero_image_url}`);
    }

    const itineraryResult = await client.query(`
      SELECT port_name, port_image_url
      FROM itinerary
      WHERE cruise_id = (SELECT id FROM cruises WHERE slug = 'drag-stars-at-sea-2025')
      ORDER BY day
    `);

    console.log('\n📋 Port images:');
    itineraryResult.rows.forEach(port => {
      console.log(`  ${port.port_name}: ${port.port_image_url || 'No image'}`);
    });

    console.log('\n🎉 Drag Stars cruise images updated successfully!');

  } catch (error) {
    console.error('❌ Failed to update images:', error);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

updateDragStarsImages();