import multer from "multer";
import { promises as fs } from "fs";
import * as fsSync from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";

// Configure multer for temporary uploads
const storage = multer.memoryStorage(); // Use memory storage

// File filter for images only with enhanced validation
const fileFilter = (req: any, file: any, cb: any) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif'
  ];

  // Check MIME type
  if (!allowedMimeTypes.includes(file.mimetype)) {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.'), false);
    return;
  }

  // Check file extension (double validation)
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  if (!allowedExtensions.includes(ext)) {
    cb(new Error('Invalid file extension. Only .jpg, .jpeg, .png, .webp, and .gif are allowed.'), false);
    return;
  }

  // Check filename for malicious patterns
  const filename = path.basename(file.originalname);
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    cb(new Error('Invalid filename. Path traversal attempts are not allowed.'), false);
    return;
  }

  cb(null, true);
};

// Create a base multer instance for memory storage with enhanced security
const baseUpload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit (reduced from 10MB for security)
    files: 1, // Only allow 1 file per request
    fields: 10, // Limit number of fields
    fieldSize: 1024 * 1024 // 1MB max field size
  }
});

// Export the upload middleware - we'll handle Supabase Storage in routes
export const upload = baseUpload;

// Malware scanning placeholder - integrate with actual antivirus service in production
async function scanFileForMalware(buffer: Buffer): Promise<boolean> {
  // TODO: Integrate with ClamAV, VirusTotal API, or cloud-based scanning service
  // For now, perform basic checks

  // Check for suspicious file signatures (basic check)
  const suspiciousPatterns = [
    Buffer.from('4D5A'), // Windows executable (MZ)
    Buffer.from('7F454C46'), // Linux ELF executable
    Buffer.from('504B0304'), // ZIP archive (could hide malware)
  ];

  for (const pattern of suspiciousPatterns) {
    if (buffer.slice(0, pattern.length).equals(pattern)) {
      return false; // File is suspicious
    }
  }

  return true; // File appears safe (basic check only)
}

// Upload image to Supabase Storage with security checks
export async function uploadToSupabase(file: Express.Multer.File, imageType: string): Promise<string> {
  // Perform malware scan
  const isSafe = await scanFileForMalware(file.buffer);
  if (!isSafe) {
    throw new Error('File failed security scan. Upload rejected.');
  }

  // Initialize Supabase client
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration missing');
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Generate unique filename with proper extension
  const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
  const filename = `${imageType}-${randomUUID()}${ext}`;

  // Determine bucket based on image type
  let bucket = 'images';
  let folderPath = imageType;

  switch (imageType) {
    case 'talent':
      bucket = 'talent-images';
      folderPath = '';
      break;
    case 'event':
      bucket = 'event-images';
      folderPath = '';
      break;
    case 'itinerary':
      bucket = 'itinerary-images';
      folderPath = '';
      break;
    case 'cruise':
    case 'trip':
      bucket = 'trip-images';
      folderPath = '';
      break;
    default:
      bucket = 'images';
      folderPath = imageType;
  }

  // Construct full path
  const fullPath = folderPath ? `${folderPath}/${filename}` : filename;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fullPath, file.buffer, {
      contentType: file.mimetype,
      upsert: false
    });

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(fullPath);

  return publicUrl;
}

// Download image from URL and upload to Supabase Storage
export async function downloadImageFromUrl(url: string, type: string, name: string): Promise<string> {
  try {
    // Validate URL
    if (!isValidImageUrl(url)) {
      throw new Error('Invalid image URL');
    }

    // Fetch image from URL
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    // Get image buffer and content type
    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Create a mock Express.Multer.File object
    const file: Express.Multer.File = {
      buffer,
      originalname: name || 'downloaded-image.jpg',
      mimetype: contentType,
      size: buffer.length,
      fieldname: 'image',
      encoding: '7bit',
      stream: null as any,
      destination: '',
      filename: '',
      path: ''
    };

    // Upload to Supabase Storage
    return await uploadToSupabase(file, type);
  } catch (error) {
    throw error;
  }
}

// Get public URL for uploaded image (now returns Supabase Storage URLs)
export function getPublicImageUrl(imageType: string, filename: string): string {
  // For backward compatibility, if already a full URL, return as-is
  if (filename.startsWith('http')) {
    return filename; // Already a full URL
  }

  // If we have Supabase configured, construct the URL
  const supabaseUrl = process.env.SUPABASE_URL;
  if (supabaseUrl) {
    // Determine bucket based on image type
    let bucket = 'images';
    switch (imageType) {
      case 'talent':
        bucket = 'talent-images';
        break;
      case 'event':
        bucket = 'event-images';
        break;
      case 'itinerary':
        bucket = 'itinerary-images';
        break;
      case 'cruise':
      case 'trip':
        bucket = 'trip-images';
        break;
      default:
        bucket = 'images';
    }

    return `${supabaseUrl}/storage/v1/object/public/${bucket}/${filename}`;
  }

  // Legacy fallback for local development
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

// Delete image file from Supabase Storage
export async function deleteImage(imageUrl: string): Promise<void> {
  try {
    // Check if this is a Supabase Storage URL
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && imageUrl.includes(supabaseUrl) && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Extract bucket and path from Supabase URL
      // Format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
      const urlPattern = new RegExp(`${supabaseUrl}/storage/v1/object/public/([^/]+)/(.+)`);
      const match = imageUrl.match(urlPattern);

      if (match) {
        const bucket = match[1];
        const filePath = match[2];

        const { error } = await supabase.storage
          .from(bucket)
          .remove([filePath]);

        if (error) {
          // Deletion failed but don't throw
        }
        return;
      }
    }

    // Legacy: Try to delete from local filesystem (for backward compatibility)
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