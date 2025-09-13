import { config } from 'dotenv';
config();

import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

const sqlite = new Database('./dev.db');
const db = drizzle(sqlite);

async function createTables() {
  console.log('🚀 Creating SQLite tables...');

  try {
    // Create tables manually since we don't have SQLite migrations set up
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
        created_at INTEGER DEFAULT (strftime('%s','now')),
        updated_at INTEGER DEFAULT (strftime('%s','now'))
      );

      CREATE TABLE IF NOT EXISTS itinerary (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trip_id INTEGER NOT NULL,
        day INTEGER NOT NULL,
        date TEXT NOT NULL,
        port TEXT NOT NULL,
        country TEXT,
        arrival_time TEXT,
        departure_time TEXT,
        description TEXT,
        image_url TEXT,
        is_sea_day INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s','now')),
        updated_at INTEGER DEFAULT (strftime('%s','now')),
        FOREIGN KEY (trip_id) REFERENCES trips(id)
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
        created_at INTEGER DEFAULT (strftime('%s','now')),
        updated_at INTEGER DEFAULT (strftime('%s','now'))
      );

      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cruiseId INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        eventType TEXT,
        date TEXT,
        startTime TEXT,
        endTime TEXT,
        location TEXT,
        imageUrl TEXT,
        featured BOOLEAN DEFAULT FALSE,
        ticketRequired BOOLEAN DEFAULT FALSE,
        ticketPrice REAL,
        maxCapacity INTEGER,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cruiseId) REFERENCES trips(id)
      );
    `);

    console.log('✅ SQLite tables created successfully!');

  } catch (error) {
    console.error('❌ Table creation failed:', error);
  }

  sqlite.close();
  process.exit(0);
}

createTables();