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

async function updateQueenMaryImage() {
  try {
    console.log('Updating Queen Mary 2 hero image for Transatlantic Crossing...');

    // Use a working Queen Mary 2 image URL that matches your provided image
    // This is a high-quality Queen Mary 2 image from a reliable source
    const queenMaryUrl = 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_1200,h_600,c_fill,g_center,q_auto,f_auto/v1757773863/cruise-app/ships/cunard-queen-mary-2.jpg';

    // Update the Transatlantic Crossing cruise (ID: 6)
    await db.update(cruises)
      .set({ heroImageUrl: queenMaryUrl })
      .where(eq(cruises.id, 6));

    console.log(`✅ Updated Transatlantic Crossing with Queen Mary 2 image: ${queenMaryUrl}`);

    // Verify the update
    const updatedCruise = await db.select().from(cruises).where(eq(cruises.id, 6));
    console.log('\nVerification:');
    console.log(`Transatlantic Crossing new URL: ${updatedCruise[0].heroImageUrl}`);
    console.log(`Cruise name: ${updatedCruise[0].name}`);

  } catch (error) {
    console.error('Error updating Queen Mary 2 image:', error);
  } finally {
    await pool.end();
  }
}

updateQueenMaryImage();