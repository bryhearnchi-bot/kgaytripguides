import { drizzle } from 'drizzle-orm/neon-serverless';
import { neonConfig, Pool } from '@neondatabase/serverless';
import { cruises } from './shared/schema.ts';

// Configure Neon
neonConfig.fetchConnectionCache = true;

// Database connection
const connectionString = 'postgresql://neondb_owner:npg_S3acE5NbXIQR@ep-gentle-union-adlq6wol-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new Pool({ connectionString });
const db = drizzle(pool);

async function getShipNames() {
  try {
    console.log('Fetching cruise ship names...');

    // Get all cruise entries
    const cruiseEntries = await db.select().from(cruises);

    console.log(`Found ${cruiseEntries.length} cruise entries with ship names:`);
    cruiseEntries.forEach(entry => {
      console.log(`- ID: ${entry.id}, Name: ${entry.name}, Ship: ${entry.shipName || 'No Ship Name'}`);
    });

    // Filter out Greek Isles cruise (keep as is) and focus on others
    const otherCruises = cruiseEntries.filter(cruise => cruise.id !== 1);

    console.log('\nCruises to update with ship images (excluding Greek Isles):');
    otherCruises.forEach(entry => {
      console.log(`- ${entry.name}: ${entry.shipName || 'No Ship Name'}`);
    });

    return otherCruises;

  } catch (error) {
    console.error('Error fetching ship names:', error);
  } finally {
    await pool.end();
  }
}

getShipNames();