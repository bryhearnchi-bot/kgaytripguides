import { neon } from '@neondatabase/serverless';
import fs from 'fs';

const neonConnectionString = 'postgresql://neondb_owner:npg_S3acE5NbXIQR@ep-gentle-union-adlq6wol-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function exportNeonData() {
  console.log('🚀 Exporting data from Neon database...');

  try {
    const sql = neon(neonConnectionString);

    console.log('📊 Fetching all data...');

    // Get all data using correct table names
    const results = {};

    const tables = [
      'cruises',
      'itinerary',
      'events',
      'talent',
      'settings',
      'users',
      'cruise_talent',
      'user_cruises',
      'party_templates',
      'trip_info_sections',
      'media',
      'ai_drafts',
      'ai_jobs',
      'audit_log',
      'password_reset_tokens'
    ];

    for (const table of tables) {
      try {
        console.log(`  📋 Exporting ${table}...`);
        const data = await sql`SELECT * FROM ${sql(table)} ORDER BY id`;
        results[table] = data;
        console.log(`  ✅ ${data.length} records from ${table}`);
      } catch (error) {
        console.log(`  ⚠️  Skipping ${table}: ${error.message}`);
        results[table] = [];
      }
    }

    const exportData = {
      ...results,
      exportDate: new Date().toISOString(),
      metadata: {
        source: 'Neon',
        destination: 'Railway',
        totalTables: Object.keys(results).length
      }
    };

    // Save to file
    fs.writeFileSync('./neon-complete-export.json', JSON.stringify(exportData, null, 2));
    console.log('💾 Data exported to neon-complete-export.json');

    // Summary
    console.log('\n📊 Export Summary:');
    Object.entries(results).forEach(([table, data]) => {
      console.log(`  ${table}: ${data.length} records`);
    });

    console.log('\n🎉 Export complete!');

  } catch (error) {
    console.error('❌ Export failed:', error);
  }
}

exportNeonData();