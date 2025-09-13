import { config } from 'dotenv';
config();

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './shared/schema';

const queryClient = neon(process.env.DATABASE_URL!);
const db = drizzle(queryClient, { schema });

async function quickSeed() {
  console.log('🚀 Quick seeding the database...');

  try {
    // Create a Greek Isles cruise
    const cruise = await db.insert(schema.trips).values({
      name: 'Greek Isles Adventure 2025',
      slug: 'greek-isles-2025',
      shipName: 'Resilient Lady',
      cruiseLine: 'Virgin Voyages',
      tripType: 'cruise',
      description: 'Discover the magic of the Greek islands on this unforgettable Mediterranean cruise adventure.',
      heroImageUrl: 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1757773819/cruise-app/cruises/cruise-1-greek-isles-adventure_myozen.jpg',
      startDate: new Date('2025-08-21'),
      endDate: new Date('2025-08-31'),
      status: 'upcoming'
    }).returning();

    console.log('✅ Created cruise:', cruise[0].name);

    // Add some itinerary
    await db.insert(schema.itinerary).values([
      {
        cruiseId: cruise[0].id,
        day: 1,
        date: new Date('2025-08-21'),
        portName: 'Athens (Piraeus)',
        country: 'Greece',
        arrivalTime: null,
        departureTime: '18:00',
        description: 'Embark from the historic port of Piraeus and begin your Greek adventure.',
        portImageUrl: 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1757773805/cruise-app/itinerary/athens-greece_rcbjir.png',
        orderIndex: 1
      },
      {
        cruiseId: cruise[0].id,
        day: 2,
        date: new Date('2025-08-22'),
        portName: 'Santorini',
        country: 'Greece',
        arrivalTime: '08:00',
        departureTime: '18:00',
        description: 'Explore the breathtaking cliffs and blue-domed churches of Santorini.',
        portImageUrl: 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1757773792/cruise-app/itinerary/santorini-greece_f3oppm.png',
        orderIndex: 2
      },
      {
        cruiseId: cruise[0].id,
        day: 3,
        date: new Date('2025-08-23'),
        portName: 'Mykonos',
        country: 'Greece',
        arrivalTime: '07:00',
        departureTime: '17:00',
        description: 'Experience the vibrant nightlife and beautiful beaches of Mykonos.',
        portImageUrl: 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1757773795/cruise-app/itinerary/mykonos-greece_r8et22.png',
        orderIndex: 3
      }
    ]);

    // Add some talent
    await db.insert(schema.talent).values([
      {
        name: 'Audra McDonald',
        category: 'Broadway',
        role: 'Headliner',
        knownFor: 'Six-time Tony Award winner',
        bio: 'Audra McDonald is a renowned Broadway performer and six-time Tony Award winner.',
        imageUrl: 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1757773782/cruise-app/talent/talent-1-audra-mcdonald_rjhk78.jpg',
        featured: true
      },
      {
        name: 'Alexis Michelle',
        category: 'Drag',
        role: 'Special Guest',
        knownFor: 'RuPauls Drag Race Season 9',
        bio: 'Producer and drag performer from Brooklyn, known for theatrical performances.',
        imageUrl: 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1757773769/cruise-app/talent/talent-3-alexis-michelle_ycbioo.jpg',
        featured: true
      }
    ]);

    console.log('✅ Database seeded successfully!');
    console.log('🌐 Your app should now show trips at http://localhost:3000');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  }

  process.exit(0);
}

quickSeed();