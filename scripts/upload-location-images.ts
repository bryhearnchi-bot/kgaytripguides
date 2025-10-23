import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../server/logging/logger';
import https from 'https';
import { promises as fs } from 'fs';
import fsSync from 'fs';
import path from 'path';
import os from 'os';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  logger.error('FATAL: Supabase configuration missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Curated Unsplash images for each location (all royalty-free, no attribution required)
const locationImages = [
  {
    id: 54,
    name: 'Hong Kong',
    // Hong Kong skyline from Victoria Harbour
    unsplashUrl: 'https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=1600&q=80',
    filename: 'hong-kong.jpg',
  },
  {
    id: 75,
    name: 'Labadee',
    // Tropical beach with zip line or Caribbean beach
    unsplashUrl: 'https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=1600&q=80',
    filename: 'labadee-haiti.jpg',
  },
  {
    id: 76,
    name: 'San Juan',
    // Old San Juan colorful buildings
    unsplashUrl: 'https://images.unsplash.com/photo-1591634616938-1dfa7ee2e617?w=1600&q=80',
    filename: 'san-juan-puerto-rico.jpg',
  },
  {
    id: 61,
    name: 'Singapore',
    // Singapore Marina Bay Sands and skyline
    unsplashUrl: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1600&q=80',
    filename: 'singapore.jpg',
  },
  {
    id: 77,
    name: 'St. Maarten',
    // Caribbean beach (Orient Beach or Maho Beach)
    unsplashUrl: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1600&q=80',
    filename: 'st-maarten.jpg',
  },
  {
    id: 60,
    name: 'Ko Samui',
    // Thailand tropical beach with palms
    unsplashUrl: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1600&q=80',
    filename: 'ko-samui-thailand.jpg',
  },
  {
    id: 59,
    name: 'Laem Chabang (Bangkok)',
    // Bangkok skyline or temple
    unsplashUrl: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=1600&q=80',
    filename: 'bangkok-thailand.jpg',
  },
  {
    id: 69,
    name: 'Miami',
    // Miami South Beach or skyline
    unsplashUrl: 'https://images.unsplash.com/photo-1533106418989-88406c7cc8ca?w=1600&q=80',
    filename: 'miami-florida.jpg',
  },
  {
    id: 56,
    name: 'Hanoi',
    // Hanoi Old Quarter or temple
    unsplashUrl: 'https://images.unsplash.com/photo-1509600110300-21b9d5fedeb7?w=1600&q=80',
    filename: 'hanoi-vietnam.jpg',
  },
  {
    id: 58,
    name: 'Phu My (Ho Chi Minh City)',
    // Ho Chi Minh City skyline or street
    unsplashUrl: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1600&q=80',
    filename: 'ho-chi-minh-city-vietnam.jpg',
  },
];

// Download image from URL to temp directory
async function downloadImage(url: string, filename: string): Promise<string> {
  const tempDir = os.tmpdir();
  const tempPath = path.join(tempDir, filename);

  logger.info(`Downloading image from ${url}...`);

  return new Promise((resolve, reject) => {
    const file = fsSync.createWriteStream(tempPath);

    https
      .get(url, response => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download: ${response.statusCode}`));
          return;
        }

        response.pipe(file);

        file.on('finish', () => {
          file.close();
          logger.info(`Downloaded to ${tempPath}`);
          resolve(tempPath);
        });
      })
      .on('error', err => {
        fsSync.unlink(tempPath, () => {});
        reject(err);
      });
  });
}

// Upload image to Supabase Storage
async function uploadToSupabase(localPath: string, filename: string): Promise<string> {
  logger.info(`Uploading ${filename} to Supabase Storage...`);

  // Read file
  const fileBuffer = await fs.readFile(localPath);

  // Upload to locations bucket
  const storagePath = `locations/${filename}`;
  const { data, error } = await supabase.storage.from('images').upload(storagePath, fileBuffer, {
    contentType: 'image/jpeg',
    upsert: true, // Overwrite if exists
  });

  if (error) {
    logger.error(`Failed to upload ${filename}`, error);
    throw error;
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from('images').getPublicUrl(storagePath);

  logger.info(`Uploaded successfully: ${publicUrl}`);
  return publicUrl;
}

// Update location record with image URL
async function updateLocationImage(locationId: number, imageUrl: string): Promise<void> {
  logger.info(`Updating location ${locationId} with image URL...`);

  const { error } = await supabase
    .from('locations')
    .update({ image_url: imageUrl })
    .eq('id', locationId);

  if (error) {
    logger.error(`Failed to update location ${locationId}`, error);
    throw error;
  }

  logger.info(`Location ${locationId} updated successfully`);
}

// Main function
async function main() {
  try {
    logger.info('Starting location images upload process...');
    logger.info(`Processing ${locationImages.length} locations`);

    for (const location of locationImages) {
      logger.info(`\n${'='.repeat(60)}`);
      logger.info(`Processing: ${location.name} (ID: ${location.id})`);
      logger.info('='.repeat(60));

      try {
        // Step 1: Download image from Unsplash
        const tempPath = await downloadImage(location.unsplashUrl, location.filename);

        // Step 2: Upload to Supabase Storage
        const supabaseUrl = await uploadToSupabase(tempPath, location.filename);

        // Step 3: Update location record
        await updateLocationImage(location.id, supabaseUrl);

        // Step 4: Clean up temp file
        await fs.unlink(tempPath);
        logger.info(`Cleaned up temp file: ${tempPath}`);

        logger.info(`✅ ${location.name} - COMPLETE`);
      } catch (error) {
        logger.error(`❌ Failed to process ${location.name}`, error);
        // Continue with next location even if one fails
      }
    }

    logger.info(`\n${'='.repeat(60)}`);
    logger.info('✅ Location images upload completed!');
    logger.info('='.repeat(60));
    logger.info('\nNEXT STEPS:');
    logger.info('1. Verify images in Supabase Storage dashboard');
    logger.info('2. Check locations in database have image_url populated');
    logger.info('3. Test trip pages to see hero carousel images');
  } catch (error) {
    logger.error('❌ Location images upload failed', error);
    process.exit(1);
  }
}

// Run the script
main();
