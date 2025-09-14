import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function updateEvents() {
  try {
    console.log('Updating events in database...');

    // 1. First, move Empires party from 8-23 to 8-25
    const empiresUpdate = await sql`
      UPDATE events
      SET date = '2025-08-25', "updated_at" = NOW()
      WHERE cruise_id = 7 AND title ILIKE '%empires%' AND date::text LIKE '2025-08-23%'
      RETURNING id, title, date, time, venue
    `;

    if (empiresUpdate.length > 0) {
      console.log(`✓ Moved Empires party to 8-25:`, empiresUpdate[0]);
    } else {
      console.log('⚠ No Empires party found on 8-23 to move');
    }

    // 2. Add Lost At Sea party for 8-23 at 11pm (replacing Empires slot)
    const lostAtSeaImage = "https://res.cloudinary.com/dfqoebbyj/image/upload/w_600,h_400,c_fill,g_center,q_auto,f_auto/v1757804283/sea_dyhgwy.jpg";

    const newEvent = await sql`
      INSERT INTO events (cruise_id, date, time, title, venue, type, description, "image_url", "created_at", "updated_at")
      VALUES (7, '2025-08-23', '23:00', 'Lost At Sea', 'Aquatic Club', 'party',
              'As we head deep into uncharted waters, the creatures above and below the water line come together for a night of nautical silliness.',
              ${lostAtSeaImage}, NOW(), NOW())
      RETURNING id, title, date, time, venue
    `;

    console.log(`✓ Added Lost At Sea party:`, newEvent[0]);

    console.log('\n✨ Events updated successfully!');

  } catch (error) {
    console.error('Error updating events:', error);
    process.exit(1);
  }
}

// Run the update
updateEvents();