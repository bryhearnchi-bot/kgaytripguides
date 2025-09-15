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

async function updateBobImage() {
  console.log('👑 Updating Bob the Drag Queen profile image...');

  try {
    await client.connect();
    console.log('✅ Connected to Railway PostgreSQL');

    // Bob's new Cloudinary image URL
    const bobImageUrl = 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_400,h_400,c_fill,g_face,q_auto,f_auto/v1757903567/bob_sl4ox8.jpg';

    console.log('🎭 Updating Bob the Drag Queen image...');
    console.log(`URL: ${bobImageUrl}`);

    // Update Bob's profile image
    const result = await client.query(`
      UPDATE talent
      SET profile_image_url = $1, updated_at = NOW()
      WHERE name = 'Bob the Drag Queen'
      RETURNING id, name, profile_image_url
    `, [bobImageUrl]);

    if (result.rows.length > 0) {
      console.log('✅ Successfully updated Bob the Drag Queen profile image:');
      console.log(`  Name: ${result.rows[0].name}`);
      console.log(`  ID: ${result.rows[0].id}`);
      console.log(`  Image: ${result.rows[0].profile_image_url}`);
    } else {
      console.log('❌ Bob the Drag Queen not found in talent table');
    }

    console.log('\n🎉 Bob the Drag Queen now has her updated profile image!');
    console.log('👑 Season 8 winner ready to serve comedy and charisma!');

  } catch (error) {
    console.error('❌ Update failed:', error);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

updateBobImage();