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

// Talent data based on research
const talentData = [
  {
    name: "Bob the Drag Queen",
    category: "Drag",
    bio: "Winner of RuPaul's Drag Race Season 8, Bob the Drag Queen is known for her quick wit, political humor, and incredible comedic timing. She has appeared on numerous TV shows, hosted podcasts, and continues to be a powerful voice for LGBTQ+ rights and social justice. Bob's performances blend drag artistry with sharp social commentary.",
    knownFor: "RuPaul's Drag Race Season 8 Winner",
    socialLinks: {
      instagram: "https://www.instagram.com/bobthedragqueen",
      twitter: "https://twitter.com/bobthedragqueen",
      website: null
    }
  },
  {
    name: "Bianca del Rio",
    category: "Drag",
    bio: "The self-proclaimed 'Joan Rivers of drag,' Bianca del Rio won RuPaul's Drag Race Season 6 with her razor-sharp tongue and impeccable fashion sense. Known for her quick wit and brutal honesty, she has released multiple comedy specials, written books, and toured worldwide with her stand-up comedy shows.",
    knownFor: "RuPaul's Drag Race Season 6 Winner, Comedy Queen",
    socialLinks: {
      instagram: "https://www.instagram.com/thebiancadelrio",
      twitter: "https://twitter.com/biancadelrio",
      website: "https://www.biancadelrio.com"
    }
  },
  {
    name: "Alyssa Edwards",
    category: "Drag",
    bio: "A legendary drag performer from Texas, Alyssa Edwards is known for her high-energy performances, dance background, and iconic one-liners. She competed on RuPaul's Drag Race Season 5 and All Stars 2, and has her own dance studio. Her Netflix series 'Dancing Queen' showcased her life as both a drag performer and dance teacher.",
    knownFor: "RuPaul's Drag Race All Star, Dancing Queen",
    socialLinks: {
      instagram: "https://www.instagram.com/alyssaedwards_1",
      twitter: "https://twitter.com/AlyssaEdwards_1",
      website: null
    }
  },
  {
    name: "House of Avalon",
    category: "Drag",
    bio: "House of Avalon is a collective of talented drag performers known for their polished performances, stunning looks, and collaborative artistry. The house represents a new generation of drag excellence, combining traditional drag elements with contemporary innovation and theatrical flair.",
    knownFor: "Drag House Collective",
    socialLinks: {
      instagram: "https://www.instagram.com/houseofavalon",
      twitter: null,
      website: null
    }
  },
  {
    name: "Sugar",
    category: "Drag",
    bio: "One half of the dynamic twin duo from RuPaul's Drag Race Season 15, Sugar brings sweetness with a side of spice to every performance. Known for her bubbly personality, stunning looks, and strong sisterly bond with Spice, she represents the new generation of drag excellence.",
    knownFor: "RuPaul's Drag Race Season 15 Contestant",
    socialLinks: {
      instagram: "https://www.instagram.com/sugarrush.drag",
      twitter: null,
      website: null
    }
  },
  {
    name: "Spice",
    category: "Drag",
    bio: "The fiercer half of the twin duo from RuPaul's Drag Race Season 15, Spice brings attitude and glamour to every stage. Along with her sister Sugar, she made history as part of the first twin contestants on the show, showcasing both individual talent and unbreakable sisterly bonds.",
    knownFor: "RuPaul's Drag Race Season 15 Contestant",
    socialLinks: {
      instagram: "https://www.instagram.com/spicerush.drag",
      twitter: null,
      website: null
    }
  },
  {
    name: "Trinity the Tuck",
    category: "Drag",
    bio: "Winner of RuPaul's Drag Race All Stars 4, Trinity the Tuck is known for her body modifications, fierce performances, and transformation into 'The Body.' A southern belle with a sharp tongue, she's become one of drag's most recognizable faces with her distinctive style and confident personality.",
    knownFor: "RuPaul's Drag Race All Stars 4 Winner",
    socialLinks: {
      instagram: "https://www.instagram.com/trinitythetuck",
      twitter: "https://twitter.com/TrinityTheTuck",
      website: null
    }
  },
  {
    name: "Plasma",
    category: "Drag",
    bio: "A fierce competitor from RuPaul's Drag Race Season 16, Plasma is known for her edgy aesthetic, alternative drag style, and unapologetic attitude. She brings a punk rock sensibility to drag performance, challenging traditional beauty standards with her unique and memorable looks.",
    knownFor: "RuPaul's Drag Race Season 16 Contestant",
    socialLinks: {
      instagram: "https://www.instagram.com/plasma.drag",
      twitter: null,
      website: null
    }
  },
  {
    name: "Jackie Cox",
    category: "Drag",
    bio: "A Persian-American drag performer from RuPaul's Drag Race Season 12, Jackie Cox is known for her political activism, Middle Eastern representation in drag, and advocacy for LGBTQ+ rights. She brings cultural pride and political awareness to her performances while serving stunning Middle Eastern-inspired looks.",
    knownFor: "RuPaul's Drag Race Season 12 Contestant, Political Activist",
    socialLinks: {
      instagram: "https://www.instagram.com/jackiecoxnyc",
      twitter: "https://twitter.com/JackieCoxNYC",
      website: null
    }
  }
];

