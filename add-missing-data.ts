import { config } from 'dotenv';
config();

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './shared/schema';

const queryClient = neon(process.env.DATABASE_URL!);
const db = drizzle(queryClient, { schema });

async function addMissingData() {
  console.log('🚀 Adding missing itinerary and talent data...');

  try {
    // The trip ID is 2 (we saw this from the database check)
    const tripId = 2;

    // Add itinerary data
    await db.insert(schema.itinerary).values([
      {
        cruiseId: tripId,
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
        cruiseId: tripId,
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
        cruiseId: tripId,
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

    console.log('✅ Added itinerary data');

    // Add talent data
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

    console.log('✅ Added talent data');
    console.log('🎯 Missing data added successfully!');

  } catch (error) {
    console.error('❌ Failed to add missing data:', error);
  }

  process.exit(0);
}

addMissingData();