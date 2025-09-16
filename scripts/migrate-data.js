import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function runMigration() {
  await client.connect();

  try {
    console.log('Starting data migration...\n');

    // Insert ports
    console.log('Step 1: Inserting ports...');
    const portsQuery = `
      INSERT INTO ports (name, country, region, port_type) VALUES
      ('Athens (Piraeus)', 'Greece', 'Mediterranean', 'port'),
      ('Santorini', 'Greece', 'Mediterranean', 'port'),
      ('Mykonos', 'Greece', 'Mediterranean', 'port'),
      ('Istanbul', 'Turkey', 'Mediterranean', 'port'),
      ('Kuşadası', 'Turkey', 'Mediterranean', 'port'),
      ('Alexandria', 'Egypt', 'Mediterranean', 'port'),
      ('Iraklion', 'Greece', 'Mediterranean', 'port'),
      ('Sea Day', '', 'At Sea', 'sea_day'),
      ('Embarkation', 'Greece', 'Mediterranean', 'embark'),
      ('Disembarkation', 'Greece', 'Mediterranean', 'disembark')
      ON CONFLICT (name) DO NOTHING
    `;
    await client.query(portsQuery);

    const portCount = await client.query('SELECT COUNT(*) FROM ports');
    console.log(`  ✓ Ports created: ${portCount.rows[0].count}`);

    // Insert parties
    console.log('\nStep 2: Inserting parties...');
    const partiesQuery = `
      INSERT INTO parties (name, theme, venue_type, capacity, duration_hours) VALUES
      ('Red Dress Pool Party', 'Everyone wears red for this iconic pool party', 'pool', 500, 3.0),
      ('Pride of the Seven Seas', 'Sunset pride celebration on deck', 'deck', 300, 2.5),
      ('Ancient Treasures', 'Egyptian themed costume party', 'theater', 250, 2.0),
      ('Glow Party', 'UV and neon dance party', 'club', 400, 4.0),
      ('Dog Tag Tea Dance', 'Classic tea dance with military theme', 'deck', 350, 3.0),
      ('Cocktails and Canapés', 'Elegant evening reception', 'lounge', 150, 2.0),
      ('White Party', 'All-white dress code dance party', 'pool', 500, 4.0),
      ('Mediterranean Night', 'Cultural celebration', 'theater', 300, 2.5),
      ('Farewell Gala', 'Final night celebration', 'theater', 400, 3.0)
      ON CONFLICT (name) DO NOTHING
    `;
    await client.query(partiesQuery);

    const partyCount = await client.query('SELECT COUNT(*) FROM parties');
    console.log(`  ✓ Parties created: ${partyCount.rows[0].count}`);

    // Update itinerary with port references
    console.log('\nStep 3: Updating itinerary with port references...');

    // Get port IDs
    const portResult = await client.query('SELECT id, name FROM ports');
    const portMap = {};
    portResult.rows.forEach(p => portMap[p.name] = p.id);

    // Update each day's itinerary
    const itineraryMappings = [
      [1, 'Embarkation'],
      [2, 'Athens (Piraeus)'],
      [3, 'Santorini'],
      [4, 'Sea Day'],
      [5, 'Alexandria'],
      [6, 'Kuşadası'],
      [7, 'Istanbul'],
      [8, 'Sea Day'],
      [9, 'Mykonos'],
      [10, 'Iraklion'],
      [11, 'Disembarkation']
    ];

    let updateCount = 0;
    for (const [day, portName] of itineraryMappings) {
      if (portMap[portName]) {
        const result = await client.query(
          'UPDATE itinerary SET port_id = $1 WHERE day = $2 AND cruise_id = 3',
          [portMap[portName], day]
        );
        updateCount += result.rowCount;
      }
    }
    console.log(`  ✓ Itinerary items updated: ${updateCount}`);

    // Update events with party references (sample)
    console.log('\nStep 4: Updating events with party references...');

    // Get party IDs
    const partyResult = await client.query('SELECT id, name FROM parties');
    const partyMap = {};
    partyResult.rows.forEach(p => partyMap[p.name.toLowerCase()] = p.id);

    // Update some events
    const eventUpdates = [
      ['%Red Dress%', 'red dress pool party'],
      ['%Pride%', 'pride of the seven seas'],
      ['%Glow%', 'glow party'],
      ['%White%', 'white party'],
      ['%Dog Tag%', 'dog tag tea dance'],
      ['%Ancient%', 'ancient treasures'],
      ['%Mediterranean%', 'mediterranean night'],
      ['%Farewell%', 'farewell gala']
    ];

    let eventUpdateCount = 0;
    for (const [pattern, partyName] of eventUpdates) {
      if (partyMap[partyName]) {
        const result = await client.query(
          'UPDATE events SET party_id = $1 WHERE LOWER(title) LIKE LOWER($2)',
          [partyMap[partyName], pattern]
        );
        eventUpdateCount += result.rowCount;
      }
    }

    // Update welcome events
    await client.query(
      `UPDATE events SET party_id = $1
       WHERE (LOWER(title) LIKE '%welcome%' OR LOWER(title) LIKE '%reception%')
       AND party_id IS NULL`,
      [partyMap['cocktails and canapés']]
    );

    const eventCount = await client.query('SELECT COUNT(*) FROM events WHERE party_id IS NOT NULL');
    console.log(`  ✓ Events updated: ${eventCount.rows[0].count}`);

    // Add coordinates to ports
    console.log('\nStep 5: Adding coordinates to ports...');
    const coordinates = [
      ['Athens (Piraeus)', { lat: 37.9838, lng: 23.7275 }],
      ['Santorini', { lat: 36.3932, lng: 25.4615 }],
      ['Mykonos', { lat: 37.4467, lng: 25.3289 }],
      ['Istanbul', { lat: 41.0082, lng: 28.9784 }],
      ['Kuşadası', { lat: 37.8579, lng: 27.2610 }],
      ['Alexandria', { lat: 31.2001, lng: 29.9187 }],
      ['Iraklion', { lat: 35.3387, lng: 25.1442 }],
      ['Embarkation', { lat: 37.9838, lng: 23.7275 }],
      ['Disembarkation', { lat: 37.9838, lng: 23.7275 }]
    ];

    for (const [portName, coords] of coordinates) {
      await client.query(
        'UPDATE ports SET coordinates = $1::jsonb WHERE name = $2',
        [JSON.stringify(coords), portName]
      );
    }
    console.log('  ✓ Coordinates added to ports');

    // Add image URLs
    console.log('\nStep 6: Adding image URLs...');
    const portImages = [
      ['Athens (Piraeus)', 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1734310851/destinations/athens_vxwqrt.jpg'],
      ['Santorini', 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1734310853/destinations/santorini_hjrjcm.jpg'],
      ['Mykonos', 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1734310853/destinations/mykonos_bpyakq.jpg'],
      ['Istanbul', 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1734310852/destinations/istanbul_xdymjj.jpg'],
      ['Kuşadası', 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1734310852/destinations/kusadasi_f3n5ak.jpg'],
      ['Alexandria', 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1734310850/destinations/alexandria_wrmtfk.jpg'],
      ['Iraklion', 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1734310851/destinations/iraklion_siyuhr.jpg']
    ];

    for (const [portName, imageUrl] of portImages) {
      await client.query(
        'UPDATE ports SET image_url = $1 WHERE name = $2',
        [imageUrl, portName]
      );
    }

    const partyImages = [
      ['Red Dress Pool Party', 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1734310795/events/red-dress_kpmzqr.jpg'],
      ['Pride of the Seven Seas', 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1734310794/events/pride-at-sea_vktggj.jpg'],
      ['Ancient Treasures', 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1734310792/events/ancient-treasures_e6miwp.jpg'],
      ['Glow Party', 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1734310792/events/glow_tqrfho.jpg'],
      ['Dog Tag Tea Dance', 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1734310792/events/dog-tag_rbcb8k.jpg'],
      ['White Party', 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1734310796/events/white-party_mxwl1e.jpg'],
      ['Farewell Gala', 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1734310793/events/farewell_yxlhwd.jpg']
    ];

    for (const [partyName, imageUrl] of partyImages) {
      await client.query(
        'UPDATE parties SET image_url = $1 WHERE name = $2',
        [imageUrl, partyName]
      );
    }
    console.log('  ✓ Image URLs added');

    // Create sample event_talent relationships
    console.log('\nStep 7: Creating event-talent relationships...');

    // Get some talent and event IDs
    const talentResult = await client.query(
      `SELECT id FROM talent WHERE name IN ('Latrice Royale', 'Ginger Minj', 'Jiggly Caliente', 'Lady Bunny') LIMIT 4`
    );

    const eventResult = await client.query(
      `SELECT id FROM events WHERE title LIKE '%Party%' OR title LIKE '%Gala%' LIMIT 5`
    );

    if (talentResult.rows.length > 0 && eventResult.rows.length > 0) {
      let relationCount = 0;
      for (const event of eventResult.rows) {
        let order = 1;
        for (const talent of talentResult.rows) {
          try {
            await client.query(
              `INSERT INTO event_talent (event_id, talent_id, role, performance_order)
               VALUES ($1, $2, 'performer', $3)
               ON CONFLICT DO NOTHING`,
              [event.id, talent.id, order++]
            );
            relationCount++;
          } catch (err) {
            // Ignore duplicate key errors
          }
        }
      }
      console.log(`  ✓ Event-talent relationships created: ${relationCount}`);
    }

    // Record migration success
    await client.query(
      `INSERT INTO _migrations (number, name, success) VALUES (3, 'migrate_data', true)
       ON CONFLICT (number) DO UPDATE SET success = true`
    );

    // Summary
    console.log('\n=== Migration Summary ===');
    const stats = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM ports) as ports,
        (SELECT COUNT(*) FROM parties) as parties,
        (SELECT COUNT(*) FROM itinerary WHERE port_id IS NOT NULL) as itinerary_with_ports,
        (SELECT COUNT(*) FROM events WHERE party_id IS NOT NULL) as events_with_parties,
        (SELECT COUNT(*) FROM event_talent) as event_talent_relations
    `);

    const s = stats.rows[0];
    console.log(`  Ports: ${s.ports}`);
    console.log(`  Parties: ${s.parties}`);
    console.log(`  Itinerary with ports: ${s.itinerary_with_ports}`);
    console.log(`  Events with parties: ${s.events_with_parties}`);
    console.log(`  Event-talent relations: ${s.event_talent_relations}`);

    console.log('\n✅ Migration 003 completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();