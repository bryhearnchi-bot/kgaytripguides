import { drizzle } from 'drizzle-orm/node-postgres';
import { pool } from './db.js';
import { amenities, venues } from './schema.js';

async function seedTestData() {
  const db = drizzle(pool);

  console.log('Adding test data to database...');

  try {
    // Add test amenities
    const testAmenities = [];
    for (let i = 1; i <= 20; i++) {
      testAmenities.push({
        name: `Test Amenity ${i}`,
        description: `Test amenity description ${i} for scrollbar testing`
      });
    }

    // Add test venues
    const testVenues = [];
    for (let i = 1; i <= 20; i++) {
      testVenues.push({
        name: `Test Venue ${i}`,
        description: `Test venue description ${i} for scrollbar testing`
      });
    }

    // Insert amenities
    console.log('Inserting test amenities...');
    await db.insert(amenities).values(testAmenities).onConflictDoNothing();

    // Insert venues
    console.log('Inserting test venues...');
    await db.insert(venues).values(testVenues).onConflictDoNothing();

    console.log('Test data added successfully!');
    console.log('You can now test the MultiSelectWithCreate component with real database data.');

  } catch (error) {
    console.error('Error adding test data:', error);
  } finally {
    await pool.end();
  }
}

seedTestData();