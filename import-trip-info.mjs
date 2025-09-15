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

async function importTripInfoSections() {
  console.log('🚀 Importing trip_info_sections to Railway database...');

  try {
    // Connect to Railway database
    await client.connect();
    console.log('✅ Connected to Railway PostgreSQL');

    // Read the exported data
    const exportData = JSON.parse(fs.readFileSync('./trip-info-export.json', 'utf8'));
    console.log('📂 Loaded trip info sections data');

    const data = exportData.trip_info_sections;
    console.log(`📊 Importing ${data.length} trip_info_sections records...`);

    // Clear existing data first
    await client.query('DELETE FROM trip_info_sections');
    console.log('🗑️  Cleared existing trip_info_sections data');

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
        const query = `INSERT INTO trip_info_sections (${columnList}) VALUES (${placeholders})`;

        await client.query(query, values);
        successCount++;
      } catch (error) {
        console.log(`    ⚠️  Failed to insert record:`, error.message);
      }
    }

    console.log(`✅ Imported ${successCount}/${data.length} trip_info_sections records`);

    // Verify the import
    const result = await client.query('SELECT COUNT(*) as count FROM trip_info_sections');
    console.log(`🔍 Verification: ${result.rows[0].count} records in trip_info_sections table`);

    // Show sample data
    const sample = await client.query('SELECT id, title, cruise_id FROM trip_info_sections ORDER BY id LIMIT 3');
    console.log('\n📋 Sample imported records:');
    sample.rows.forEach(row => {
      console.log(`  - ID: ${row.id}, Cruise: ${row.cruise_id}, Title: ${row.title}`);
    });

    console.log('\n🎉 Trip info sections import complete!');

  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

importTripInfoSections();