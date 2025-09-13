import { config } from 'dotenv';
config();

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function inspectDatabase() {
  try {
    console.log('🔍 Inspecting your uploaded database...\n');

    console.log('📊 Row counts in each table:');

    // Check cruises
    const cruiseCount = await sql`SELECT COUNT(*) as count FROM cruises`;
    console.log(`  🚢 Cruises: ${cruiseCount[0].count} rows`);

    // Check itinerary
    const itineraryCount = await sql`SELECT COUNT(*) as count FROM itinerary`;
    console.log(`  🗺️ Itinerary: ${itineraryCount[0].count} rows`);

    // Check events
    const eventsCount = await sql`SELECT COUNT(*) as count FROM events`;
    console.log(`  🎪 Events: ${eventsCount[0].count} rows`);

    // Check talent
    const talentCount = await sql`SELECT COUNT(*) as count FROM talent`;
    console.log(`  🎭 Talent: ${talentCount[0].count} rows`);

    // Check cruise_talent relationships
    const cruiseTalentCount = await sql`SELECT COUNT(*) as count FROM cruise_talent`;
    console.log(`  🔗 Cruise-Talent Relations: ${cruiseTalentCount[0].count} rows`);

    console.log('\n🚢 All Cruises in database:');
    const allCruises = await sql`SELECT id, name, slug, start_date, end_date FROM cruises ORDER BY start_date`;
    allCruises.forEach((cruise, i) => {
      console.log(`  ${i+1}. ${cruise.name} (${cruise.slug}) - ${cruise.start_date?.toISOString?.()?.split('T')[0] || cruise.start_date}`);
    });

    console.log('\n🎭 Sample Talent:');
    const sampleTalent = await sql`SELECT name, category FROM talent LIMIT 10`;
    sampleTalent.forEach((t, i) => {
      console.log(`  ${i+1}. ${t.name} - ${t.category}`);
    });

    console.log('\n🗺️ Sample Itinerary for first cruise:');
    if (allCruises.length > 0) {
      const firstCruiseId = allCruises[0].id;
      const sampleItinerary = await sql`SELECT port_name, date, arrival_time, departure_time FROM itinerary WHERE cruise_id = ${firstCruiseId} ORDER BY order_index LIMIT 5`;
      sampleItinerary.forEach((stop, i) => {
        console.log(`  ${i+1}. ${stop.port_name} - ${stop.date?.toISOString?.()?.split('T')[0] || stop.date} (${stop.arrival_time} - ${stop.departure_time})`);
      });
    }

    console.log('\n🎪 Sample Events for first cruise:');
    if (allCruises.length > 0) {
      const firstCruiseId = allCruises[0].id;
      const sampleEvents = await sql`SELECT title, date, time, type, venue FROM events WHERE cruise_id = ${firstCruiseId} ORDER BY date, time LIMIT 5`;
      sampleEvents.forEach((event, i) => {
        console.log(`  ${i+1}. ${event.title} - ${event.date?.toISOString?.()?.split('T')[0] || event.date} ${event.time} (${event.type} at ${event.venue})`);
      });
    }

  } catch (error) {
    console.error('❌ Database inspection failed:', error);
  }
}

inspectDatabase();