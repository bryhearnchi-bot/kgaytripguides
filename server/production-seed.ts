import { getSupabaseAdmin } from './supabase-admin';
// @ts-expect-error - Legacy data import for seeding, will be removed in Phase 6
import { ITINERARY, DAILY, TALENT, PARTY_THEMES } from '../client/src/data/cruise-data';

// Trip type settings with metadata for production
const TRIP_TYPE_SETTINGS = [
  {
    key: 'cruise',
    label: 'Cruise',
    value: null,
    metadata: {
      buttonText: 'Book Cruise',
      description: 'Multi-day cruise experiences with entertainment, dining, and port visits',
    },
    orderIndex: 0,
  },
  {
    key: 'vacation',
    label: 'Vacation Package',
    value: null,
    metadata: {
      buttonText: 'Book Vacation',
      description: 'Complete vacation packages including accommodations and activities',
    },
    orderIndex: 1,
  },
  {
    key: 'event',
    label: 'Special Event',
    value: null,
    metadata: {
      buttonText: 'Register for Event',
      description: 'Exclusive events, parties, and special occasions',
    },
    orderIndex: 2,
  },
  {
    key: 'resort',
    label: 'Resort Stay',
    value: null,
    metadata: {
      buttonText: 'Book Resort',
      description: 'Luxury resort accommodations with all-inclusive amenities',
    },
    orderIndex: 3,
  },
];

