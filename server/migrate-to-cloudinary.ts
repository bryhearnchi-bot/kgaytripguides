import { config } from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

// Load environment variables
config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface MigrationResult {
  localPath: string;
  cloudinaryUrl: string;
  publicId: string;
  folder: string;
}

async function uploadToCloudinary(filePath: string, folder: string): Promise<MigrationResult> {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: `cruise-app/${folder}`,
      use_filename: true,
      unique_filename: true,
      resource_type: 'auto',
      transformation: [
        { width: 1200, height: 1200, crop: 'limit', quality: 'auto' }
      ]
    });

    return {
      localPath: filePath,
      cloudinaryUrl: result.secure_url,
      publicId: result.public_id,
      folder: folder
    };
  } catch (error) {
    console.error(`Failed to upload ${filePath}:`, error);
    throw error;
  }
}

async function migrateImagesFromDirectory(directory: string, folderName: string): Promise<MigrationResult[]> {
  console.log(`\n📁 Migrating images from ${directory}...`);

  if (!fs.existsSync(directory)) {
    console.log(`❌ Directory ${directory} does not exist, skipping...`);
    return [];
  }

  const imagePatterns = [
    path.join(directory, '**/*.jpg'),
    path.join(directory, '**/*.jpeg'),
    path.join(directory, '**/*.png'),
    path.join(directory, '**/*.gif'),
    path.join(directory, '**/*.webp')
  ];

  const results: MigrationResult[] = [];

  for (const pattern of imagePatterns) {
    const files = await glob(pattern);

    for (const file of files) {
      try {
        console.log(`⬆️  Uploading: ${file}`);
        const result = await uploadToCloudinary(file, folderName);
        results.push(result);
        console.log(`✅ Uploaded: ${result.cloudinaryUrl}`);

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`❌ Failed to upload ${file}:`, error);
      }
    }
  }

  return results;
}

async function main() {
  console.log('🚀 Starting Cloudinary migration...');

  try {
    // Test Cloudinary connection
    const pingResult = await cloudinary.api.ping();
    console.log('✅ Cloudinary connection successful:', pingResult);
  } catch (error) {
    console.error('❌ Cloudinary connection failed:', error);
    process.exit(1);
  }

  const allResults: MigrationResult[] = [];

  // Migrate different image directories
  const migrationTasks = [
    { dir: 'server/public/talent-images', folder: 'talent' },
    { dir: 'server/public/event-images', folder: 'events' },
    { dir: 'server/public/itinerary-images', folder: 'itinerary' },
    { dir: 'server/public/cruise-images', folder: 'cruises' },
    { dir: 'server/public/uploads', folder: 'general' },
    { dir: 'dist/public/images/talent', folder: 'talent' },
    { dir: 'dist/public/images/ports', folder: 'ports' },
    { dir: 'dist/public/images/ships', folder: 'ships' },
    { dir: 'attached_assets', folder: 'assets' }
  ];

  for (const task of migrationTasks) {
    const results = await migrateImagesFromDirectory(task.dir, task.folder);
    allResults.push(...results);
  }

  // Save migration mapping for reference
  const mappingPath = 'cloudinary-migration-mapping.json';
  await fs.promises.writeFile(mappingPath, JSON.stringify(allResults, null, 2));

  console.log(`\n🎉 Migration complete!`);
  console.log(`📊 Total images migrated: ${allResults.length}`);
  console.log(`📋 Migration mapping saved to: ${mappingPath}`);
  console.log(`\nCloudinary folders created:`);

  const folders = Array.from(new Set(allResults.map(r => r.folder)));
  folders.forEach(folder => {
    const count = allResults.filter(r => r.folder === folder).length;
    console.log(`  📁 cruise-app/${folder}: ${count} images`);
  });

  // Show some example URLs
  console.log(`\n🔗 Example Cloudinary URLs:`);
  allResults.slice(0, 3).forEach(result => {
    console.log(`  ${result.localPath} → ${result.cloudinaryUrl}`);
  });

  console.log(`\n✨ Your images are now hosted on Cloudinary with automatic optimization!`);
}

// Run migration if this file is executed directly
main().catch(console.error);

export { main as migrateToCloudinary };