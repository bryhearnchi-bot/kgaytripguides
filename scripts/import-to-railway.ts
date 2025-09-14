import fs from 'fs';
import path from 'path';
import { db, cruises, itinerary, events, talent } from '../server/storage';

async function importDataToRailway() {
  try {
    console.log('🚄 Importing data to Railway PostgreSQL...');

    // Read exported data
    const exportPath = path.join(process.cwd(), 'exports', 'database-export-2025-09-14.json');

    if (!fs.existsSync(exportPath)) {
      throw new Error(`Export file not found: ${exportPath}`);
    }

    const exportData = JSON.parse(fs.readFileSync(exportPath, 'utf-8'));

    console.log(`📊 Found export data:`);
    console.log(`   - Cruises: ${exportData.cruises.length}`);
    console.log(`   - Itinerary items: ${exportData.itinerary.length}`);
    console.log(`   - Events: ${exportData.events.length}`);
    console.log(`   - Talent: ${exportData.talent.length}`);

    // Clear existing data (be careful!)
    console.log('🗑️ Clearing existing data...');
    await db.delete(events);
    await db.delete(itinerary);
    await db.delete(talent);
    await db.delete(cruises);

    // Import cruises first (parent table)
    console.log('📦 Importing cruises...');
    await db.insert(cruises).values(exportData.cruises);

    // Import talent
    console.log('👥 Importing talent...');
    await db.insert(talent).values(exportData.talent);

    // Import itinerary
    console.log('🗺️ Importing itinerary...');
    await db.insert(itinerary).values(exportData.itinerary);

    // Import events
    console.log('🎉 Importing events...');
    await db.insert(events).values(exportData.events);

    console.log('✅ Data import completed successfully!');
    console.log(`📝 Import summary:`);
    console.log(`   - Cruises: ${exportData.cruises.length} imported`);
    console.log(`   - Itinerary items: ${exportData.itinerary.length} imported`);
    console.log(`   - Events: ${exportData.events.length} imported`);
    console.log(`   - Talent: ${exportData.talent.length} imported`);

  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

// Only run if called directly
if (require.main === module) {
  importDataToRailway();
}

export { importDataToRailway };