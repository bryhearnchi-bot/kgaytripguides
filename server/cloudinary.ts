import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Configure Cloudinary
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Create storage engines for different image types
export const createCloudinaryStorage = (folder: string) => {
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: folder,
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      transformation: [
        { width: 1200, height: 1200, crop: 'limit', quality: 'auto' }
      ],
    } as any,
  });
};

// Pre-configured storage for different asset types
export const talentImageStorage = createCloudinaryStorage('cruise-app/talent');
export const eventImageStorage = createCloudinaryStorage('cruise-app/events');
export const itineraryImageStorage = createCloudinaryStorage('cruise-app/itinerary');
export const cruiseImageStorage = createCloudinaryStorage('cruise-app/cruises');

export { cloudinary };