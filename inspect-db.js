import { config } from 'dotenv';
config();

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function inspectDatabase() {
  try {
    console.log('🔍 Inspecting Neon database...\n');

    // List all tables
    console.log('📋 Available tables:');
    const tables = await sql`
      SELECT table_name, table_schema
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    for (const table of tables) {
      console.log(`  - ${table.table_name}`);
    }

    console.log('\n📊 Table row counts:');
    for (const table of tables) {
      try {
        const count = await sql`SELECT COUNT(*) as count FROM ${sql(table.table_name)}`;
        console.log(`  - ${table.table_name}: ${count[0].count} rows`);
      } catch (err) {
        console.log(`  - ${table.table_name}: Error counting (${err.message})`);
      }
    }

    // Check cruises table structure
    console.log('\n🚢 Cruises table sample:');
    const cruises = await sql`SELECT * FROM cruises LIMIT 5`;
    console.log(JSON.stringify(cruises, null, 2));

    // Check if there are other trip-related tables
    const otherTables = tables.filter(t =>
      t.table_name.toLowerCase().includes('trip') ||
      t.table_name.toLowerCase().includes('cruise') ||
      t.table_name.toLowerCase().includes('voyage') ||
      t.table_name.toLowerCase().includes('journey')
    );

    if (otherTables.length > 1) {
      console.log('\n🎯 Other trip-related tables:');
      for (const table of otherTables) {
        const sample = await sql`SELECT * FROM ${sql(table.table_name)} LIMIT 2`;
        console.log(`\n--- ${table.table_name} ---`);
        console.log(JSON.stringify(sample, null, 2));
      }
    }

  } catch (error) {
    console.error('❌ Database inspection failed:', error);
  }
}

inspectDatabase();