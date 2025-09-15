import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from 'pg';
import { sql } from 'drizzle-orm';
import { neon } from '@neondatabase/serverless';
import * as schema from './shared/schema.ts';

// Neon (source) connection
const neonConnectionString = 'postgresql://neondb_owner:npg_S3acE5NbXIQR@ep-gentle-union-adlq6wol-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

// Railway (destination) connection
const railwayConnectionString = 'postgresql://postgres:ZMxXTsAbduhdjAQmOtdLiMgUuHTMHDMB@trolley.proxy.rlwy.net:16776/railway';

async function migrateDatabase() {
  console.log('🚀 Starting database migration from Neon to Railway...');

  try {
    // Connect to Neon (source)
    console.log('📡 Connecting to Neon database...');
    const neonClient = neon(neonConnectionString);
    const neonDb = drizzle(neonClient, { schema });

    // Connect to Railway (destination)
    console.log('🚃 Connecting to Railway database...');
    const railwayPool = new Pool({
      connectionString: railwayConnectionString,
      ssl: false
    });

    // Test Railway connection
    const railwayClient = await railwayPool.connect();
    console.log('✅ Railway connection successful');

    // Get all tables from Neon
    console.log('📊 Fetching data from Neon...');

    // Get trips
    const trips = await neonDb.execute(sql`SELECT * FROM trips ORDER BY id`);
    console.log(`Found ${trips.rows.length} trips`);

    // Get itinerary
    const itinerary = await neonDb.execute(sql`SELECT * FROM itinerary ORDER BY id`);
    console.log(`Found ${itinerary.rows.length} itinerary items`);

    // Get events
    const events = await neonDb.execute(sql`SELECT * FROM events ORDER BY id`);
    console.log(`Found ${events.rows.length} events`);

    // Get talent
    const talent = await neonDb.execute(sql`SELECT * FROM talent ORDER BY id`);
    console.log(`Found ${talent.rows.length} talent`);

    // Get settings
    const settings = await neonDb.execute(sql`SELECT * FROM settings ORDER BY id`);
    console.log(`Found ${settings.rows.length} settings`);

    // Get users (if any)
    const users = await neonDb.execute(sql`SELECT * FROM users ORDER BY id`);
    console.log(`Found ${users.rows.length} users`);

    console.log('🔧 Setting up Railway database schema...');

    // Create schema in Railway (you'll need to run drizzle push first)
    console.log('⚠️  Please run: npm run db:push with Railway connection string to create schema');

    // For now, let's save the data to files for manual import
    const exportData = {
      trips: trips.rows,
      itinerary: itinerary.rows,
      events: events.rows,
      talent: talent.rows,
      settings: settings.rows,
      users: users.rows,
      exportDate: new Date().toISOString()
    };

    // Save to file
    import('fs').then(fs => {
      fs.writeFileSync('./railway-migration-data.json', JSON.stringify(exportData, null, 2));
      console.log('💾 Data exported to railway-migration-data.json');
      console.log('📝 Next steps:');
      console.log('1. Update DATABASE_URL in .env to Railway connection string');
      console.log('2. Run: npm run db:push');
      console.log('3. Run the import script to load data');
    });

    railwayClient.release();
    await railwayPool.end();

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

migrateDatabase();