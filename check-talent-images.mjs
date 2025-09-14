import { drizzle } from 'drizzle-orm/neon-serverless';
import { neonConfig, Pool } from '@neondatabase/serverless';
import { talent } from './shared/schema.ts';

// Configure Neon
neonConfig.fetchConnectionCache = true;

// Database connection
const connectionString = 'postgresql://neondb_owner:npg_S3acE5NbXIQR@ep-gentle-union-adlq6wol-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new Pool({ connectionString });
const db = drizzle(pool);

async function checkTalentImages() {
  try {
    console.log('Checking talent images in database...');

    const talentEntries = await db.select().from(talent);

    console.log(`Found ${talentEntries.length} talent entries:`);
    talentEntries.forEach(entry => {
      console.log(`\nID: ${entry.id}`);
      console.log(`Name: ${entry.name}`);
      console.log(`Category: ${entry.category}`);
      console.log(`Profile Image URL: ${entry.profileImageUrl || 'None'}`);
      console.log(`---`);
    });

    // Check for any entries with problematic URLs
    console.log('\nProblematic URLs:');
    talentEntries.forEach(entry => {
      if (entry.profileImageUrl && entry.profileImageUrl.includes('abel_cuv35p')) {
        console.log(`❌ Found problematic URL for ${entry.name}: ${entry.profileImageUrl}`);
      }
      if (entry.profileImageUrl && !entry.profileImageUrl.includes('cloudinary.com')) {
        console.log(`⚠️  Non-Cloudinary URL for ${entry.name}: ${entry.profileImageUrl}`);
      }
    });

  } catch (error) {
    console.error('Error checking talent images:', error);
  } finally {
    await pool.end();
  }
}

checkTalentImages();