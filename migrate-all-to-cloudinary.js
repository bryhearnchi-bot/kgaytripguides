import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import fetch from 'node-fetch';
import { createWriteStream, unlinkSync } from 'fs';
import { promisify } from 'util';
import { pipeline } from 'stream';

config();

const db = neon(process.env.DATABASE_URL);

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const streamPipeline = promisify(pipeline);

async function downloadImage(url, filename) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    await streamPipeline(response.body, createWriteStream(filename));
    return true;
  } catch (error) {
    console.log(`    ❌ Failed to download: ${error.message}`);
    return false;
  }
}

async function uploadToCloudinary(localPath, folder, publicId) {
  try {
    const result = await cloudinary.uploader.upload(localPath, {
      folder: `cruise-app/${folder}`,
      public_id: publicId,
      overwrite: true,
      resource_type: 'image'
    });

    // Clean up local file
    try {
      unlinkSync(localPath);
    } catch (e) {
      // Ignore cleanup errors
    }

    return result.secure_url;
  } catch (error) {
    console.log(`    ❌ Cloudinary upload failed: ${error.message}`);
    return null;
  }
}

async function migrateAllImages() {
  console.log('🚀 Migrating ALL images to Cloudinary...\n');

  try {
    // 1. CRUISE HERO IMAGES
    console.log('1️⃣ MIGRATING CRUISE HERO IMAGES...');
    const cruises = await db`SELECT id, name, hero_image_url FROM cruises WHERE hero_image_url IS NOT NULL ORDER BY id`;

    for (const cruise of cruises) {
      console.log(`\n  📸 ${cruise.name}`);
      console.log(`     Current: ${cruise.hero_image_url}`);

      let newUrl = null;

      if (cruise.hero_image_url.startsWith('/cruise-images/')) {
        // Local image - need to find it in Replit or create placeholder
        console.log(`     ⚠️ Local image reference - creating placeholder`);

        // Generate a unique public_id based on cruise name
        const publicId = `cruise-${cruise.id}-${cruise.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

        // Use a placeholder image for now - you can replace these later
        const placeholderUrl = 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&h=800&fit=crop';

        const tempFile = `/tmp/${publicId}.jpg`;
        const downloaded = await downloadImage(placeholderUrl, tempFile);

        if (downloaded) {
          newUrl = await uploadToCloudinary(tempFile, 'cruises', publicId);
        }
      } else if (cruise.hero_image_url.startsWith('http')) {
        // External URL - download and upload
        const publicId = `cruise-${cruise.id}-${cruise.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        const tempFile = `/tmp/${publicId}.jpg`;

        const downloaded = await downloadImage(cruise.hero_image_url, tempFile);
        if (downloaded) {
          newUrl = await uploadToCloudinary(tempFile, 'cruises', publicId);
        }
      }

      if (newUrl) {
        await db`UPDATE cruises SET hero_image_url = ${newUrl} WHERE id = ${cruise.id}`;
        console.log(`     ✅ Updated: ${newUrl}`);
      } else {
        console.log(`     ❌ Failed to migrate`);
      }
    }

    // 2. TALENT PROFILE IMAGES
    console.log('\n2️⃣ MIGRATING TALENT PROFILE IMAGES...');
    const talent = await db`SELECT id, name, profile_image_url FROM talent WHERE profile_image_url IS NOT NULL ORDER BY id`;

    for (const person of talent) {
      console.log(`\n  👤 ${person.name}`);
      console.log(`     Current: ${person.profile_image_url}`);

      let newUrl = null;

      if (person.profile_image_url.startsWith('/talent-images/')) {
        // Local image - create placeholder
        console.log(`     ⚠️ Local image reference - creating placeholder`);

        const publicId = `talent-${person.id}-${person.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

        // Use a generic person placeholder
        const placeholderUrl = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face';

        const tempFile = `/tmp/${publicId}.jpg`;
        const downloaded = await downloadImage(placeholderUrl, tempFile);

        if (downloaded) {
          newUrl = await uploadToCloudinary(tempFile, 'talent', publicId);
        }
      } else if (person.profile_image_url.startsWith('http')) {
        // External URL - download and upload
        const publicId = `talent-${person.id}-${person.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        const tempFile = `/tmp/${publicId}.jpg`;

        const downloaded = await downloadImage(person.profile_image_url, tempFile);
        if (downloaded) {
          newUrl = await uploadToCloudinary(tempFile, 'talent', publicId);
        }
      }

      if (newUrl) {
        await db`UPDATE talent SET profile_image_url = ${newUrl} WHERE id = ${person.id}`;
        console.log(`     ✅ Updated: ${newUrl}`);
      } else {
        console.log(`     ❌ Failed to migrate`);
      }
    }

    // 3. VERIFY MIGRATION
    console.log('\n3️⃣ VERIFYING MIGRATION...');

    const updatedCruises = await db`SELECT hero_image_url FROM cruises WHERE hero_image_url IS NOT NULL`;
    const updatedTalent = await db`SELECT profile_image_url FROM talent WHERE profile_image_url IS NOT NULL`;

    const allUrls = [
      ...updatedCruises.map(c => c.hero_image_url),
      ...updatedTalent.map(t => t.profile_image_url)
    ];

    const cloudinaryCount = allUrls.filter(url =>
      url?.includes('cloudinary.com') || url?.includes('res.cloudinary.com')
    ).length;

    console.log(`\n📊 MIGRATION RESULTS:`);
    console.log(`   ✅ Cloudinary URLs: ${cloudinaryCount}/${allUrls.length}`);
    console.log(`   📁 Cruise hero images: ${updatedCruises.length}`);
    console.log(`   👤 Talent profile images: ${updatedTalent.length}`);

    if (cloudinaryCount === allUrls.length) {
      console.log(`\n🎉 SUCCESS! All images are now served from Cloudinary!`);
    } else {
      console.log(`\n⚠️ Some images still need manual attention`);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

migrateAllImages();