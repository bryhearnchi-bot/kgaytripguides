#!/usr/bin/env node

// Load environment variables
import { config } from 'dotenv';
config();

import postgres from 'postgres';

async function vacuumOptimize() {
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const sql = postgres(DATABASE_URL);

  try {
    console.log('🧹 Running database vacuum and optimization...\n');

    // Run VACUUM ANALYZE on tables with high dead row percentage
    const tablesToVacuum = ['profiles', 'ships', 'cruises'];

    for (const table of tablesToVacuum) {
      console.log(`🔧 Vacuuming ${table}...`);
      await sql.unsafe(`VACUUM ANALYZE ${table};`);
      console.log(`✅ ${table} vacuumed successfully`);
    }

    // Update table statistics
    console.log('\n📊 Updating table statistics...');
    await sql`ANALYZE;`;
    console.log('✅ Statistics updated');

    // Check the improvements
    console.log('\n📈 Post-vacuum statistics:');
    const postVacuumStats = await sql`
      SELECT
        relname as tablename,
        n_live_tup as live_rows,
        n_dead_tup as dead_rows,
        CASE
          WHEN n_live_tup > 0
          THEN ROUND((n_dead_tup::numeric / n_live_tup) * 100, 2)
          ELSE 0
        END as dead_row_percent
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
        AND relname IN ('profiles', 'ships', 'cruises')
      ORDER BY n_live_tup DESC;
    `;

    postVacuumStats.forEach(stat => {
      const healthIndicator = stat.dead_row_percent > 20 ? '🔴' : stat.dead_row_percent > 10 ? '🟡' : '🟢';
      console.log(`  ${healthIndicator} ${stat.tablename}: ${stat.live_rows} live, ${stat.dead_rows} dead (${stat.dead_row_percent}% dead)`);
    });

    console.log('\n🎉 Database optimization completed successfully!');

  } catch (error) {
    console.error('❌ Vacuum optimization failed:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

vacuumOptimize().catch(console.error);