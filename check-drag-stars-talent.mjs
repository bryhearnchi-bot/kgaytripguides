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

async function checkDragStarsTalent() {
  console.log('🔍 Checking Drag Stars talent in database...');

  try {
    await client.connect();
    console.log('✅ Connected to Railway PostgreSQL');

    // Get cruise info
    const cruiseResult = await client.query(`
      SELECT id, name, slug FROM cruises WHERE slug = 'drag-stars-at-sea-2025'
    `);

    if (cruiseResult.rows.length === 0) {
      console.log('❌ Drag Stars cruise not found');
      return;
    }

    const cruise = cruiseResult.rows[0];
    console.log(`✅ Found cruise: ${cruise.name} (ID: ${cruise.id})`);

    // Check talent linked to this cruise
    console.log('\n🎭 Talent linked to Drag Stars cruise:');
    const talentResult = await client.query(`
      SELECT
        t.id,
        t.name,
        t.category,
        t.bio,
        t.known_for,
        t.social_links,
        t.profile_image_url,
        ct.role
      FROM talent t
      JOIN cruise_talent ct ON t.id = ct.talent_id
      WHERE ct.cruise_id = $1
      ORDER BY t.name
    `, [cruise.id]);

    if (talentResult.rows.length === 0) {
      console.log('❌ No talent found linked to Drag Stars cruise');
    } else {
      console.log(`✅ Found ${talentResult.rows.length} performers:`);
      talentResult.rows.forEach((talent, index) => {
        console.log(`\n${index + 1}. ${talent.name}`);
        console.log(`   Category: ${talent.category}`);
        console.log(`   Known for: ${talent.known_for}`);
        console.log(`   Role: ${talent.role}`);
        console.log(`   Image URL: ${talent.profile_image_url || 'No image'}`);
        console.log(`   Social links: ${talent.social_links ? JSON.stringify(talent.social_links) : 'None'}`);
        console.log(`   Bio: ${talent.bio ? talent.bio.substring(0, 100) + '...' : 'No bio'}`);
      });
    }

    // Check if there are any talent records not linked to any cruise
    console.log('\n🎭 All talent in database:');
    const allTalentResult = await client.query(`
      SELECT
        t.id,
        t.name,
        t.category,
        COUNT(ct.cruise_id) as cruise_count
      FROM talent t
      LEFT JOIN cruise_talent ct ON t.id = ct.talent_id
      GROUP BY t.id, t.name, t.category
      ORDER BY t.name
    `);

    console.log(`📊 Total talent records: ${allTalentResult.rows.length}`);
    allTalentResult.rows.forEach((talent) => {
      console.log(`  ${talent.name} (${talent.category}) - linked to ${talent.cruise_count} cruise(s)`);
    });

  } catch (error) {
    console.error('❌ Check failed:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

checkDragStarsTalent();