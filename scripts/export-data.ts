import { db, cruises, itinerary, events, talent } from '../server/storage';
import fs from 'fs';
import path from 'path';

async function exportData() {
  try {
    console.log('🔄 Exporting data from Neon database...');

    // Export all tables
    const cruiseData = await db.select().from(cruises);
    const itineraryData = await db.select().from(itinerary);
    const eventData = await db.select().from(events);
    const talentData = await db.select().from(talent);

    console.log(`📊 Found: ${cruiseData.length} cruises, ${itineraryData.length} itinerary items, ${eventData.length} events, ${talentData.length} talent`);

    const exportData = {
      cruises: cruiseData,
      itinerary: itineraryData,
      events: eventData,
      talent: talentData,
      exportedAt: new Date().toISOString(),
      source: 'neon-database'
    };

    // Create exports directory if it doesn't exist
    const exportsDir = path.join(process.cwd(), 'exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    // Write to file
    const filename = `database-export-${new Date().toISOString().split('T')[0]}.json`;
    const filepath = path.join(exportsDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(exportData, null, 2));

    console.log(`✅ Data exported successfully to: ${filepath}`);
    console.log(`📝 Export summary:`);
    console.log(`   - Cruises: ${cruiseData.length}`);
    console.log(`   - Itinerary items: ${itineraryData.length}`);
    console.log(`   - Events: ${eventData.length}`);
    console.log(`   - Talent: ${talentData.length}`);

  } catch (error) {
    console.error('❌ Export failed:', error);
    process.exit(1);
  }
}

exportData();