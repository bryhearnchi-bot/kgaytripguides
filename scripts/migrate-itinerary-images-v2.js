#!/usr/bin/env node

import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || 'https://bxiiodeyqvqqcgzzqzvt.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found');
  process.exit(1);
}

// Unique Cloudinary URLs to migrate
const imagesToMigrate = [
  { url: 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1757880780/cruise-app/itinerary/cruise-app/itinerary/athens-greece-port-scenic-0bfb845f.png', name: 'athens-greece.png', ids: [1, 2, 12] },
  { url: 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1757880793/cruise-app/itinerary/cruise-app/itinerary/santorini-greece-cruise-port-ed3e2e0a.png', name: 'santorini-greece.png', ids: [3] },
  { url: 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1757880789/cruise-app/itinerary/cruise-app/itinerary/kusadasi-turkey-port-scenic-cf0f15d9.png', name: 'kusadasi-turkey.png', ids: [4] },
  { url: 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1757880787/cruise-app/itinerary/cruise-app/itinerary/istanbul-turkey-cruise-port-e82f2c8b.png', name: 'istanbul-turkey.png', ids: [5, 6] },
  { url: 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_600,h_400,c_fill,g_center,q_auto,f_auto/v1757773863/cruise-app/assets/celebrity-cruise-lines_celebrity-solstice_wake_article_article-2997_5685_1757732437578_cuv35p.jpg', name: 'day-at-sea-1.jpg', ids: [7, 9] },
  { url: 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1757880778/cruise-app/itinerary/cruise-app/itinerary/alexandria-egypt-cruise-port-764a37c8.png', name: 'alexandria-egypt.png', ids: [8] },
  { url: 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1757880791/cruise-app/itinerary/cruise-app/itinerary/mykonos-greece-cruise-port-ae350664.png', name: 'mykonos-greece.png', ids: [10] },
  { url: 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1757880786/cruise-app/itinerary/cruise-app/itinerary/iraklion-crete-cruise-port-faa24cff.png', name: 'iraklion-crete.png', ids: [11] },
  { url: 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_600,h_400,c_fill,g_center,q_auto,f_auto/v1757901417/471674-Miami_zorh0h.webp', name: 'miami-1.webp', ids: [13] },
  { url: 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_600,h_400,c_fill,g_center,q_auto,f_auto/v1757901417/Sunrise-at-sea-Easter-morning_smdnce.jpg', name: 'day-at-sea-2.jpg', ids: [14] },
  { url: 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_600,h_400,c_fill,g_center,q_auto,f_auto/v1757901418/keywest_bly8wt.png', name: 'key-west.png', ids: [15] },
  { url: 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_600,h_400,c_fill,g_center,q_auto,f_auto/v1757901417/bimini_k3wdwc.avif', name: 'bimini.avif', ids: [16] },
  { url: 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_600,h_400,c_fill,g_center,q_auto,f_auto/v1757901417/miami_2_deyzec.jpg', name: 'miami-2.jpg', ids: [17] }
];

async function downloadImage(url) {
  try {
    console.log(`  Downloading: ${url.substring(0, 80)}...`);
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

async function uploadToSupabase(fileName, imageData) {
  const path = `itinerary/${fileName}`;
  console.log(`  Uploading to: ${path}`);

  try {
    // Use Supabase Storage API directly
    const uploadUrl = `${supabaseUrl}/storage/v1/object/app-images/${path}`;

    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': imageData.contentType,
        'x-upsert': 'true'
      },
      body: imageData.buffer
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/app-images/${path}`;
    console.log(`  ✓ Uploaded to: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error(`  ❌ Error uploading: ${error.message}`);
    return null;
  }
}

async function updateDatabase(ids, newUrl) {
  try {
    // Build the SQL query to update multiple records
    const idList = ids.join(',');

    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        sql: `UPDATE itinerary SET port_image_url = '${newUrl}' WHERE id IN (${idList})`
      })
    });

    if (!response.ok) {
      throw new Error(`Database update failed: ${response.status}`);
    }

    console.log(`  ✓ Updated ${ids.length} database records`);
    return true;
  } catch (error) {
    console.error(`  ❌ Error updating database: ${error.message}`);
    // Try alternative approach - update via REST API
    for (const id of ids) {
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/itinerary?id=eq.${id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ port_image_url: newUrl })
        });

        if (response.ok) {
          console.log(`    ✓ Updated record ${id}`);
        }
      } catch (err) {
        console.error(`    ❌ Failed to update record ${id}`);
      }
    }
    return false;
  }
}

async function migrateItineraryImages() {
  console.log('🚀 Starting Itinerary Image Migration');
  console.log('=====================================\n');
  console.log(`Found ${imagesToMigrate.length} unique images to migrate\n`);

  let successCount = 0;
  let failCount = 0;

  for (const item of imagesToMigrate) {
    console.log(`\n📍 Processing: ${item.name}`);
    console.log(`   Will update itinerary IDs: ${item.ids.join(', ')}`);

    // Download image from Cloudinary
    const imageData = await downloadImage(item.url);

    if (!imageData) {
      failCount++;
      continue;
    }

    // Upload to Supabase
    const newUrl = await uploadToSupabase(item.name, imageData);

    if (!newUrl) {
      failCount++;
      continue;
    }

    // Update database records
    const updated = await updateDatabase(item.ids, newUrl);

    if (updated) {
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log('\n=====================================');
  console.log('📊 Migration Summary:');
  console.log(`   ✅ Success: ${successCount} images`);
  console.log(`   ❌ Failed: ${failCount} images`);
  console.log('\n✅ Migration complete!');
}

// Run the migration
migrateItineraryImages().catch(console.error);