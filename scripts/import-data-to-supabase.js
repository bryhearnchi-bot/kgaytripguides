import pg from 'pg';
import fs from 'fs';

const supabaseConfig = {
  connectionString: "postgresql://postgres:kgayatlantis2025@db.bxiiodeyqvqqcgzzqzvt.supabase.co:5432/postgres",
  ssl: { rejectUnauthorized: false }
};

const client = new pg.Client(supabaseConfig);

async function importData() {
  console.log('🚀 Importing data to Supabase\n');

  try {
    await client.connect();
    console.log('✅ Connected to Supabase\n');

    // Read and execute data.sql
    const dataSQL = fs.readFileSync('database-export/data.sql', 'utf-8');

    // Split by lines and filter INSERT statements
    const statements = dataSQL
      .split('\n')
      .filter(line => line.trim().startsWith('INSERT INTO'))
      .filter(line => line.trim().length > 0);

    console.log(`📊 Found ${statements.length} INSERT statements to execute\n`);

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Group statements by table for better reporting
    const tableStats = {};

    for (const statement of statements) {
      // Extract table name for stats
      const tableMatch = statement.match(/INSERT INTO (\w+)/);
      const tableName = tableMatch ? tableMatch[1] : 'unknown';

      try {
        await client.query(statement);
        successCount++;
        tableStats[tableName] = (tableStats[tableName] || 0) + 1;

        // Progress indicator
        if (successCount % 10 === 0) {
          process.stdout.write('.');
        }
      } catch (error) {
        errorCount++;
        errors.push({
          table: tableName,
          error: error.message,
          statement: statement.substring(0, 100) + '...'
        });
      }
    }

    console.log('\n\n═══════════════════════════════════════');
    console.log('Import Complete!');
    console.log('═══════════════════════════════════════\n');

    console.log('📊 Summary by table:');
    for (const [table, count] of Object.entries(tableStats)) {
      console.log(`  ✅ ${table}: ${count} rows`);
    }

    console.log(`\n✅ Total successful: ${successCount}`);
    if (errorCount > 0) {
      console.log(`❌ Total errors: ${errorCount}`);
      console.log('\nErrors:');
      errors.forEach(e => {
        console.log(`  - ${e.table}: ${e.error}`);
      });
    }

    // Verify final counts
    console.log('\n📋 Verifying final row counts:');
    const tables = ['cruises', 'talent', 'ports', 'parties', 'itinerary', 'events', 'trip_info_sections', 'cruise_talent'];

    for (const table of tables) {
      const result = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`  ${table}: ${result.rows[0].count} rows`);
    }

    console.log('\n🎉 Migration to Supabase complete!');

  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await client.end();
  }
}

// Run import
importData().catch(console.error);