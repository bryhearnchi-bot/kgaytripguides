import { neon } from '@neondatabase/serverless';
import fs from 'fs';

const neonConnectionString = 'postgresql://neondb_owner:npg_S3acE5NbXIQR@ep-gentle-union-adlq6wol-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function exportRemainingTables() {
  console.log('🔍 Exporting remaining tables from Neon...');

  try {
    const sql = neon(neonConnectionString);

    // Tables that were missing from the original export
    const remainingTables = [
      'ai_drafts',
      'ai_jobs',
      'audit_log',
      'media',
      'password_reset_tokens',
      'user_cruises'
    ];

    const results = {};

    for (const table of remainingTables) {
      try {
        console.log(`📋 Exporting ${table}...`);
        const data = await sql`SELECT * FROM ${sql(table)} ORDER BY id`;
        results[table] = data;
        console.log(`✅ ${data.length} records from ${table}`);
      } catch (error) {
        console.log(`⚠️  Skipping ${table}: ${error.message}`);
        results[table] = [];
      }
    }

    const exportData = {
      ...results,
      exportDate: new Date().toISOString(),
      metadata: {
        source: 'Neon',
        destination: 'Railway',
        exportType: 'remaining_tables',
        totalTables: Object.keys(results).length
      }
    };

    // Save to file
    fs.writeFileSync('./remaining-tables-export.json', JSON.stringify(exportData, null, 2));
    console.log('💾 Remaining tables exported to remaining-tables-export.json');

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

exportRemainingTables();