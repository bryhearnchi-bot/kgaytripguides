import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Ship images mapping - we'll use the images we successfully downloaded
const shipImages = [
  { file: 'virgin-scarlet-lady.jpg', publicId: 'virgin-scarlet-lady', shipName: 'Virgin Scarlet Lady' },
  { file: 'virgin-valiant-lady.jpg', publicId: 'virgin-valiant-lady', shipName: 'Virgin Valiant Lady' },
  { file: 'virgin-resilient-lady.jpg', publicId: 'virgin-resilient-lady', shipName: 'Virgin Resilient Lady' },
  { file: 'virgin-explorer.jpg', publicId: 'virgin-explorer', shipName: 'Virgin Voyages Explorer' }
];

async function uploadAllShipImages() {
  console.log('🚀 Starting upload of ship images...\n');

  const results = [];

  for (let i = 0; i < shipImages.length; i++) {
    const ship = shipImages[i];
    const filePath = `ship-images/${ship.file}`;

    try {
      console.log(`⬆️  Uploading ${i + 1}/${shipImages.length}: ${ship.shipName}...`);

      // Check if file exists and has content
      if (!fs.existsSync(filePath)) {
        console.log(`❌ File not found: ${filePath}`);
        continue;
      }

      const stats = fs.statSync(filePath);
      if (stats.size < 1000) { // Less than 1KB probably means error
        console.log(`❌ File too small (${stats.size} bytes): ${filePath}`);
        continue;
      }

      const result = await cloudinary.uploader.upload(filePath, {
        folder: 'cruise-app/ships',
        public_id: ship.publicId,
        overwrite: true,
        resource_type: 'image',
        transformation: [
          { width: 1200, height: 800, crop: 'fill', quality: 'auto' }
        ]
      });

      results.push({
        filename: ship.file,
        publicId: ship.publicId,
        shipName: ship.shipName,
        url: result.secure_url,
        success: true
      });

      console.log(`✅ Success: ${result.secure_url}`);

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 300));

    } catch (error) {
      console.error(`❌ Failed to upload ${ship.shipName}:`, error.message);
      results.push({
        filename: ship.file,
        publicId: ship.publicId,
        shipName: ship.shipName,
        url: null,
        success: false,
        error: error.message
      });
    }
  }

  // Save results to JSON file for database update
  fs.writeFileSync('ship-upload-results.json', JSON.stringify(results, null, 2));

  console.log(`\n🎉 Upload complete!`);
  console.log(`📊 Total uploaded: ${results.filter(r => r.success).length}/${results.length}`);
  console.log(`📋 Results saved to: ship-upload-results.json\n`);

  // Show URLs for successful uploads
  console.log('✅ Successful uploads:');
  results.filter(r => r.success).forEach(result => {
    console.log(`${result.publicId}: ${result.url}`);
  });

  if (results.some(r => !r.success)) {
    console.log('\n❌ Failed uploads:');
    results.filter(r => !r.success).forEach(result => {
      console.log(`${result.filename}: ${result.error || 'File not found or too small'}`);
    });
  }
}

uploadAllShipImages();