import { v2 as cloudinary } from 'cloudinary';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function uploadLogoToCloudinary(imageUrl, publicId) {
  try {
    console.log(`Uploading ${publicId}...`);

    const result = await cloudinary.uploader.upload(imageUrl, {
      public_id: publicId,
      folder: 'cruise-app/logos',
      overwrite: true,
      resource_type: 'image',
      transformation: [
        { quality: 'auto', fetch_format: 'auto' }
      ]
    });

    console.log(`✅ Uploaded: ${result.secure_url}`);
    return result.secure_url;
  } catch (error) {
    console.error(`❌ Failed to upload ${publicId}:`, error.message);
    return null;
  }
}

async function uploadLogos() {
  const logos = [
    {
      url: 'https://atlantisevents.com/wp-content/themes/atlantis/assets/images/logos/atlantis-logo.png',
      publicId: 'atlantis-logo'
    },
    {
      url: 'https://kgaytravel.com/wp-content/uploads/2019/05/k-gay-logo-blue1-hi-res.jpg',
      publicId: 'kgay-logo'
    }
  ];

  const results = {};

  for (const logo of logos) {
    const cloudinaryUrl = await uploadLogoToCloudinary(logo.url, logo.publicId);
    if (cloudinaryUrl) {
      results[logo.publicId] = cloudinaryUrl;
    }
  }

  console.log('\n=== Cloudinary Logo URLs ===');
  console.log(JSON.stringify(results, null, 2));

  console.log('\n=== Update navigation-banner.tsx with these URLs ===');
  for (const [key, url] of Object.entries(results)) {
    console.log(`${key}: ${url}`);
  }
}

uploadLogos();