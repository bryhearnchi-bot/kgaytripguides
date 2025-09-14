import { drizzle } from 'drizzle-orm/neon-serverless';
import { neonConfig, Pool } from '@neondatabase/serverless';
import { cruises } from './shared/schema.ts';
import { eq } from 'drizzle-orm';

// Configure Neon
neonConfig.fetchConnectionCache = true;

// Database connection
const connectionString = 'postgresql://neondb_owner:npg_S3acE5NbXIQR@ep-gentle-union-adlq6wol-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new Pool({ connectionString });
const db = drizzle(pool);

async function fixQueenMaryImage() {
  try {
    console.log('Fixing Queen Mary 2 hero image with working URL...');

    // Use a working ship image as placeholder for now
    // This matches the format of the other working ship images
    const workingQueenMaryUrl = 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_1200,h_600,c_fill,g_center,q_auto,f_auto/v1757789604/cruise-app/ships/virgin-resilient-lady.jpg';

    // Update the Transatlantic Crossing cruise (ID: 6)
    await db.update(cruises)
      .set({ heroImageUrl: workingQueenMaryUrl })
      .where(eq(cruises.id, 6));

    console.log(`✅ Updated Transatlantic Crossing with working ship image: ${workingQueenMaryUrl}`);
    console.log('Note: This is a placeholder until the Queen Mary 2 image is properly uploaded to Cloudinary');

    // Verify the update
    const updatedCruise = await db.select().from(cruises).where(eq(cruises.id, 6));
    console.log('\nVerification:');
    console.log(`Transatlantic Crossing new URL: ${updatedCruise[0].heroImageUrl}`);

  } catch (error) {
    console.error('Error fixing Queen Mary 2 image:', error);
  } finally {
    await pool.end();
  }
}

fixQueenMaryImage();