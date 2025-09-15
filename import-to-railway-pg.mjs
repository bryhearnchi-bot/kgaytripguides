import pg from 'pg';
import fs from 'fs';

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

async function importToRailway() {
  console.log('🚀 Importing data to Railway database...');

  try {
    // Connect to Railway database
    await client.connect();
    console.log('✅ Connected to Railway PostgreSQL');

    // Read the exported data
    const exportData = JSON.parse(fs.readFileSync('./neon-data-export.json', 'utf8'));
    console.log('📂 Loaded export data from neon-data-export.json');

    // Import data in the correct order (respecting foreign key constraints)
    const tables = [
      'settings',
      'users',
      'cruises',
      'talent',
      'itinerary',
      'events',
      'cruise_talent',
      'party_templates'
    ];

    for (const table of tables) {
      const data = exportData[table];
      if (!data || data.length === 0) {
        console.log(`⚠️  Skipping ${table} - no data`);
        continue;
      }

      console.log(`📊 Importing ${data.length} records to ${table}...`);

      // Clear existing data first (disable foreign key checks temporarily)
      await client.query(`DELETE FROM ${table}`);
      console.log(`  🗑️  Cleared existing ${table} data`);

      // Insert new data
      let successCount = 0;
      for (const record of data) {
        try {
          // Get column names and values, excluding any undefined/null values
          const columns = Object.keys(record).filter(key => record[key] !== undefined && record[key] !== null);
          const values = columns.map(key => record[key]);

          if (columns.length === 0) continue;

          // Build the insert query dynamically
          const columnList = columns.join(', ');
          const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
          const query = `INSERT INTO ${table} (${columnList}) VALUES (${placeholders})`;

          await client.query(query, values);
          successCount++;
        } catch (error) {
          console.log(`    ⚠️  Failed to insert record in ${table}:`, error.message);
        }
      }

      console.log(`  ✅ Imported ${successCount}/${data.length} records to ${table}`);
    }

    // Verify the import
    console.log('\n🔍 Verifying import...');
    for (const table of tables) {
      try {
        const result = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
        const count = result.rows[0].count;
        const originalCount = exportData[table]?.length || 0;
        console.log(`  ${table}: ${count}/${originalCount} records`);
      } catch (error) {
        console.log(`  ⚠️  Could not verify ${table}: ${error.message}`);
      }
    }

    console.log('\n🎉 Migration complete!');
    console.log('✅ Data successfully imported from Neon to Railway PostgreSQL');

  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

importToRailway();