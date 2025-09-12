import multer from "multer";
import { promises as fs } from "fs";
import path from "path";
import { downloadImageFromUrl } from "./image-migration";
import { randomUUID } from "crypto";

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const imageType = req.body.imageType || 'general';
    let directory: string;
    
    switch (imageType) {
      case 'talent':
        directory = 'server/public/talent-images';
        break;
      case 'event':
        directory = 'server/public/event-images';
        break;
      case 'itinerary':
        directory = 'server/public/itinerary-images';
        break;
      case 'cruise':
        directory = 'server/public/cruise-images';
        break;
      default:
        directory = 'server/public/uploads';
    }
    
    cb(null, directory);
  },
  filename: (req, file, cb) => {
    const imageType = req.body.imageType || 'general';
    const timestamp = Date.now();
    const uniqueId = randomUUID().substring(0, 8);
    const extension = path.extname(file.originalname).toLowerCase();
    
    const filename = `${imageType}-${timestamp}-${uniqueId}${extension}`;
    cb(null, filename);
  }
});

// File filter for images only
const fileFilter = (req: any, file: any, cb: any) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/gif'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only image files are allowed.'), false);
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Get public URL for uploaded image
export function getPublicImageUrl(imageType: string, filename: string): string {
  switch (imageType) {
    case 'talent':
      return `/talent-images/${filename}`;
    case 'event':
      return `/event-images/${filename}`;
    case 'itinerary':
      return `/itinerary-images/${filename}`;
    case 'cruise':
      return `/cruise-images/${filename}`;
    default:
      return `/uploads/${filename}`;
  }
}

// Delete image file
export async function deleteImage(imageUrl: string): Promise<void> {
  try {
    // Extract filename from URL
    const urlPath = new URL(imageUrl, 'http://localhost').pathname;
    const segments = urlPath.split('/');
    const filename = segments[segments.length - 1];
    const imageType = segments[segments.length - 2];
    
    let directory: string;
    switch (imageType) {
      case 'talent-images':
        directory = 'server/public/talent-images';
        break;
      case 'event-images':
        directory = 'server/public/event-images';
        break;
      case 'itinerary-images':
        directory = 'server/public/itinerary-images';
        break;
      case 'cruise-images':
        directory = 'server/public/cruise-images';
        break;
      default:
        directory = 'server/public/uploads';
    }
    
    const filePath = path.join(process.cwd(), directory, filename);
    await fs.unlink(filePath);
  } catch (error) {
    console.error('Error deleting image:', error);
    // Don't throw - file might already be deleted
  }
}

// Validate image URL format
export function isValidImageUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return ['http:', 'https:'].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
}