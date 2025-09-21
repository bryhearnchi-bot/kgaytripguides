#!/usr/bin/env node

/**
 * Script to migrate Supabase storage from multiple buckets to single app-images bucket
 * Consolidates: talent-images, port-images, party-images, cruise-images, event-images
 * Into: app-images with folders (talent, locations, events, trips, parties)
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || 'https://bxiiodeyqvqqcgzzqzvt.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment variables');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Bucket mapping: old bucket -> new folder in app-images
const BUCKET_MAPPING = {
  'talent-images': 'talent',
  'port-images': 'locations',
  'destination-images': 'locations',
  'party-images': 'parties',
  'event-images': 'parties',  // Changed from 'events' to 'parties'
  'cruise-images': 'trips',
  'trip-images': 'trips',
  'ship-images': 'trips'
};

const NEW_BUCKET = 'app-images';

async function createBucket(bucketName) {
  console.log(`\n📦 Creating bucket: ${bucketName}`);

  const { data, error } = await supabase.storage.createBucket(bucketName, {
    public: true,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    fileSizeLimit: 5242880 // 5MB
  });

  if (error) {
    if (error.message.includes('already exists')) {
      console.log(`✓ Bucket ${bucketName} already exists`);
      return true;
    }
    console.error(`❌ Error creating bucket ${bucketName}:`, error.message);
    return false;
  }

  console.log(`✅ Bucket ${bucketName} created successfully`);
  return true;
}

async function listBuckets() {
  console.log('\n📋 Listing existing buckets...');
  const { data, error } = await supabase.storage.listBuckets();

  if (error) {
    console.error('❌ Error listing buckets:', error.message);
    return [];
  }

  console.log('Found buckets:', data.map(b => b.name).join(', '));
  return data;
}

async function listFilesInBucket(bucketName, folder = '') {
  console.log(`\n📂 Listing files in ${bucketName}/${folder || 'root'}...`);

  const { data, error } = await supabase.storage.from(bucketName).list(folder, {
    limit: 1000,
    offset: 0
  });

  if (error) {
    console.error(`❌ Error listing files in ${bucketName}:`, error.message);
    return [];
  }

  // Collect all files recursively
  let allFiles = [];

  for (const item of data) {
    if (item.id) { // It's a file
      allFiles.push({ ...item, path: folder ? `${folder}/${item.name}` : item.name });
    } else { // It's a folder
      const subPath = folder ? `${folder}/${item.name}` : item.name;
      const subFiles = await listFilesInBucket(bucketName, subPath);
      allFiles = allFiles.concat(subFiles);
    }
  }

  if (folder === '') {
    console.log(`Found ${allFiles.length} files total`);
  }

  return allFiles;
}

async function copyFile(sourceBucket, sourcePath, targetBucket, targetPath) {
  try {
    // Download from source
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(sourceBucket)
      .download(sourcePath);

    if (downloadError) {
      console.error(`❌ Error downloading ${sourceBucket}/${sourcePath}:`, downloadError.message);
      return false;
    }

    // Upload to target
    const { data, error: uploadError } = await supabase.storage
      .from(targetBucket)
      .upload(targetPath, fileData, {
        upsert: true,
        contentType: fileData.type
      });

    if (uploadError) {
      console.error(`❌ Error uploading to ${targetBucket}/${targetPath}:`, uploadError.message);
      return false;
    }

    console.log(`✓ Copied: ${sourceBucket}/${sourcePath} → ${targetBucket}/${targetPath}`);
    return true;
  } catch (error) {
    console.error(`❌ Error copying file:`, error.message);
    return false;
  }
}

async function migrateFiles(sourceBucket, targetFolder) {
  console.log(`\n🚀 Migrating ${sourceBucket} → ${NEW_BUCKET}/${targetFolder}`);

  // List all files in source bucket (recursively)
  const files = await listFilesInBucket(sourceBucket);

  if (files.length === 0) {
    console.log(`No files to migrate from ${sourceBucket}`);
    return;
  }

  let successCount = 0;
  let failCount = 0;

  for (const file of files) {
    const sourcePath = file.path;
    // Preserve folder structure but put under new target folder
    const fileName = sourcePath.split('/').pop();
    const targetPath = `${targetFolder}/${fileName}`;

    const success = await copyFile(sourceBucket, sourcePath, NEW_BUCKET, targetPath);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log(`\n📊 Migration complete for ${sourceBucket}:`);
  console.log(`   ✅ Success: ${successCount} files`);
  console.log(`   ❌ Failed: ${failCount} files`);
}

async function deleteBucket(bucketName) {
  console.log(`\n🗑️  Deleting bucket: ${bucketName}`);

  // First, delete all files in the bucket (recursively)
  const files = await listFilesInBucket(bucketName);

  if (files.length > 0) {
    console.log(`Deleting ${files.length} files...`);
    const filePaths = files.map(f => f.path);

    // Delete in batches of 100
    for (let i = 0; i < filePaths.length; i += 100) {
      const batch = filePaths.slice(i, i + 100);
      const { error } = await supabase.storage
        .from(bucketName)
        .remove(batch);

      if (error) {
        console.error(`❌ Error deleting files:`, error.message);
      }
    }
  }

  // Then delete the bucket
  const { data, error } = await supabase.storage.deleteBucket(bucketName);

  if (error) {
    console.error(`❌ Error deleting bucket ${bucketName}:`, error.message);
    return false;
  }

  console.log(`✅ Bucket ${bucketName} deleted successfully`);
  return true;
}

async function main() {
  console.log('🎯 Starting Supabase Storage Migration');
  console.log('=====================================\n');

  try {
    // Step 1: List existing buckets
    const existingBuckets = await listBuckets();
    const bucketNames = existingBuckets.map(b => b.name);

    // Step 2: Create app-images bucket
    const bucketCreated = await createBucket(NEW_BUCKET);
    if (!bucketCreated && !bucketNames.includes(NEW_BUCKET)) {
      console.error('❌ Failed to create app-images bucket. Exiting...');
      process.exit(1);
    }

    // Step 3: Migrate files from each old bucket
    for (const [oldBucket, newFolder] of Object.entries(BUCKET_MAPPING)) {
      if (bucketNames.includes(oldBucket)) {
        await migrateFiles(oldBucket, newFolder);
      } else {
        console.log(`⚠️  Bucket ${oldBucket} not found, skipping...`);
      }
    }

    console.log('\n✅ Migration complete!');

    // Step 4: Ask user if they want to delete old buckets
    console.log('\n⚠️  WARNING: Old buckets still exist.');
    console.log('After verifying the app works with the new structure,');
    console.log('run this script with --delete-old flag to remove old buckets.');

    if (process.argv.includes('--delete-old')) {
      console.log('\n🗑️  Deleting old buckets...');
      for (const oldBucket of Object.keys(BUCKET_MAPPING)) {
        if (bucketNames.includes(oldBucket)) {
          await deleteBucket(oldBucket);
        }
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run the migration
main().catch(console.error);