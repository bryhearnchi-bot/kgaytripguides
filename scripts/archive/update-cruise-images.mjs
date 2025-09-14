import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { config } from 'dotenv';

// Load environment variables
config();

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import from the server
const { tripStorage } = await import(resolve(__dirname, 'server/storage.ts'));

// Wait for import to complete
await new Promise(resolve => setTimeout(resolve, 100));

// Read the ship upload results
const shipResults = JSON.parse(fs.readFileSync('ship-upload-results.json', 'utf8'));

// Mapping from ship names to Cloudinary URLs
const shipImageMap = {};
shipResults.forEach(ship => {
  if (ship.success) {
    shipImageMap[ship.shipName] = ship.url;
  }
});

// Mapping from cruise ship names to Cloudinary URLs (based on actual database names)
const cruiseShipMapping = {
  'Caribbean Paradise': 'Virgin Scarlet Lady',
  'Mediterranean Dreams': 'Virgin Valiant Lady',
  'Alaska Inside Passage': 'Virgin Voyages Explorer',
  'Transatlantic Crossing': 'Virgin Resilient Lady',
  'Baltic Capitals Explorer': 'Virgin Valiant Lady'
};

async function updateCruiseDatabase() {
  console.log('🔄 Starting cruise database update...\n');

  // Get all trips from the database
  const allTrips = await tripStorage.getAllTrips();
  console.log(`Found ${allTrips.length} trips in database`);

  let updateCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  for (const trip of allTrips) {
    // Skip the Greek Isles cruise (it's working correctly)
    if (trip.slug === 'greek-isles-2025' || trip.name.includes('Greek Isles')) {
      console.log(`⏭️  Skipping: ${trip.name} (Greek Isles - already working)`);
      skippedCount++;
      continue;
    }

    // Find the ship mapping for this cruise
    const shipName = cruiseShipMapping[trip.name];
    if (!shipName) {
      console.log(`⚠️  No ship mapping found for cruise: ${trip.name}`);
      continue;
    }

    const newImageUrl = shipImageMap[shipName];
    if (!newImageUrl) {
      console.log(`⚠️  No Cloudinary URL found for ship: ${shipName}`);
      continue;
    }

    try {
      console.log(`⬆️  Updating ${trip.name} (${shipName})...`);

      await tripStorage.updateTrip(trip.id, {
        heroImageUrl: newImageUrl
      });

      console.log(`✅ Updated: ${trip.name} -> ${newImageUrl}`);
      updateCount++;

    } catch (error) {
      console.error(`❌ Error updating ${trip.name}:`, error.message);
      errorCount++;
    }
  }

  console.log('\n🎉 Cruise database update complete!');
  console.log(`✅ Successfully updated: ${updateCount} cruises`);
  console.log(`⏭️  Skipped (Greek Isles): ${skippedCount} cruises`);
  if (errorCount > 0) {
    console.log(`❌ Errors: ${errorCount} cruises`);
  }
  console.log('\n🔄 Refresh your browser to see the new cruise ship images!');

  // Show summary of what was updated
  if (updateCount > 0) {
    console.log('\n📋 Updated cruises:');
    for (const [cruiseName, shipName] of Object.entries(cruiseShipMapping)) {
      if (shipImageMap[shipName]) {
        console.log(`${cruiseName} -> ${shipName}`);
      }
    }
  }
}

updateCruiseDatabase().catch(console.error);