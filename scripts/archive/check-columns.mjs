import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function checkColumns() {
  try {
    // Check cruises columns
    const cruiseColumns = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'cruises'
      ORDER BY ordinal_position
    `;
    console.log('\n=== CRUISES COLUMNS ===');
    cruiseColumns.forEach(c => console.log(`- ${c.column_name}`));

    // Check events columns
    const eventColumns = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'events'
      ORDER BY ordinal_position
    `;
    console.log('\n=== EVENTS COLUMNS ===');
    eventColumns.forEach(c => console.log(`- ${c.column_name}`));

    // Check talent columns
    const talentColumns = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'talent'
      ORDER BY ordinal_position
    `;
    console.log('\n=== TALENT COLUMNS ===');
    talentColumns.forEach(c => console.log(`- ${c.column_name}`));

  } catch (error) {
    console.error('Error checking columns:', error);
  }
}

checkColumns();