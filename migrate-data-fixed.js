import { neon } from '@neondatabase/serverless';

// Source: Replit development database (with all your data)
const sourceUrl = 'postgresql://neondb_owner:npg_ZuHmt2bOKFy3@ep-round-sun-ae5ux0vo.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';

// Target: New development database (currently empty)
const targetUrl = 'postgresql://neondb_owner:npg_S3acE5NbXIQR@ep-bold-wave-adnvwxha-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require';

const sourceDb = neon(sourceUrl);
const targetDb = neon(targetUrl);

function safeJsonParse(value) {
  if (!value) return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch (err) {
    console.log(`  ⚠️ Invalid JSON, setting to null: ${value.substring(0, 50)}...`);
    return null;
  }
}

async function migrateData() {
  try {
    console.log('🚀 Starting enhanced data migration from Replit database...\n');

    // Clear target database first
    console.log('🗑️ Clearing target database...');

    const clearCommands = [
      'DELETE FROM user_cruises',
      'DELETE FROM cruise_talent',
      'DELETE FROM ai_drafts',
      'DELETE FROM ai_jobs',
      'DELETE FROM trip_info_sections',
      'DELETE FROM events',
      'DELETE FROM itinerary',
      'DELETE FROM cruises',
      'DELETE FROM talent',
      'DELETE FROM media',
      'DELETE FROM party_templates',
      'DELETE FROM password_reset_tokens',
      'DELETE FROM users',
      'DELETE FROM settings',
      'DELETE FROM audit_log'
    ];

    for (const cmd of clearCommands) {
      try {
        await targetDb.unsafe(cmd);
        console.log(`  ✅ ${cmd.split(' ')[2]}`);
      } catch (err) {
        console.log(`  ⚠️ ${cmd.split(' ')[2]}: ${err.message}`);
      }
    }

    console.log('\n📋 Migrating data with JSON handling...');

    // 1. Users
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
          const metadata = safeJsonParse(setting.metadata);
          await targetDb`
            INSERT INTO settings (category, key, label, value, metadata, is_active, order_index, created_by, created_at, updated_at)
            VALUES (${setting.category}, ${setting.key}, ${setting.label}, ${setting.value}, ${JSON.stringify(metadata)}, ${setting.is_active}, ${setting.order_index}, ${setting.created_by}, ${setting.created_at}, ${setting.updated_at})
          `;
        }
        console.log(`  ✅ Migrated ${settings.length} settings`);
      }
    } catch (err) {
      console.log(`  ⚠️ Settings: ${err.message}`);
    }

    // 3. Cruises (with careful JSON handling)
    const cruises = await sourceDb`SELECT * FROM cruises ORDER BY id`;
    let cruiseCount = 0;
    for (const cruise of cruises) {
      try {
        const highlights = safeJsonParse(cruise.highlights);
        const includesInfo = safeJsonParse(cruise.includes_info);
        const pricing = safeJsonParse(cruise.pricing);

        await targetDb`
          INSERT INTO cruises (id, name, slug, ship_name, cruise_line, trip_type, start_date, end_date, status, hero_image_url, description, highlights, includes_info, pricing, created_by, created_at, updated_at)
          VALUES (${cruise.id}, ${cruise.name}, ${cruise.slug}, ${cruise.ship_name}, ${cruise.cruise_line}, ${cruise.trip_type}, ${cruise.start_date}, ${cruise.end_date}, ${cruise.status}, ${cruise.hero_image_url}, ${cruise.description}, ${JSON.stringify(highlights)}, ${JSON.stringify(includesInfo)}, ${JSON.stringify(pricing)}, ${cruise.created_by}, ${cruise.created_at}, ${cruise.updated_at})
        `;
        cruiseCount++;
      } catch (err) {
        console.log(`  ⚠️ Cruise ${cruise.name}: ${err.message}`);
      }
    }
    console.log(`  ✅ Migrated ${cruiseCount} cruises`);

    // 4. Talent
    const talent = await sourceDb`SELECT * FROM talent ORDER BY id`;
    let talentCount = 0;
    for (const t of talent) {
      try {
        const socialLinks = safeJsonParse(t.social_links);

        await targetDb`
          INSERT INTO talent (id, name, category, bio, known_for, profile_image_url, social_links, website, created_at, updated_at)
          VALUES (${t.id}, ${t.name}, ${t.category}, ${t.bio}, ${t.known_for}, ${t.profile_image_url}, ${JSON.stringify(socialLinks)}, ${t.website}, ${t.created_at}, ${t.updated_at})
        `;
        talentCount++;
      } catch (err) {
        console.log(`  ⚠️ Talent ${t.name}: ${err.message}`);
      }
    }
    console.log(`  ✅ Migrated ${talentCount} talent`);

    // 5. Itinerary
    const itinerary = await sourceDb`SELECT * FROM itinerary ORDER BY cruise_id, order_index`;
    let itineraryCount = 0;
    for (const stop of itinerary) {
      try {
        const highlights = safeJsonParse(stop.highlights);

        await targetDb`
          INSERT INTO itinerary (id, cruise_id, date, day, port_name, country, arrival_time, departure_time, all_aboard_time, port_image_url, description, highlights, order_index, segment)
          VALUES (${stop.id}, ${stop.cruise_id}, ${stop.date}, ${stop.day}, ${stop.port_name}, ${stop.country}, ${stop.arrival_time}, ${stop.departure_time}, ${stop.all_aboard_time}, ${stop.port_image_url}, ${stop.description}, ${JSON.stringify(highlights)}, ${stop.order_index}, ${stop.segment})
        `;
        itineraryCount++;
      } catch (err) {
        console.log(`  ⚠️ Itinerary stop: ${err.message}`);
      }
    }
    console.log(`  ✅ Migrated ${itineraryCount} itinerary stops`);

    // 6. Events
    const events = await sourceDb`SELECT * FROM events ORDER BY cruise_id, date, time`;
    let eventsCount = 0;
    for (const event of events) {
      try {
        const talentIds = safeJsonParse(event.talent_ids);

        await targetDb`
          INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at)
          VALUES (${event.id}, ${event.cruise_id}, ${event.date}, ${event.time}, ${event.title}, ${event.type}, ${event.venue}, ${event.deck}, ${event.description}, ${event.short_description}, ${event.image_url}, ${event.theme_description}, ${event.dress_code}, ${event.capacity}, ${event.requires_reservation}, ${JSON.stringify(talentIds)}, ${event.created_at}, ${event.updated_at})
        `;
        eventsCount++;
      } catch (err) {
        console.log(`  ⚠️ Event: ${err.message}`);
      }
    }
    console.log(`  ✅ Migrated ${eventsCount} events`);

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
      let mediaCount = 0;
      for (const m of media) {
        try {
          const metadata = safeJsonParse(m.metadata);
          await targetDb`
            INSERT INTO media (id, url, thumbnail_url, type, associated_type, associated_id, caption, alt_text, credits, uploaded_by, uploaded_at, metadata)
            VALUES (${m.id}, ${m.url}, ${m.thumbnail_url}, ${m.type}, ${m.associated_type}, ${m.associated_id}, ${m.caption}, ${m.alt_text}, ${m.credits}, ${m.uploaded_by}, ${m.uploaded_at}, ${JSON.stringify(metadata)})
          `;
          mediaCount++;
        } catch (err) {
          console.log(`  ⚠️ Media item: ${err.message}`);
        }
      }
      console.log(`  ✅ Migrated ${mediaCount} media items`);
    } catch (err) {
      console.log(`  ⚠️ Media: ${err.message}`);
    }

    console.log('\n🎉 Enhanced migration completed!');

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
    const migratedCruises = await targetDb`SELECT id, name, slug FROM cruises ORDER BY id`;
    migratedCruises.forEach((cruise, i) => {
      console.log(`  ${i+1}. ${cruise.name} (${cruise.slug}) - ID: ${cruise.id}`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

migrateData();