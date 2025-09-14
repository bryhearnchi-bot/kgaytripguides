import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Talent mapping based on filename to clean public ID
const talents = [
  { file: 'talent-1-audra-mcdonald.jpeg', publicId: 'audra-mcdonald' },
  { file: 'talent-2-mont-x-change.jpg', publicId: 'monet-x-change' },
  { file: 'talent-3-alexis-michelle.jpg', publicId: 'alexis-michelle' },
  { file: 'talent-4-leona-winter.jpg', publicId: 'leona-winter' },
  { file: 'talent-5-sherry-vine.png', publicId: 'sherry-vine' },
  { file: 'talent-6-reuben-kaye.jpg', publicId: 'reuben-kaye' },
  { file: 'talent-7-rob-houchen.jpg', publicId: 'rob-houchen' },
  { file: 'talent-8-alyssa-wray.jpg', publicId: 'alyssa-wray' },
  { file: 'talent-9-brad-loekle.jpg', publicId: 'brad-loekle' },
  { file: 'talent-10-rachel-scanlon.png', publicId: 'rachel-scanlon' },
  { file: 'talent-11-daniel-webb.jpg', publicId: 'daniel-webb' },
  { file: 'talent-12-airotic.webp', publicId: 'airotic' },
  { file: 'talent-13-another-rose.jpg', publicId: 'another-rose' },
  { file: 'talent-14-persephone.jpg', publicId: 'persephone' },
  { file: 'talent-15-the-diva-bingo.jpeg', publicId: 'the-diva-bingo' },
  { file: 'talent-16-abel.jpg', publicId: 'abel' },
  { file: 'talent-17-dan-slater.jpg', publicId: 'dan-slater' },
  { file: 'talent-18-dj-suri.jpg', publicId: 'dj-suri' },
  { file: 'talent-19-gsp.jpg', publicId: 'gsp' },
  { file: 'talent-20-william-tn-hall.jpg', publicId: 'william-tn-hall' },
  { file: 'talent-21-brian-nash.jpg', publicId: 'brian-nash' },
  { file: 'talent-22-brandon-james-gwinn.jpg', publicId: 'brandon-james-gwinn' }
];

async function uploadAllTalents() {
  console.log('🚀 Starting upload of all 22 talent images...\n');

  const results = [];

  for (let i = 0; i < talents.length; i++) {
    const talent = talents[i];
    const filePath = `talent-images/${talent.file}`;

    try {
      console.log(`⬆️  Uploading ${i + 1}/22: ${talent.file}...`);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.log(`❌ File not found: ${filePath}`);
        continue;
      }

      const result = await cloudinary.uploader.upload(filePath, {
        folder: 'cruise-app/talent',
        public_id: talent.publicId,
        overwrite: true,
        resource_type: 'image',
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto' }
        ]
      });

      results.push({
        filename: talent.file,
        publicId: talent.publicId,
        url: result.secure_url,
        success: true
      });

      console.log(`✅ Success: ${result.secure_url}`);

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 300));

    } catch (error) {
      console.error(`❌ Failed to upload ${talent.file}:`, error.message);
      results.push({
        filename: talent.file,
        publicId: talent.publicId,
        url: null,
        success: false,
        error: error.message
      });
    }
  }

  // Save results to JSON file for database update
  fs.writeFileSync('talent-upload-results.json', JSON.stringify(results, null, 2));

  console.log(`\n🎉 Upload complete!`);
  console.log(`📊 Total uploaded: ${results.filter(r => r.success).length}/${results.length}`);
  console.log(`📋 Results saved to: talent-upload-results.json\n`);

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

uploadAllTalents();