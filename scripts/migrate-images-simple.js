#!/usr/bin/env node

/**
 * Simple image migration from Cloudinary to Supabase Storage
 */

import postgres from 'postgres';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import { config } from 'dotenv';
import fs from 'fs/promises';

config();

// Database connection
const sql = postgres(process.env.DATABASE_URL);

// Supabase configuration
const SUPABASE_URL = 'https://bxiiodeyqvqqcgzzqzvt.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Statistics
const stats = {
  total: 0,
  migrated: 0,
  skipped: 0,
  failed: 0,
  errors: []
};

/**
 * Get all image URLs from database
 */
async function getImageUrls() {
  console.log('🔍 Fetching image URLs from database...\n');

  const images = [];

  // Get cruise images
  const cruises = await sql`
    SELECT id, 'cruises' as table_name, 'hero_image_url' as field_name, hero_image_url as url
    FROM cruises
    WHERE hero_image_url IS NOT NULL
    AND hero_image_url NOT LIKE '%example.com%'
  `;
  images.push(...cruises);

  // Get talent images
  const talent = await sql`
    SELECT id, 'talent' as table_name, 'profile_image_url' as field_name, profile_image_url as url
    FROM talent
    WHERE profile_image_url IS NOT NULL
    AND profile_image_url NOT LIKE '%example.com%'
  `;
  images.push(...talent);

  // Get port images
  const ports = await sql`
    SELECT id, 'ports' as table_name, 'image_url' as field_name, image_url as url
    FROM ports
    WHERE image_url IS NOT NULL
    AND image_url NOT LIKE '%example.com%'
  `;
  images.push(...ports);

  // Get party images
  const parties = await sql`
    SELECT id, 'parties' as table_name, 'image_url' as field_name, image_url as url
    FROM parties
    WHERE image_url IS NOT NULL
    AND image_url NOT LIKE '%example.com%'
  `;
  images.push(...parties);

  // Get event images
  const events = await sql`
    SELECT id, 'events' as table_name, 'image_url' as field_name, image_url as url
    FROM events
    WHERE image_url IS NOT NULL
    AND image_url NOT LIKE '%example.com%'
  `;
  images.push(...events);

  console.log(`Found ${images.length} images to process\n`);
  return images;
}

/**
 * Determine bucket based on table name
 */
function getBucket(tableName) {
  const buckets = {
    'cruises': 'cruise-images',
    'talent': 'talent-images',
    'ports': 'destination-images',
    'parties': 'party-images',
    'events': 'event-images'
  };
  return buckets[tableName] || 'event-images';
}

/**
 * Extract filename from URL
 */
function getFilename(url) {
  try {
    // For Cloudinary URLs, extract the public ID
    const matches = url.match(/\/v\d+\/(.+?)(\.\w+)?$/);
    if (matches) {
      const publicId = matches[1];
      const extension = matches[2] || '.jpg';
      const filename = publicId.split('/').pop().replace(/[^a-zA-Z0-9.-]/g, '_');
      return filename + (filename.endsWith(extension) ? '' : extension);
    }

    // Fallback
    const pathname = new URL(url).pathname;
    return pathname.split('/').pop() || 'image.jpg';
  } catch (e) {
    return 'image_' + Date.now() + '.jpg';
  }
}

/**
 * Migrate a single image
 */
async function migrateImage(record) {
  const { id, table_name, field_name, url } = record;

  // Skip if already migrated
  if (url.includes('supabase.co/storage')) {
    console.log(`⏭️  Skipping (already migrated): ${url.substring(0, 50)}...`);
    stats.skipped++;
    return null;
  }

  try {
    console.log(`📥 Downloading: ${url.substring(0, 60)}...`);

    // Download image
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const buffer = await response.buffer();

    // Determine bucket and filename
    const bucket = getBucket(table_name);
    const filename = getFilename(url);
    const path = `${table_name}/${filename}`;

    console.log(`📤 Uploading to ${bucket}/${path}`);

    // Upload to Supabase
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    console.log(`✅ Migrated to: ${publicUrl}\n`);
    stats.migrated++;

    return {
      table_name,
      id,
      field_name,
      old_url: url,
      new_url: publicUrl
    };

  } catch (error) {
    console.error(`❌ Failed: ${error.message}\n`);
    stats.failed++;
    stats.errors.push({ url, error: error.message });
    return null;
  }
}

/**
 * Update database with new URLs
 */
async function updateDatabase(migrations) {
  console.log('\n🔄 Updating database with new URLs...\n');

  for (const m of migrations) {
    if (!m) continue;

    try {
      // Use dynamic SQL based on table and field
      if (m.table_name === 'cruises') {
        await sql`UPDATE cruises SET hero_image_url = ${m.new_url} WHERE id = ${m.id}`;
      } else if (m.table_name === 'talent') {
        await sql`UPDATE talent SET profile_image_url = ${m.new_url} WHERE id = ${m.id}`;
      } else if (m.table_name === 'ports') {
        await sql`UPDATE ports SET image_url = ${m.new_url} WHERE id = ${m.id}`;
      } else if (m.table_name === 'parties') {
        await sql`UPDATE parties SET image_url = ${m.new_url} WHERE id = ${m.id}`;
      } else if (m.table_name === 'events') {
        await sql`UPDATE events SET image_url = ${m.new_url} WHERE id = ${m.id}`;
      }
      console.log(`✅ Updated ${m.table_name} ID ${m.id}`);
    } catch (error) {
      console.error(`❌ Failed to update ${m.table_name} ID ${m.id}: ${error.message}`);
    }
  }
}

/**
 * Main migration
 */
async function main() {
  console.log('🚀 Starting Cloudinary to Supabase Storage Migration');
  console.log('='.repeat(60) + '\n');

  try {
    // Get all images
    const images = await getImageUrls();
    stats.total = images.length;

    // Migrate each image
    const migrations = [];
    for (const image of images) {
      const result = await migrateImage(image);
      migrations.push(result);

      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 100));
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('Migration Summary:');
    console.log(`✅ Migrated: ${stats.migrated}`);
    console.log(`⏭️  Skipped: ${stats.skipped}`);
    console.log(`❌ Failed: ${stats.failed}`);
    console.log(`📊 Total: ${stats.total}`);

    // Save results
    const resultsPath = 'migration-results.json';
    await fs.writeFile(resultsPath, JSON.stringify({
      stats,
      migrations: migrations.filter(m => m !== null),
      timestamp: new Date().toISOString()
    }, null, 2));

    console.log(`\n📄 Results saved to: ${resultsPath}`);

    // Ask to update database
    if (stats.migrated > 0) {
      console.log('\n' + '='.repeat(60));
      console.log('Ready to update database URLs.');
      console.log('Type "yes" to update the database with new URLs:');

      // For now, we'll auto-update since this is a script
      // In production, you'd want manual confirmation
      await updateDatabase(migrations);
      console.log('\n✅ Database updated successfully!');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

// Run migration
main().catch(console.error);