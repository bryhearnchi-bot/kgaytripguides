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

async function updateRemainingDragStarsImages() {
  console.log('💃👑 Updating remaining Drag Stars profile images...');

  try {
    await client.connect();
    console.log('✅ Connected to Railway PostgreSQL');

    // Image URLs for remaining performers
    const imageUpdates = [
      {
        name: 'Alyssa Edwards',
        url: 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_400,h_400,c_fill,g_face,q_auto,f_auto/v1757903567/alyssa_ecvvvx.jpg',
        emoji: '💃'
      },
      {
        name: 'Trinity the Tuck',
        url: 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_400,h_400,c_fill,g_face,q_auto,f_auto/v1757903567/trinity_pxalyq.jpg',
        emoji: '👑'
      }
    ];

    for (const update of imageUpdates) {
      console.log(`\n${update.emoji} Updating ${update.name} image...`);
      console.log(`URL: ${update.url}`);

      const result = await client.query(`
        UPDATE talent
        SET profile_image_url = $1, updated_at = NOW()
        WHERE name = $2
        RETURNING id, name, profile_image_url
      `, [update.url, update.name]);

      if (result.rows.length > 0) {
        console.log(`✅ Successfully updated ${update.name} profile image:`);
        console.log(`  Name: ${result.rows[0].name}`);
        console.log(`  ID: ${result.rows[0].id}`);
        console.log(`  Image: ${result.rows[0].profile_image_url}`);
      } else {
        console.log(`❌ ${update.name} not found in talent table`);
      }
    }

    // Final verification - check all Drag Stars performers
    console.log('\n🔍 Final verification of all Drag Stars performer images:');

    const dragStarsCheck = await client.query(`
      SELECT t.name, t.profile_image_url
      FROM talent t
      JOIN cruise_talent ct ON t.id = ct.talent_id
      JOIN cruises c ON ct.cruise_id = c.id
      WHERE c.slug = 'drag-stars-at-sea-2025'
      ORDER BY t.name
    `);

    console.log(`\n📋 All ${dragStarsCheck.rows.length} Drag Stars performers:`);
    dragStarsCheck.rows.forEach((performer, index) => {
      const hasImage = performer.profile_image_url ? '✅' : '❌';
      const imageName = performer.profile_image_url ?
        performer.profile_image_url.split('/').pop().split('_')[0] : 'No image';
      console.log(`  ${index + 1}. ${performer.name} ${hasImage} ${imageName}`);
    });

    const withImages = dragStarsCheck.rows.filter(p => p.profile_image_url).length;
    const withoutImages = dragStarsCheck.rows.length - withImages;

    console.log(`\n📊 Image status:`);
    console.log(`  ✅ With images: ${withImages}`);
    console.log(`  ❌ Without images: ${withoutImages}`);

    if (withoutImages === 0) {
      console.log('\n🎉 SUCCESS: All Drag Stars performers now have profile images!');
      console.log('🌟 The talent page is ready to sparkle!');
    } else {
      console.log('\n⚠️ Some performers still need images.');
    }

  } catch (error) {
    console.error('❌ Update failed:', error);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

updateRemainingDragStarsImages();