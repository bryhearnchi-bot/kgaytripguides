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

async function updateAvalonPlasmaImages() {
  console.log('🏠✨ Updating House of Avalon and Plasma profile images...');

  try {
    await client.connect();
    console.log('✅ Connected to Railway PostgreSQL');

    // House of Avalon's new Cloudinary image URL
    const avalonImageUrl = 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_400,h_400,c_fill,g_face,q_auto,f_auto/v1757903568/avalon_fav1qd.jpg';

    // Plasma's new Cloudinary image URL
    const plasmaImageUrl = 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_400,h_400,c_fill,g_face,q_auto,f_auto/v1757903568/plasma_g6ajyj.jpg';

    console.log('🏠 Updating House of Avalon image...');
    console.log(`URL: ${avalonImageUrl}`);

    // Update House of Avalon's profile image
    const avalonResult = await client.query(`
      UPDATE talent
      SET profile_image_url = $1, updated_at = NOW()
      WHERE name = 'House of Avalon'
      RETURNING id, name, profile_image_url
    `, [avalonImageUrl]);

    if (avalonResult.rows.length > 0) {
      console.log('✅ Successfully updated House of Avalon profile image:');
      console.log(`  Name: ${avalonResult.rows[0].name}`);
      console.log(`  ID: ${avalonResult.rows[0].id}`);
      console.log(`  Image: ${avalonResult.rows[0].profile_image_url}`);
    } else {
      console.log('❌ House of Avalon not found in talent table');
    }

    console.log('\n⚡ Updating Plasma image...');
    console.log(`URL: ${plasmaImageUrl}`);

    // Update Plasma's profile image
    const plasmaResult = await client.query(`
      UPDATE talent
      SET profile_image_url = $1, updated_at = NOW()
      WHERE name = 'Plasma'
      RETURNING id, name, profile_image_url
    `, [plasmaImageUrl]);

    if (plasmaResult.rows.length > 0) {
      console.log('✅ Successfully updated Plasma profile image:');
      console.log(`  Name: ${plasmaResult.rows[0].name}`);
      console.log(`  ID: ${plasmaResult.rows[0].id}`);
      console.log(`  Image: ${plasmaResult.rows[0].profile_image_url}`);
    } else {
      console.log('❌ Plasma not found in talent table');
    }

    console.log('\n🎉 House of Avalon and Plasma now have their profile images!');
    console.log('🏠 Drag collective excellence ready!');
    console.log('⚡ Edgy alternative drag ready!');

  } catch (error) {
    console.error('❌ Update failed:', error);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

updateAvalonPlasmaImages();