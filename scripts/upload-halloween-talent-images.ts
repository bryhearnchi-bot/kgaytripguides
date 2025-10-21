/**
 * Script to download and upload Halloween trip talent images to Supabase Storage
 *
 * This script:
 * 1. Downloads images from external URLs
 * 2. Uploads them to Supabase Storage
 * 3. Updates the talent records with the Supabase storage URLs
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

// Talent images to download and upload
const talentImages = [
  {
    id: 48, // Cacophony Daniels
    name: 'Cacophony Daniels',
    // Instagram profile or promotional photo - will need manual upload
    url: null,
    filename: 'cacophony-daniels.jpg',
  },
  {
    id: 47, // Christina Bianco
    name: 'Christina Bianco',
    // Wix site - will need manual upload
    url: null,
    filename: 'christina-bianco.jpg',
  },
  {
    id: 54, // Duel Reality
    name: 'Duel Reality',
    url: 'https://7fingers.com/sites/default/files/shows/images/duel3.jpg',
    filename: 'duel-reality.jpg',
  },
  {
    id: 53, // Dylan Adler
    name: 'Dylan Adler',
    // Edinburgh Fringe - will need manual upload
    url: null,
    filename: 'dylan-adler.jpg',
  },
  {
    id: 52, // Erin Foley
    name: 'Erin Foley',
    url: 'https://images.squarespace-cdn.com/content/v1/6802e4e8ae4d0521ea8119db/06261599-1bb8-47af-8f96-07fa05f365b1/Erin+Foley+stage.png',
    filename: 'erin-foley.png',
  },
  {
    id: 46, // Ge Enrique
    name: 'Ge Enrique',
    // Facebook page - will need manual upload
    url: null,
    filename: 'ge-enrique.jpg',
  },
  {
    id: 50, // Miss Richfield 1981
    name: 'Miss Richfield 1981',
    url: 'https://missrichfield.com/wp-content/uploads/2025/09/mr-head.jpg',
    filename: 'miss-richfield-1981.jpg',
  },
  {
    id: 57, // Murder in the Manor
    name: 'Murder in the Manor',
    url: 'https://vvinsider.com/wp-content/uploads/2025/09/IMG_8573-scaled.jpeg',
    filename: 'murder-in-the-manor.jpeg',
  },
  {
    id: 55, // Red Hot
    name: 'Red Hot',
    url: 'https://vvinsider.com/wp-content/uploads/2025/03/Red-Hot.jpg',
    filename: 'red-hot.jpg',
  },
  {
    id: 51, // Solea Pfeiffer
    name: 'Solea Pfeiffer',
    url: 'https://assets.playbill.com/editorial/_articleLeadImage/03.-Solea-Pfeiffer-as-Satine-and-John-Cardoza-as-Christian-01-Photo-by-Evan-Zimmerman-for-MurphyMade.jpg',
    filename: 'solea-pfeiffer.jpg',
  },
  {
    id: 49, // Sutton Lee Seymour
    name: 'Sutton Lee Seymour',
    // Instagram or Atlantis Events - will need manual upload
    url: null,
    filename: 'sutton-lee-seymour.jpg',
  },
  {
    id: 56, // Up With a Twist
    name: 'Up With a Twist',
    url: 'https://vvinsider.com/wp-content/uploads/2025/08/250731-Setups-2231-scaled.jpg',
    filename: 'up-with-a-twist.jpg',
  },
];

async function uploadTalentImages() {
  console.log('Starting talent image upload process...\n');

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const talent of talentImages) {
    try {
      console.log(`Processing: ${talent.name} (ID: ${talent.id})`);

      if (!talent.url) {
        console.log(`  ⚠️  Skipping - no URL available (manual upload required)\n`);
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
  console.log('\nTalent that need manual upload:');
  talentImages.filter(t => !t.url).forEach(t => console.log(`  - ${t.name} (ID: ${t.id})`));
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
