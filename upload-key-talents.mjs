import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const talents = [
  { file: 'talent_2_03-2-Monet-X-Change-rupauls-drag-race-s10-billboard-a-1548.jpg', publicId: 'monet-x-change' },
  { file: 'talent_3_azxnlnbuql9b1.jpg', publicId: 'alexis-michelle' },
  { file: 'talent_4_83ebd7f4d42b686feb15dd51ed68d987.jpg', publicId: 'leona-winter' },
  { file: 'talent_5_sherry-web-social.png', publicId: 'sherry-vine' },
  { file: 'talent_6_Reuben-Kaye-c-Alan-Moyle-scaled-e1727080187482.jpg', publicId: 'reuben-kaye' }
];

async function uploadKeyTalents() {
  console.log('Uploading key talent images...\n');

  for (const talent of talents) {
    try {
      console.log(`⬆️  Uploading ${talent.file}...`);

      const result = await cloudinary.uploader.upload(
        `dist/public/images/talent/${talent.file}`,
        {
          folder: 'cruise-app/talent',
          public_id: talent.publicId,
          overwrite: true,
          resource_type: 'image'
        }
      );

      console.log(`✅ Success: ${result.secure_url}\n`);

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 200));

    } catch (error) {
      console.error(`❌ Failed to upload ${talent.file}:`, error.message);
    }
  }

  console.log('🎉 Key talent uploads complete!');
}

uploadKeyTalents();