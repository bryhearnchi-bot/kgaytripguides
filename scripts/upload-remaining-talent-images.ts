/**
 * Script to upload remaining Halloween trip talent images to Supabase Storage
 */

import { createClient } from '@supabase/supabase-js';
import { downloadImageFromUrl } from '../server/image-utils.js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Remaining talent images to download and upload
const talentImages = [
  {
    id: 48, // Cacophony Daniels
    name: 'Cacophony Daniels',
    url: 'https://cdn.provincetownindependent.org/2020/07/Fulcher-Cacophony-Daniels-photo-2-courtesy-Cacophony-Daniels.jpg',
    filename: 'cacophony-daniels.jpg',
  },
];

async function uploadTalentImages() {
  console.log('Starting remaining talent image upload process...\n');

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const talent of talentImages) {
    try {
      console.log(`Processing: ${talent.name} (ID: ${talent.id})`);

      if (!talent.url) {
        console.log(`  ⚠️  Skipping - no URL available\n`);
        skipCount++;
        continue;
      }

      console.log(`  📥 Downloading from: ${talent.url}`);

      // Download and upload to Supabase Storage
      const supabaseUrl = await downloadImageFromUrl(talent.url, 'talent', talent.filename);

      console.log(`  ✅ Uploaded to: ${supabaseUrl}`);

      // Update the talent record in the database
      const { error: updateError } = await supabase
        .from('talent')
        .update({ profile_image_url: supabaseUrl })
        .eq('id', talent.id);

      if (updateError) {
        console.error(`  ❌ Failed to update database: ${updateError.message}\n`);
        errorCount++;
        continue;
      }

      console.log(`  ✅ Database updated successfully\n`);
      successCount++;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`  ❌ Error processing ${talent.name}: ${message}\n`);
      errorCount++;
    }
  }

  console.log('\n=== Upload Summary ===');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`⚠️  Skipped: ${skipCount}`);
  console.log(`❌ Errors: ${errorCount}`);
}

// Run the script
uploadTalentImages()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`\n❌ Script failed: ${message}`);
    process.exit(1);
  });
