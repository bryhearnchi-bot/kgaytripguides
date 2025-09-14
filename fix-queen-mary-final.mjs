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

async function fixQueenMaryFinal() {
  try {
    console.log('Fixing Queen Mary 2 with working Virgin Resilient Lady image...');

    // Use the Virgin Resilient Lady image that we know works
    const workingUrl = 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1757789604/cruise-app/ships/virgin-resilient-lady.jpg';

    // Update the Transatlantic Crossing cruise (ID: 6)
    await db.update(cruises)
      .set({ heroImageUrl: workingUrl })
      .where(eq(cruises.id, 6));

    console.log(`✅ Updated Transatlantic Crossing with working image: ${workingUrl}`);

    // Verify the update
    const updatedCruise = await db.select().from(cruises).where(eq(cruises.id, 6));
    console.log('\nVerification:');
    console.log(`${updatedCruise[0].name}: ${updatedCruise[0].heroImageUrl}`);

  } catch (error) {
    console.error('Error fixing Queen Mary 2 image:', error);
  } finally {
    await pool.end();
  }
}

fixQueenMaryFinal();