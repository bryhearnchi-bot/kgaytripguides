import { drizzle } from 'drizzle-orm/neon-serverless';
import { neonConfig, Pool } from '@neondatabase/serverless';
import { cruises } from './shared/schema.ts';
import { eq } from 'drizzle-orm';
import fs from 'fs';

// Configure Neon
neonConfig.fetchConnectionCache = true;

// Database connection
const connectionString = 'postgresql://neondb_owner:npg_S3acE5NbXIQR@ep-gentle-union-adlq6wol-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new Pool({ connectionString });
const db = drizzle(pool);

// Load upload results
const uploadResults = JSON.parse(fs.readFileSync('./ship-hero-upload-results.json', 'utf8'));

// Mapping of cruise names to database IDs (excluding Greek Isles ID 1)
const cruiseMapping = {
  'Mediterranean Dreams': 2,      // Celebrity Apex
  'Caribbean Paradise': 3,        // Harmony of the Seas
  'Baltic Capitals Explorer': 4,  // Viking Star
  'Alaska Inside Passage': 5,     // Norwegian Bliss
  'Transatlantic Crossing': 6     // Queen Mary 2 (will add later)
};

async function updateShipHeroImages() {
  try {
    console.log('Updating cruise hero images with ship photos...');
    console.log('(Keeping Greek Isles Atlantis Cruise as is)');

    for (const result of uploadResults) {
      if (result.success) {
        const cruiseId = cruiseMapping[result.cruiseName];

        if (cruiseId) {
          console.log(`\nUpdating ${result.cruiseName} (ID: ${cruiseId}) with ${result.shipName} image...`);

          // Update the database
          await db.update(cruises)
            .set({ heroImageUrl: result.secure_url })
            .where(eq(cruises.id, cruiseId));

          console.log(`✅ Updated ${result.cruiseName} with ship image: ${result.secure_url}`);
        } else {
          console.log(`❌ No cruise ID found for: ${result.cruiseName}`);
        }
      } else {
        console.log(`❌ Skipping failed upload: ${result.cruiseName}`);
      }
    }

    console.log('\n=== UPDATE COMPLETE ===');

    // Verify updates
    console.log('\nVerifying updates...');
    const updatedEntries = await db.select().from(cruises);
    updatedEntries.forEach(entry => {
      if (entry.id === 1) {
        console.log(`${entry.name}: ✅ Keeping original Greek Isles image`);
      } else {
        console.log(`${entry.name}: ${entry.heroImageUrl ? '✅ Updated with ship image' : '❌ No image'}`);
      }
    });

  } catch (error) {
    console.error('Error updating cruise hero images:', error);
  } finally {
    await pool.end();
  }
}

updateShipHeroImages();