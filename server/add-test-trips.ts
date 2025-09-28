
import { getSupabaseAdmin } from './supabase-admin';

/**
 * Script to add test trips for UI testing purposes
 * Adds 6 trips with different statuses: upcoming, current, and past
 */
async function addTestTrips() {
  console.log('🧪 Adding test trips for UI testing...');

  try {
    const supabaseAdmin = getSupabaseAdmin();

    const testTrips = [
      // Upcoming Trips
      {
        name: 'Caribbean Paradise 2025',
        slug: 'caribbean-paradise-2025',
        shipName: 'Virgin Scarlet Lady',
        cruiseLine: 'Virgin Voyages',
        startDate: new Date('2025-03-15'),
        endDate: new Date('2025-03-25'),
        status: 'upcoming' as const,
        description: 'Explore the stunning Caribbean islands with crystal clear waters and vibrant nightlife.',
        heroImageUrl: '/app-images/trips/caribbean-adventure.png',
        highlights: ['Barbados', 'St. Lucia', 'Martinique', 'Dominica']
      },
      {
        name: 'Mediterranean Dreams 2025',
        slug: 'mediterranean-dreams-2025',
        shipName: 'Virgin Valiant Lady',
        cruiseLine: 'Virgin Voyages',
        startDate: new Date('2025-05-10'),
        endDate: new Date('2025-05-20'),
        status: 'upcoming' as const,
        description: 'Discover the romance and history of the Mediterranean with stops at iconic ports.',
        heroImageUrl: '/app-images/trips/mediterranean-dreams.png',
        highlights: ['Barcelona', 'Monaco', 'Rome', 'Florence']
      },
      {
        name: 'Alaska Wilderness Adventure',
        slug: 'alaska-wilderness-2025',
        shipName: 'Virgin Voyages Explorer',
        cruiseLine: 'Virgin Voyages',
        startDate: new Date('2025-07-08'),
        endDate: new Date('2025-07-18'),
        status: 'upcoming' as const,
        description: 'Experience the breathtaking wilderness of Alaska with glaciers, wildlife, and pristine nature.',
        heroImageUrl: '/app-images/trips/alaska-wilderness.png',
        highlights: ['Juneau', 'Ketchikan', 'Glacier Bay', 'Skagway']
      },
      // Current Trip
      {
        name: 'Northern Lights Expedition',
        slug: 'northern-lights-current',
        shipName: 'Virgin Resilient Lady',
        cruiseLine: 'Virgin Voyages',
        startDate: new Date('2024-12-20'),
        endDate: new Date('2024-12-30'),
        status: 'current' as const,
        description: 'Currently sailing through Nordic waters chasing the magical Northern Lights.',
        heroImageUrl: '/app-images/trips/mediterranean-dreams.png',
        highlights: ['Iceland', 'Norway', 'Northern Lights Viewing', 'Arctic Wildlife']
      },
      // Past Trips
      {
        name: 'Trans-Atlantic Classic',
        slug: 'trans-atlantic-past-2024',
        shipName: 'Virgin Scarlet Lady',
        cruiseLine: 'Virgin Voyages',
        startDate: new Date('2024-10-01'),
        endDate: new Date('2024-10-11'),
        status: 'past' as const,
        description: 'A classic ocean crossing from New York to Southampton with elegant entertainment.',
        heroImageUrl: '/app-images/trips/caribbean-adventure.png',
        highlights: ['New York Departure', 'Sea Days', 'Southampton Arrival', 'Ocean Views']
      },
      {
        name: 'Baltic Sea Discovery',
        slug: 'baltic-sea-past-2024',
        shipName: 'Virgin Valiant Lady',
        cruiseLine: 'Virgin Voyages',
        startDate: new Date('2024-08-15'),
        endDate: new Date('2024-08-25'),
        status: 'past' as const,
        description: 'Explored the historic capitals and stunning coastlines of the Baltic Sea.',
        heroImageUrl: '/app-images/trips/alaska-wilderness.png',
        highlights: ['Stockholm', 'Helsinki', 'St. Petersburg', 'Copenhagen']
      }
    ];

    let addedCount = 0;

    for (const trip of testTrips) {
      // Check if trip already exists
      const { data: existingTrip, error: checkError } = await supabaseAdmin
        .from('trips')
        .select('*')
        .eq('slug', trip.slug);

      if (checkError) {
        console.error(`Error checking existing trip ${trip.slug}:`, checkError);
        throw checkError;
      }

      if (!existingTrip || existingTrip.length === 0) {
        console.log(`➕ Adding test trip: ${trip.name}`);

        const { error: insertError } = await supabaseAdmin
          .from('trips')
          .insert({
            ...trip,
            ship_name: trip.shipName,
            cruise_line: trip.cruiseLine,
            start_date: trip.startDate.toISOString(),
            end_date: trip.endDate.toISOString(),
            hero_image_url: trip.heroImageUrl,
            includes_info: {
              included: [
                'Accommodation in selected cabin category',
                'All meals and entertainment onboard',
                'Access to ship facilities',
                'Entertainment and shows'
              ],
              notIncluded: [
                'Airfare',
                'Shore excursions',
                'Alcoholic beverages',
                'Gratuities'
              ]
            }
          });

        if (insertError) {
          console.error(`Error creating test trip ${trip.name}:`, insertError);
          throw insertError;
        }

        addedCount++;
      } else {
        console.log(`✅ Test trip already exists: ${trip.name}`);
      }
    }

    console.log('🎯 Test trips added successfully!');
    console.log(`📊 Summary: ${addedCount} new test trips added`);

    if (addedCount > 0) {
      console.log('✨ You can now test the UI with multiple trip statuses!');
      console.log('📋 Added trips with statuses:');
      console.log('   - 3 upcoming trips');
      console.log('   - 1 current trip');
      console.log('   - 2 past trips');
    }

  } catch (error) {
    console.error('❌ Error adding test trips:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  addTestTrips()
    .then(() => {
      console.log('✅ Test trip addition completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test trip addition failed:', error);
      process.exit(1);
    });
}

export { addTestTrips };
