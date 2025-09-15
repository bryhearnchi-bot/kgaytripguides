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

async function updateJackieImage() {
  console.log('🌟 Updating Jackie Cox profile image...');

  try {
    await client.connect();
    console.log('✅ Connected to Railway PostgreSQL');

    // Jackie Cox's new Cloudinary image URL
    const jackieImageUrl = 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_400,h_400,c_fill,g_face,q_auto,f_auto/v1757903569/jackie_eheucy.jpg';

    console.log('🎭 Updating Jackie Cox image...');
    console.log(`URL: ${jackieImageUrl}`);

    // Update Jackie Cox's profile image
    const result = await client.query(`
      UPDATE talent
      SET profile_image_url = $1, updated_at = NOW()
      WHERE name = 'Jackie Cox'
      RETURNING id, name, profile_image_url
    `, [jackieImageUrl]);

    if (result.rows.length > 0) {
      console.log('✅ Successfully updated Jackie Cox profile image:');
      console.log(`  Name: ${result.rows[0].name}`);
      console.log(`  ID: ${result.rows[0].id}`);
      console.log(`  Image: ${result.rows[0].profile_image_url}`);
    } else {
      console.log('❌ Jackie Cox not found in talent table');
    }

    console.log('\n🎉 Jackie Cox now has her profile image!');
    console.log('🌟 Persian-American drag excellence ready for Drag Stars cruise!');

  } catch (error) {
    console.error('❌ Update failed:', error);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

updateJackieImage();