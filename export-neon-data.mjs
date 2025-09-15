import { neon } from '@neondatabase/serverless';
import fs from 'fs';

// Neon connection
const neonConnectionString = 'postgresql://neondb_owner:npg_S3acE5NbXIQR@ep-gentle-union-adlq6wol-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function exportNeonData() {
  console.log('🚀 Exporting data from Neon database...');

  try {
    const sql = neon(neonConnectionString);

    console.log('📊 Fetching all data...');

    // Get all data
    const [trips, itinerary, events, talent, settings, users] = await Promise.all([
      sql`SELECT * FROM trips ORDER BY id`,
      sql`SELECT * FROM itinerary ORDER BY id`,
      sql`SELECT * FROM events ORDER BY id`,
      sql`SELECT * FROM talent ORDER BY id`,
      sql`SELECT * FROM settings ORDER BY id`,
      sql`SELECT * FROM users ORDER BY id`
    ]);

    console.log(`✅ Found ${trips.length} trips`);
    console.log(`✅ Found ${itinerary.length} itinerary items`);
    console.log(`✅ Found ${events.length} events`);
    console.log(`✅ Found ${talent.length} talent`);
    console.log(`✅ Found ${settings.length} settings`);
    console.log(`✅ Found ${users.length} users`);

    const exportData = {
      trips,
      itinerary,
      events,
      talent,
      settings,
      users,
      exportDate: new Date().toISOString()
    };

    // Save to file
    fs.writeFileSync('./neon-export.json', JSON.stringify(exportData, null, 2));
    console.log('💾 Data exported to neon-export.json');
    console.log('📝 Data export complete!');

  } catch (error) {
    console.error('❌ Export failed:', error);
  }
}

exportNeonData();