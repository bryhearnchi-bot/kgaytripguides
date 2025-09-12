
import { db, cruises } from './storage';

/**
 * Script to add test cruises for UI testing purposes
 * Adds 6 cruises with different statuses: upcoming, current, and past
 */
async function addTestCruises() {
  console.log('🧪 Adding test cruises for UI testing...');
  
  try {
    const testCruises = [
      // Upcoming Cruises
      {
        name: 'Caribbean Paradise 2025',
        slug: 'caribbean-paradise-2025',
        shipName: 'Virgin Scarlet Lady',
        cruiseLine: 'Virgin Voyages',
        startDate: new Date('2025-03-15'),
        endDate: new Date('2025-03-25'),
        status: 'upcoming' as const,
        description: 'Explore the stunning Caribbean islands with crystal clear waters and vibrant nightlife.',
        heroImageUrl: '/cruise-images/caribbean-adventure.png',
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
        heroImageUrl: '/cruise-images/mediterranean-dreams.png',
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
        heroImageUrl: '/cruise-images/alaska-wilderness.png',
        highlights: ['Juneau', 'Ketchikan', 'Glacier Bay', 'Skagway']
      },
      // Current Cruise
      {
        name: 'Northern Lights Expedition',
        slug: 'northern-lights-current',
        shipName: 'Virgin Resilient Lady',
        cruiseLine: 'Virgin Voyages',
        startDate: new Date('2024-12-20'),
        endDate: new Date('2024-12-30'),
        status: 'current' as const,
        description: 'Currently sailing through Nordic waters chasing the magical Northern Lights.',
        heroImageUrl: '/cruise-images/mediterranean-dreams.png',
        highlights: ['Iceland', 'Norway', 'Northern Lights Viewing', 'Arctic Wildlife']
      },
      // Past Cruises
      {
        name: 'Trans-Atlantic Classic',
        slug: 'trans-atlantic-past-2024',
        shipName: 'Virgin Scarlet Lady',
        cruiseLine: 'Virgin Voyages',
        startDate: new Date('2024-10-01'),
        endDate: new Date('2024-10-11'),
        status: 'past' as const,
        description: 'A classic ocean crossing from New York to Southampton with elegant entertainment.',
        heroImageUrl: '/cruise-images/caribbean-adventure.png',
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
        heroImageUrl: '/cruise-images/alaska-wilderness.png',
        highlights: ['Stockholm', 'Helsinki', 'St. Petersburg', 'Copenhagen']
      }
    ];

    let addedCount = 0;

    for (const cruise of testCruises) {
      // Check if cruise already exists
      const existingCruise = await db.select().from(cruises).where(eq => eq.slug === cruise.slug);
      
      if (existingCruise.length === 0) {
        console.log(`➕ Adding test cruise: ${cruise.name}`);
        
        await db.insert(cruises).values({
          ...cruise,
          includesInfo: {
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
        addedCount++;
      } else {
        console.log(`✅ Test cruise already exists: ${cruise.name}`);
      }
    }

    console.log('🎯 Test cruises added successfully!');
    console.log(`📊 Summary: ${addedCount} new test cruises added`);
    
    if (addedCount > 0) {
      console.log('✨ You can now test the UI with multiple cruise statuses!');
      console.log('📋 Added cruises with statuses:');
      console.log('   - 3 upcoming cruises');
      console.log('   - 1 current cruise');
      console.log('   - 2 past cruises');
    }

  } catch (error) {
    console.error('❌ Error adding test cruises:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  addTestCruises()
    .then(() => {
      console.log('✅ Test cruise addition completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test cruise addition failed:', error);
      process.exit(1);
    });
}

export { addTestCruises };
