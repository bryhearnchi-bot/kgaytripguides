import fs from 'fs';
import path from 'path';
import { db, cruises, itinerary, events, talent } from './server/storage.js';

async function migrateToRailway() {
  try {
    console.log('🚄 Migrating data to Railway PostgreSQL...');

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
    try {
      await db.delete(events);
      console.log('   ✅ Events cleared');
    } catch (e) {
      console.log('   ⚠️ Events table empty or not found');
    }

    try {
      await db.delete(itinerary);
      console.log('   ✅ Itinerary cleared');
    } catch (e) {
      console.log('   ⚠️ Itinerary table empty or not found');
    }

    try {
      await db.delete(talent);
      console.log('   ✅ Talent cleared');
    } catch (e) {
      console.log('   ⚠️ Talent table empty or not found');
    }

    try {
      await db.delete(cruises);
      console.log('   ✅ Cruises cleared');
    } catch (e) {
      console.log('   ⚠️ Cruises table empty or not found');
    }

    // Transform data to handle date/timestamp fields
    const cruiseData = exportData.cruises.map((cruise: any) => ({
      ...cruise,
      createdAt: cruise.createdAt ? new Date(cruise.createdAt) : new Date(),
      updatedAt: cruise.updatedAt ? new Date(cruise.updatedAt) : new Date(),
    }));

    const talentData = exportData.talent.map((t: any) => ({
      ...t,
      createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
      updatedAt: t.updatedAt ? new Date(t.updatedAt) : new Date(),
    }));

    const itineraryData = exportData.itinerary.map((item: any) => ({
      ...item,
      createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
      updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
    }));

    const eventData = exportData.events.map((event: any) => ({
      ...event,
      createdAt: event.createdAt ? new Date(event.createdAt) : new Date(),
      updatedAt: event.updatedAt ? new Date(event.updatedAt) : new Date(),
    }));

    // Import cruises first (parent table)
    console.log('📦 Importing cruises...');
    await db.insert(cruises).values(cruiseData);
    console.log('   ✅ Cruises imported');

    // Import talent
    console.log('👥 Importing talent...');
    await db.insert(talent).values(talentData);
    console.log('   ✅ Talent imported');

    // Import itinerary
    console.log('🗺️ Importing itinerary...');
    await db.insert(itinerary).values(itineraryData);
    console.log('   ✅ Itinerary imported');

    // Import events
    console.log('🎉 Importing events...');
    await db.insert(events).values(eventData);
    console.log('   ✅ Events imported');

    console.log('\n✅ Data migration completed successfully!');
    console.log(`📝 Migration summary:`);
    console.log(`   - Cruises: ${exportData.cruises.length} imported`);
    console.log(`   - Itinerary items: ${exportData.itinerary.length} imported`);
    console.log(`   - Events: ${exportData.events.length} imported`);
    console.log(`   - Talent: ${exportData.talent.length} imported`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateToRailway();