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

// Define which fields are JSON for each table
const jsonFields = {
  cruises: ['highlights', 'includes_info', 'pricing'],
  events: ['talent_ids'],
  talent: ['social_links'],
  settings: ['metadata'],
  itinerary: ['highlights'],
  media: ['metadata']
};

async function importToRailway() {
  console.log('🚀 Importing data to Railway database...');

  try {
    // Connect to Railway database
    await client.connect();
    console.log('✅ Connected to Railway PostgreSQL');

    // Read the exported data
    const exportData = JSON.parse(fs.readFileSync('./neon-data-export.json', 'utf8'));
    console.log('📂 Loaded export data from neon-data-export.json');

    // First, check which cruise IDs we have
    const availableCruiseIds = new Set(exportData.cruises?.map(c => c.id) || []);
    console.log(`🎯 Available cruise IDs: ${Array.from(availableCruiseIds).join(', ')}`);

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
      await client.query(`DELETE FROM ${table}`);
      console.log(`  🗑️  Cleared existing ${table} data`);

      // Filter data for foreign key constraints
      let filteredData = data;
      if (table === 'itinerary' || table === 'events') {
        filteredData = data.filter(record => {
          const hasValidCruiseId = availableCruiseIds.has(record.cruise_id);
          if (!hasValidCruiseId) {
            console.log(`    ⚠️  Skipping ${table} record with invalid cruise_id: ${record.cruise_id}`);
          }
          return hasValidCruiseId;
        });
        console.log(`  🔍 Filtered ${table}: ${filteredData.length}/${data.length} records with valid cruise_id`);
      }

      // Insert new data
      let successCount = 0;
      for (const record of filteredData) {
        try {
          // Get column names and values, excluding any undefined/null values
          const columns = Object.keys(record).filter(key => record[key] !== undefined && record[key] !== null);
          const values = columns.map(key => {
            const value = record[key];
            const jsonFieldsForTable = jsonFields[table] || [];

            // Handle JSON fields - convert objects/arrays to JSON strings
            if (jsonFieldsForTable.includes(key) && typeof value === 'object') {
              return JSON.stringify(value);
            }

            return value;
          });

          if (columns.length === 0) continue;

          // Build the insert query dynamically
          const columnList = columns.join(', ');
          const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
          const query = `INSERT INTO ${table} (${columnList}) VALUES (${placeholders})`;

          await client.query(query, values);
          successCount++;
        } catch (error) {
          console.log(`    ⚠️  Failed to insert record in ${table}:`, error.message);
          // Log the first few characters of the problematic record for debugging
          const recordPreview = JSON.stringify(record).substring(0, 100);
          console.log(`    📝 Record preview: ${recordPreview}...`);
        }
      }

      console.log(`  ✅ Imported ${successCount}/${filteredData.length} records to ${table}`);
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

    // Check what's in the database now
    console.log('\n📋 Testing application data access...');
    try {
      const cruiseResult = await client.query('SELECT name, slug FROM cruises LIMIT 3');
      console.log('  ✅ Cruises accessible:', cruiseResult.rows.map(r => r.name).join(', '));

      const eventResult = await client.query('SELECT COUNT(*) as count FROM events WHERE cruise_id IN (SELECT id FROM cruises)');
      console.log(`  ✅ Events with valid cruises: ${eventResult.rows[0].count}`);
    } catch (error) {
      console.log('  ⚠️  Database verification error:', error.message);
    }

    console.log('\n🎉 Migration complete!');
    console.log('✅ Data successfully imported from Neon to Railway PostgreSQL');
    console.log('🔄 Your application should now be using the Railway database');

  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

importToRailway();