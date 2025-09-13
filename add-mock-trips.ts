import { config } from 'dotenv';
config();

import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './shared/schema-sqlite';

const sqlite = new Database('./dev.db');
const db = drizzle(sqlite, { schema });

async function addMockTrips() {
  console.log('🚀 Adding mock trips to database...');

  try {
    // Add more sample trips
    const trips = await db.insert(schema.trips).values([
      {
        name: 'Caribbean Paradise 2025',
        slug: 'caribbean-paradise-2025',
        description: 'Island hop through the crystal-clear waters of the Caribbean with stops at exotic ports.',
        shortDescription: 'Caribbean cruise with exotic island stops',
        heroImageUrl: 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1757773820/cruise-app/cruises/caribbean-cruise-hero.jpg',
        startDate: '2025-11-15',
        endDate: '2025-11-22',
        status: 'upcoming',
        featured: 1
      },
      {
        name: 'Mediterranean Magic 2025',
        slug: 'mediterranean-magic-2025',
        description: 'Explore ancient cultures and stunning coastlines across the Mediterranean Sea.',
        shortDescription: 'Mediterranean cultural cruise experience',
        heroImageUrl: 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1757773821/cruise-app/cruises/mediterranean-cruise-hero.jpg',
        startDate: '2025-09-10',
        endDate: '2025-09-17',
        status: 'upcoming'
      },
      {
        name: 'Baltic Adventures 2025',
        slug: 'baltic-adventures-2025',
        description: 'Discover the rich history and stunning architecture of Northern Europe.',
        shortDescription: 'Northern European capitals and culture',
        heroImageUrl: 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1757773822/cruise-app/cruises/baltic-cruise-hero.jpg',
        startDate: '2025-06-01',
        endDate: '2025-06-10',
        status: 'upcoming'
      }
    ]).returning();

    console.log('✅ Added', trips.length, 'mock trips');

    // Add some itinerary for the first mock trip
    await db.insert(schema.itinerary).values([
      {
        tripId: trips[0].id,
        day: 1,
        date: '2025-11-15',
        port: 'Fort Lauderdale',
        country: 'United States',
        arrivalTime: null,
        departureTime: '17:00',
        description: 'Board your Caribbean adventure from the Venice of America.',
        imageUrl: 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1757773823/cruise-app/itinerary/fort-lauderdale.jpg'
      },
      {
        tripId: trips[0].id,
        day: 2,
        date: '2025-11-16',
        port: 'Nassau',
        country: 'Bahamas',
        arrivalTime: '09:00',
        departureTime: '18:00',
        description: 'Explore the vibrant capital of the Bahamas with pristine beaches and duty-free shopping.',
        imageUrl: 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1757773824/cruise-app/itinerary/nassau-bahamas.jpg'
      }
    ]);

    console.log('✅ Added itinerary for Caribbean trip');
    console.log('🌐 Your app should now show', trips.length + 1, 'total trips at http://localhost:3000');

  } catch (error) {
    console.error('❌ Adding mock trips failed:', error);
  }

  sqlite.close();
  process.exit(0);
}

addMockTrips();