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

async function cleanupTalentDuplicates() {
  console.log('🧹 Cleaning up talent duplicates and cruise associations...');

  try {
    await client.connect();
    console.log('✅ Connected to Railway PostgreSQL');

    // Get cruise IDs
    const cruises = await client.query(`
      SELECT id, name, slug FROM cruises WHERE slug IN ('greek-isles-2025', 'drag-stars-at-sea-2025')
      ORDER BY slug
    `);

    const dragStarsCruise = cruises.rows.find(c => c.slug === 'drag-stars-at-sea-2025');
    const greekCruise = cruises.rows.find(c => c.slug === 'greek-isles-2025');

    console.log(`✅ Found cruises:`);
    console.log(`   Drag Stars: ${dragStarsCruise.name} (ID: ${dragStarsCruise.id})`);
    console.log(`   Greek Isles: ${greekCruise.name} (ID: ${greekCruise.id})`);

    // Define who should be on Drag Stars cruise (the 9 performers from the original list)
    const dragStarsPerformers = [
      'Bob the Drag Queen',
      'Bianca del Rio',
      'Alyssa Edwards',
      'House of Avalon',
      'Sugar',
      'Spice',
      'Trinity the Tuck',
      'Plasma',
      'Jackie Cox'
    ];

    console.log('\n🎭 Drag Stars performers should be:');
    dragStarsPerformers.forEach((name, i) => console.log(`   ${i+1}. ${name}`));

    // Step 1: Clear ALL existing cruise-talent associations
    console.log('\n🗑️ Clearing all existing cruise-talent associations...');
    await client.query('DELETE FROM cruise_talent');
    console.log('   ✅ All cruise-talent associations cleared');

    // Step 2: Find and remove duplicate talent entries
    console.log('\n🔍 Finding duplicate talent entries...');

    // Find potential duplicates (case-insensitive)
    const allTalent = await client.query(`
      SELECT id, name, category FROM talent ORDER BY name
    `);

    const nameGroups = {};
    allTalent.rows.forEach(talent => {
      const normalizedName = talent.name.toLowerCase().trim();
      if (!nameGroups[normalizedName]) {
        nameGroups[normalizedName] = [];
      }
      nameGroups[normalizedName].push(talent);
    });

    // Handle specific duplicates
    const duplicateFixMap = {
      'bianca del rio': 'Bianca del Rio', // Keep the properly capitalized version
      'sugar and spice': null, // Remove this group entry, we have individual Sugar/Spice
    };

    console.log('\n🧹 Removing specific duplicates...');

    // Remove "Sugar and Spice" group entry since we have individual Sugar and Spice
    const sugarAndSpiceResult = await client.query(`
      DELETE FROM talent WHERE name = 'Sugar and Spice'
      RETURNING id, name
    `);
    if (sugarAndSpiceResult.rows.length > 0) {
      console.log(`   ✅ Removed "Sugar and Spice" group entry`);
    }

    // Remove the incorrectly capitalized "Bianca Del Rio" and keep "Bianca del Rio"
    const biancaDupeResult = await client.query(`
      DELETE FROM talent WHERE name = 'Bianca Del Rio'
      RETURNING id, name
    `);
    if (biancaDupeResult.rows.length > 0) {
      console.log(`   ✅ Removed duplicate "Bianca Del Rio"`);
    }

    // Step 3: Link Drag Stars performers to Drag Stars cruise
    console.log('\n🌟 Linking Drag Stars performers...');

    for (const performerName of dragStarsPerformers) {
      const talentResult = await client.query(`
        SELECT id FROM talent WHERE name = $1
      `, [performerName]);

      if (talentResult.rows.length === 0) {
        console.log(`   ❌ ${performerName} not found in talent table`);
        continue;
      }

      const talentId = talentResult.rows[0].id;

      await client.query(`
        INSERT INTO cruise_talent (cruise_id, talent_id, role, created_at)
        VALUES ($1, $2, 'Featured Performer', NOW())
      `, [dragStarsCruise.id, talentId]);

      console.log(`   ✅ Linked ${performerName} to Drag Stars cruise`);
    }

    // Step 4: Link ALL remaining talent to Greek cruise
    console.log('\n🏛️ Linking remaining talent to Greek cruise...');

    const remainingTalent = await client.query(`
      SELECT id, name FROM talent
      WHERE id NOT IN (
        SELECT talent_id FROM cruise_talent WHERE cruise_id = $1
      )
      ORDER BY name
    `, [dragStarsCruise.id]);

    console.log(`   Found ${remainingTalent.rows.length} remaining talent for Greek cruise`);

    for (const talent of remainingTalent.rows) {
      await client.query(`
        INSERT INTO cruise_talent (cruise_id, talent_id, role, created_at)
        VALUES ($1, $2, 'Featured Performer', NOW())
      `, [greekCruise.id, talent.id]);

      console.log(`   ✅ Linked ${talent.name} to Greek cruise`);
    }

    // Step 5: Final verification
    console.log('\n📊 Final verification:');

    const dragStarsCount = await client.query(`
      SELECT COUNT(*) as count FROM cruise_talent WHERE cruise_id = $1
    `, [dragStarsCruise.id]);

    const greekCount = await client.query(`
      SELECT COUNT(*) as count FROM cruise_talent WHERE cruise_id = $1
    `, [greekCruise.id]);

    const dragStarsTalent = await client.query(`
      SELECT t.name FROM talent t
      JOIN cruise_talent ct ON t.id = ct.talent_id
      WHERE ct.cruise_id = $1
      ORDER BY t.name
    `, [dragStarsCruise.id]);

    console.log(`   ✅ Drag Stars cruise: ${dragStarsCount.rows[0].count} talent`);
    console.log(`   ✅ Greek Isles cruise: ${greekCount.rows[0].count} talent`);

    console.log('\n🎭 Drag Stars talent:');
    dragStarsTalent.rows.forEach((talent, i) => {
      console.log(`   ${i+1}. ${talent.name}`);
    });

    // Check for any cross-contamination
    const crossCheck = await client.query(`
      SELECT
        t.name,
        COUNT(DISTINCT ct.cruise_id) as cruise_count
      FROM talent t
      JOIN cruise_talent ct ON t.id = ct.talent_id
      GROUP BY t.id, t.name
      HAVING COUNT(DISTINCT ct.cruise_id) > 1
    `);

    if (crossCheck.rows.length > 0) {
      console.log('\n⚠️ WARNING: Talent linked to multiple cruises:');
      crossCheck.rows.forEach(talent => {
        console.log(`   ${talent.name} (linked to ${talent.cruise_count} cruises)`);
      });
    } else {
      console.log('\n✅ SUCCESS: No talent is linked to multiple cruises');
    }

    console.log('\n🎉 Talent cleanup completed!');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

cleanupTalentDuplicates();