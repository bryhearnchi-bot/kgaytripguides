import { config } from 'dotenv';
config();

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './shared/schema';

const queryClient = neon(process.env.DATABASE_URL!);
const db = drizzle(queryClient, { schema });

async function checkDatabase() {
  console.log('🔍 Checking database contents...');

  try {
    // Check trips
    const trips = await db.select().from(schema.trips);
    console.log('📝 Trips:', trips);

    // Check itinerary
    const itinerary = await db.select().from(schema.itinerary);
    console.log('🗺️  Itinerary:', itinerary);

    // Check talent
    const talent = await db.select().from(schema.talent);
    console.log('🎭 Talent:', talent);

  } catch (error) {
    console.error('❌ Database check failed:', error);
  }

  process.exit(0);
}

checkDatabase();