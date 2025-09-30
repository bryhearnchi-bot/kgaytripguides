import { getSupabaseAdmin } from './supabase-admin';
// NOTE: cruise-data.ts has been removed. Use trip-data.ts or mock-data.ts instead
// import { ITINERARY, DAILY, TALENT, PARTY_THEMES } from '../client/src/data/cruise-data';
import {
  MOCK_ITINERARY,
  MOCK_DAILY,
  MOCK_TALENT,
  MOCK_PARTY_THEMES,
} from '../client/src/data/mock-data';

// Placeholder for production data - replace with actual data source
const ITINERARY = MOCK_ITINERARY;
const DAILY = MOCK_DAILY;
const TALENT = MOCK_TALENT;
const PARTY_THEMES = MOCK_PARTY_THEMES;

async function seedDatabase() {
  console.log('🌱 Starting database seed...');

  // Use mock data only in development when explicitly enabled
  const isProduction = process.env.NODE_ENV === 'production';
  const useMockData = process.env.USE_MOCK_DATA === 'true' && !isProduction;

  const selectedItinerary = useMockData ? MOCK_ITINERARY : ITINERARY;
  const selectedDaily = useMockData ? MOCK_DAILY : DAILY;
  const selectedTalent = useMockData ? MOCK_TALENT : TALENT;
  const selectedPartyThemes = useMockData ? MOCK_PARTY_THEMES : PARTY_THEMES;

  console.log(
    useMockData ? '🧪 Using mock data for testing' : '🚢 Using production Greek Isles cruise data'
  );

  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Check if Greek cruise already exists
    const targetSlug = useMockData ? 'mock-cruise-2024' : 'greek-isles-2025';
    const { data: existingCruise, error: checkError } = await supabaseAdmin
      .from('trips')
      .select('*')
      .eq('slug', targetSlug);

    if (checkError) {
      console.error('Error checking existing cruise:', checkError);
      throw checkError;
    }

    if (existingCruise && existingCruise.length > 0) {
      console.log('✅ Cruise already exists, skipping seed...');
      console.log(`Found existing cruise: ${existingCruise[0].name} (ID: ${existingCruise[0].id})`);
      return;
    }
    // Create the cruise
    console.log(useMockData ? 'Creating mock test cruise...' : 'Creating Greek Isles cruise...');
    const { data: cruise, error: insertError } = await supabaseAdmin
      .from('trips')
      .insert({
        name: useMockData ? 'Mock Test Cruise' : 'Greek Isles Atlantis Cruise',
        slug: useMockData ? 'mock-cruise-2024' : 'greek-isles-2025',
        ship_name: useMockData ? 'Test Ship' : 'Virgin Resilient Lady',
        cruise_line: useMockData ? 'Test Line' : 'Virgin Voyages',
        start_date: (useMockData ? new Date('2024-01-01') : new Date('2025-08-21')).toISOString(),
        end_date: (useMockData ? new Date('2024-01-03') : new Date('2025-08-31')).toISOString(),
        status: 'upcoming',
        description: useMockData
          ? 'Mock test cruise for development and testing purposes.'
          : 'Join us for an unforgettable journey through the Greek Isles aboard the Virgin Resilient Lady. Experience ancient wonders, stunning beaches, and legendary Atlantis parties.',
        hero_image_url:
          'https://www.usatoday.com/gcdn/authoring/authoring-images/2024/02/09/USAT/72538478007-resilientlady.png',
        highlights: [
          'Visit iconic Greek islands including Mykonos and Santorini',
          'Explore ancient ruins in Athens and Ephesus',
          'Legendary Atlantis parties and entertainment',
          'World-class talent and performances',
          'All-gay vacation experience',
        ],
        includes_info: {
          included: [
            'Accommodation in your selected cabin category',
            'All meals and entertainment onboard',
            'Access to all ship facilities',
            'Atlantis parties and events',
            'Talent performances and shows',
          ],
          notIncluded: [
            'Airfare',
            'Shore excursions',
            'Alcoholic beverages',
            'Gratuities',
            'Spa services',
          ],
        },
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating cruise:', insertError);
      throw insertError;
    }

    // Seed itinerary
    console.log('Creating itinerary stops...');
    const itineraryData = selectedItinerary.map((stop: any, index: number) => {
      const [year, month, day] = stop.key.split('-').map(Number);
      const stopDate = new Date(year, month - 1, day);

      return {
        trip_id: cruise.id,
        date: stopDate.toISOString(),
        day: index + 1,
        location_id: null, // Will be set to actual location IDs later if needed
        location_type_id: null, // Will be set to actual location type IDs later if needed
        arrival_time: stop.arrive === '—' ? null : stop.arrive,
        departure_time:
          stop.depart === '—' ? null : stop.depart === 'Overnight' ? 'Overnight' : stop.depart,
        all_aboard_time:
          stop.depart && stop.depart !== '—' && stop.depart !== 'Overnight'
            ? (() => {
                const [hours, minutes] = stop.depart.split(':').map(Number);
                const allAboardHour = hours - 1;
                return `${String(allAboardHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
              })()
            : null,
        order_index: index,
        segment: null,
        description: stop.port.includes('Sea')
          ? 'Enjoy a relaxing day at sea with all the ship amenities and Atlantis activities.'
          : null,
        highlights: null,
        location_image_url: null,
        port_image_url: null,
      };
    });

    const { error: itineraryError } = await supabaseAdmin.from('itinerary').insert(itineraryData);

    if (itineraryError) {
      console.error('Error creating itinerary:', itineraryError);
      throw itineraryError;
    }

    // Seed talent
    console.log('Creating talent...');
    const talentMap = new Map();

    for (const t of selectedTalent) {
      const { data: talentRecord, error: talentError } = await supabaseAdmin
        .from('talent')
        .insert({
          name: t.name,
          talent_category_id: null, // Will need to map categories to IDs later if needed
          bio: t.bio,
          known_for: t.knownFor,
          profile_image_url: t.img,
          social_links: t.social || {},
          website: t.social?.website || null,
        })
        .select()
        .single();

      if (talentError) {
        console.error(`Error creating talent ${t.name}:`, talentError);
        throw talentError;
      }

      talentMap.set(t.name, talentRecord.id);
    }

    // Seed events
    console.log('Creating events...');
    for (const daily of selectedDaily) {
      const [year = 2025, month = 1, day = 1] = daily.key.split('-').map(Number);
      const eventDate = new Date(year, month - 1, day);

      for (const item of daily.items) {
        // Find talent IDs mentioned in the event
        const talentIds = [];
        for (const [talentName, talentId] of Array.from(talentMap.entries())) {
          if (
            item.title.toLowerCase().includes(talentName.toLowerCase()) ||
            (talentName === 'The Diva (Bingo)' && item.title.toLowerCase().includes('bingo'))
          ) {
            talentIds.push(talentId);
          }
        }

        // Find party theme description
        let themeDesc = null;
        if (item.type === 'party' || item.type === 'after') {
          const theme = selectedPartyThemes.find((p: any) => item.title.includes(p.key));
          themeDesc = theme?.desc || null;
        }

        const { error: eventError } = await supabaseAdmin.from('events').insert({
          trip_id: cruise.id,
          date: eventDate.toISOString(),
          time: item.time,
          title: item.title,
          type: item.type,
          venue: item.venue,
          description: themeDesc,
          short_description: themeDesc
            ? themeDesc.length > 100
              ? `${themeDesc.substring(0, 100)}...`
              : themeDesc
            : null,
          talent_ids: talentIds.length > 0 ? talentIds : null,
          requires_reservation: item.venue === 'The Manor' || item.venue === 'Pink Agave',
        });

        if (eventError) {
          console.error(`Error creating event ${item.title}:`, eventError);
          throw eventError;
        }
      }
    }

    console.log('✅ Database seeded successfully!');
    console.log(`Created cruise: ${cruise.name} (ID: ${cruise.id})`);
    console.log(`- ${selectedItinerary.length} itinerary stops`);
    console.log(`- ${selectedTalent.length} talent members`);
    console.log(
      `- ${selectedDaily.reduce((acc: number, d: any) => acc + d.items.length, 0)} events`
    );
  } catch (error: unknown) {
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
    .catch(error => {
      console.error('Seed failed:', error);
      process.exit(1);
    });
}

export { seedDatabase };
