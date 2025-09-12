import { cruiseStorage, talentStorage } from "./storage";
import fetch from "node-fetch";
import { promises as fs } from "fs";
import path from "path";

interface ImageToMigrate {
  type: 'talent' | 'event' | 'itinerary' | 'party_template';
  id: number;
  name: string;
  currentUrl: string;
}

function getImageExtension(url: string): string {
  // Check for explicit extension in URL
  const urlParts = url.split('?')[0]; // Remove query parameters
  const extension = urlParts.split('.').pop()?.toLowerCase();
  
  if (extension && ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension)) {
    return extension;
  }
  
  // Default to jpg for most web images
  return 'jpg';
}

function getContentType(extension: string): string {
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    default:
      return 'image/jpeg';
  }
}

function createFilename(type: string, id: number, name: string, extension: string): string {
  // Create a clean filename from name
  const cleanName = name.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with dashes
    .replace(/-+/g, '-') // Replace multiple dashes with single dash
    .trim();
  
  return `${type}-${id}-${cleanName}.${extension}`;
}

function getImageDirectory(type: string): string {
  switch (type) {
    case 'talent':
      return 'server/public/talent-images';
    case 'event':
      return 'server/public/event-images';
    case 'itinerary':
      return 'server/public/itinerary-images';
    case 'cruise':
      return 'server/public/cruise-images';
    case 'party_template':
      return 'server/public/party-images';
    default:
      throw new Error(`Unknown image type: ${type}`);
  }
}

function getPublicPath(type: string): string {
  switch (type) {
    case 'talent':
      return '/talent-images';
    case 'event':
      return '/event-images';
    case 'itinerary':
      return '/itinerary-images';
    case 'cruise':
      return '/cruise-images';
    case 'party_template':
      return '/party-images';
    default:
      throw new Error(`Unknown image type: ${type}`);
  }
}

async function downloadAndSaveImage(item: ImageToMigrate): Promise<{ filename: string; localUrl: string }> {
  try {
    console.log(`Downloading ${item.type} image for ${item.name}...`);
    
    // Download the image
    const response = await fetch(item.currentUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`);
    }
    
    const buffer = Buffer.from(await response.arrayBuffer());
    const extension = getImageExtension(item.currentUrl);
    const filename = createFilename(item.type, item.id, item.name, extension);
    const directory = getImageDirectory(item.type);
    
    // Save to local filesystem  
    // Adjust path based on current working directory
    let adjustedDirectory = directory;
    if (process.cwd().endsWith('/server')) {
      adjustedDirectory = directory.replace('server/', '');
    }
    const filePath = path.join(process.cwd(), adjustedDirectory, filename);
    console.log(`Saving ${filename} to ${filePath}...`);
    
    await fs.writeFile(filePath, buffer);
    
    const publicPath = getPublicPath(item.type);
    const localUrl = `${publicPath}/${filename}`;
    
    console.log(`Successfully saved ${filename}`);
    return { filename, localUrl };
    
  } catch (error) {
    console.error(`Error processing ${item.type} ${item.name}:`, error);
    throw error;
  }
}

async function updateDatabase(item: ImageToMigrate, localUrl: string): Promise<void> {
  try {
    console.log(`Updating database for ${item.type} ${item.id} with local URL: ${localUrl}`);
    
    switch (item.type) {
      case 'talent':
        await talentStorage.updateTalent(item.id, { profileImageUrl: localUrl });
        break;
      case 'event':
        // TODO: Update event image when events have images
        break;
      case 'itinerary':
        // TODO: Update itinerary image when itinerary has images
        break;
      case 'party_template':
        // TODO: Update party template image when needed
        break;
      default:
        throw new Error(`Unknown type for database update: ${item.type}`);
    }
    
    console.log(`Database updated for ${item.type} ${item.id}`);
  } catch (error) {
    console.error(`Error updating database for ${item.type} ${item.id}:`, error);
    throw error;
  }
}

export async function getAllImagesToMigrate(): Promise<ImageToMigrate[]> {
  const imagesToMigrate: ImageToMigrate[] = [];
  
  // Get all talent with profile images
  const talent = await talentStorage.getAllTalent();
  for (const t of talent) {
    if (t.profileImageUrl && !t.profileImageUrl.startsWith('/')) {
      imagesToMigrate.push({
        type: 'talent',
        id: t.id,
        name: t.name,
        currentUrl: t.profileImageUrl
      });
    }
  }
  
  return imagesToMigrate;
}

export async function migrateAllImages(): Promise<void> {
  console.log('Starting comprehensive image migration...');
  
  const imagesToMigrate = await getAllImagesToMigrate();
  console.log(`Found ${imagesToMigrate.length} images to migrate`);
  
  for (const item of imagesToMigrate) {
    try {
      const { filename, localUrl } = await downloadAndSaveImage(item);
      await updateDatabase(item, localUrl);
      console.log(`✅ Completed migration for ${item.type}: ${item.name}`);
    } catch (error) {
      console.error(`❌ Failed migration for ${item.type}: ${item.name}:`, error);
      // Continue with other images even if one fails
    }
  }
  
  console.log('Comprehensive image migration completed!');
}

// Utility function to download a single image from URL
export async function downloadImageFromUrl(url: string, type: 'talent' | 'event' | 'itinerary' | 'cruise', name: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`);
  }
  
  const buffer = Buffer.from(await response.arrayBuffer());
  const extension = getImageExtension(url);
  const filename = `${type}-${Date.now()}-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.${extension}`;
  const directory = getImageDirectory(type);
  
  const filePath = path.join(process.cwd(), directory, filename);
  await fs.writeFile(filePath, buffer);
  
  const publicPath = getPublicPath(type);
  return `${publicPath}/${filename}`;
}

// Run migration if called directly (not when imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateAllImages()
    .then(() => {
      console.log('Migration finished successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
} else if (process.env.NODE_ENV === 'production' && process.env.RUN_MIGRATIONS === 'true') {
  // Only run migration in production if explicitly enabled via environment variable
  // This prevents automatic migration during server startup that could cause exits
  migrateAllImages()
    .then(() => {
      console.log('Migration finished successfully');
    })
    .catch((error) => {
      console.error('Migration failed:', error);
    });
}