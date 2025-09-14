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

async function updateWithNewQueenMary() {
  try {
    console.log('Updating Queen Mary 2 with newly uploaded image...');

    // Use the newly uploaded Queen Mary 2 image
    const newQueenMaryUrl = 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1757884169/cruise-app/ships/cruise-app/ships/queen-mary-2-new.jpg';

    // Update the Transatlantic Crossing cruise (ID: 6)
    await db.update(cruises)
      .set({ heroImageUrl: newQueenMaryUrl })
      .where(eq(cruises.id, 6));

    console.log(`✅ Updated Transatlantic Crossing with new Queen Mary 2 image: ${newQueenMaryUrl}`);

    // Also update the Greek Isles cruise to use Virgin Resilient Lady
    // Since you mentioned using Image #1 for Resilient Lady
    const resilientLadyUrl = 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1757789604/cruise-app/ships/virgin-resilient-lady.jpg';

    await db.update(cruises)
      .set({ heroImageUrl: resilientLadyUrl })
      .where(eq(cruises.id, 1));

    console.log(`✅ Updated Greek Isles with Virgin Resilient Lady image: ${resilientLadyUrl}`);

    // Verify the updates
    const updatedCruises = await db.select().from(cruises).where(eq(cruises.id, 6));
    const greekIsles = await db.select().from(cruises).where(eq(cruises.id, 1));

    console.log('\nVerification:');
    console.log(`${updatedCruises[0].name}: ${updatedCruises[0].heroImageUrl}`);
    console.log(`${greekIsles[0].name}: ${greekIsles[0].heroImageUrl}`);

  } catch (error) {
    console.error('Error updating ship images:', error);
  } finally {
    await pool.end();
  }
}

updateWithNewQueenMary();