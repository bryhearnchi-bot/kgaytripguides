import pg from 'pg';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Database connections
const railwayConfig = {
  connectionString: "postgresql://postgres:ZMxXTsAbduhdjAQmOtdLiMgUuHTMHDMB@trolley.proxy.rlwy.net:16776/railway"
};

// Supabase connection - using pooler endpoint
const supabaseConfig = {
  connectionString: "postgresql://postgres.bxiiodeyqvqqcgzzqzvt:kgayatlantis2025@aws-0-us-east-1.pooler.supabase.com:6543/postgres",
  ssl: { rejectUnauthorized: false }
};

const railwayClient = new pg.Client(railwayConfig);
const supabaseClient = new pg.Client(supabaseConfig);

async function migrate() {
  console.log('🚀 Starting Supabase Migration from Railway\n');

  try {
    // Connect to both databases
    console.log('📦 Connecting to Railway database...');
    await railwayClient.connect();
    console.log('✅ Connected to Railway');

    console.log('📦 Connecting to Supabase database...');
    await supabaseClient.connect();
    console.log('✅ Connected to Supabase\n');

    // Phase 3.1: Setup Supabase
    console.log('═══════════════════════════════════════');
    console.log('Phase 3.1: Supabase Setup');
    console.log('═══════════════════════════════════════\n');

    // Enable required extensions
    console.log('🔧 Enabling required extensions...');
    await supabaseClient.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    await supabaseClient.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
    console.log('✅ Extensions enabled\n');

    // Phase 3.2: Database Migration
    console.log('═══════════════════════════════════════');
    console.log('Phase 3.2: Database Migration');
    console.log('═══════════════════════════════════════\n');

    // Get table creation order
    const tables = [
      'trips',
      'cruises',
      'talent',
      'ports',
      'parties',
      'itinerary',
      'events',
      'event_talent',
      'info_sections'
    ];

    // Drop existing tables in reverse order (if any)
    console.log('🧹 Cleaning up existing tables...');
    for (const table of [...tables].reverse()) {
      await supabaseClient.query(`DROP TABLE IF EXISTS ${table} CASCADE;`);
    }
    console.log('✅ Cleanup complete\n');

    // Export and recreate schema
    console.log('📋 Creating schema...');

    // Get schema from Railway
    const schemaQuery = `
      SELECT
        'CREATE TABLE ' || table_name || ' (' ||
        string_agg(
          column_name || ' ' ||
          CASE
            WHEN data_type = 'character varying' THEN 'VARCHAR(' || character_maximum_length || ')'
            WHEN data_type = 'character' THEN 'CHAR(' || character_maximum_length || ')'
            ELSE UPPER(data_type)
          END ||
          CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
          CASE WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default ELSE '' END,
          ', '
        ) || ');' as create_statement
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = ANY($1::text[])
      GROUP BY table_name
      ORDER BY ARRAY_POSITION($1::text[], table_name);
    `;

    const schemaResult = await railwayClient.query(schemaQuery, [tables]);

    // Create tables in Supabase
    for (const row of schemaResult.rows) {
      if (row.create_statement) {
        await supabaseClient.query(row.create_statement);
      }
    }
    console.log('✅ Schema created\n');

    // Migrate data table by table
    console.log('📊 Migrating data...');

    for (const table of tables) {
      // Get row count from Railway
      const countResult = await railwayClient.query(`SELECT COUNT(*) as count FROM ${table}`);
      const rowCount = parseInt(countResult.rows[0].count);

      if (rowCount > 0) {
        console.log(`  📦 Migrating ${table} (${rowCount} rows)...`);

        // Get all data from Railway
        const dataResult = await railwayClient.query(`SELECT * FROM ${table}`);

        if (dataResult.rows.length > 0) {
          // Build insert query
          const columns = Object.keys(dataResult.rows[0]);
          const values = dataResult.rows.map((row, index) => {
            const vals = columns.map((col, i) => `$${index * columns.length + i + 1}`);
            return `(${vals.join(', ')})`;
          });

          const insertQuery = `
            INSERT INTO ${table} (${columns.join(', ')})
            VALUES ${values.join(', ')}
          `;

          // Flatten all values
          const flatValues = dataResult.rows.flatMap(row => columns.map(col => row[col]));

          // Insert into Supabase
          await supabaseClient.query(insertQuery, flatValues);
          console.log(`  ✅ ${table} migrated`);
        }
      } else {
        console.log(`  ⏭️  ${table} (empty)`);
      }
    }

    console.log('\n✅ Data migration complete\n');

    // Add constraints and indexes
    console.log('🔗 Adding constraints and indexes...');

    // Primary keys
    const primaryKeys = [
      'ALTER TABLE trips ADD PRIMARY KEY (id);',
      'ALTER TABLE cruises ADD PRIMARY KEY (id);',
      'ALTER TABLE talent ADD PRIMARY KEY (id);',
      'ALTER TABLE ports ADD PRIMARY KEY (id);',
      'ALTER TABLE parties ADD PRIMARY KEY (id);',
      'ALTER TABLE itinerary ADD PRIMARY KEY (id);',
      'ALTER TABLE events ADD PRIMARY KEY (id);',
      'ALTER TABLE event_talent ADD PRIMARY KEY (id);',
      'ALTER TABLE info_sections ADD PRIMARY KEY (id);'
    ];

    for (const pk of primaryKeys) {
      try {
        await supabaseClient.query(pk);
      } catch (e) {
        // Primary key might already exist
      }
    }

    // Foreign keys
    const foreignKeys = [
      'ALTER TABLE cruises ADD CONSTRAINT cruises_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES trips(id);',
      'ALTER TABLE itinerary ADD CONSTRAINT itinerary_cruise_id_fkey FOREIGN KEY (cruise_id) REFERENCES cruises(id);',
      'ALTER TABLE itinerary ADD CONSTRAINT itinerary_port_id_fkey FOREIGN KEY (port_id) REFERENCES ports(id);',
      'ALTER TABLE events ADD CONSTRAINT events_cruise_id_fkey FOREIGN KEY (cruise_id) REFERENCES cruises(id);',
      'ALTER TABLE events ADD CONSTRAINT events_party_id_fkey FOREIGN KEY (party_id) REFERENCES parties(id);',
      'ALTER TABLE event_talent ADD CONSTRAINT event_talent_event_id_fkey FOREIGN KEY (event_id) REFERENCES events(id);',
      'ALTER TABLE event_talent ADD CONSTRAINT event_talent_talent_id_fkey FOREIGN KEY (talent_id) REFERENCES talent(id);',
      'ALTER TABLE info_sections ADD CONSTRAINT info_sections_cruise_id_fkey FOREIGN KEY (cruise_id) REFERENCES cruises(id);'
    ];

    for (const fk of foreignKeys) {
      try {
        await supabaseClient.query(fk);
      } catch (e) {
        // Foreign key might already exist
      }
    }

    // Indexes
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_cruises_trip_id ON cruises(trip_id);',
      'CREATE INDEX IF NOT EXISTS idx_itinerary_cruise_id ON itinerary(cruise_id);',
      'CREATE INDEX IF NOT EXISTS idx_itinerary_port_id ON itinerary(port_id);',
      'CREATE INDEX IF NOT EXISTS idx_events_cruise_id ON events(cruise_id);',
      'CREATE INDEX IF NOT EXISTS idx_events_party_id ON events(party_id);',
      'CREATE INDEX IF NOT EXISTS idx_event_talent_event_id ON event_talent(event_id);',
      'CREATE INDEX IF NOT EXISTS idx_event_talent_talent_id ON event_talent(talent_id);',
      'CREATE INDEX IF NOT EXISTS idx_info_sections_cruise_id ON info_sections(cruise_id);'
    ];

    for (const idx of indexes) {
      await supabaseClient.query(idx);
    }

    console.log('✅ Constraints and indexes added\n');

    // Verify migration
    console.log('═══════════════════════════════════════');
    console.log('Migration Verification');
    console.log('═══════════════════════════════════════\n');

    for (const table of tables) {
      const railwayCount = await railwayClient.query(`SELECT COUNT(*) as count FROM ${table}`);
      const supabaseCount = await supabaseClient.query(`SELECT COUNT(*) as count FROM ${table}`);

      const railwayRows = parseInt(railwayCount.rows[0].count);
      const supabaseRows = parseInt(supabaseCount.rows[0].count);

      const status = railwayRows === supabaseRows ? '✅' : '❌';
      console.log(`${status} ${table}: Railway=${railwayRows}, Supabase=${supabaseRows}`);
    }

    console.log('\n═══════════════════════════════════════');
    console.log('🎉 Migration Complete!');
    console.log('═══════════════════════════════════════\n');

    console.log('Next steps:');
    console.log('1. Update .env file with Supabase connection string');
    console.log('2. Test application with new database');
    console.log('3. Enable Row Level Security (RLS) policies');
    console.log('4. Configure backup and monitoring\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await railwayClient.end();
    await supabaseClient.end();
  }
}

// Run migration
migrate().catch(console.error);