async function addDragStarsTalent() {
  console.log('🌟 Adding Drag Stars talent to database...');

  try {
    await client.connect();
    console.log('✅ Connected to Railway PostgreSQL');

    // First, check if talent already exists and get cruise ID
    const cruiseResult = await client.query(`
      SELECT id FROM cruises WHERE slug = 'drag-stars-at-sea-2025'
    `);

    if (cruiseResult.rows.length === 0) {
      console.log('❌ Drag Stars cruise not found');
      return;
    }

    const cruiseId = cruiseResult.rows[0].id;
    console.log(`✅ Found Drag Stars cruise with ID: ${cruiseId}`);

    let addedCount = 0;
    let skippedCount = 0;

    for (const performer of talentData) {
      console.log(`\n🎭 Processing ${performer.name}...`);

      // Check if talent already exists
      const existingTalent = await client.query(`
        SELECT id FROM talent WHERE name = $1
      `, [performer.name]);

      let talentId;

      if (existingTalent.rows.length > 0) {
        talentId = existingTalent.rows[0].id;
        console.log(`  ⚠️ ${performer.name} already exists in talent table (ID: ${talentId})`);
        skippedCount++;
      } else {
        // Insert new talent
        const talentResult = await client.query(`
          INSERT INTO talent (name, category, bio, known_for, social_links, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
          RETURNING id
        `, [
          performer.name,
          performer.category,
          performer.bio,
          performer.knownFor,
          JSON.stringify(performer.socialLinks)
        ]);

        talentId = talentResult.rows[0].id;
        console.log(`  ✅ Added ${performer.name} to talent table (ID: ${talentId})`);
        addedCount++;
      }

      // Check if cruise-talent relationship exists
      const existingRelation = await client.query(`
        SELECT * FROM cruise_talent WHERE cruise_id = $1 AND talent_id = $2
      `, [cruiseId, talentId]);

      if (existingRelation.rows.length === 0) {
        // Add to cruise_talent junction table
        await client.query(`
          INSERT INTO cruise_talent (cruise_id, talent_id, role, created_at)
          VALUES ($1, $2, $3, NOW())
        `, [cruiseId, talentId, 'Featured Performer']);

        console.log(`  ✅ Linked ${performer.name} to Drag Stars cruise`);
      } else {
        console.log(`  ⚠️ ${performer.name} already linked to Drag Stars cruise`);
      }
    }

    console.log('\n📊 Summary:');
    console.log(`  ✅ New talent added: ${addedCount}`);
    console.log(`  ⚠️ Existing talent skipped: ${skippedCount}`);
    console.log(`  🔗 All talent linked to Drag Stars cruise`);

    // Verify final count
    const finalCount = await client.query(`
      SELECT COUNT(*) as count
      FROM cruise_talent ct
      JOIN talent t ON ct.talent_id = t.id
      WHERE ct.cruise_id = $1
    `, [cruiseId]);

    console.log(`\n🎉 Drag Stars cruise now has ${finalCount.rows[0].count} performers!`);

  } catch (error) {
    console.error('❌ Failed to add talent:', error);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

addDragStarsTalent();