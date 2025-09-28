import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// All image type folders that should exist
const folders = [
  'ships',
  'resorts',
  'locations',
  'events',
  'talent',
  'trips',
  'itinerary',
  'general',
  'profiles'
];

async function createAllFolders() {
  console.log('🚀 Creating all image folders in Supabase storage...');

  // Create a small test image buffer (1x1 pixel PNG)
  const testImageBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU7HkQAAAABJRU5ErkJggg==',
    'base64'
  );

  for (const folder of folders) {
    try {
      console.log(`📁 Creating folder: ${folder}/`);

      const { data, error } = await supabase.storage
        .from('images')
        .upload(`${folder}/.gitkeep`, testImageBuffer, {
          contentType: 'image/png',
          upsert: true
        });

      if (error) {
        console.log(`⚠️  ${folder}: ${error.message}`);
      } else {
        console.log(`✅ ${folder}/ created successfully`);

        // Clean up the placeholder file
        await supabase.storage
          .from('images')
          .remove([`${folder}/.gitkeep`]);
      }
    } catch (err) {
      console.log(`❌ Error creating ${folder}:`, err.message);
    }
  }

  console.log('\n🎉 All folders processed!');
  console.log('Folders are now ready for image uploads.');
}

createAllFolders();