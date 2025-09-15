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

async function addDragStarsCruise() {
  console.log('🌟 Adding Drag Stars at Sea cruise to Railway database...');

  try {
    await client.connect();
    console.log('✅ Connected to Railway PostgreSQL');

    // Get the user ID for created_by
    const userResult = await client.query('SELECT id FROM users LIMIT 1');
    const userId = userResult.rows[0]?.id || null;

    // First, let's get the next available cruise ID
    const maxIdResult = await client.query('SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM cruises');
    const nextCruiseId = maxIdResult.rows[0].next_id;
    console.log(`📊 Next cruise ID will be: ${nextCruiseId}`);

    // 1. Create the cruise
    console.log('🚢 Creating cruise record...');
    const cruiseResult = await client.query(`
      INSERT INTO cruises (
        name, slug, ship_name, cruise_line, trip_type, start_date, end_date,
        status, hero_image_url, description, highlights, includes_info, pricing, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
      ) RETURNING id
    `, [
      'Drag Stars at Sea 2025',
      'drag-stars-at-sea-2025',
      'Valiant Lady',
      'Virgin Voyages',
      'cruise',
      '2025-10-15T17:00:00.000Z', // Oct 15, 5:00 PM
      '2025-10-19T07:00:00.000Z', // Oct 19, 7:00 AM
      'upcoming',
      'https://res.cloudinary.com/dfqoebbyj/image/upload/w_1200,h_600,c_fill,g_center,q_auto,f_auto/v1/cruise-app/ships/valiant-lady.jpg',
      'An unforgettable 4-night drag extravaganza featuring world-class performers including Bianca Del Rio, Bob the Drag Queen, and Trinity the Tuck aboard Virgin Voyages\' Valiant Lady.',
      JSON.stringify([
        'Headlining performances by RuPaul\'s Drag Race stars',
        'Multiple performance venues and poolside shows',
        'Themed events and spontaneous performances',
        'Premium Virgin Voyages amenities included',
        'Produced by Atlantis Events with 35+ years experience'
      ]),
      JSON.stringify({
        'basic_wifi': 'Included',
        'premium_dining': 'All restaurants included',
        'beverages': 'Basic non-alcoholic beverages included',
        'fitness': 'Fitness classes included',
        'gratuities': 'All gratuities included'
      }),
      JSON.stringify({
        'starting_price': '$699',
        'duration': '4 nights',
        'currency': 'USD',
        'pricing_note': 'Starting price for interior cabin'
      }),
      userId
    ]);

    const cruiseId = cruiseResult.rows[0].id;
    console.log(`✅ Created cruise with ID: ${cruiseId}`);

    // 2. Add itinerary
    console.log('🗺️  Adding itinerary...');
    const itineraryData = [
      {
        day: 1,
        date: '2025-10-15T17:00:00.000Z',
        port_name: 'Miami',
        country: 'United States',
        arrival_time: '—',
        departure_time: '17:00',
        all_aboard_time: '16:30',
        description: 'Embarkation day in the vibrant city of Miami',
        highlights: JSON.stringify(['Embarkation', 'Ship exploration', 'Welcome activities'])
      },
      {
        day: 2,
        date: '2025-10-16T12:00:00.000Z',
        port_name: 'Day at Sea',
        country: null,
        arrival_time: '—',
        departure_time: '—',
        all_aboard_time: '—',
        description: 'Slay Day at Sea - Full day of drag performances and activities',
        highlights: JSON.stringify(['Drag performances', 'Poolside shows', 'Themed events', 'Ship amenities'])
      },
      {
        day: 3,
        date: '2025-10-17T08:00:00.000Z',
        port_name: 'Key West',
        country: 'United States',
        arrival_time: '08:00',
        departure_time: '17:00',
        all_aboard_time: '16:30',
        description: 'Explore the colorful island paradise of Key West, Florida',
        highlights: JSON.stringify(['Duval Street', 'Hemingway House', 'Mallory Square sunset', 'Local bars and restaurants'])
      },
      {
        day: 4,
        date: '2025-10-18T09:00:00.000Z',
        port_name: 'Bimini',
        country: 'Bahamas',
        arrival_time: '09:00',
        departure_time: '18:00',
        all_aboard_time: '17:30',
        description: 'Beautiful Bahamian island with pristine beaches and crystal waters',
        highlights: JSON.stringify(['Beach time', 'Water activities', 'Local culture', 'Duty-free shopping'])
      },
      {
        day: 5,
        date: '2025-10-19T07:00:00.000Z',
        port_name: 'Miami',
        country: 'United States',
        arrival_time: '07:00',
        departure_time: '—',
        all_aboard_time: '—',
        description: 'Disembarkation in Miami - end of cruise',
        highlights: JSON.stringify(['Disembarkation', 'Farewell breakfast', 'Luggage collection'])
      }
    ];

    for (let i = 0; i < itineraryData.length; i++) {
      const item = itineraryData[i];
      await client.query(`
        INSERT INTO itinerary (
          cruise_id, date, day, port_name, country, arrival_time,
          departure_time, all_aboard_time, description, highlights, order_index
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        cruiseId, item.date, item.day, item.port_name, item.country,
        item.arrival_time, item.departure_time, item.all_aboard_time,
        item.description, item.highlights, i + 1
      ]);
    }
    console.log(`✅ Added ${itineraryData.length} itinerary items`);

    // 3. Add talent
    console.log('🌟 Adding talent...');
    const talentData = [
      {
        name: 'Bianca Del Rio',
        category: 'Drag',
        bio: 'Winner of RuPaul\'s Drag Race Season 6, known for her sharp wit and comedic timing.',
        known_for: 'RuPaul\'s Drag Race Season 6 Winner, Stand-up Comedy',
        profile_image_url: 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_400,h_400,c_fill,g_face,q_auto,f_auto/v1/cruise-app/talent/bianca-del-rio.jpg'
      },
      {
        name: 'Bob the Drag Queen',
        category: 'Drag',
        bio: 'Winner of RuPaul\'s Drag Race Season 8, comedian, musician, and activist.',
        known_for: 'RuPaul\'s Drag Race Season 8 Winner, Comedy, Music',
        profile_image_url: 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_400,h_400,c_fill,g_face,q_auto,f_auto/v1/cruise-app/talent/bob-the-drag-queen.jpg'
      },
      {
        name: 'Trinity the Tuck',
        category: 'Drag',
        bio: 'RuPaul\'s Drag Race All Stars 4 Winner, known for her pageant excellence and performance skills.',
        known_for: 'RuPaul\'s Drag Race All Stars 4 Winner, Pageant Excellence',
        profile_image_url: 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_400,h_400,c_fill,g_face,q_auto,f_auto/v1/cruise-app/talent/trinity-the-tuck.jpg'
      },
      {
        name: 'Alyssa Edwards',
        category: 'Drag',
        bio: 'Fan favorite from RuPaul\'s Drag Race, dance teacher, and entertainer extraordinaire.',
        known_for: 'RuPaul\'s Drag Race, Dancing Queen, Viral Memes',
        profile_image_url: 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_400,h_400,c_fill,g_face,q_auto,f_auto/v1/cruise-app/talent/alyssa-edwards.jpg'
      },
      {
        name: 'Sugar and Spice',
        category: 'Drag',
        bio: 'Twin drag performers known for their synchronized performances and unique twin dynamic.',
        known_for: 'RuPaul\'s Drag Race Season 15, Twin Performances',
        profile_image_url: 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_400,h_400,c_fill,g_face,q_auto,f_auto/v1/cruise-app/talent/sugar-and-spice.jpg'
      },
      {
        name: 'Plasma',
        category: 'Drag',
        bio: 'Fierce drag performer known for high-energy performances and stunning looks.',
        known_for: 'RuPaul\'s Drag Race, High-Energy Performances',
        profile_image_url: 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_400,h_400,c_fill,g_face,q_auto,f_auto/v1/cruise-app/talent/plasma.jpg'
      },
      {
        name: 'Jackie Cox',
        category: 'Drag',
        bio: 'Persian-American drag queen known for her political activism and stunning runway looks.',
        known_for: 'RuPaul\'s Drag Race Season 12, Political Activism',
        profile_image_url: 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_400,h_400,c_fill,g_face,q_auto,f_auto/v1/cruise-app/talent/jackie-cox.jpg'
      },
      {
        name: 'House of Avalon',
        category: 'Drag',
        bio: 'Dynamic drag house known for group performances and collaborative artistry.',
        known_for: 'Group Performances, Drag House Collective',
        profile_image_url: 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_400,h_400,c_fill,g_face,q_auto,f_auto/v1/cruise-app/talent/house-of-avalon.jpg'
      }
    ];

    const talentIds = [];
    for (const talent of talentData) {
      // Check if talent already exists
      const existingTalent = await client.query('SELECT id FROM talent WHERE name = $1', [talent.name]);

      if (existingTalent.rows.length > 0) {
        console.log(`  ♻️  Using existing talent: ${talent.name} (ID: ${existingTalent.rows[0].id})`);
        talentIds.push(existingTalent.rows[0].id);
      } else {
        const talentResult = await client.query(`
          INSERT INTO talent (name, category, bio, known_for, profile_image_url)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id
        `, [talent.name, talent.category, talent.bio, talent.known_for, talent.profile_image_url]);

        console.log(`  ✨ Created new talent: ${talent.name} (ID: ${talentResult.rows[0].id})`);
        talentIds.push(talentResult.rows[0].id);
      }
    }
    console.log(`✅ Added ${talentData.length} talent records`);

    // 4. Add events
    console.log('🎭 Adding events...');
    const eventsData = [
      // Day 1 - Embarkation Day
      {
        date: '2025-10-15T19:30:00.000Z',
        time: '19:30',
        title: 'Drag Stars Welcome Reception',
        type: 'party',
        venue: 'The Manor',
        deck: '5',
        description: 'Welcome aboard celebration with cocktails and meet & greet with the drag stars',
        talent_ids: JSON.stringify(talentIds.slice(0, 4))
      },
      {
        date: '2025-10-15T21:00:00.000Z',
        time: '21:00',
        title: 'Opening Night Spectacular',
        type: 'show',
        venue: 'The Red Room',
        deck: '6',
        description: 'Grand opening show featuring all headlining performers',
        talent_ids: JSON.stringify(talentIds)
      },

      // Day 2 - Slay Day at Sea
      {
        date: '2025-10-16T11:00:00.000Z',
        time: '11:00',
        title: 'Drag Brunch with Bianca Del Rio',
        type: 'dining',
        venue: 'The Wake',
        deck: '15',
        description: 'Hilarious brunch experience with comedy queen Bianca Del Rio',
        talent_ids: JSON.stringify([talentIds[0]])
      },
      {
        date: '2025-10-16T15:00:00.000Z',
        time: '15:00',
        title: 'Poolside Drag Bingo',
        type: 'fun',
        venue: 'The Pool Club',
        deck: '15',
        description: 'High-energy drag bingo by the pool with fabulous prizes',
        talent_ids: JSON.stringify([talentIds[3], talentIds[4]])
      },
      {
        date: '2025-10-16T17:00:00.000Z',
        time: '17:00',
        title: 'Sunset Cocktail Hour',
        type: 'lounge',
        venue: 'The Dock',
        deck: '7',
        description: 'Intimate cocktail hour with acoustic performances',
        talent_ids: JSON.stringify([talentIds[6]])
      },
      {
        date: '2025-10-16T20:00:00.000Z',
        time: '20:00',
        title: 'Trinity\'s Pageant Extravaganza',
        type: 'show',
        venue: 'The Red Room',
        deck: '6',
        description: 'Glamorous pageant-style show hosted by Trinity the Tuck',
        talent_ids: JSON.stringify([talentIds[2]])
      },
      {
        date: '2025-10-16T23:00:00.000Z',
        time: '23:00',
        title: 'Late Night Dance Party',
        type: 'club',
        venue: 'The Manor',
        deck: '5',
        description: 'Dance the night away with DJ sets and surprise performances',
        talent_ids: JSON.stringify([talentIds[7]])
      },

      // Day 3 - Key West
      {
        date: '2025-10-17T19:00:00.000Z',
        time: '19:00',
        title: 'Key West Drag Stories',
        type: 'show',
        venue: 'The Red Room',
        deck: '6',
        description: 'Bob the Drag Queen shares stories and performs hits from Key West adventures',
        talent_ids: JSON.stringify([talentIds[1]])
      },
      {
        date: '2025-10-17T22:00:00.000Z',
        time: '22:00',
        title: 'Alyssa\'s Dance Masterclass After Party',
        type: 'party',
        venue: 'The Manor',
        deck: '5',
        description: 'Dance party following Alyssa Edwards\' exclusive masterclass',
        talent_ids: JSON.stringify([talentIds[3]])
      },

      // Day 4 - Bimini
      {
        date: '2025-10-18T20:30:00.000Z',
        time: '20:30',
        title: 'Bahamas Beach Party Extravaganza',
        type: 'party',
        venue: 'The Pool Club',
        deck: '15',
        description: 'Tropical themed party celebrating our time in the Bahamas',
        talent_ids: JSON.stringify([talentIds[4], talentIds[5]])
      },
      {
        date: '2025-10-18T22:30:00.000Z',
        time: '22:30',
        title: 'House of Avalon Showcase',
        type: 'show',
        venue: 'The Red Room',
        deck: '6',
        description: 'Collaborative performance showcase by House of Avalon',
        talent_ids: JSON.stringify([talentIds[7]])
      },

      // Day 5 - Final Day
      {
        date: '2025-10-19T01:00:00.000Z',
        time: '01:00',
        title: 'Farewell Finale',
        type: 'show',
        venue: 'The Red Room',
        deck: '6',
        description: 'Grand finale show featuring all performers for the last hurrah',
        talent_ids: JSON.stringify(talentIds)
      }
    ];

    for (const event of eventsData) {
      await client.query(`
        INSERT INTO events (
          cruise_id, date, time, title, type, venue, deck,
          description, talent_ids
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        cruiseId, event.date, event.time, event.title, event.type,
        event.venue, event.deck, event.description, event.talent_ids
      ]);
    }
    console.log(`✅ Added ${eventsData.length} events`);

    // Summary
    console.log('\n🎉 Drag Stars at Sea cruise successfully added!');
    console.log(`📊 Summary:`);
    console.log(`  - Cruise ID: ${cruiseId}`);
    console.log(`  - Itinerary: ${itineraryData.length} ports`);
    console.log(`  - Talent: ${talentData.length} performers`);
    console.log(`  - Events: ${eventsData.length} scheduled events`);
    console.log(`  - Duration: October 15-19, 2025`);
    console.log(`  - Ship: Virgin Voyages Valiant Lady`);

  } catch (error) {
    console.error('❌ Failed to add cruise:', error);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

addDragStarsCruise();