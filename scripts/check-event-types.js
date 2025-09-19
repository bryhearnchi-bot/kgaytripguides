#!/usr/bin/env node

// Load environment variables
import { config } from 'dotenv';
config();

import postgres from 'postgres';

async function checkEventTypes() {
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const sql = postgres(DATABASE_URL);

  try {
    console.log('🔍 Checking existing event types...');

    // Check distinct event types
    const eventTypes = await sql`
      SELECT type, COUNT(*) as count
      FROM events
      GROUP BY type
      ORDER BY count DESC;
    `;

    console.log('\n📊 Event types in database:');
    eventTypes.forEach(type => {
      console.log(`  • ${type.type}: ${type.count} events`);
    });

    // Also check if there are any NULL types
    const nullTypes = await sql`
      SELECT COUNT(*) as count
      FROM events
      WHERE type IS NULL;
    `;

    console.log(`\n❓ NULL types: ${nullTypes[0].count} events`);

  } catch (error) {
    console.error('❌ Check failed:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

checkEventTypes().catch(console.error);