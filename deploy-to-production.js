import { neon } from '@neondatabase/serverless';
import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

// Database URLs
const DEV_DB_URL = 'postgresql://neondb_owner:npg_S3acE5NbXIQR@ep-bold-wave-adnvwxha-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require';
const PROD_DB_URL = 'postgresql://neondb_owner:npg_S3acE5NbXIQR@ep-fancy-queen-ad2frbaz-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require';

const devDb = neon(DEV_DB_URL);
const prodDb = neon(PROD_DB_URL);

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

async function deployToProduction() {
  console.log('🚀 Starting PRODUCTION deployment...\n');

  try {
    // Step 1: Create production database schema
    console.log('1️⃣ Setting up production database schema...');

    // Update .env to point to production DB temporarily for schema creation
    const envContent = readFileSync('.env', 'utf8');
    const prodEnvContent = envContent.replace(
      /DATABASE_URL=.*$/m,
      `DATABASE_URL=${PROD_DB_URL}`
    );
    writeFileSync('.env', prodEnvContent);

    // Push schema to production database
    console.log('   📋 Pushing schema to production database...');
    execSync('npx drizzle-kit push', { stdio: 'inherit' });
    console.log('   ✅ Production schema ready');

    // Step 2: Copy all data from development to production
    console.log('\n2️⃣ Copying data from development to production...');

    // Clear production database first
    console.log('   🗑️ Clearing production database...');
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
        await prodDb.unsafe(cmd);
      } catch (err) {
        // Ignore errors - tables might be empty
      }
    }
    console.log('   ✅ Production database cleared');

    // Copy data in dependency order
    console.log('   📋 Copying data...');

    // Users
    const users = await devDb`SELECT * FROM users`;
    if (users.length > 0) {
      for (const user of users) {
        await prodDb`
          INSERT INTO users (id, username, password, email, full_name, role, created_at, updated_at, last_login, is_active)
          VALUES (${user.id}, ${user.username}, ${user.password}, ${user.email}, ${user.full_name}, ${user.role}, ${user.created_at}, ${user.updated_at}, ${user.last_login}, ${user.is_active})
        `;
      }
      console.log(`     ✅ ${users.length} users`);
    }

    // Settings
    const settings = await devDb`SELECT * FROM settings`;
    if (settings.length > 0) {
      for (const setting of settings) {
        const metadata = safeJsonParse(setting.metadata);
        await prodDb`
          INSERT INTO settings (category, key, label, value, metadata, is_active, order_index, created_by, created_at, updated_at)
          VALUES (${setting.category}, ${setting.key}, ${setting.label}, ${setting.value}, ${JSON.stringify(metadata)}, ${setting.is_active}, ${setting.order_index}, ${setting.created_by}, ${setting.created_at}, ${setting.updated_at})
        `;
      }
      console.log(`     ✅ ${settings.length} settings`);
    }

    // Cruises
    const cruises = await devDb`SELECT * FROM cruises ORDER BY id`;
    let cruiseCount = 0;
    for (const cruise of cruises) {
      try {
        const highlights = safeJsonParse(cruise.highlights);
        const includesInfo = safeJsonParse(cruise.includes_info);
        const pricing = safeJsonParse(cruise.pricing);

        await prodDb`
          INSERT INTO cruises (id, name, slug, ship_name, cruise_line, trip_type, start_date, end_date, status, hero_image_url, description, highlights, includes_info, pricing, created_by, created_at, updated_at)
          VALUES (${cruise.id}, ${cruise.name}, ${cruise.slug}, ${cruise.ship_name}, ${cruise.cruise_line}, ${cruise.trip_type}, ${cruise.start_date}, ${cruise.end_date}, ${cruise.status}, ${cruise.hero_image_url}, ${cruise.description}, ${JSON.stringify(highlights)}, ${JSON.stringify(includesInfo)}, ${JSON.stringify(pricing)}, ${cruise.created_by}, ${cruise.created_at}, ${cruise.updated_at})
        `;
        cruiseCount++;
      } catch (err) {
        console.log(`     ⚠️ Cruise ${cruise.name}: ${err.message}`);
      }
    }
    console.log(`     ✅ ${cruiseCount} cruises`);

    // Talent
    const talent = await devDb`SELECT * FROM talent ORDER BY id`;
    let talentCount = 0;
    for (const t of talent) {
      try {
        const socialLinks = safeJsonParse(t.social_links);
        await prodDb`
          INSERT INTO talent (id, name, category, bio, known_for, profile_image_url, social_links, website, created_at, updated_at)
          VALUES (${t.id}, ${t.name}, ${t.category}, ${t.bio}, ${t.known_for}, ${t.profile_image_url}, ${JSON.stringify(socialLinks)}, ${t.website}, ${t.created_at}, ${t.updated_at})
        `;
        talentCount++;
      } catch (err) {
        console.log(`     ⚠️ Talent ${t.name}: ${err.message}`);
      }
    }
    console.log(`     ✅ ${talentCount} talent`);

    // Itinerary
    const itinerary = await devDb`SELECT * FROM itinerary ORDER BY cruise_id, order_index`;
    let itineraryCount = 0;
    for (const stop of itinerary) {
      try {
        const highlights = safeJsonParse(stop.highlights);
        await prodDb`
          INSERT INTO itinerary (id, cruise_id, date, day, port_name, country, arrival_time, departure_time, all_aboard_time, port_image_url, description, highlights, order_index, segment)
          VALUES (${stop.id}, ${stop.cruise_id}, ${stop.date}, ${stop.day}, ${stop.port_name}, ${stop.country}, ${stop.arrival_time}, ${stop.departure_time}, ${stop.all_aboard_time}, ${stop.port_image_url}, ${stop.description}, ${JSON.stringify(highlights)}, ${stop.order_index}, ${stop.segment})
        `;
        itineraryCount++;
      } catch (err) {
        console.log(`     ⚠️ Itinerary stop: ${err.message}`);
      }
    }
    console.log(`     ✅ ${itineraryCount} itinerary stops`);

    // Events
    const events = await devDb`SELECT * FROM events ORDER BY cruise_id, date, time`;
    let eventsCount = 0;
    for (const event of events) {
      try {
        const talentIds = safeJsonParse(event.talent_ids);
        await prodDb`
          INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at)
          VALUES (${event.id}, ${event.cruise_id}, ${event.date}, ${event.time}, ${event.title}, ${event.type}, ${event.venue}, ${event.deck}, ${event.description}, ${event.short_description}, ${event.image_url}, ${event.theme_description}, ${event.dress_code}, ${event.capacity}, ${event.requires_reservation}, ${JSON.stringify(talentIds)}, ${event.created_at}, ${event.updated_at})
        `;
        eventsCount++;
      } catch (err) {
        console.log(`     ⚠️ Event: ${err.message}`);
      }
    }
    console.log(`     ✅ ${eventsCount} events`);

    // Cruise-Talent relationships
    const cruiseTalent = await devDb`SELECT * FROM cruise_talent`;
    for (const ct of cruiseTalent) {
      await prodDb`
        INSERT INTO cruise_talent (cruise_id, talent_id, role, performance_count, notes, created_at)
        VALUES (${ct.cruise_id}, ${ct.talent_id}, ${ct.role}, ${ct.performance_count}, ${ct.notes}, ${ct.created_at})
      `;
    }
    console.log(`     ✅ ${cruiseTalent.length} cruise-talent relationships`);

    // Media
    const media = await devDb`SELECT * FROM media`;
    let mediaCount = 0;
    for (const m of media) {
      try {
        const metadata = safeJsonParse(m.metadata);
        await prodDb`
          INSERT INTO media (id, url, thumbnail_url, type, associated_type, associated_id, caption, alt_text, credits, uploaded_by, uploaded_at, metadata)
          VALUES (${m.id}, ${m.url}, ${m.thumbnail_url}, ${m.type}, ${m.associated_type}, ${m.associated_id}, ${m.caption}, ${m.alt_text}, ${m.credits}, ${m.uploaded_by}, ${m.uploaded_at}, ${JSON.stringify(metadata)})
        `;
        mediaCount++;
      } catch (err) {
        console.log(`     ⚠️ Media item: ${err.message}`);
      }
    }
    console.log(`     ✅ ${mediaCount} media items`);

    // Step 3: Verify production data
    console.log('\n3️⃣ Verifying production data...');
    const prodCruises = await prodDb`SELECT COUNT(*) as count FROM cruises`;
    const prodItinerary = await prodDb`SELECT COUNT(*) as count FROM itinerary`;
    const prodEvents = await prodDb`SELECT COUNT(*) as count FROM events`;
    const prodTalent = await prodDb`SELECT COUNT(*) as count FROM talent`;

    console.log(`   🚢 Cruises: ${prodCruises[0].count}`);
    console.log(`   🗺️ Itinerary: ${prodItinerary[0].count}`);
    console.log(`   🎪 Events: ${prodEvents[0].count}`);
    console.log(`   🎭 Talent: ${prodTalent[0].count}`);

    // Step 4: Create production environment file
    console.log('\n4️⃣ Creating production environment...');
    const productionEnv = `# Production Database
DATABASE_URL=${PROD_DB_URL}

# Environment
NODE_ENV=production

# Optional: Mock data for testing (set to true to use test data)
USE_MOCK_DATA=false

# Image Storage (Cloudinary)
CLOUDINARY_CLOUD_NAME=dfqoebbyj
CLOUDINARY_API_KEY=162354273258333
CLOUDINARY_API_SECRET=tPBIYWH3n6BL3-AN3y6W3zU7JI0
CLOUDINARY_URL=cloudinary://162354273258333:**********@dfqoebbyj

# Session Secret (for production)
SESSION_SECRET=your_production_session_secret_here
`;

    writeFileSync('.env.production', productionEnv);
    console.log('   ✅ Created .env.production file');

    // Step 5: Build for production
    console.log('\n5️⃣ Building application for production...');
    execSync('npm run build', { stdio: 'inherit' });
    console.log('   ✅ Production build complete');

    // Step 6: Instructions for Netlify deployment
    console.log('\n🎯 PRODUCTION DEPLOYMENT READY!');
    console.log('\nNext steps for Netlify deployment:');
    console.log('1. Copy the contents of .env.production to Netlify environment variables');
    console.log('2. Set build command: npm run build');
    console.log('3. Set publish directory: dist');
    console.log('4. Deploy to Netlify');
    console.log('\n📊 Production database now contains:');
    console.log(`   - ${prodCruises[0].count} cruises with full data`);
    console.log(`   - ${prodEvents[0].count} events across all cruises`);
    console.log(`   - ${prodTalent[0].count} talent members`);
    console.log(`   - ${prodItinerary[0].count} itinerary stops`);

    // Restore development environment
    writeFileSync('.env', envContent);
    console.log('\n✅ Development environment restored');
    console.log('🎉 Production deployment preparation complete!');

  } catch (error) {
    console.error('❌ Production deployment failed:', error);

    // Try to restore development environment on error
    try {
      const envContent = readFileSync('.env', 'utf8');
      if (!envContent.includes('ep-bold-wave-adnvwxha')) {
        writeFileSync('.env', envContent.replace(
          /DATABASE_URL=.*$/m,
          `DATABASE_URL=${DEV_DB_URL}`
        ));
        console.log('🔄 Development environment restored after error');
      }
    } catch (restoreError) {
      console.error('⚠️ Could not restore development environment:', restoreError.message);
    }
  }
}

deployToProduction();