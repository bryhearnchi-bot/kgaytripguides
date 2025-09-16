import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function runCleanupMigration() {
  await client.connect();

  try {
    console.log('Running cleanup migration...\n');

    // Verify migration success
    console.log('Step 1: Verifying migration success...');

    const stats = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM ports) as ports,
        (SELECT COUNT(*) FROM parties) as parties,
        (SELECT COUNT(*) FROM itinerary WHERE port_id IS NOT NULL) as itinerary_with_ports,
        (SELECT COUNT(*) FROM events WHERE party_id IS NOT NULL) as events_with_parties,
        (SELECT COUNT(*) FROM event_talent) as event_talent_relations
    `);

    const s = stats.rows[0];
    console.log('  Ports:', s.ports);
    console.log('  Parties:', s.parties);
    console.log('  Itinerary with ports:', s.itinerary_with_ports);
    console.log('  Events with parties:', s.events_with_parties);
    console.log('  Event-talent relations:', s.event_talent_relations);

    if (s.ports == 0 || s.parties == 0) {
      throw new Error('New tables are empty - migration may not have completed');
    }

    if (s.itinerary_with_ports == 0) {
      throw new Error('No itinerary items have port_id - migration incomplete');
    }

    console.log('\n✓ Migration verification passed');

    // Clean up old columns (if they exist)
    console.log('\nStep 2: Checking for deprecated columns...');

    // Check for columns that might need cleanup
    const columnsToCheck = [
      { table: 'itinerary', column: 'location' },
      { table: 'events', column: 'location' },
      { table: 'events', column: 'party_name' }
    ];

    for (const check of columnsToCheck) {
      const result = await client.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = $1 AND column_name = $2
      `, [check.table, check.column]);

      if (result.rows.length > 0) {
        console.log(`  Found deprecated column: ${check.table}.${check.column}`);

        // Rename instead of dropping (safer)
        await client.query(`
          ALTER TABLE ${check.table}
          RENAME COLUMN ${check.column} TO _deprecated_${check.column}
        `);

        console.log(`    → Renamed to _deprecated_${check.column}`);
      }
    }

    // Create backward compatibility views
    console.log('\nStep 3: Creating compatibility views...');

    // Drop view if exists and recreate
    await client.query('DROP VIEW IF EXISTS v_itinerary_legacy');

    await client.query(`
      CREATE VIEW v_itinerary_legacy AS
      SELECT
        i.*,
        p.name as port_name_normalized,
        p.country as port_country,
        p.region as port_region,
        p.coordinates as port_coordinates
      FROM itinerary i
      LEFT JOIN ports p ON i.port_id = p.id
    `);

    console.log('  ✓ Created v_itinerary_legacy view');

    // Drop and recreate events view
    await client.query('DROP VIEW IF EXISTS v_events_legacy');

    await client.query(`
      CREATE VIEW v_events_legacy AS
      SELECT
        e.*,
        p.name as party_name,
        p.theme as party_theme,
        p.venue_type as party_venue_type,
        p.capacity as party_capacity
      FROM events e
      LEFT JOIN parties p ON e.party_id = p.id
    `);

    console.log('  ✓ Created v_events_legacy view');

    // Update migration tracking
    await client.query(`
      INSERT INTO _migrations (number, name, success)
      VALUES (5, 'cleanup_old_columns', true)
      ON CONFLICT (number) DO UPDATE SET success = true
    `);

    // Final summary
    console.log('\n=== Cleanup Migration Summary ===');
    console.log('  ✓ Migration verified successfully');
    console.log('  ✓ Deprecated columns handled');
    console.log('  ✓ Compatibility views created');
    console.log('\n✅ Cleanup migration completed!');

  } catch (error) {
    console.error('❌ Cleanup migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runCleanupMigration();