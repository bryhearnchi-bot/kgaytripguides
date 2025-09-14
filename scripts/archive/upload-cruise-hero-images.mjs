import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'dfqoebbyj',
  api_key: '162354273258333',
  api_secret: 'tPBIYWH3n6BL3-AN3y6W3zU7JI0'
});

const imagesFolder = './server/public/cruise-images/';

// Upload function
async function uploadCruiseHeroImages() {
  console.log('Starting Cloudinary upload for cruise hero images...');

  const files = fs.readdirSync(imagesFolder).filter(file =>
    file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')
  );

  console.log(`Found ${files.length} images to upload:`);
  files.forEach(file => console.log(`- ${file}`));

  const results = [];

  for (const file of files) {
    try {
      const filePath = path.join(imagesFolder, file);
      console.log(`\nUploading ${file}...`);

      // Create a cleaner public_id from filename
      const publicId = `cruise-app/hero/${file.replace(/\.[^/.]+$/, "").toLowerCase().replace(/_/g, '-')}`;

      const result = await cloudinary.uploader.upload(filePath, {
        public_id: publicId,
        folder: 'cruise-app/hero',
        transformation: [
          { width: 1200, height: 600, crop: 'fill', gravity: 'center' },
          { quality: 'auto', format: 'auto' }
        ]
      });

      console.log(`✅ Uploaded successfully: ${result.secure_url}`);

      results.push({
        filename: file,
        public_id: result.public_id,
        secure_url: result.secure_url,
        success: true
      });

    } catch (error) {
      console.error(`❌ Failed to upload ${file}:`, error.message);
      results.push({
        filename: file,
        success: false,
        error: error.message
      });
    }
  }

  // Save results to file
  fs.writeFileSync('./cruise-hero-upload-results.json', JSON.stringify(results, null, 2));

  console.log('\n=== UPLOAD SUMMARY ===');
  console.log(`Total files: ${files.length}`);
  console.log(`Successful uploads: ${results.filter(r => r.success).length}`);
  console.log(`Failed uploads: ${results.filter(r => !r.success).length}`);

  console.log('\nSuccessful uploads:');
  results.filter(r => r.success).forEach(result => {
    console.log(`${result.filename} -> ${result.secure_url}`);
  });

  if (results.some(r => !r.success)) {
    console.log('\nFailed uploads:');
    results.filter(r => !r.success).forEach(result => {
      console.log(`${result.filename} -> ${result.error}`);
    });
  }

  console.log('\nResults saved to cruise-hero-upload-results.json');
}

uploadCruiseHeroImages().catch(console.error);