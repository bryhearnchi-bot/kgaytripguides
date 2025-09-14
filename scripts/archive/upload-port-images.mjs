import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Port images mapping based on filename to clean public ID
const portImages = [
  { file: 'Alexandria_Egypt_cruise_port_764a37c8.png', publicId: 'alexandria-egypt', portName: 'Alexandria (Cairo), Egypt' },
  { file: 'Athens_Greece_port_scenic_0bfb845f.png', publicId: 'athens-greece', portName: 'Athens, Greece' },
  { file: 'Iraklion_Crete_cruise_port_faa24cff.png', publicId: 'iraklion-crete', portName: 'Iraklion, Crete' },
  { file: 'Istanbul_Turkey_cruise_port_e82f2c8b.png', publicId: 'istanbul-turkey', portName: 'Istanbul, Turkey' },
  { file: 'Kusadasi_Turkey_port_scenic_cf0f15d9.png', publicId: 'kusadasi-turkey', portName: 'Kuşadası, Turkey' },
  { file: 'Mykonos_Greece_cruise_port_ae350664.png', publicId: 'mykonos-greece', portName: 'Mykonos, Greece' },
  { file: 'Santorini_Greece_cruise_port_ed3e2e0a.png', publicId: 'santorini-greece', portName: 'Santorini, Greece' }
];

async function uploadAllPortImages() {
  console.log('🚀 Starting upload of all 7 port images...\n');

  const results = [];

  for (let i = 0; i < portImages.length; i++) {
    const port = portImages[i];
    const filePath = `attached_assets/generated_images/${port.file}`;

    try {
      console.log(`⬆️  Uploading ${i + 1}/7: ${port.file}...`);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.log(`❌ File not found: ${filePath}`);
        continue;
      }

      const result = await cloudinary.uploader.upload(filePath, {
        folder: 'cruise-app/ports',
        public_id: port.publicId,
        overwrite: true,
        resource_type: 'image',
        transformation: [
          { width: 800, height: 600, crop: 'fill', quality: 'auto' }
        ]
      });

      results.push({
        filename: port.file,
        publicId: port.publicId,
        portName: port.portName,
        url: result.secure_url,
        success: true
      });

      console.log(`✅ Success: ${result.secure_url}`);

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 300));

    } catch (error) {
      console.error(`❌ Failed to upload ${port.file}:`, error.message);
      results.push({
        filename: port.file,
        publicId: port.publicId,
        portName: port.portName,
        url: null,
        success: false,
        error: error.message
      });
    }
  }

  // Save results to JSON file for database update
  fs.writeFileSync('port-upload-results.json', JSON.stringify(results, null, 2));

  console.log(`\n🎉 Upload complete!`);
  console.log(`📊 Total uploaded: ${results.filter(r => r.success).length}/${results.length}`);
  console.log(`📋 Results saved to: port-upload-results.json\n`);

  // Show URLs for successful uploads
  console.log('✅ Successful uploads:');
  results.filter(r => r.success).forEach(result => {
    console.log(`${result.publicId}: ${result.url}`);
  });

  if (results.some(r => !r.success)) {
    console.log('\n❌ Failed uploads:');
    results.filter(r => !r.success).forEach(result => {
      console.log(`${result.filename}: ${result.error}`);
    });
  }
}

uploadAllPortImages();