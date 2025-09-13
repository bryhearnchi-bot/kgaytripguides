import { config } from 'dotenv';
config();

import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './shared/schema-sqlite';

const sqlite = new Database('./dev.db');
const db = drizzle(sqlite, { schema });

async function initDatabase() {
  console.log('🚀 Initializing SQLite database with proper schema...');

  try {
    // Create tables based on the schema
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS trips (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT,
        short_description TEXT,
        hero_image_url TEXT,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        status TEXT DEFAULT 'upcoming',
        featured INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (unixepoch()),
        updated_at INTEGER DEFAULT (unixepoch())
      );

      CREATE TABLE IF NOT EXISTS itinerary (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trip_id INTEGER,
        day INTEGER NOT NULL,
        date TEXT NOT NULL,
        port TEXT NOT NULL,
        country TEXT,
        arrival_time TEXT,
        departure_time TEXT,
        description TEXT,
        image_url TEXT,
        is_sea_day INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (unixepoch()),
        updated_at INTEGER DEFAULT (unixepoch()),
        FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS talent (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT,
        role TEXT,
        known_for TEXT,
        bio TEXT,
        image_url TEXT,
        social_links TEXT,
        featured INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (unixepoch()),
        updated_at INTEGER DEFAULT (unixepoch())
      );

      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trip_id INTEGER,
        name TEXT NOT NULL,
        description TEXT,
        type TEXT,
        venue TEXT,
        date TEXT NOT NULL,
        start_time TEXT,
        end_time TEXT,
        image_url TEXT,
        featured INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (unixepoch()),
        updated_at INTEGER DEFAULT (unixepoch()),
        FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
      );
    `);

    console.log('✅ SQLite database initialized successfully!');

    // Now seed with data
    const trip = await db.insert(schema.trips).values({
      name: 'Greek Isles Adventure 2025',
      slug: 'greek-isles-2025',
      description: 'Discover the magic of the Greek islands on this unforgettable Mediterranean cruise adventure.',
      shortDescription: 'Greek Isles Mediterranean cruise on Resilient Lady',
      heroImageUrl: 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1757773819/cruise-app/cruises/cruise-1-greek-isles-adventure_myozen.jpg',
      startDate: '2025-08-21',
      endDate: '2025-08-31',
      status: 'upcoming'
    }).returning();

    console.log('✅ Created trip:', trip[0].name);

    // Add itinerary
    await db.insert(schema.itinerary).values([
      {
        tripId: trip[0].id,
        day: 1,
        date: '2025-08-21',
        port: 'Athens (Piraeus)',
        country: 'Greece',
        arrivalTime: null,
        departureTime: '18:00',
        description: 'Embark from the historic port of Piraeus and begin your Greek adventure.',
        imageUrl: 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1757773805/cruise-app/itinerary/athens-greece_rcbjir.png'
      },
      {
        tripId: trip[0].id,
        day: 2,
        date: '2025-08-22',
        port: 'Santorini',
        country: 'Greece',
        arrivalTime: '08:00',
        departureTime: '18:00',
        description: 'Explore the breathtaking cliffs and blue-domed churches of Santorini.',
        imageUrl: 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1757773792/cruise-app/itinerary/santorini-greece_f3oppm.png'
      },
      {
        tripId: trip[0].id,
        day: 3,
        date: '2025-08-23',
        port: 'Mykonos',
        country: 'Greece',
        arrivalTime: '07:00',
        departureTime: '17:00',
        description: 'Experience the vibrant nightlife and beautiful beaches of Mykonos.',
        imageUrl: 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1757773795/cruise-app/itinerary/mykonos-greece_r8et22.png'
      }
    ]);

    console.log('✅ Added itinerary data');

    // Add talent
    await db.insert(schema.talent).values([
      {
        name: 'Audra McDonald',
        category: 'Broadway',
        role: 'Headliner',
        knownFor: 'Six-time Tony Award winner',
        bio: 'Audra McDonald is a renowned Broadway performer and six-time Tony Award winner.',
        imageUrl: 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1757773782/cruise-app/talent/talent-1-audra-mcdonald_rjhk78.jpg',
        featured: 1
      },
      {
        name: 'Alexis Michelle',
        category: 'Drag',
        role: 'Special Guest',
        knownFor: 'RuPauls Drag Race Season 9',
        bio: 'Producer and drag performer from Brooklyn, known for theatrical performances.',
        imageUrl: 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1757773769/cruise-app/talent/talent-3-alexis-michelle_ycbioo.jpg',
        featured: 1
      }
    ]);

    console.log('✅ Added talent data');
    console.log('🌐 Your app should now show complete trip data at http://localhost:3000');

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  }

  sqlite.close();
  process.exit(0);
}

initDatabase();