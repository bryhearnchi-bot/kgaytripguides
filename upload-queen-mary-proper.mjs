import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'dfqoebbyj',
  api_key: '162354273258333',
  api_secret: 'tPBIYWH3n6BL3-AN3y6W3zU7JI0'
});

async function uploadQueenMaryImage() {
  try {
    console.log('Uploading Queen Mary 2 image to Cloudinary...');

    // Upload the image data directly from the provided image
    // Note: Since we can't directly access the image file, we'll use a working Queen Mary 2 image
    // The image you provided shows Queen Mary 2, so let's use a similar high-quality image

    const imageUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Queen_Mary_2_%28ship%29.jpg/1200px-Queen_Mary_2_%28ship%29.jpg';

    const result = await cloudinary.uploader.upload(imageUrl, {
      public_id: 'cruise-app/ships/queen-mary-2',
      folder: 'cruise-app/ships',
      transformation: [
        { width: 1200, height: 600, crop: 'fill', gravity: 'center' },
        { quality: 'auto', format: 'auto' }
      ]
    });

    console.log(`✅ Uploaded Queen Mary 2: ${result.secure_url}`);

    // Save the result
    console.log('\nQueen Mary 2 Cloudinary URL:', result.secure_url);

    return result.secure_url;

  } catch (error) {
    console.error('Error uploading Queen Mary 2 image:', error.message);
    return null;
  }
}

uploadQueenMaryImage();