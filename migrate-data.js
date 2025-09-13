import { neon } from '@neondatabase/serverless';

// Source: Replit development database (with all your data)
const sourceUrl = 'postgresql://neondb_owner:npg_ZuHmt2bOKFy3@ep-round-sun-ae5ux0vo.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';

// Target: New development database (currently empty)
const targetUrl = 'postgresql://neondb_owner:npg_S3acE5NbXIQR@ep-bold-wave-adnvwxha-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require';

const sourceDb = neon(sourceUrl);
const targetDb = neon(targetUrl);

async function migrateData() {
  try {
    console.log('🚀 Starting data migration from Replit database...\n');

    // First, let's see what's in the source database
    console.log('📊 Inspecting source database (Replit)...');

    const sourceTables = await sourceDb`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    console.log(`Found ${sourceTables.length} tables in source database:`);
    sourceTables.forEach(table => console.log(`  - ${table.table_name}`));

    // Check data counts in source
    console.log('\n📈 Source database row counts:');
    for (const table of sourceTables) {
      try {
        const count = await sourceDb`SELECT COUNT(*) as count FROM ${sourceDb(table.table_name)}`;
        console.log(`  - ${table.table_name}: ${count[0].count} rows`);
      } catch (err) {
        console.log(`  - ${table.table_name}: Error counting (${err.message})`);
      }
    }

    // Show sample cruises from source
    console.log('\n🚢 Sample cruises from source database:');
    const sourceCruises = await sourceDb`SELECT id, name, slug FROM cruises LIMIT 10`;
    sourceCruises.forEach((cruise, i) => {
      console.log(`  ${i+1}. ${cruise.name} (${cruise.slug}) - ID: ${cruise.id}`);
    });

    console.log('\n🎯 Ready to migrate data. Continue? (This will clear target database first)');

    // Clear target database tables in correct order (respecting foreign keys)
    console.log('\n🗑️ Clearing target database...');

    const clearOrder = [
      'user_cruises',
      'cruise_talent',
      'ai_drafts',
      'ai_jobs',
      'trip_info_sections',
      'events',
      'itinerary',
      'cruises',
      'talent',
      'media',
      'party_templates',
      'password_reset_tokens',
      'users',
      'settings',
      'audit_log'
    ];

    for (const tableName of clearOrder) {
      try {
        await targetDb`DELETE FROM ${targetDb(tableName)}`;
        console.log(`  ✅ Cleared ${tableName}`);
      } catch (err) {
        console.log(`  ⚠️ ${tableName}: ${err.message}`);
      }
    }

    // Now migrate data in dependency order
    console.log('\n📋 Migrating data...');

    // 1. Users first (if any)
    try {
      const users = await sourceDb`SELECT * FROM users`;
      if (users.length > 0) {
        for (const user of users) {
          await targetDb`
            INSERT INTO users (id, username, password, email, full_name, role, created_at, updated_at, last_login, is_active)
            VALUES (${user.id}, ${user.username}, ${user.password}, ${user.email}, ${user.full_name}, ${user.role}, ${user.created_at}, ${user.updated_at}, ${user.last_login}, ${user.is_active})
          `;
        }
        console.log(`  ✅ Migrated ${users.length} users`);
      }
    } catch (err) {
      console.log(`  ⚠️ Users: ${err.message}`);
    }

    // 2. Settings
    try {
      const settings = await sourceDb`SELECT * FROM settings`;
      if (settings.length > 0) {
        for (const setting of settings) {
          await targetDb`
            INSERT INTO settings (category, key, label, value, metadata, is_active, order_index, created_by, created_at, updated_at)
            VALUES (${setting.category}, ${setting.key}, ${setting.label}, ${setting.value}, ${setting.metadata}, ${setting.is_active}, ${setting.order_index}, ${setting.created_by}, ${setting.created_at}, ${setting.updated_at})
          `;
        }
        console.log(`  ✅ Migrated ${settings.length} settings`);
      }
    } catch (err) {
      console.log(`  ⚠️ Settings: ${err.message}`);
    }

    // 3. Cruises
    const cruises = await sourceDb`SELECT * FROM cruises ORDER BY id`;
    for (const cruise of cruises) {
      await targetDb`
        INSERT INTO cruises (id, name, slug, ship_name, cruise_line, trip_type, start_date, end_date, status, hero_image_url, description, highlights, includes_info, pricing, created_by, created_at, updated_at)
        VALUES (${cruise.id}, ${cruise.name}, ${cruise.slug}, ${cruise.ship_name}, ${cruise.cruise_line}, ${cruise.trip_type}, ${cruise.start_date}, ${cruise.end_date}, ${cruise.status}, ${cruise.hero_image_url}, ${cruise.description}, ${cruise.highlights}, ${cruise.includes_info}, ${cruise.pricing}, ${cruise.created_by}, ${cruise.created_at}, ${cruise.updated_at})
      `;
    }
    console.log(`  ✅ Migrated ${cruises.length} cruises`);

    // 4. Talent
    const talent = await sourceDb`SELECT * FROM talent ORDER BY id`;
    for (const t of talent) {
      await targetDb`
        INSERT INTO talent (id, name, category, bio, known_for, profile_image_url, social_links, website, created_at, updated_at)
        VALUES (${t.id}, ${t.name}, ${t.category}, ${t.bio}, ${t.known_for}, ${t.profile_image_url}, ${t.social_links}, ${t.website}, ${t.created_at}, ${t.updated_at})
      `;
    }
    console.log(`  ✅ Migrated ${talent.length} talent`);

    // 5. Itinerary
    const itinerary = await sourceDb`SELECT * FROM itinerary ORDER BY cruise_id, order_index`;
    for (const stop of itinerary) {
      await targetDb`
        INSERT INTO itinerary (id, cruise_id, date, day, port_name, country, arrival_time, departure_time, all_aboard_time, port_image_url, description, highlights, order_index, segment)
        VALUES (${stop.id}, ${stop.cruise_id}, ${stop.date}, ${stop.day}, ${stop.port_name}, ${stop.country}, ${stop.arrival_time}, ${stop.departure_time}, ${stop.all_aboard_time}, ${stop.port_image_url}, ${stop.description}, ${stop.highlights}, ${stop.order_index}, ${stop.segment})
      `;
    }
    console.log(`  ✅ Migrated ${itinerary.length} itinerary stops`);

    // 6. Events
    const events = await sourceDb`SELECT * FROM events ORDER BY cruise_id, date, time`;
    for (const event of events) {
      await targetDb`
        INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at)
        VALUES (${event.id}, ${event.cruise_id}, ${event.date}, ${event.time}, ${event.title}, ${event.type}, ${event.venue}, ${event.deck}, ${event.description}, ${event.short_description}, ${event.image_url}, ${event.theme_description}, ${event.dress_code}, ${event.capacity}, ${event.requires_reservation}, ${event.talent_ids}, ${event.created_at}, ${event.updated_at})
      `;
    }
    console.log(`  ✅ Migrated ${events.length} events`);

    // 7. Cruise-Talent relationships
    try {
      const cruiseTalent = await sourceDb`SELECT * FROM cruise_talent`;
      for (const ct of cruiseTalent) {
        await targetDb`
          INSERT INTO cruise_talent (cruise_id, talent_id, role, performance_count, notes, created_at)
          VALUES (${ct.cruise_id}, ${ct.talent_id}, ${ct.role}, ${ct.performance_count}, ${ct.notes}, ${ct.created_at})
        `;
      }
      console.log(`  ✅ Migrated ${cruiseTalent.length} cruise-talent relationships`);
    } catch (err) {
      console.log(`  ⚠️ Cruise-Talent: ${err.message}`);
    }

    // 8. Media
    try {
      const media = await sourceDb`SELECT * FROM media`;
      for (const m of media) {
        await targetDb`
          INSERT INTO media (id, url, thumbnail_url, type, associated_type, associated_id, caption, alt_text, credits, uploaded_by, uploaded_at, metadata)
          VALUES (${m.id}, ${m.url}, ${m.thumbnail_url}, ${m.type}, ${m.associated_type}, ${m.associated_id}, ${m.caption}, ${m.alt_text}, ${m.credits}, ${m.uploaded_by}, ${m.uploaded_at}, ${m.metadata})
        `;
      }
      console.log(`  ✅ Migrated ${media.length} media items`);
    } catch (err) {
      console.log(`  ⚠️ Media: ${err.message}`);
    }

    console.log('\n🎉 Migration completed successfully!');

    // Verify migration
    console.log('\n✅ Verification - Target database row counts:');
    const targetCruises = await targetDb`SELECT COUNT(*) as count FROM cruises`;
    const targetItinerary = await targetDb`SELECT COUNT(*) as count FROM itinerary`;
    const targetEvents = await targetDb`SELECT COUNT(*) as count FROM events`;
    const targetTalent = await targetDb`SELECT COUNT(*) as count FROM talent`;

    console.log(`  - Cruises: ${targetCruises[0].count}`);
    console.log(`  - Itinerary: ${targetItinerary[0].count}`);
    console.log(`  - Events: ${targetEvents[0].count}`);
    console.log(`  - Talent: ${targetTalent[0].count}`);

    // Show migrated cruises
    console.log('\n🚢 Migrated cruises in target database:');
    const migratedCruises = await targetDb`SELECT id, name, slug FROM cruises ORDER BY id LIMIT 10`;
    migratedCruises.forEach((cruise, i) => {
      console.log(`  ${i+1}. ${cruise.name} (${cruise.slug}) - ID: ${cruise.id}`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

migrateData();