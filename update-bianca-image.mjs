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

async function updateBiancaImage() {
  console.log('💄 Updating Bianca del Rio profile image...');

  try {
    await client.connect();
    console.log('✅ Connected to Railway PostgreSQL');

    // Bianca's new Cloudinary image URL
    const biancaImageUrl = 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_400,h_400,c_fill,g_face,q_auto,f_auto/v1757903570/bianca_jh9ojg.jpg';

    console.log('🎭 Updating Bianca del Rio image...');
    console.log(`URL: ${biancaImageUrl}`);

    // Update Bianca's profile image
    const result = await client.query(`
      UPDATE talent
      SET profile_image_url = $1, updated_at = NOW()
      WHERE name = 'Bianca del Rio'
      RETURNING id, name, profile_image_url
    `, [biancaImageUrl]);

    if (result.rows.length > 0) {
      console.log('✅ Successfully updated Bianca del Rio profile image:');
      console.log(`  Name: ${result.rows[0].name}`);
      console.log(`  ID: ${result.rows[0].id}`);
      console.log(`  Image: ${result.rows[0].profile_image_url}`);
    } else {
      console.log('❌ Bianca del Rio not found in talent table');
    }

    console.log('\n🎉 Bianca del Rio now has her profile image!');

  } catch (error) {
    console.error('❌ Update failed:', error);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

updateBiancaImage();