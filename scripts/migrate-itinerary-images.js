#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || 'https://bxiiodeyqvqqcgzzqzvt.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function downloadImage(url) {
  try {
    console.log(`  Downloading: ${url}`);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const buffer = await response.buffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    return { buffer, contentType };
  } catch (error) {
    console.error(`  ❌ Error downloading image: ${error.message}`);
    return null;
  }
}

function getFileNameFromUrl(url, portName, id) {
  // Extract filename from Cloudinary URL or generate one
  const urlParts = url.split('/');
  const lastPart = urlParts[urlParts.length - 1];

  // Remove any query params
  const fileName = lastPart.split('?')[0];

  // If it's a generic filename, create a better one
  if (fileName.includes('article') || fileName.length < 10) {
    const cleanName = portName.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return `${cleanName}-${id}.jpg`;
  }

  // Ensure proper extension
  if (!fileName.match(/\.(jpg|jpeg|png|webp|avif)$/i)) {
    return fileName + '.jpg';
  }

  return fileName;
}

async function uploadToSupabase(fileName, imageData, contentType) {
  const path = `itinerary/${fileName}`;

  console.log(`  Uploading to: ${path}`);

  const { data, error } = await supabase.storage
    .from('app-images')
    .upload(path, imageData.buffer, {
      contentType: contentType,
      upsert: true
    });

  if (error) {
    console.error(`  ❌ Error uploading: ${error.message}`);
    return null;
  }

  // Construct the public URL
  const publicUrl = `${supabaseUrl}/storage/v1/object/public/app-images/${path}`;
  console.log(`  ✓ Uploaded to: ${publicUrl}`);

  return publicUrl;
}

async function migrateItineraryImages() {
  console.log('🚀 Starting Itinerary Image Migration');
  console.log('=====================================\n');

  // Fetch all itinerary entries with Cloudinary URLs
  const { data: itineraries, error: fetchError } = await supabase
    .from('itinerary')
    .select('id, trip_id, port_name, port_image_url')
    .not('port_image_url', 'is', null)
    .like('port_image_url', '%cloudinary%')
    .order('trip_id')
    .order('day');

  if (fetchError) {
    console.error('❌ Error fetching itinerary data:', fetchError);
    return;
  }

  console.log(`Found ${itineraries.length} itinerary entries with Cloudinary images\n`);

  let successCount = 0;
  let failCount = 0;
  const urlMap = new Map(); // Track URL mappings to avoid re-downloading same images

  for (const item of itineraries) {
    console.log(`\n📍 Processing: ${item.port_name} (ID: ${item.id})`);

    // Check if we've already processed this URL
    if (urlMap.has(item.port_image_url)) {
      const newUrl = urlMap.get(item.port_image_url);
      console.log(`  ⚡ Using cached URL: ${newUrl}`);

      // Update database
      const { error: updateError } = await supabase
        .from('itinerary')
        .update({ port_image_url: newUrl })
        .eq('id', item.id);

      if (updateError) {
        console.error(`  ❌ Error updating database: ${updateError.message}`);
        failCount++;
      } else {
        console.log(`  ✓ Database updated`);
        successCount++;
      }
      continue;
    }

    // Download image from Cloudinary
    const imageData = await downloadImage(item.port_image_url);

    if (!imageData) {
      failCount++;
      continue;
    }

    // Generate filename
    const fileName = getFileNameFromUrl(item.port_image_url, item.port_name, item.id);

    // Upload to Supabase
    const newUrl = await uploadToSupabase(fileName, imageData, imageData.contentType);

    if (!newUrl) {
      failCount++;
      continue;
    }

    // Store URL mapping
    urlMap.set(item.port_image_url, newUrl);

    // Update database
    const { error: updateError } = await supabase
      .from('itinerary')
      .update({ port_image_url: newUrl })
      .eq('id', item.id);

    if (updateError) {
      console.error(`  ❌ Error updating database: ${updateError.message}`);
      failCount++;
    } else {
      console.log(`  ✓ Database updated`);
      successCount++;
    }
  }

  console.log('\n=====================================');
  console.log('📊 Migration Summary:');
  console.log(`   ✅ Success: ${successCount} entries`);
  console.log(`   ❌ Failed: ${failCount} entries`);
  console.log(`   📁 Unique images uploaded: ${urlMap.size}`);
  console.log('\n✅ Migration complete!');
}

// Run the migration
migrateItineraryImages().catch(console.error);