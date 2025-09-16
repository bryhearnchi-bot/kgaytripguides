#!/usr/bin/env node

/**
 * Migrate images from Cloudinary to Supabase Storage
 * Only migrates images that are actively used in the database
 */

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import { config } from 'dotenv';
import path from 'path';
import fs from 'fs/promises';

config();

// Supabase configuration
const SUPABASE_URL = 'https://bxiiodeyqvqqcgzzqzvt.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key-here';

if (!SUPABASE_SERVICE_KEY || SUPABASE_SERVICE_KEY === 'your-service-role-key-here') {
  console.error('❌ Please set SUPABASE_SERVICE_ROLE_KEY in your .env file');
  console.log('You can find this in your Supabase dashboard under Settings > API');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Image categories and their corresponding buckets
const BUCKETS = {
  'talent': 'talent-images',
  'destinations': 'destination-images',
  'events': 'event-images',
  'cruises': 'cruise-images',
  'parties': 'party-images'
};

// Statistics tracking
const stats = {
  total: 0,
  migrated: 0,
  skipped: 0,
  failed: 0,
  errors: []
};

/**
 * Create storage buckets if they don't exist
 */
async function createBuckets() {
  console.log('\n📦 Creating storage buckets...\n');

  for (const [category, bucketName] of Object.entries(BUCKETS)) {
    try {
      // Check if bucket exists
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();

      if (listError) {
        console.error(`❌ Error listing buckets: ${listError.message}`);
        continue;
      }

      const bucketExists = buckets?.some(b => b.name === bucketName);

      if (!bucketExists) {
        // Create bucket with public access
        const { data, error } = await supabase.storage.createBucket(bucketName, {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
          fileSizeLimit: 5242880 // 5MB
        });

        if (error) {
          console.error(`❌ Error creating bucket ${bucketName}: ${error.message}`);
        } else {
          console.log(`✅ Created bucket: ${bucketName}`);
        }
      } else {
        console.log(`✓ Bucket already exists: ${bucketName}`);
      }
    } catch (error) {
      console.error(`❌ Error with bucket ${bucketName}: ${error.message}`);
    }
  }
}

/**
 * Get all image URLs from the database
 */
async function getImageUrlsFromDatabase() {
  console.log('\n🔍 Fetching image URLs from database...\n');

  const { data, error } = await supabase.rpc('get_all_image_urls', {});

  if (error) {
    // If RPC doesn't exist, create it first
    console.log('Creating RPC function...');

    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION get_all_image_urls()
        RETURNS TABLE (
          table_name text,
          record_id integer,
          field_name text,
          image_url text,
          category text
        ) AS $$
        BEGIN
          RETURN QUERY
          SELECT
            'cruises'::text,
            id,
            'hero_image_url'::text,
            hero_image_url,
            'cruises'::text
          FROM cruises WHERE hero_image_url IS NOT NULL AND hero_image_url NOT LIKE '%example.com%'

          UNION ALL

          SELECT
            'talent'::text,
            id,
            'profile_image_url'::text,
            profile_image_url,
            'talent'::text
          FROM talent WHERE profile_image_url IS NOT NULL AND profile_image_url NOT LIKE '%example.com%'

          UNION ALL

          SELECT
            'ports'::text,
            id,
            'image_url'::text,
            image_url,
            'destinations'::text
          FROM ports WHERE image_url IS NOT NULL AND image_url NOT LIKE '%example.com%'

          UNION ALL

          SELECT
            'parties'::text,
            id,
            'image_url'::text,
            image_url,
            'parties'::text
          FROM parties WHERE image_url IS NOT NULL AND image_url NOT LIKE '%example.com%'

          UNION ALL

          SELECT
            'events'::text,
            id,
            'image_url'::text,
            image_url,
            'events'::text
          FROM events WHERE image_url IS NOT NULL AND image_url NOT LIKE '%example.com%';
        END;
        $$ LANGUAGE plpgsql;
      `
    });

    if (createError) {
      // Fallback to direct SQL query
      const { data: images, error: queryError } = await supabase
        .from('cruises')
        .select('id, hero_image_url')
        .not('hero_image_url', 'is', null)
        .not('hero_image_url', 'like', '%example.com%');

      // For now, we'll just work with what we can get
      return images || [];
    }

    // Try again after creating the function
    const { data: retryData } = await supabase.rpc('get_all_image_urls', {});
    return retryData || [];
  }

  return data || [];
}

/**
 * Download image from Cloudinary
 */
async function downloadImage(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const buffer = await response.buffer();
    return buffer;
  } catch (error) {
    throw new Error(`Failed to download image: ${error.message}`);
  }
}

/**
 * Extract filename from Cloudinary URL
 */
function getFilenameFromUrl(url) {
  // Extract the public ID and format from Cloudinary URL
  const matches = url.match(/\/v\d+\/(.+?)(\.\w+)?$/);
  if (matches) {
    const publicId = matches[1];
    const extension = matches[2] || '.jpg';
    // Clean up the filename
    const filename = publicId.split('/').pop().replace(/[^a-zA-Z0-9.-]/g, '_');
    return filename + (filename.endsWith(extension) ? '' : extension);
  }

  // Fallback to URL pathname
  const pathname = new URL(url).pathname;
  return pathname.split('/').pop() || 'image.jpg';
}

/**
 * Determine bucket and path for an image
 */
function determineBucketAndPath(imageUrl, category) {
  let bucket = BUCKETS[category] || BUCKETS['events'];
  let filename = getFilenameFromUrl(imageUrl);

  // Organize by subcategories if needed
  let subfolder = '';

  if (category === 'talent') {
    // Keep talent organized by name if possible
    subfolder = 'profiles/';
  } else if (category === 'destinations') {
    subfolder = 'ports/';
  } else if (category === 'events' || category === 'parties') {
    subfolder = 'themes/';
  }

  return {
    bucket,
    path: subfolder + filename,
    filename
  };
}

/**
 * Migrate a single image
 */
async function migrateImage(record) {
  const { table_name, record_id, field_name, image_url, category } = record;

  // Skip if already a Supabase URL
  if (image_url.includes('supabase.co/storage')) {
    console.log(`⏭️  Skipping (already migrated): ${image_url.substring(0, 50)}...`);
    stats.skipped++;
    return null;
  }

  try {
    console.log(`📥 Downloading: ${image_url.substring(0, 60)}...`);

    // Download the image
    const imageBuffer = await downloadImage(image_url);

    // Determine bucket and path
    const { bucket, path, filename } = determineBucketAndPath(image_url, category);

    console.log(`📤 Uploading to ${bucket}/${path}`);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, imageBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (error) {
      throw error;
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    console.log(`✅ Migrated to: ${publicUrl}`);
    stats.migrated++;

    return {
      table_name,
      record_id,
      field_name,
      old_url: image_url,
      new_url: publicUrl
    };

  } catch (error) {
    console.error(`❌ Failed to migrate ${image_url.substring(0, 50)}...`);
    console.error(`   Error: ${error.message}`);
    stats.failed++;
    stats.errors.push({ url: image_url, error: error.message });
    return null;
  }
}

/**
 * Update database with new URLs
 */
async function updateDatabaseUrls(migrations) {
  console.log('\n🔄 Updating database with new URLs...\n');

  const updates = {
    cruises: [],
    talent: [],
    ports: [],
    parties: [],
    events: []
  };

  // Group migrations by table
  for (const migration of migrations) {
    if (migration) {
      updates[migration.table_name].push(migration);
    }
  }

  // Update each table
  for (const [table, records] of Object.entries(updates)) {
    if (records.length === 0) continue;

    console.log(`Updating ${records.length} records in ${table} table...`);

    for (const record of records) {
      const { error } = await supabase
        .from(table)
        .update({ [record.field_name]: record.new_url })
        .eq('id', record.record_id);

      if (error) {
        console.error(`❌ Failed to update ${table}.${record.field_name} for ID ${record.record_id}: ${error.message}`);
      }
    }
  }

  console.log('✅ Database updates complete');
}

/**
 * Main migration function
 */
async function main() {
  console.log('🚀 Starting Cloudinary to Supabase Storage Migration');
  console.log('=' .repeat(60));

  try {
    // Step 1: Create buckets
    await createBuckets();

    // Step 2: Get all image URLs from database
    const imageRecords = await getImageUrlsFromDatabase();
    stats.total = imageRecords.length;

    console.log(`\n📊 Found ${stats.total} images to process\n`);

    // Step 3: Migrate images
    const migrations = [];
    for (const record of imageRecords) {
      const result = await migrateImage(record);
      migrations.push(result);

      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Step 4: Update database (optional - can be done manually for safety)
    console.log('\n' + '='.repeat(60));
    console.log('Migration complete! Summary:');
    console.log(`✅ Migrated: ${stats.migrated}`);
    console.log(`⏭️  Skipped: ${stats.skipped}`);
    console.log(`❌ Failed: ${stats.failed}`);
    console.log(`📊 Total: ${stats.total}`);

    if (stats.errors.length > 0) {
      console.log('\n❌ Errors:');
      stats.errors.forEach(err => {
        console.log(`  - ${err.url.substring(0, 50)}...: ${err.error}`);
      });
    }

    // Save migration results
    const resultsPath = path.join(process.cwd(), 'migration-results.json');
    await fs.writeFile(resultsPath, JSON.stringify({
      stats,
      migrations: migrations.filter(m => m !== null),
      timestamp: new Date().toISOString()
    }, null, 2));

    console.log(`\n📄 Migration results saved to: ${resultsPath}`);

    // Ask user if they want to update the database
    console.log('\n' + '='.repeat(60));
    console.log('⚠️  Database URLs have NOT been updated yet.');
    console.log('Review the migration results and run the update manually if satisfied.');
    console.log('\nTo update the database, run:');
    console.log('npm run update-image-urls');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run the migration
main().catch(console.error);