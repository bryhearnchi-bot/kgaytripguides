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
const uploadResults = JSON.parse(fs.readFileSync('./cruise-hero-upload-results.json', 'utf8'));

async function updateCruiseHeroImages() {
  try {
    console.log('Fetching current cruise entries...');

    // Get all cruise entries
    const cruiseEntries = await db.select().from(cruises);

    console.log(`Found ${cruiseEntries.length} cruise entries:`);
    cruiseEntries.forEach(entry => {
      console.log(`- ID: ${entry.id}, Name: ${entry.name}, Current Hero Image: ${entry.heroImageUrl || 'None'}`);
    });

    console.log('\nUpdating with new Cloudinary URLs...');

    // The main cruise we're working with is ID 1 (Greek Isles)
    // Let's update it with the appropriate hero image
    const greekIslesCruise = cruiseEntries.find(cruise =>
      cruise.name.toLowerCase().includes('greek') ||
      cruise.slug?.includes('greek') ||
      cruise.id === 1
    );

    if (greekIslesCruise) {
      console.log(`\nUpdating Greek Isles cruise (ID: ${greekIslesCruise.id})...`);

      // Find the Greek Isles hero image
      const heroImage = uploadResults.find(result =>
        result.filename.includes('greek-isles') && result.success
      );

      if (heroImage) {
        console.log(`Found Greek Isles hero image: ${heroImage.secure_url}`);

        // Update the database
        await db.update(cruises)
          .set({ heroImageUrl: heroImage.secure_url })
          .where(eq(cruises.id, greekIslesCruise.id));

        console.log(`✅ Updated ${greekIslesCruise.name} with new hero image URL`);
      } else {
        console.log(`❌ No Greek Isles hero image found in upload results`);
      }
    } else {
      console.log(`❌ No Greek Isles cruise found in database`);
    }

    // If there are other cruises, we can map them to other hero images
    const otherCruises = cruiseEntries.filter(cruise => cruise.id !== greekIslesCruise?.id);

    if (otherCruises.length > 0) {
      console.log('\nUpdating other cruises with available hero images...');

      const otherHeroImages = uploadResults.filter(result =>
        !result.filename.includes('greek-isles') &&
        !result.filename.includes('1757717') && // Skip generic cruise images
        result.success
      );

      for (let i = 0; i < Math.min(otherCruises.length, otherHeroImages.length); i++) {
        const cruise = otherCruises[i];
        const heroImage = otherHeroImages[i];

        console.log(`Updating ${cruise.name} with ${heroImage.filename}`);

        await db.update(cruises)
          .set({ heroImageUrl: heroImage.secure_url })
          .where(eq(cruises.id, cruise.id));

        console.log(`✅ Updated ${cruise.name} with hero image`);
      }
    }

    console.log('\n=== UPDATE COMPLETE ===');

    // Verify updates
    console.log('\nVerifying updates...');
    const updatedEntries = await db.select().from(cruises);
    updatedEntries.forEach(entry => {
      console.log(`${entry.name}: ${entry.heroImageUrl ? '✅ Has Hero Image' : '❌ No Hero Image'}`);
    });

  } catch (error) {
    console.error('Error updating cruise hero images:', error);
  } finally {
    await pool.end();
  }
}

updateCruiseHeroImages();