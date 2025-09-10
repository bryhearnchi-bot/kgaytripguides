import { db, cruises, itinerary, events, talent, cruiseTalent } from './storage';
import { ITINERARY, DAILY, TALENT, PARTY_THEMES } from '../client/src/data/cruise-data';

async function seedDatabase() {
  console.log('🌱 Starting database seed...');

  try {
    // Create the Greek Isles cruise
    console.log('Creating Greek Isles cruise...');
    const [greekIslesCruise] = await db.insert(cruises).values({
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

    // Seed itinerary
    console.log('Creating itinerary stops...');
    const itineraryPromises = ITINERARY.map(async (stop, index) => {
      const [year, month, day] = stop.key.split('-').map(Number);
      const stopDate = new Date(year, month - 1, day);

      return db.insert(itinerary).values({
        cruiseId: greekIslesCruise.id,
        date: stopDate,
        day: index + 1,
        portName: stop.port,
        country: stop.port.includes('Greece') ? 'Greece' : 
                 stop.port.includes('Turkey') ? 'Turkey' : 
                 stop.port.includes('Egypt') ? 'Egypt' :
                 stop.port.includes('Italy') ? 'Italy' :
                 stop.port.includes('Spain') ? 'Spain' : null,
        arrivalTime: stop.arrive === '—' ? null : stop.arrive,
        departureTime: stop.depart === '—' ? null : stop.depart === 'Overnight' ? 'Overnight' : stop.depart,
        allAboardTime: stop.depart && stop.depart !== '—' && stop.depart !== 'Overnight' ? 
          (() => {
            const [hours, minutes] = stop.depart.split(':').map(Number);
            const allAboardHour = hours - 1;
            return `${String(allAboardHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
          })() : null,
        orderIndex: index,
        description: stop.port.includes('Sea') ? 'Enjoy a relaxing day at sea with all the ship amenities and Atlantis activities.' : null
      }).returning();
    });

    await Promise.all(itineraryPromises);

    // Seed talent
    console.log('Creating talent...');
    const talentMap = new Map();
    
    for (const t of TALENT) {
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

      // Link talent to cruise
      await db.insert(cruiseTalent).values({
        cruiseId: greekIslesCruise.id,
        talentId: talentRecord.id,
        role: t.cat === 'Broadway' ? 'Headliner' : 
              t.cat === 'Drag' ? 'Special Guest' : 
              t.cat === 'Comedy' ? 'Host' : 'Performer'
      });
    }

    // Seed events
    console.log('Creating events...');
    for (const daily of DAILY) {
      const [year, month, day] = daily.key.split('-').map(Number);
      const eventDate = new Date(year, month - 1, day);

      for (const item of daily.items) {
        // Find talent IDs mentioned in the event
        const talentIds = [];
        for (const [talentName, talentId] of talentMap.entries()) {
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
          cruiseId: greekIslesCruise.id,
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
      }
    }

    console.log('✅ Database seeded successfully!');
    console.log(`Created cruise: ${greekIslesCruise.name} (ID: ${greekIslesCruise.id})`);
    console.log(`- ${ITINERARY.length} itinerary stops`);
    console.log(`- ${TALENT.length} talent members`);
    console.log(`- ${DAILY.reduce((acc, d) => acc + d.items.length, 0)} events`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Check if running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => {
      console.log('Seed completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seed failed:', error);
      process.exit(1);
    });
}

export { seedDatabase };