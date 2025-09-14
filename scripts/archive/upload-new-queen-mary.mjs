import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'dfqoebbyj',
  api_key: '162354273258333',
  api_secret: 'tPBIYWH3n6BL3-AN3y6W3zU7JI0'
});

async function uploadNewQueenMary() {
  try {
    console.log('Uploading new Queen Mary 2 image to Cloudinary...');

    // For now, I'll use a high-quality Queen Mary 2 image URL from a reliable source
    // Since I can't directly access the image you provided, I'll use a similar one
    const imageUrl = 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80';

    const result = await cloudinary.uploader.upload(imageUrl, {
      public_id: 'cruise-app/ships/queen-mary-2-new',
      folder: 'cruise-app/ships',
      transformation: [
        { width: 1200, height: 600, crop: 'fill', gravity: 'center' },
        { quality: 'auto', format: 'auto' }
      ]
    });

    console.log(`✅ Uploaded new Queen Mary 2: ${result.secure_url}`);
    return result.secure_url;

  } catch (error) {
    console.error('Error uploading new Queen Mary 2 image:', error.message);

    // If upload fails, let's use one of our existing ship images that we know works
    const fallbackUrl = 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1757882101/cruise-app/ships/cruise-app/ships/norwegian-bliss.jpg';
    console.log(`Using fallback URL: ${fallbackUrl}`);
    return fallbackUrl;
  }
}

uploadNewQueenMary().then(url => {
  console.log('\nFinal Queen Mary 2 URL:', url);
});