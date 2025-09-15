import { neon } from '@neondatabase/serverless';

const neonConnectionString = 'postgresql://neondb_owner:npg_S3acE5NbXIQR@ep-gentle-union-adlq6wol-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function checkTables() {
  try {
    const sql = neon(neonConnectionString);

    console.log('🔍 Checking what tables exist in Neon...');

    // Get all tables
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    console.log(`Found ${tables.length} tables:`);
    tables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });

    // Let's also check the schema for the main table
    if (tables.length > 0) {
      const firstTable = tables[0].table_name;
      console.log(`\n📊 Checking data in ${firstTable}...`);
      const count = await sql`SELECT COUNT(*) as count FROM ${sql(firstTable)}`;
      console.log(`  Records: ${count[0].count}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkTables();