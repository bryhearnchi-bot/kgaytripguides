import { db, cruises, itinerary, events, talent, cruiseTalent } from './storage';
import { eq, and } from 'drizzle-orm';
import { ITINERARY, DAILY, TALENT, PARTY_THEMES } from '../client/src/data/cruise-data';

/**
 * Production seeding script that intelligently manages data:
 * - First deployment: Seeds all Greek Isles cruise data
 * - Subsequent deployments: Only adds new/changed data
 */
async function seedProduction() {
  console.log('🚀 Starting production database seeding...');
  
  // Only use real Greek Isles data in production
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (!isProduction) {
    console.log('⏭️ Skipping production seed - not in production environment');
    return;
  }

  try {
    // 1. Check if Greek Isles cruise exists
    console.log('🔍 Checking existing cruise data...');
    const existingCruise = await db.select().from(cruises).where(eq(cruises.slug, 'greek-isles-2025'));
    
    let cruise;
    
    if (existingCruise.length === 0) {
      // First time deployment - create the main cruise
      console.log('🆕 First deployment detected - creating Greek Isles cruise...');
      [cruise] = await db.insert(cruises).values({
        name: 'Greek Isles Atlantis Cruise',
        slug: 'greek-isles-2025',
        shipName: 'Virgin Resilient Lady',
        cruiseLine: 'Virgin Voyages',
        startDate: new Date('2025-08-21'),
        endDate: new Date('2025-08-31'),
        status: 'upcoming',
        description: 'Join us for an unforgettable journey through the Greek Isles aboard the Virgin Resilient Lady. Experience ancient wonders, stunning beaches, and legendary Atlantis parties.',
        heroImageUrl: 'https://www.usatoday.com/gcdn/authoring/authoring-images/2024/02/09/USAT/72538478007-resilientlady.png',
        highlights: [
          'Visit iconic Greek islands including Mykonos and Santorini',
          'Explore ancient ruins in Athens and Ephesus',
          'Legendary Atlantis parties and entertainment',
          'World-class talent and performances',
          'All-gay vacation experience'
        ],
        includesInfo: {
          included: [
            'Accommodation in your selected cabin category',
            'All meals and entertainment onboard',
            'Access to all ship facilities',
            'Atlantis parties and events',
            'Talent performances and shows'
          ],
          notIncluded: [
            'Airfare',
            'Shore excursions',
            'Alcoholic beverages',
            'Gratuities',
            'Spa services'
          ]
        }
      }).returning();
      console.log(`✅ Created cruise: ${cruise.name} (ID: ${cruise.id})`);
    } else {
      cruise = existingCruise[0];
      console.log(`✅ Found existing cruise: ${cruise.name} (ID: ${cruise.id})`);
    }

    // 2. Seed/Update Talent (check for new talent)
    console.log('🎭 Checking talent data...');
    const existingTalent = await db.select().from(talent);
    const existingTalentNames = existingTalent.map(t => t.name);
    const talentMap = new Map(existingTalent.map(t => [t.name, t.id]));
    
    let newTalentCount = 0;
    for (const t of TALENT) {
      if (!existingTalentNames.includes(t.name)) {
        console.log(`➕ Adding new talent: ${t.name}`);
        const [talentRecord] = await db.insert(talent).values({
          name: t.name,
          category: t.cat,
          bio: t.bio,
          knownFor: t.knownFor,
          profileImageUrl: t.img,
          socialLinks: t.social || {},
          website: t.social?.website || null
        }).returning();
        
        talentMap.set(t.name, talentRecord.id);
        
        // Link new talent to cruise
        await db.insert(cruiseTalent).values({
          cruiseId: cruise.id,
          talentId: talentRecord.id,
          role: t.cat === 'Broadway' ? 'Headliner' : 
                t.cat === 'Drag' ? 'Special Guest' : 
                t.cat === 'Comedy' ? 'Host' : 'Performer'
        });
        
        newTalentCount++;
      }
    }
    console.log(`✅ Talent check complete. Added ${newTalentCount} new performers.`);

    // 3. Seed/Update Itinerary (check for new stops)
    console.log('🗺️ Checking itinerary data...');
    const existingItinerary = await db.select().from(itinerary).where(eq(itinerary.cruiseId, cruise.id));
    const existingPorts = existingItinerary.map(i => `${i.date?.toISOString().split('T')[0]}-${i.portName}`);
    
    let newItineraryCount = 0;
    for (const stop of ITINERARY) {
      const [year, month, day] = stop.date.split('-').map(Number);
      const stopDate = new Date(year, month - 1, day);
      const stopKey = `${stopDate.toISOString().split('T')[0]}-${stop.port}`;
      
      if (!existingPorts.includes(stopKey)) {
        console.log(`➕ Adding new itinerary stop: ${stop.port} on ${stop.date}`);
        await db.insert(itinerary).values({
          cruiseId: cruise.id,
          date: stopDate,
          day: stop.day,
          portName: stop.port,
          country: stop.country || '',
          arrivalTime: stop.arrival || '',
          departureTime: stop.departure || '',
          allAboardTime: stop.allAboard || '',
          description: stop.description || '',
          orderIndex: stop.day - 1
        });
        newItineraryCount++;
      }
    }
    console.log(`✅ Itinerary check complete. Added ${newItineraryCount} new stops.`);

    // 4. Seed/Update Events (check for new events)
    console.log('🎉 Checking events data...');
    const existingEvents = await db.select().from(events).where(eq(events.cruiseId, cruise.id));
    const existingEventKeys = existingEvents.map(e => 
      `${e.date?.toISOString().split('T')[0]}-${e.time}-${e.title}`
    );
    
    let newEventCount = 0;
    for (const daily of DAILY) {
      const [year, month, day] = daily.key.split('-').map(Number);
      const eventDate = new Date(year, month - 1, day);

      for (const item of daily.items) {
        const eventKey = `${eventDate.toISOString().split('T')[0]}-${item.time}-${item.title}`;
        
        if (!existingEventKeys.includes(eventKey)) {
          console.log(`➕ Adding new event: ${item.title} on ${daily.key}`);
          
          // Find talent IDs mentioned in the event
          const talentIds = [];
          for (const [talentName, talentId] of Array.from(talentMap.entries())) {
            if (item.title.toLowerCase().includes(talentName.toLowerCase()) ||
                (talentName === 'The Diva (Bingo)' && item.title.toLowerCase().includes('bingo'))) {
              talentIds.push(talentId);
            }
          }

          // Find party theme description
          let themeDesc = null;
          if (item.type === 'party' || item.type === 'after') {
            const theme = PARTY_THEMES.find(p => item.title.includes(p.key));
            themeDesc = theme?.desc || null;
          }

          await db.insert(events).values({
            cruiseId: cruise.id,
            date: eventDate,
            time: item.time,
            title: item.title,
            type: item.type,
            venue: item.venue,
            description: themeDesc,
            shortDescription: themeDesc ? (themeDesc.length > 100 ? themeDesc.substring(0, 100) + '...' : themeDesc) : null,
            talentIds: talentIds.length > 0 ? talentIds : null,
            requiresReservation: item.venue === 'The Manor' || item.venue === 'Pink Agave'
          });
          
          newEventCount++;
        }
      }
    }
    console.log(`✅ Events check complete. Added ${newEventCount} new events.`);

    console.log('🎯 Production seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Cruise: ${cruise.name} (${cruise.status})`);
    console.log(`   - New talent added: ${newTalentCount}`);
    console.log(`   - New itinerary stops: ${newItineraryCount}`);
    console.log(`   - New events added: ${newEventCount}`);

  } catch (error) {
    console.error('❌ Error in production seeding:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  seedProduction()
    .then(() => {
      console.log('✅ Production seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Production seeding failed:', error);
      process.exit(1);
    });
}

export { seedProduction };