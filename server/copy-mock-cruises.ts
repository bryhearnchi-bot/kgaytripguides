import { db, cruises } from './storage';
import { eq } from 'drizzle-orm';

/**
 * One-time script to copy the other mock cruises to production database
 * Mediterranean Dreams, Caribbean Adventure, Alaska Wilderness
 */
async function copyMockCruisesToProduction() {
  console.log('🚢 Starting one-time copy of mock cruises to production...');
  
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (!isProduction) {
    console.log('⚠️ Not in production environment. Set NODE_ENV=production to run this script.');
    return;
  }

  try {
    // Define the mock cruises to copy
    const mockCruises = [
      {
        name: 'Mediterranean Dreams Current',
        slug: 'mediterranean-dreams-2025',
        shipName: 'Virgin Resilient Lady',
        cruiseLine: 'Virgin Voyages',
        startDate: new Date('2025-09-08'),
        endDate: new Date('2025-09-18'),
        status: 'upcoming' as const,
        description: 'Currently sailing through the beautiful Mediterranean',
        heroImageUrl: '/cruise-images/mediterranean-dreams.png',
        highlights: ['Santorini', 'Mykonos', 'Crete']
      },
      {
        name: 'Caribbean Adventure Upcoming',
        slug: 'caribbean-adventure-2025',
        shipName: 'Virgin Resilient Lady',
        cruiseLine: 'Virgin Voyages',
        startDate: new Date('2025-12-15'),
        endDate: new Date('2025-12-25'),
        status: 'upcoming' as const,
        description: 'Upcoming tropical paradise adventure',
        heroImageUrl: '/cruise-images/caribbean-adventure.png',
        highlights: ['Barbados', 'St. Lucia', 'Martinique']
      },
      {
        name: 'Alaska Wilderness Past',
        slug: 'alaska-wilderness-2025',
        shipName: 'Virgin Resilient Lady',
        cruiseLine: 'Virgin Voyages',
        startDate: new Date('2025-07-01'),
        endDate: new Date('2025-07-11'),
        status: 'upcoming' as const,
        description: 'Completed journey through the Last Frontier',
        heroImageUrl: '/cruise-images/alaska-wilderness.png',
        highlights: ['Juneau', 'Ketchikan', 'Glacier Bay']
      }
    ];

    let addedCount = 0;

    for (const cruise of mockCruises) {
      // Check if cruise already exists
      const existingCruise = await db.select().from(cruises).where(eq(cruises.slug, cruise.slug));
      
      if (existingCruise.length === 0) {
        console.log(`➕ Adding mock cruise: ${cruise.name}`);
        
        await db.insert(cruises).values(cruise);
        addedCount++;
      } else {
        console.log(`✅ Mock cruise already exists: ${cruise.name}`);
      }
    }

    console.log('🎯 Mock cruise copy completed!');
    console.log(`📊 Summary: ${addedCount} new cruises added to production`);
    
    if (addedCount > 0) {
      console.log('✨ Your production site now has additional cruise options for testing!');
    }

  } catch (error) {
    console.error('❌ Error copying mock cruises:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  copyMockCruisesToProduction()
    .then(() => {
      console.log('✅ Mock cruise copy completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Mock cruise copy failed:', error);
      process.exit(1);
    });
}

export { copyMockCruisesToProduction };