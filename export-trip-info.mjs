import { neon } from '@neondatabase/serverless';
import fs from 'fs';

const neonConnectionString = 'postgresql://neondb_owner:npg_S3acE5NbXIQR@ep-gentle-union-adlq6wol-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function exportTripInfoSections() {
  console.log('🔍 Checking for trip_info_sections table in Neon...');

  try {
    const sql = neon(neonConnectionString);

    // Check if trip_info_sections table exists
    try {
      const tripInfoData = await sql`SELECT * FROM trip_info_sections ORDER BY id`;
      console.log(`✅ Found ${tripInfoData.length} trip_info_sections records`);

      if (tripInfoData.length > 0) {
        // Save to separate file
        const exportData = {
          trip_info_sections: tripInfoData,
          exportDate: new Date().toISOString(),
          metadata: {
            source: 'Neon',
            table: 'trip_info_sections',
            recordCount: tripInfoData.length
          }
        };

        fs.writeFileSync('./trip-info-export.json', JSON.stringify(exportData, null, 2));
        console.log('💾 Trip info sections exported to trip-info-export.json');

        // Show sample data
        console.log('\n📋 Sample records:');
        tripInfoData.slice(0, 3).forEach(record => {
          console.log(`  - ID: ${record.id}, Trip: ${record.trip_id}, Section: ${record.section_type}`);
        });
      }
    } catch (error) {
      if (error.message.includes('does not exist')) {
        console.log('⚠️  trip_info_sections table does not exist in Neon database');
      } else {
        console.log('❌ Error accessing trip_info_sections:', error.message);
      }
    }

    // Also check what other tables might be missing
    console.log('\n🔍 Checking for other potential tables...');
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    console.log('📋 All tables in Neon database:');
    tables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });

  } catch (error) {
    console.error('❌ Export failed:', error);
  }
}

exportTripInfoSections();