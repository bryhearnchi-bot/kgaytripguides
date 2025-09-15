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

async function fixGreekCruiseTalent() {
  console.log('🏛️ Fixing Greek Cruise talent associations...');

  try {
    await client.connect();
    console.log('✅ Connected to Railway PostgreSQL');

    // Get cruise IDs
    const cruises = await client.query(`
      SELECT id, name, slug FROM cruises WHERE slug IN ('greek-isles-2025', 'drag-stars-at-sea-2025')
      ORDER BY slug
    `);

    if (cruises.rows.length !== 2) {
      console.log('❌ Could not find both cruises');
      return;
    }

    const dragStarsCruise = cruises.rows.find(c => c.slug === 'drag-stars-at-sea-2025');
    const greekCruise = cruises.rows.find(c => c.slug === 'greek-isles-2025');

    console.log(`✅ Found cruises:`);
    console.log(`   Drag Stars: ${dragStarsCruise.name} (ID: ${dragStarsCruise.id})`);
    console.log(`   Greek Isles: ${greekCruise.name} (ID: ${greekCruise.id})`);

    // Check current talent associations
    console.log('\n🔍 Current talent associations:');

    const dragStarsTalent = await client.query(`
      SELECT t.name FROM talent t
      JOIN cruise_talent ct ON t.id = ct.talent_id
      WHERE ct.cruise_id = $1
      ORDER BY t.name
    `, [dragStarsCruise.id]);

    const greekTalent = await client.query(`
      SELECT t.name FROM talent t
      JOIN cruise_talent ct ON t.id = ct.talent_id
      WHERE ct.cruise_id = $1
      ORDER BY t.name
    `, [greekCruise.id]);

    console.log(`   Drag Stars has ${dragStarsTalent.rows.length} talent linked`);
    console.log(`   Greek Isles has ${greekTalent.rows.length} talent linked`);

    // Get all talent that are NOT linked to Drag Stars (these should be Greek talent)
    const potentialGreekTalent = await client.query(`
      SELECT t.id, t.name, t.category
      FROM talent t
      WHERE t.id NOT IN (
        SELECT ct.talent_id
        FROM cruise_talent ct
        WHERE ct.cruise_id = $1
      )
      ORDER BY t.name
    `, [dragStarsCruise.id]);

    console.log(`\n🎭 Found ${potentialGreekTalent.rows.length} talent NOT linked to Drag Stars:`);
    potentialGreekTalent.rows.forEach((talent, index) => {
      console.log(`   ${index + 1}. ${talent.name} (${talent.category})`);
    });

    if (potentialGreekTalent.rows.length === 0) {
      console.log('ℹ️ No available talent to link to Greek cruise');
      return;
    }

    // Link all non-drag-stars talent to Greek cruise
    console.log(`\n🔗 Linking ${potentialGreekTalent.rows.length} talent to Greek cruise...`);

    for (const talent of potentialGreekTalent.rows) {
      // Check if already linked
      const existing = await client.query(`
        SELECT 1 FROM cruise_talent
        WHERE cruise_id = $1 AND talent_id = $2
      `, [greekCruise.id, talent.id]);

      if (existing.rows.length === 0) {
        await client.query(`
          INSERT INTO cruise_talent (cruise_id, talent_id, role, created_at)
          VALUES ($1, $2, 'Featured Performer', NOW())
        `, [greekCruise.id, talent.id]);
        console.log(`   ✅ Linked ${talent.name} to Greek cruise`);
      } else {
        console.log(`   ⚠️ ${talent.name} already linked to Greek cruise`);
      }
    }

    // Verify final counts
    console.log('\n📊 Final verification:');

    const finalDragStars = await client.query(`
      SELECT COUNT(*) as count FROM cruise_talent WHERE cruise_id = $1
    `, [dragStarsCruise.id]);

    const finalGreek = await client.query(`
      SELECT COUNT(*) as count FROM cruise_talent WHERE cruise_id = $1
    `, [greekCruise.id]);

    console.log(`   ✅ Drag Stars cruise: ${finalDragStars.rows[0].count} talent`);
    console.log(`   ✅ Greek Isles cruise: ${finalGreek.rows[0].count} talent`);

    console.log('\n🎉 Greek cruise talent associations fixed!');

  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

fixGreekCruiseTalent();