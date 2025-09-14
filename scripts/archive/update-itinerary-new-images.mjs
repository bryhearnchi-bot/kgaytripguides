import { drizzle } from 'drizzle-orm/neon-serverless';
import { neonConfig, Pool } from '@neondatabase/serverless';
import { itinerary } from './shared/schema.ts';
import { eq } from 'drizzle-orm';
import fs from 'fs';

// Configure Neon
neonConfig.fetchConnectionCache = true;

// Database connection
const connectionString = 'postgresql://neondb_owner:npg_S3acE5NbXIQR@ep-gentle-union-adlq6wol-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new Pool({ connectionString });
const db = drizzle(pool);

// Load upload results
const uploadResults = JSON.parse(fs.readFileSync('./itinerary-upload-results.json', 'utf8'));

// Mapping of port names to image filenames (without extensions)
const portImageMap = {
  'athens': 'athens-greece-port-scenic-0bfb845f',
  'santorini': 'santorini-greece-cruise-port-ed3e2e0a',
  'kuşadası': 'kusadasi-turkey-port-scenic-cf0f15d9',
  'istanbul': 'istanbul-turkey-cruise-port-e82f2c8b',
  'alexandria': 'alexandria-egypt-cruise-port-764a37c8',
  'mykonos': 'mykonos-greece-cruise-port-ae350664',
  'iraklion': 'iraklion-crete-cruise-port-faa24cff',
  'heraklion': 'iraklion-crete-cruise-port-faa24cff', // Alternative spelling
  'crete': 'iraklion-crete-cruise-port-faa24cff'
};

async function updateItineraryImages() {
  try {
    console.log('Fetching current itinerary entries...');

    // Get all itinerary entries
    const itineraryEntries = await db.select().from(itinerary);

    console.log(`Found ${itineraryEntries.length} itinerary entries:`);
    itineraryEntries.forEach(entry => {
      console.log(`- ID: ${entry.id}, Port: ${entry.portName}, Current Image: ${entry.portImageUrl || 'None'}`);
    });

    console.log('\nUpdating with new Cloudinary URLs...');

    for (const entry of itineraryEntries) {
      const portName = entry.portName.toLowerCase();
      console.log(`\nProcessing: ${entry.portName} (ID: ${entry.id})`);

      // Find matching image by checking if port name contains any key
      let imageFilename = null;
      for (const [portKey, filename] of Object.entries(portImageMap)) {
        if (portName.includes(portKey)) {
          imageFilename = filename;
          break;
        }
      }

      if (imageFilename) {
        // Find the corresponding upload result
        const uploadResult = uploadResults.find(result =>
          result.filename.toLowerCase().includes(imageFilename.split('-')[0])
        );

        if (uploadResult && uploadResult.success) {
          console.log(`Found matching image: ${uploadResult.secure_url}`);

          // Update the database
          await db.update(itinerary)
            .set({ portImageUrl: uploadResult.secure_url })
            .where(eq(itinerary.id, entry.id));

          console.log(`✅ Updated ${entry.portName} with new image URL`);
        } else {
          console.log(`❌ No upload result found for ${imageFilename}`);
        }
      } else {
        console.log(`❌ No image mapping found for port: ${entry.portName}`);
      }
    }

    console.log('\n=== UPDATE COMPLETE ===');

    // Verify updates
    console.log('\nVerifying updates...');
    const updatedEntries = await db.select().from(itinerary);
    updatedEntries.forEach(entry => {
      console.log(`${entry.portName}: ${entry.portImageUrl ? '✅ Has Image' : '❌ No Image'}`);
    });

  } catch (error) {
    console.error('Error updating itinerary images:', error);
  } finally {
    await pool.end();
  }
}

updateItineraryImages();