"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudinary = exports.cruiseImageStorage = exports.itineraryImageStorage = exports.eventImageStorage = exports.talentImageStorage = exports.createCloudinaryStorage = void 0;
const cloudinary_1 = require("cloudinary");
Object.defineProperty(exports, "cloudinary", { enumerable: true, get: function () { return cloudinary_1.v2; } });
const multer_storage_cloudinary_1 = require("multer-storage-cloudinary");
// Configure Cloudinary
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    cloudinary_1.v2.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
}
// Create storage engines for different image types
const createCloudinaryStorage = (folder) => {
    return new multer_storage_cloudinary_1.CloudinaryStorage({
        cloudinary: cloudinary_1.v2,
        params: {
            folder: folder,
            allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
            transformation: [
                { width: 1200, height: 1200, crop: 'limit', quality: 'auto' }
            ],
        },
    });
};
exports.createCloudinaryStorage = createCloudinaryStorage;
// Pre-configured storage for different asset types
exports.talentImageStorage = (0, exports.createCloudinaryStorage)('cruise-app/talent');
exports.eventImageStorage = (0, exports.createCloudinaryStorage)('cruise-app/events');
exports.itineraryImageStorage = (0, exports.createCloudinaryStorage)('cruise-app/itinerary');
exports.cruiseImageStorage = (0, exports.createCloudinaryStorage)('cruise-app/cruises');
