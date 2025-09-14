import fs from 'fs';
import path from 'path';
import { db, cruises, itinerary, events, talent } from './server/storage.js';

async function migrateSimple() {
  try {
    console.log('🚄 Migrating data to Railway PostgreSQL...');

    // Read exported data
    const exportPath = path.join(process.cwd(), 'exports', 'database-export-2025-09-14.json');
    const exportData = JSON.parse(fs.readFileSync(exportPath, 'utf-8'));

    console.log(`📊 Found export data:`);
    console.log(`   - Cruises: ${exportData.cruises.length}`);
    console.log(`   - Itinerary items: ${exportData.itinerary.length}`);
    console.log(`   - Events: ${exportData.events.length}`);
    console.log(`   - Talent: ${exportData.talent.length}`);

    // Import cruises with proper date conversion
    console.log('📦 Importing cruises...');
    for (const cruise of exportData.cruises) {
      const cruiseData = {
        ...cruise,
        startDate: cruise.startDate ? new Date(cruise.startDate) : null,
        endDate: cruise.endDate ? new Date(cruise.endDate) : null,
        createdAt: cruise.createdAt ? new Date(cruise.createdAt) : new Date(),
        updatedAt: cruise.updatedAt ? new Date(cruise.updatedAt) : new Date(),
      };
      await db.insert(cruises).values(cruiseData).onConflictDoNothing();
    }
    console.log('   ✅ Cruises imported');

    // Import talent
    console.log('👥 Importing talent...');
    for (const t of exportData.talent) {
      const talentData = {
        ...t,
        createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
        updatedAt: t.updatedAt ? new Date(t.updatedAt) : new Date(),
      };
      await db.insert(talent).values(talentData).onConflictDoNothing();
    }
    console.log('   ✅ Talent imported');

    // Import itinerary
    console.log('🗺️ Importing itinerary...');
    for (const item of exportData.itinerary) {
      const itineraryData = {
        ...item,
        date: item.date ? new Date(item.date) : null,
        createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
        updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
      };
      await db.insert(itinerary).values(itineraryData).onConflictDoNothing();
    }
    console.log('   ✅ Itinerary imported');

    // Import events
    console.log('🎉 Importing events...');
    for (const event of exportData.events) {
      const eventData = {
        ...event,
        date: event.date ? new Date(event.date) : null,
        createdAt: event.createdAt ? new Date(event.createdAt) : new Date(),
        updatedAt: event.updatedAt ? new Date(event.updatedAt) : new Date(),
      };
      await db.insert(events).values(eventData).onConflictDoNothing();
    }
    console.log('   ✅ Events imported');

    console.log('\n✅ Data migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateSimple();