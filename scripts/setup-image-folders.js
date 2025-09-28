#!/usr/bin/env node

/**
 * Setup Supabase storage folders for image types
 * This script creates the necessary folders in the 'images' bucket
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Image type folders that need to be created
const imageFolders = [
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

async function setupImageFolders() {
  console.log('🚀 Setting up Supabase storage folders...');

  try {
    // First, check if the images bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError.message);
      return;
    }

    const imagesBucket = buckets.find(bucket => bucket.name === 'images');
    if (!imagesBucket) {
      console.log('📦 Creating images bucket...');
      const { data, error } = await supabase.storage.createBucket('images', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'],
        fileSizeLimit: 5242880 // 5MB
      });

      if (error) {
        console.error('❌ Error creating images bucket:', error.message);
        return;
      }
      console.log('✅ Images bucket created successfully');
    } else {
      console.log('✅ Images bucket already exists');
    }

    // Create folders by uploading a placeholder file to each folder
    console.log('📁 Creating image type folders...');

    for (const folder of imageFolders) {
      try {
        // Create a small placeholder file to establish the folder
        const placeholderContent = `# ${folder.toUpperCase()} IMAGES\nThis folder contains ${folder} images uploaded by the application.`;
        const placeholderBuffer = Buffer.from(placeholderContent, 'utf-8');

        const { data, error } = await supabase.storage
          .from('images')
          .upload(`${folder}/.gitkeep`, placeholderBuffer, {
            contentType: 'text/plain',
            upsert: true
          });

        if (error) {
          console.log(`⚠️  Folder ${folder} might already exist or error occurred:`, error.message);
        } else {
          console.log(`✅ Created folder: ${folder}/`);
        }
      } catch (err) {
        console.log(`⚠️  Error creating folder ${folder}:`, err.message);
      }
    }

    console.log('🎉 Supabase storage setup complete!');
    console.log('\nFolder structure:');
    imageFolders.forEach(folder => {
      console.log(`  📁 images/${folder}/`);
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the setup
setupImageFolders().then(() => {
  console.log('\n✨ Setup finished!');
}).catch(err => {
  console.error('❌ Setup failed:', err.message);
  process.exit(1);
});