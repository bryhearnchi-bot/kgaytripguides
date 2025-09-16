import multer from "multer";
import { promises as fs } from "fs";
import * as fsSync from "fs";
import path from "path";
import { randomUUID } from "crypto";

// Configure multer for temporary uploads
const storage = multer.memoryStorage(); // Use memory storage

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

// Create a base multer instance for memory storage
const baseUpload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Export the upload middleware - we'll handle Cloudinary in routes
export const upload = baseUpload;

// Upload image to Supabase Storage (stub - to be implemented)
export async function uploadToCloudinary(file: Express.Multer.File, imageType: string): Promise<string> {
  // TODO: Implement Supabase Storage upload
  // For now, return a placeholder URL
  const filename = `${imageType}-${randomUUID()}.jpg`;
  return `https://placeholder.com/${imageType}/${filename}`;
}

// Download image from URL (stub - replaces image-migration function)
export async function downloadImageFromUrl(url: string, type: string, name: string): Promise<string> {
  // TODO: Implement actual download and Supabase Storage upload
  // For now, just return the original URL
  return url;
}

// Get public URL for uploaded image (now returns Cloudinary URLs)
export function getPublicImageUrl(imageType: string, filename: string): string {
  // For backward compatibility, but new uploads will return full Cloudinary URLs
  if (filename.startsWith('http')) {
    return filename; // Already a full URL
  }

  // Legacy local file URLs (for migration period)
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

// Validate image URL format with basic SSRF protection
export function isValidImageUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return false;
    }

    // Basic SSRF protection - block private IP ranges
    const hostname = parsedUrl.hostname.toLowerCase();

    // Block localhost and private IPs
    if (hostname === 'localhost' || 
        hostname === '127.0.0.1' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.match(/^172\.(1[6-9]|2[0-9]|3[01])\./)) {
      return false;
    }

    // Block internal domains
    if (hostname.endsWith('.local') || hostname.endsWith('.internal')) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

// File extensions that should be treated as binary
const BINARY_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.mp4', '.mov', '.avi'];

export function isBinaryFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return BINARY_EXTENSIONS.includes(ext);
}

export function safReadFile(filePath: string): string | Buffer {
  if (isBinaryFile(filePath)) {
    return fsSync.readFileSync(filePath);
  }
  return fsSync.readFileSync(filePath, 'utf-8');
}