/**
 * Production seeding script that intelligently manages data:
 * - First deployment: Seeds all Greek Isles cruise data and default settings
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
    const supabaseAdmin = getSupabaseAdmin();

    // 1. Check if Greek Isles cruise exists
    console.log('🔍 Checking existing cruise data...');
    const { data: existingCruise, error: checkError } = await supabaseAdmin
      .from('trips')
      .select('*')
      .eq('slug', 'greek-isles-2025');

    if (checkError) {
      console.error('Error checking existing cruise:', checkError);
      throw checkError;
    }

    let cruise;

    if (!existingCruise || existingCruise.length === 0) {
      // First time deployment - create the main cruise
      console.log('🆕 First deployment detected - creating Greek Isles cruise...');
      const { data: cruiseData, error: insertError } = await supabaseAdmin
        .from('trips')
        .insert({
          name: 'Greek Isles Atlantis Cruise',
          slug: 'greek-isles-2025',
          ship_name: 'Virgin Resilient Lady',
          cruise_line: 'Virgin Voyages',
          start_date: new Date('2025-08-21').toISOString(),
          end_date: new Date('2025-08-31').toISOString(),
          status: 'upcoming',
          description:
            'Join us for an unforgettable journey through the Greek Isles aboard the Virgin Resilient Lady. Experience ancient wonders, stunning beaches, and legendary Atlantis parties.',
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

      cruise = cruiseData;
      console.log(`✅ Created cruise: ${cruise.name} (ID: ${cruise.id})`);
    } else {
      cruise = existingCruise[0];
      console.log(`✅ Found existing cruise: ${cruise.name} (ID: ${cruise.id})`);
    }

    // 2. Seed/Update Settings (check for new trip type settings)
    console.log('⚙️ Checking trip type settings...');
    const { data: existingSettings, error: settingsError } = await supabaseAdmin
      .from('settings')
      .select('*')
      .eq('category', 'trip_types');

    if (settingsError) {
      console.error('Error fetching existing settings:', settingsError);
      throw settingsError;
    }

    const existingSettingKeys = existingSettings?.map(s => s.key) || [];

    let newSettingsCount = 0;
    for (const settingData of TRIP_TYPE_SETTINGS) {
      if (!existingSettingKeys.includes(settingData.key)) {
        console.log(`➕ Adding new trip type setting: ${settingData.label}`);

        const { error: insertSettingError } = await supabaseAdmin.from('settings').insert({
          category: 'trip_types',
          key: settingData.key,
          label: settingData.label,
          value: settingData.value,
          metadata: settingData.metadata,
          is_active: true,
          order_index: settingData.orderIndex,
          created_by: null, // System-created settings don't have a specific user
        });

        if (insertSettingError) {
          console.error(`Error creating setting ${settingData.key}:`, insertSettingError);
          throw insertSettingError;
        }

        newSettingsCount++;
      }
    }
    console.log(`✅ Trip type settings check complete. Added ${newSettingsCount} new settings.`);

    // 3. Seed/Update Talent (check for new talent)
    console.log('🎭 Checking talent data...');
    const { data: existingTalent, error: talentFetchError } = await supabaseAdmin
      .from('talent')
      .select('*');

    if (talentFetchError) {
      console.error('Error fetching existing talent:', talentFetchError);
      throw talentFetchError;
    }

    const existingTalentNames = existingTalent?.map(t => t.name) || [];
    const talentMap = new Map((existingTalent || []).map(t => [t.name, t.id]));

    let newTalentCount = 0;
    for (const t of TALENT) {
      if (!existingTalentNames.includes(t.name)) {
        console.log(`➕ Adding new talent: ${t.name}`);
        const { data: talentRecord, error: talentInsertError } = await supabaseAdmin
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

        if (talentInsertError) {
          console.error(`Error creating talent ${t.name}:`, talentInsertError);
          throw talentInsertError;
        }

        talentMap.set(t.name, talentRecord.id);

        // Link new talent to cruise
        const { error: linkError } = await supabaseAdmin.from('trip_talent').insert({
          trip_id: cruise.id,
          talent_id: talentRecord.id,
          role:
            t.cat === 'Broadway'
              ? 'Headliner'
              : t.cat === 'Drag'
                ? 'Special Guest'
                : t.cat === 'Comedy'
                  ? 'Host'
                  : 'Performer',
        });

        if (linkError) {
          console.error(`Error linking talent ${t.name} to cruise:`, linkError);
          throw linkError;
        }

        newTalentCount++;
      }
    }
    console.log(`✅ Talent check complete. Added ${newTalentCount} new performers.`);

    // 4. Seed/Update Itinerary (check for new stops)
    console.log('🗺️ Checking itinerary data...');
    const { data: existingItinerary, error: itineraryFetchError } = await supabaseAdmin
      .from('itinerary')
      .select('*')
      .eq('trip_id', cruise.id);

    if (itineraryFetchError) {
      console.error('Error fetching existing itinerary:', itineraryFetchError);
      throw itineraryFetchError;
    }

    const existingPorts = (existingItinerary || []).map(
      i => `${new Date(i.date).toISOString().split('T')[0]}-${i.location_id || 'unknown'}`
    );

    let newItineraryCount = 0;
    for (let index = 0; index < ITINERARY.length; index++) {
      const stop = ITINERARY[index];
      const [year, month, day] = stop.key.split('-').map(Number);
      const stopDate = new Date(year, month - 1, day);
      const stopKey = `${stopDate.toISOString().split('T')[0]}-${stop.port}`;

      if (!existingPorts.includes(stopKey)) {
        console.log(`➕ Adding new itinerary stop: ${stop.port} on ${stop.key}`);

        // Calculate day number based on index + 1
        const dayNumber = index + 1;

        // Convert all aboard time from departure time (subtract 1 hour typically)
        let allAboardTime = '';
        if (stop.depart && stop.depart !== '—' && stop.depart !== 'Overnight') {
          allAboardTime = stop.depart; // Simplified - use departure time as all aboard
        }

        const { error: itineraryInsertError } = await supabaseAdmin.from('itinerary').insert({
          trip_id: cruise.id,
          date: stopDate.toISOString(),
          day: dayNumber,
          location_id: null, // Will be set to actual location IDs later if needed
          location_type_id: null,
          arrival_time: stop.arrive === '—' ? '' : stop.arrive,
          departure_time: stop.depart === '—' ? '' : stop.depart,
          all_aboard_time: allAboardTime,
          description: stop.port.includes('Sea')
            ? 'Enjoy a relaxing day at sea with all the ship amenities and Atlantis activities.'
            : '',
          order_index: index,
          segment: null,
          highlights: null,
          location_image_url: null,
          port_image_url: null,
        });

        if (itineraryInsertError) {
          console.error(`Error creating itinerary stop ${stop.port}:`, itineraryInsertError);
          throw itineraryInsertError;
        }

        newItineraryCount++;
      }
    }
    console.log(`✅ Itinerary check complete. Added ${newItineraryCount} new stops.`);

    // 5. Seed/Update Events (check for new events)
    console.log('🎉 Checking events data...');
    const { data: existingEvents, error: eventsFetchError } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('trip_id', cruise.id);

    if (eventsFetchError) {
      console.error('Error fetching existing events:', eventsFetchError);
      throw eventsFetchError;
    }

    const existingEventKeys = (existingEvents || []).map(
      (e: any) => `${new Date(e.date).toISOString().split('T')[0]}-${e.time}-${e.title}`
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
            const theme = (PARTY_THEMES as any[]).find((p: any) => item.title.includes(p.key));
            themeDesc = theme?.desc || null;
          }

          const { error: eventInsertError } = await supabaseAdmin.from('events').insert({
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

          if (eventInsertError) {
            console.error(`Error creating event ${item.title}:`, eventInsertError);
            throw eventInsertError;
          }

          newEventCount++;
        }
      }
    }
    console.log(`✅ Events check complete. Added ${newEventCount} new events.`);

    console.log('🎯 Production seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Cruise: ${cruise.name} (${cruise.status})`);
    console.log(`   - New trip type settings: ${newSettingsCount}`);
    console.log(`   - New talent added: ${newTalentCount}`);
    console.log(`   - New itinerary stops: ${newItineraryCount}`);
    console.log(`   - New events added: ${newEventCount}`);
  } catch (error: unknown) {
    console.error('❌ Error in production seeding:', error);
    throw error;
  }
}

// Run if called directly
if (process.argv[1] && import.meta.url === new URL(process.argv[1], 'file://').href) {
  seedProduction()
    .then(() => {
      console.log('✅ Production seeding completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Production seeding failed:', error);
      process.exit(1);
    });
} else if (process.env.NODE_ENV === 'production') {
  // Run seeding in background during production startup, but don't exit
  seedProduction()
    .then(() => {
      console.log('✅ Production seeding completed');
    })
    .catch(error => {
      console.error('❌ Production seeding failed:', error);
    });
}

export { seedProduction };
