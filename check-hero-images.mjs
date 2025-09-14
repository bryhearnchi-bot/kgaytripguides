import { drizzle } from 'drizzle-orm/neon-serverless';
import { neonConfig, Pool } from '@neondatabase/serverless';
import { cruises } from './shared/schema.ts';

// Configure Neon
neonConfig.fetchConnectionCache = true;

// Database connection
const connectionString = 'postgresql://neondb_owner:npg_S3acE5NbXIQR@ep-gentle-union-adlq6wol-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new Pool({ connectionString });
const db = drizzle(pool);

async function checkHeroImages() {
  try {
    console.log('Checking current hero images in database...');

    const cruiseEntries = await db.select().from(cruises);

    console.log('\nCurrent hero images:');
    cruiseEntries.forEach(entry => {
      console.log(`\nID: ${entry.id}`);
      console.log(`Name: ${entry.name}`);
      console.log(`Slug: ${entry.slug}`);
      console.log(`Hero Image URL: ${entry.heroImageUrl}`);
      console.log(`---`);
    });

  } catch (error) {
    console.error('Error checking hero images:', error);
  } finally {
    await pool.end();
  }
}

checkHeroImages();