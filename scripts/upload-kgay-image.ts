import { config } from 'dotenv';
import { downloadImageFromUrl } from '../server/image-utils';

// Load environment variables
config();

const KGAY_IMAGE_URL =
  'https://kgaytravel.com/wp-content/uploads/2019/05/kgay-travel-image-768x1154.jpg';

async function uploadKGayImage() {
  try {
    console.log('Downloading and uploading KGAY Travel image...');

    const supabaseUrl = await downloadImageFromUrl(
      KGAY_IMAGE_URL,
      'general',
      'kgay-travel-about.jpg'
    );

    console.log('Successfully uploaded image to Supabase:');
    console.log(supabaseUrl);

    return supabaseUrl;
  } catch (error) {
    console.error('Failed to upload KGAY image:', error);
    throw error;
  }
}

uploadKGayImage()
  .then(() => {
    console.log('Upload complete!');
    process.exit(0);
  })
  .catch(() => {
    console.error('Upload failed!');
    process.exit(1);
  });
