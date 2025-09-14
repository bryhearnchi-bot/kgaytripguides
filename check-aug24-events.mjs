import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function checkAug24Events() {
  try {
    console.log('Checking events for August 24th, 2025...');

    // Check database events for Aug 24
    const dbEvents = await sql`
      SELECT id, date, time, title, type, venue, description, image_url
      FROM events
      WHERE cruise_id = 7 AND date::text LIKE '2025-08-24%'
      ORDER BY time
    `;

    console.log('\n=== DATABASE EVENTS for 2025-08-24 ===');
    dbEvents.forEach(event => {
      console.log(`${event.time} - ${event.title} (${event.type}) @ ${event.venue}`);
    });

    // Also check for any "Atlantis Classics" events on any date
    const classicsEvents = await sql`
      SELECT id, date, time, title, type, venue
      FROM events
      WHERE cruise_id = 7 AND title ILIKE '%atlantis classics%'
      ORDER BY date, time
    `;

    console.log('\n=== ALL "ATLANTIS CLASSICS" EVENTS ===');
    classicsEvents.forEach(event => {
      console.log(`${event.date.toISOString().split('T')[0]} ${event.time} - ${event.title} @ ${event.venue}`);
    });

    // Check all party-type events
    const partyEvents = await sql`
      SELECT id, date, time, title, type, venue
      FROM events
      WHERE cruise_id = 7 AND type IN ('party', 'club', 'after')
      ORDER BY date, time
    `;

    console.log('\n=== ALL PARTY/CLUB/AFTER EVENTS ===');
    partyEvents.forEach(event => {
      console.log(`${event.date.toISOString().split('T')[0]} ${event.time} - ${event.title} (${event.type}) @ ${event.venue}`);
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

checkAug24Events();