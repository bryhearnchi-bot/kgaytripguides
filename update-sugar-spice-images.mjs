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

async function updateSugarSpiceImages() {
  console.log('🍭 Updating Sugar and Spice profile images...');

  try {
    await client.connect();
    console.log('✅ Connected to Railway PostgreSQL');

    // Sugar & Spice image URL (they're twins so using the same image for both)
    const sugarSpiceImageUrl = 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_400,h_400,c_fill,g_face,q_auto,f_auto/v1757903570/sugar_vpd0ut.jpg';

    console.log('🎭 Updating Sugar image...');
    console.log(`URL: ${sugarSpiceImageUrl}`);

    // Update Sugar's profile image
    const sugarResult = await client.query(`
      UPDATE talent
      SET profile_image_url = $1, updated_at = NOW()
      WHERE name = 'Sugar'
      RETURNING id, name, profile_image_url
    `, [sugarSpiceImageUrl]);

    if (sugarResult.rows.length > 0) {
      console.log('✅ Successfully updated Sugar profile image:');
      console.log(`  Name: ${sugarResult.rows[0].name}`);
      console.log(`  ID: ${sugarResult.rows[0].id}`);
      console.log(`  Image: ${sugarResult.rows[0].profile_image_url}`);
    } else {
      console.log('❌ Sugar not found in talent table');
    }

    console.log('\n🌶️ Updating Spice image...');
    console.log(`URL: ${sugarSpiceImageUrl}`);

    // Update Spice's profile image (same image since they're twins)
    const spiceResult = await client.query(`
      UPDATE talent
      SET profile_image_url = $1, updated_at = NOW()
      WHERE name = 'Spice'
      RETURNING id, name, profile_image_url
    `, [sugarSpiceImageUrl]);

    if (spiceResult.rows.length > 0) {
      console.log('✅ Successfully updated Spice profile image:');
      console.log(`  Name: ${spiceResult.rows[0].name}`);
      console.log(`  ID: ${spiceResult.rows[0].id}`);
      console.log(`  Image: ${spiceResult.rows[0].profile_image_url}`);
    } else {
      console.log('❌ Spice not found in talent table');
    }

    console.log('\n🎉 Sugar and Spice now have their profile images!');
    console.log('👭 Twin duo ready to slay on the Drag Stars cruise!');

  } catch (error) {
    console.error('❌ Update failed:', error);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

updateSugarSpiceImages();