import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function checkCruiseId() {
  try {
    // Find the Greek Isles 2025 cruise
    const cruise = await sql`
      SELECT id, name, slug, start_date
      FROM cruises
      WHERE slug = 'greek-isles-2025' OR name ILIKE '%greek%'
    `;

    console.log('Found cruises:', cruise);

    // Also check existing events for this cruise
    if (cruise.length > 0) {
      const events = await sql`
        SELECT id, date, time, title, type, venue
        FROM events
        WHERE cruise_id = ${cruise[0].id}
        AND date::text LIKE '2025-08-23%'
        ORDER BY time
      `;

      console.log(`\nEvents on 2025-08-23 for cruise ${cruise[0].id}:`, events);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkCruiseId();