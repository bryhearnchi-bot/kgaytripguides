import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'dfqoebbyj',
  api_key: '162354273258333',
  api_secret: 'tPBIYWH3n6BL3-AN3y6W3zU7JI0'
});

// Ship image files from Downloads folder
const shipImages = [
  {
    path: '/Users/bryan/Downloads/norwegian-cruise-line-bliss-review-ship.jpg',
    shipName: 'norwegian-bliss',
    cruiseName: 'Alaska Inside Passage'
  },
  {
    path: '/Users/bryan/Downloads/Viking_Star_at_Pier_24_in_Tallinn_20_May_2016.jpg',
    shipName: 'viking-star',
    cruiseName: 'Baltic Capitals Explorer'
  },
  {
    path: '/Users/bryan/Downloads/Harmony-of-the-Seas-cruise-ship-scorecard-review-feature-1024x597.jpg.optimal.jpg',
    shipName: 'harmony-of-the-seas',
    cruiseName: 'Caribbean Paradise'
  },
  {
    path: '/Users/bryan/Downloads/apex.webp',
    shipName: 'celebrity-apex',
    cruiseName: 'Mediterranean Dreams'
  }
];

async function uploadShipHeroImages() {
  console.log('Starting Cloudinary upload for ship hero images...');

  const results = [];

  for (const image of shipImages) {
    try {
      // Check if file exists
      if (!fs.existsSync(image.path)) {
        console.log(`❌ File not found: ${image.path}`);
        results.push({
          shipName: image.shipName,
          cruiseName: image.cruiseName,
          success: false,
          error: 'File not found'
        });
        continue;
      }

      console.log(`\nUploading ${image.shipName} for ${image.cruiseName}...`);

      const result = await cloudinary.uploader.upload(image.path, {
        public_id: `cruise-app/ships/${image.shipName}`,
        folder: 'cruise-app/ships',
        transformation: [
          { width: 1200, height: 600, crop: 'fill', gravity: 'center' },
          { quality: 'auto', format: 'auto' }
        ]
      });

      console.log(`✅ Uploaded successfully: ${result.secure_url}`);

      results.push({
        shipName: image.shipName,
        cruiseName: image.cruiseName,
        public_id: result.public_id,
        secure_url: result.secure_url,
        success: true
      });

    } catch (error) {
      console.error(`❌ Failed to upload ${image.shipName}:`, error.message);
      results.push({
        shipName: image.shipName,
        cruiseName: image.cruiseName,
        success: false,
        error: error.message
      });
    }
  }

  // Save results to file
  fs.writeFileSync('./ship-hero-upload-results.json', JSON.stringify(results, null, 2));

  console.log('\n=== UPLOAD SUMMARY ===');
  console.log(`Total images: ${shipImages.length}`);
  console.log(`Successful uploads: ${results.filter(r => r.success).length}`);
  console.log(`Failed uploads: ${results.filter(r => !r.success).length}`);

  console.log('\nSuccessful uploads:');
  results.filter(r => r.success).forEach(result => {
    console.log(`${result.cruiseName} (${result.shipName}) -> ${result.secure_url}`);
  });

  if (results.some(r => !r.success)) {
    console.log('\nFailed uploads:');
    results.filter(r => !r.success).forEach(result => {
      console.log(`${result.cruiseName} (${result.shipName}) -> ${result.error}`);
    });
  }

  console.log('\nResults saved to ship-hero-upload-results.json');
}

uploadShipHeroImages().catch(console.error);