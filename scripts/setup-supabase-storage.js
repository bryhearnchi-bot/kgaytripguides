#!/usr/bin/env node

/**
 * Setup Supabase Storage buckets using the Management API
 */

import fetch from 'node-fetch';
import { config } from 'dotenv';

config();

const SUPABASE_PROJECT_ID = 'bxiiodeyqvqqcgzzqzvt';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in .env');
  process.exit(1);
}

// Buckets to create
const BUCKETS = [
  { name: 'talent-images', public: true },
  { name: 'destination-images', public: true },
  { name: 'event-images', public: true },
  { name: 'cruise-images', public: true },
  { name: 'party-images', public: true }
];

async function createBucket(bucketName, isPublic = true) {
  try {
    const response = await fetch(
      `https://${SUPABASE_PROJECT_ID}.supabase.co/storage/v1/bucket`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: bucketName,
          name: bucketName,
          public: isPublic,
          file_size_limit: 5242880, // 5MB
          allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        })
      }
    );

    if (response.ok) {
      console.log(`✅ Created bucket: ${bucketName}`);
      return true;
    } else {
      const error = await response.text();
      if (error.includes('already exists')) {
        console.log(`✓ Bucket already exists: ${bucketName}`);
        return true;
      } else {
        console.error(`❌ Failed to create bucket ${bucketName}: ${error}`);
        return false;
      }
    }
  } catch (error) {
    console.error(`❌ Error creating bucket ${bucketName}: ${error.message}`);
    return false;
  }
}

async function listBuckets() {
  try {
    const response = await fetch(
      `https://${SUPABASE_PROJECT_ID}.supabase.co/storage/v1/bucket`,
      {
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        }
      }
    );

    if (response.ok) {
      const buckets = await response.json();
      return buckets;
    } else {
      console.error('Failed to list buckets:', await response.text());
      return [];
    }
  } catch (error) {
    console.error('Error listing buckets:', error.message);
    return [];
  }
}

async function main() {
  console.log('🚀 Setting up Supabase Storage Buckets');
  console.log('='.repeat(60) + '\n');

  // List existing buckets
  console.log('📦 Checking existing buckets...\n');
  const existingBuckets = await listBuckets();
  console.log(`Found ${existingBuckets.length} existing buckets\n`);

  // Create buckets
  console.log('📦 Creating storage buckets...\n');
  for (const bucket of BUCKETS) {
    await createBucket(bucket.name, bucket.public);
  }

  console.log('\n✅ Storage setup complete!');
  console.log('\nYou can now run the image migration script.');
}

main().catch(console.error);