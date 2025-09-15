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

async function updateDayAtSeaImage() {
  console.log('🌅 Updating Day at Sea image...');

  try {
    await client.connect();
    console.log('✅ Connected to Railway PostgreSQL');

    // Use the beautiful sunrise at sea image
    const dayAtSeaImageUrl = 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_600,h_400,c_fill,g_center,q_auto,f_auto/v1757901417/Sunrise-at-sea-Easter-morning_smdnce.jpg';

    console.log('🚢 Updating Day at Sea image...');
    console.log(`URL: ${dayAtSeaImageUrl}`);

    // Update the Day at Sea image
    await client.query(`
      UPDATE itinerary
      SET port_image_url = $1
      WHERE cruise_id = (SELECT id FROM cruises WHERE slug = 'drag-stars-at-sea-2025')
      AND port_name = 'Day at Sea'
    `, [dayAtSeaImageUrl]);

    // Verify the update
    const result = await client.query(`
      SELECT port_name, port_image_url
      FROM itinerary
      WHERE cruise_id = (SELECT id FROM cruises WHERE slug = 'drag-stars-at-sea-2025')
      AND port_name = 'Day at Sea'
    `);

    if (result.rows.length > 0) {
      console.log('✅ Successfully updated Day at Sea image:');
      console.log(`  Port: ${result.rows[0].port_name}`);
      console.log(`  Image: ${result.rows[0].port_image_url}`);
    }

    console.log('\n🎉 Day at Sea now has a beautiful sunrise image!');

  } catch (error) {
    console.error('❌ Update failed:', error);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

updateDayAtSeaImage();