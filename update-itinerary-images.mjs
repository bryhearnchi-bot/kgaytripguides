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
const { itineraryStorage } = await import(resolve(__dirname, 'server/storage.ts'));

// Wait for import to complete
await new Promise(resolve => setTimeout(resolve, 100));

// Read the port upload results
const results = JSON.parse(fs.readFileSync('port-upload-results.json', 'utf8'));

// Mapping from port names to itinerary entries (based on the API data we saw earlier)
const portMapping = {
  'Alexandria (Cairo), Egypt': [20], // day 8 - itinerary id 20
  'Athens, Greece': [13, 14, 24], // pre-cruise, embarkation, disembarkation - ids 13, 14, 24
  'Iraklion, Crete': [23], // day 11 - id 23
  'Istanbul, Turkey': [17, 18], // days 5-6 - ids 17, 18
  'Kuşadası, Turkey': [16], // day 4 - id 16
  'Mykonos, Greece': [22], // day 10 - id 22
  'Santorini, Greece': [15] // day 3 - id 15
};

async function updateItineraryDatabase() {
  console.log('🔄 Starting itinerary database update...\n');

  let updateCount = 0;
  let errorCount = 0;

  for (const result of results) {
    if (!result.success) continue;

    const itineraryIds = portMapping[result.portName];
    if (!itineraryIds) {
      console.log(`⚠️  No itinerary mapping found for ${result.portName}`);
      continue;
    }

    for (const itineraryId of itineraryIds) {
      try {
        console.log(`⬆️  Updating itinerary ID ${itineraryId} (${result.portName})...`);

        await itineraryStorage.updateItineraryStop(itineraryId, {
          portImageUrl: result.url
        });

        console.log(`✅ Updated: ${result.portName} -> ${result.url}`);
        updateCount++;

      } catch (error) {
        console.error(`❌ Error updating itinerary ID ${itineraryId} (${result.portName}):`, error.message);
        errorCount++;
      }
    }
  }

  console.log('\n🎉 Itinerary database update complete!');
  console.log(`✅ Successfully updated: ${updateCount} itinerary entries`);
  if (errorCount > 0) {
    console.log(`❌ Errors: ${errorCount} entries`);
  }
  console.log('\n🔄 Refresh your browser to see the port images in the itinerary!');
}

updateItineraryDatabase().catch(console.error);