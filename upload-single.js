const { v2: cloudinary } = require('cloudinary');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadSingleImage() {
  try {
    const result = await cloudinary.uploader.upload(
      'dist/public/images/talent/talent_1_audra-mcdonald-will-swenson-logo-50940-1.jpeg',
      {
        folder: 'cruise-app/talent',
        public_id: 'audra-mcdonald',
        overwrite: true,
        resource_type: 'image'
      }
    );

    console.log('Upload successful!');
    console.log('URL:', result.secure_url);
    console.log('Public ID:', result.public_id);

    // Test the URL with transformations
    const transformedUrl = cloudinary.url(result.public_id, {
      width: 400,
      height: 400,
      crop: 'fill',
      gravity: 'face',
      quality: 'auto',
      format: 'auto'
    });

    console.log('Transformed URL:', transformedUrl);

  } catch (error) {
    console.error('Upload failed:', error);
  }
}

uploadSingleImage();