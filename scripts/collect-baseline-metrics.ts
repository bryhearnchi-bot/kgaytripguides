import { db, trips as tripsTable, itinerary as itineraryTable, events as eventsTable, talent as talentTable, tripInfoSections, cruiseTalent, media } from '../server/storage';

async function collectDatabaseMetrics() {
    console.log('=== Database Baseline Metrics ===');
    console.log('');
    console.log('1. Table Record Counts:');

    const trips = await db.select().from(tripsTable);
    console.log('   trips:', trips.length, 'records');

    const itineraries = await db.select().from(itineraryTable);
    console.log('   itineraries:', itineraries.length, 'records');

    const events = await db.select().from(eventsTable);
    console.log('   events:', events.length, 'records');

    const talent = await db.select().from(talentTable);
    console.log('   talent:', talent.length, 'records');

    const tripInfo = await db.select().from(tripInfoSections);
    console.log('   tripInfoSections:', tripInfo.length, 'records');

    const cruiseTalentRel = await db.select().from(cruiseTalent);
    console.log('   cruiseTalent (relationships):', cruiseTalentRel.length, 'records');

    const mediaRecords = await db.select().from(media);
    console.log('   media:', mediaRecords.length, 'records');

    console.log('');
    console.log('2. Data Analysis:');

    // Unique locations
    const locations = new Set(itineraries.map(i => i.location));
    console.log('   Unique locations:', locations.size);
    const locationList = Array.from(locations).sort();
    console.log('   Location list:', locationList.join(', '));

    // Unique parties
    const parties = new Set(events.map(e => e.title));
    console.log('   Unique party types:', parties.size);

    // Get size info
    console.log('');
    console.log('3. Database Summary:');
    const totalRecords = trips.length + itineraries.length + events.length + talent.length + tripInfo.length + cruiseTalentRel.length + mediaRecords.length;
    console.log('   Total records across all tables:', totalRecords);

    // Count images
    const talentWithImages = talent.filter(t => t.profileImageUrl).length;
    console.log('   Talent with profile images:', talentWithImages, '/', talent.length);

    // Count events per trip
    const eventsPerTrip: Record<number, number> = {};
    events.forEach(e => {
        eventsPerTrip[e.tripId] = (eventsPerTrip[e.tripId] || 0) + 1;
    });
    console.log('   Average events per trip:', (events.length / trips.length).toFixed(1));

    // Count itinerary items per trip
    const itinerariesPerTrip: Record<number, number> = {};
    itineraries.forEach(i => {
        itinerariesPerTrip[i.tripId] = (itinerariesPerTrip[i.tripId] || 0) + 1;
    });
    console.log('   Average itinerary items per trip:', (itineraries.length / trips.length).toFixed(1));
}

async function main() {
    try {
        await collectDatabaseMetrics();
        process.exit(0);
    } catch (error) {
        console.error('Error collecting metrics:', error);
        process.exit(1);
    }
}

main();