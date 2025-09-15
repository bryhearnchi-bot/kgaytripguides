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

async function addDragStarsInfoSections() {
  console.log('📋 Adding info sections to Drag Stars cruise...');

  try {
    await client.connect();
    console.log('✅ Connected to Railway PostgreSQL');

    // Get Drag Stars cruise ID
    const cruiseResult = await client.query(`
      SELECT id, name FROM cruises WHERE slug = 'drag-stars-at-sea-2025'
    `);

    if (cruiseResult.rows.length === 0) {
      console.log('❌ Drag Stars cruise not found');
      return;
    }

    const cruise = cruiseResult.rows[0];
    console.log(`✅ Found cruise: ${cruise.name} (ID: ${cruise.id})`);

    // Clear existing info sections for this cruise and reset sequence
    console.log('🧹 Clearing existing info sections...');
    await client.query(`
      DELETE FROM trip_info_sections WHERE cruise_id = $1
    `, [cruise.id]);

    // Reset the sequence to avoid primary key conflicts
    console.log('🔄 Resetting sequence...');
    await client.query(`
      SELECT setval('trip_info_sections_id_seq', COALESCE((SELECT MAX(id) FROM trip_info_sections), 0))
    `);

    // Info sections to add - structured to match frontend expectations
    const infoSections = [
      {
        title: 'Check-In Information',
        content: `Location: Terminal V at PortMiami
Address: 718 N Cruise Blvd, Miami, FL 33132
Time: Boarding begins at 2:15 PM (Luggage drop from 9:00 AM)
Required Documents: Valid passport or birth certificate with photo ID
Arrival Recommendation: Arrive at least 2 hours before embarkation
Distance from Airport: 8-10 miles from Miami International Airport
RockStar Entrance: Private north-side entrance with dedicated check-in lounge`,
        orderIndex: 1
      },
      {
        title: 'Departure Information',
        content: `Sail Away: 6:00 PM
All Aboard: 5:00 PM (final boarding time)`,
        orderIndex: 2
      },
      {
        title: 'First Day Tips',
        content: `1. Print luggage tags from email received 72 hours before sailing
2. Follow your selected Terminal Arrival Time for smooth check-in
3. Download Virgin Voyages app before sailing for onboard navigation
4. Bring valid passport or birth certificate with photo ID
5. All guests must be 18+ (adults-only experience)
6. RockStar guests use private north-side entrance
7. Parking: Garage G ($25/day) or off-site lots ($7.50-$15/day)
8. What's included: All dining, entertainment, basic drinks, WiFi, fitness classes`,
        orderIndex: 3
      },
      {
        title: 'Entertainment Booking',
        content: `Booking Start: Day 1 at 8:00 AM via Virgin Voyages app
Walk-ins: Available 30 minutes before show time
Standby Release: 15 minutes before show time
RockStar Suites: Priority booking and reserved seating available`,
        orderIndex: 4
      },
      {
        title: 'Dining Information',
        content: `Reservations: Available via Virgin Voyages app starting Day 1
Walk-ins: Most restaurants accept walk-ins based on availability
Included: All 20+ restaurants are included (no additional dining fees)`,
        orderIndex: 5
      }
    ];

    // Add each info section (let auto-increment handle IDs)
    console.log('📝 Adding info sections...');

    for (const section of infoSections) {
      const result = await client.query(`
        INSERT INTO trip_info_sections (cruise_id, title, content, order_index, updated_at)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING id, title
      `, [cruise.id, section.title, section.content, section.orderIndex]);

      console.log(`  ✅ Added: ${section.title} (ID: ${result.rows[0].id})`);
    }

    // Verify sections were added
    const verifyResult = await client.query(`
      SELECT title, order_index
      FROM trip_info_sections
      WHERE cruise_id = $1
      ORDER BY order_index
    `, [cruise.id]);

    console.log(`\n📊 Added ${verifyResult.rows.length} info sections:`);
    verifyResult.rows.forEach((section, index) => {
      console.log(`  ${index + 1}. ${section.title} (Order: ${section.order_index})`);
    });

    console.log('\n🎉 Drag Stars cruise info sections successfully added!');
    console.log('📱 The Info tab now contains comprehensive ship and port information');

  } catch (error) {
    console.error('❌ Failed to add info sections:', error);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

addDragStarsInfoSections();