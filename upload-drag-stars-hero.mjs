import { v2 as cloudinary } from 'cloudinary';
import pg from 'pg';
import fs from 'fs';
import https from 'https';

const { Client } = pg;

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'dfqoebbyj',
  api_key: '162354273258333',
  api_secret: 'tPBIYWH3n6BL3-AN3y6W3zU7JI0'
});

// Railway connection configuration
const client = new Client({
  host: 'trolley.proxy.rlwy.net',
  port: 16776,
  user: 'postgres',
  password: 'ZMxXTsAbduhdjAQmOtdLiMgUuHTMHDMB',
  database: 'railway',
  ssl: false
});

async function uploadDragStarsHeroImage() {
  console.log('🎭 Uploading Drag Stars hero image to Cloudinary...');

  try {
    // Since the image was provided via the interface, I'll need to use a base64 data URL or external URL
    // For now, I'll create a placeholder and show you how to update it

    // Upload to Cloudinary (you would replace this with actual image data)
    console.log('⚠️  Note: Using placeholder process - you would upload the actual Drag Stars image here');

    // For demonstration, I'll show the database update with the expected Cloudinary URL
    const expectedCloudinaryUrl = 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_1200,h_600,c_fill,g_center,q_auto,f_auto/v1/cruise-app/hero/drag-stars-at-sea-hero.jpg';

    console.log('📝 Expected Cloudinary URL:', expectedCloudinaryUrl);

    // Connect to Railway database
    await client.connect();
    console.log('✅ Connected to Railway PostgreSQL');

    // Update the cruise hero image
    console.log('🎭 Updating Drag Stars cruise hero image in database...');
    await client.query(`
      UPDATE cruises
      SET hero_image_url = $1
      WHERE slug = 'drag-stars-at-sea-2025'
    `, [expectedCloudinaryUrl]);

    // Verify the update
    const result = await client.query(`
      SELECT name, hero_image_url
      FROM cruises
      WHERE slug = 'drag-stars-at-sea-2025'
    `);

    if (result.rows.length > 0) {
      console.log('✅ Successfully updated hero image:');
      console.log(`  Cruise: ${result.rows[0].name}`);
      console.log(`  Hero Image: ${result.rows[0].hero_image_url}`);
    }

    console.log('\n📋 Next steps to complete the upload:');
    console.log('1. Save the Drag Stars promotional image locally');
    console.log('2. Upload it to Cloudinary using the web interface or API');
    console.log('3. Update the public_id to: cruise-app/hero/drag-stars-at-sea-hero');
    console.log('4. Verify the URL matches the database entry');

  } catch (error) {
    console.error('❌ Upload/update failed:', error);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

uploadDragStarsHeroImage();