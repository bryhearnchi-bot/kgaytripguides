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

async function updateAllPortImages() {
  console.log('🏖️ Updating all port images for Drag Stars cruise...');

  try {
    await client.connect();
    console.log('✅ Connected to Railway PostgreSQL');

    // Update Miami day 1 (departure) with Miami skyline image
    console.log('🌆 Updating Miami day 1 (departure)...');
    await client.query(`
      UPDATE itinerary
      SET port_image_url = $1
      WHERE cruise_id = (SELECT id FROM cruises WHERE slug = 'drag-stars-at-sea-2025')
      AND port_name = 'Miami'
      AND day = 1
    `, [
      'https://res.cloudinary.com/dfqoebbyj/image/upload/w_600,h_400,c_fill,g_center,q_auto,f_auto/v1757901417/471674-Miami_zorh0h.webp'
    ]);
    console.log('  ✅ Updated Miami day 1 with skyline image');

    // Update Miami day 5 (return) with Miami port image
    console.log('🌆 Updating Miami day 5 (return)...');
    await client.query(`
      UPDATE itinerary
      SET port_image_url = $1
      WHERE cruise_id = (SELECT id FROM cruises WHERE slug = 'drag-stars-at-sea-2025')
      AND port_name = 'Miami'
      AND day = 5
    `, [
      'https://res.cloudinary.com/dfqoebbyj/image/upload/w_600,h_400,c_fill,g_center,q_auto,f_auto/v1757901417/miami_2_deyzec.jpg'
    ]);
    console.log('  ✅ Updated Miami day 5 with port image');

    // Update Day at Sea day 2 with first sunrise image
    console.log('🌅 Updating Day at Sea day 2...');
    await client.query(`
      UPDATE itinerary
      SET port_image_url = $1
      WHERE cruise_id = (SELECT id FROM cruises WHERE slug = 'drag-stars-at-sea-2025')
      AND port_name = 'Day at Sea'
      AND day = 2
    `, [
      'https://res.cloudinary.com/dfqoebbyj/image/upload/w_600,h_400,c_fill,g_center,q_auto,f_auto/v1757901417/Sunrise-at-sea-Easter-morning_smdnce.jpg'
    ]);
    console.log('  ✅ Updated Day at Sea day 2 with sunrise image');

    // Update Day at Sea day 4 with second sea image
    console.log('🌊 Updating Day at Sea day 4...');
    await client.query(`
      UPDATE itinerary
      SET port_image_url = $1
      WHERE cruise_id = (SELECT id FROM cruises WHERE slug = 'drag-stars-at-sea-2025')
      AND port_name = 'Day at Sea'
      AND day = 4
    `, [
      'https://res.cloudinary.com/dfqoebbyj/image/upload/w_600,h_400,c_fill,g_center,q_auto,f_auto/v1757901658/sea_2_o8x8fh.jpg'
    ]);
    console.log('  ✅ Updated Day at Sea day 4 with sea image');

    // Key West was already updated in previous script
    console.log('🌴 Key West already updated with keywest_bly8wt.png');

    // Update Bimini with Bimini beach image
    console.log('🏝️ Updating Bimini image...');
    await client.query(`
      UPDATE itinerary
      SET port_image_url = $1
      WHERE cruise_id = (SELECT id FROM cruises WHERE slug = 'drag-stars-at-sea-2025')
      AND port_name = 'Bimini'
    `, [
      'https://res.cloudinary.com/dfqoebbyj/image/upload/w_600,h_400,c_fill,g_center,q_auto,f_auto/v1757901417/bimini_k3wdwc.avif'
    ]);
    console.log('  ✅ Updated Bimini with beach image');

    // Verify all updates
    console.log('\n🔍 Verifying all port images...');
    const result = await client.query(`
      SELECT port_name, port_image_url
      FROM itinerary
      WHERE cruise_id = (SELECT id FROM cruises WHERE slug = 'drag-stars-at-sea-2025')
      ORDER BY day
    `);

    console.log('📋 All port images for Drag Stars cruise:');
    result.rows.forEach(port => {
      const imageName = port.port_image_url?.split('/').pop()?.split('_')[0] || 'No image';
      console.log(`  ${port.port_name}: ${imageName}`);
    });

    console.log('\n🎉 All port images updated successfully!');
    console.log('✨ Drag Stars cruise now has beautiful, relevant images for each destination');

  } catch (error) {
    console.error('❌ Update failed:', error);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

updateAllPortImages();