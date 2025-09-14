import { drizzle } from 'drizzle-orm/neon-serverless';
import { neonConfig, Pool } from '@neondatabase/serverless';
import { talent } from './shared/schema.ts';
import { eq } from 'drizzle-orm';

// Configure Neon
neonConfig.fetchConnectionCache = true;

// Database connection
const connectionString = 'postgresql://neondb_owner:npg_S3acE5NbXIQR@ep-gentle-union-adlq6wol-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new Pool({ connectionString });
const db = drizzle(pool);

async function fixAbelImage() {
  try {
    console.log('Fixing Abel\'s profile image URL...');

    // Update Abel's profile image URL to match the pattern of other talent
    const correctUrl = 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_400,h_400,c_fill,g_face,q_auto,f_auto/v1757789604/cruise-app/talent/abel.jpg';

    await db.update(talent)
      .set({ profileImageUrl: correctUrl })
      .where(eq(talent.id, 16));

    console.log(`✅ Updated Abel's image URL to: ${correctUrl}`);

    // Verify the update
    const updatedAbel = await db.select().from(talent).where(eq(talent.id, 16));
    console.log('\nVerification:');
    console.log(`Abel's new URL: ${updatedAbel[0].profileImageUrl}`);

  } catch (error) {
    console.error('Error fixing Abel\'s image:', error);
  } finally {
    await pool.end();
  }
}

fixAbelImage();