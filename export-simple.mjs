import { neon } from '@neondatabase/serverless';
import fs from 'fs';

const neonConnectionString = 'postgresql://neondb_owner:npg_S3acE5NbXIQR@ep-gentle-union-adlq6wol-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function exportNeonData() {
  console.log('🚀 Exporting data from Neon database...');

  try {
    const sql = neon(neonConnectionString);

    console.log('📊 Fetching key data...');

    // Export main tables with literal SQL
    const cruises = await sql`SELECT * FROM cruises`;
    console.log(`✅ ${cruises.length} cruises`);

    const itinerary = await sql`SELECT * FROM itinerary`;
    console.log(`✅ ${itinerary.length} itinerary items`);

    const events = await sql`SELECT * FROM events`;
    console.log(`✅ ${events.length} events`);

    const talent = await sql`SELECT * FROM talent`;
    console.log(`✅ ${talent.length} talent`);

    const settings = await sql`SELECT * FROM settings`;
    console.log(`✅ ${settings.length} settings`);

    const users = await sql`SELECT * FROM users`;
    console.log(`✅ ${users.length} users`);

    // Try additional tables
    let cruise_talent = [];
    let party_templates = [];

    try {
      cruise_talent = await sql`SELECT * FROM cruise_talent`;
      console.log(`✅ ${cruise_talent.length} cruise_talent`);
    } catch (e) {
      console.log('⚠️  cruise_talent table not accessible');
    }

    try {
      party_templates = await sql`SELECT * FROM party_templates`;
      console.log(`✅ ${party_templates.length} party_templates`);
    } catch (e) {
      console.log('⚠️  party_templates table not accessible');
    }

    const exportData = {
      cruises,
      itinerary,
      events,
      talent,
      settings,
      users,
      cruise_talent,
      party_templates,
      exportDate: new Date().toISOString(),
      metadata: {
        source: 'Neon PostgreSQL',
        destination: 'Railway PostgreSQL',
        exportedAt: new Date().toISOString()
      }
    };

    // Save to file
    fs.writeFileSync('./neon-data-export.json', JSON.stringify(exportData, null, 2));
    console.log('💾 Data exported to neon-data-export.json');

    console.log('\n📊 Export Summary:');
    console.log(`  Cruises: ${cruises.length}`);
    console.log(`  Itinerary: ${itinerary.length}`);
    console.log(`  Events: ${events.length}`);
    console.log(`  Talent: ${talent.length}`);
    console.log(`  Settings: ${settings.length}`);
    console.log(`  Users: ${users.length}`);
    console.log(`  Cruise-Talent: ${cruise_talent.length}`);
    console.log(`  Party Templates: ${party_templates.length}`);

    console.log('\n🎉 Export complete! Next steps:');
    console.log('1. Update DATABASE_URL in .env to Railway connection');
    console.log('2. Run: npm run db:push');
    console.log('3. Import the data into Railway');

  } catch (error) {
    console.error('❌ Export failed:', error);
  }
}

exportNeonData();