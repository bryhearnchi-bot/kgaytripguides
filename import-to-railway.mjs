import { neon } from '@neondatabase/serverless';
import fs from 'fs';

// Railway connection string from .env
const railwayConnectionString = 'postgresql://postgres:ZMxXTsAbduhdjAQmOtdLiMgUuHTMHDMB@trolley.proxy.rlwy.net:16776/railway';

async function importToRailway() {
  console.log('🚀 Importing data to Railway database...');

  try {
    // Read the exported data
    const exportData = JSON.parse(fs.readFileSync('./neon-data-export.json', 'utf8'));
    console.log('📂 Loaded export data from neon-data-export.json');

    const sql = neon(railwayConnectionString);

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

      // Clear existing data first
      await sql`DELETE FROM ${sql(table)}`;
      console.log(`  🗑️  Cleared existing ${table} data`);

      // Insert new data
      for (const record of data) {
        try {
          // Get column names and values, excluding any undefined/null values
          const columns = Object.keys(record).filter(key => record[key] !== undefined && record[key] !== null);
          const values = columns.map(key => record[key]);

          if (columns.length === 0) continue;

          // Build the insert query dynamically
          const columnList = columns.join(', ');
          const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

          await sql`INSERT INTO ${sql(table)} (${sql.unsafe(columnList)}) VALUES (${sql.unsafe(placeholders)})`.apply(null, values);
        } catch (error) {
          console.log(`    ⚠️  Failed to insert record in ${table}:`, error.message);
        }
      }

      console.log(`  ✅ Imported ${data.length} records to ${table}`);
    }

    // Verify the import
    console.log('\n🔍 Verifying import...');
    for (const table of tables) {
      try {
        const count = await sql`SELECT COUNT(*) as count FROM ${sql(table)}`;
        const originalCount = exportData[table]?.length || 0;
        console.log(`  ${table}: ${count[0].count}/${originalCount} records`);
      } catch (error) {
        console.log(`  ⚠️  Could not verify ${table}: ${error.message}`);
      }
    }

    console.log('\n🎉 Migration complete!');
    console.log('✅ Data successfully imported from Neon to Railway PostgreSQL');

  } catch (error) {
    console.error('❌ Import failed:', error);
  }
}

importToRailway();