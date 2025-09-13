import { config } from 'dotenv';
config();

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function checkAllCruises() {
  try {
    console.log('🔍 Checking ALL cruises in Neon database...\n');

    const allCruises = await sql`SELECT * FROM cruises ORDER BY id`;

    console.log(`Found ${allCruises.length} cruises:\n`);

    allCruises.forEach((cruise, i) => {
      console.log(`${i+1}. ID: ${cruise.id} | Name: ${cruise.name} | Slug: ${cruise.slug}`);
      console.log(`   Created: ${cruise.created_at}`);
      console.log(`   Ship: ${cruise.ship_name || 'N/A'} | Line: ${cruise.cruise_line || 'N/A'}`);
      console.log(`   Dates: ${cruise.start_date} to ${cruise.end_date}`);
      console.log('');
    });

    // Now check which ones have data
    for (const cruise of allCruises) {
      const itineraryCount = await sql`SELECT COUNT(*) as count FROM itinerary WHERE cruise_id = ${cruise.id}`;
      const eventsCount = await sql`SELECT COUNT(*) as count FROM events WHERE cruise_id = ${cruise.id}`;
      const talentCount = await sql`SELECT COUNT(*) as count FROM cruise_talent WHERE cruise_id = ${cruise.id}`;

      console.log(`📊 ${cruise.name} (ID: ${cruise.id}) data:`);
      console.log(`   Itinerary stops: ${itineraryCount[0].count}`);
      console.log(`   Events: ${eventsCount[0].count}`);
      console.log(`   Talent relationships: ${talentCount[0].count}`);
      console.log('');
    }

  } catch (error) {
    console.error('❌ Failed to check cruises:', error);
  }
}

checkAllCruises();