import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function debugEvents() {
  try {
    console.log('Checking events around Aug 28-29 to debug timeline...');

    // Check Aug 28-29 events
    const events = await sql`
      SELECT id, date, time, title, type, venue
      FROM events
      WHERE cruise_id = 7 AND (
        date::text LIKE '2025-08-28%' OR
        date::text LIKE '2025-08-29%'
      )
      ORDER BY date, time
    `;

    console.log('\n=== EVENTS ON AUG 28-29 ===');
    events.forEach(event => {
      console.log(`${event.date.toISOString().split('T')[0]} ${event.time} - ${event.title} (${event.type}) @ ${event.venue}`);
    });

    // Check specifically for Neon and Off-White events
    const partyEvents = await sql`
      SELECT id, date, time, title, type, venue
      FROM events
      WHERE cruise_id = 7 AND (
        title ILIKE '%neon%' OR
        title ILIKE '%off-white%' OR
        title ILIKE '%virgin white%'
      )
      ORDER BY date, time
    `;

    console.log('\n=== PARTY EVENTS (NEON/WHITE) ===');
    partyEvents.forEach(event => {
      console.log(`${event.date.toISOString().split('T')[0]} ${event.time} - ${event.title} @ ${event.venue}`);
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

debugEvents();