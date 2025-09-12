import { ObjectStorageService } from "./objectStorage";
import { cruiseStorage } from "./storage";
import fetch from "node-fetch";

const objectStorageService = new ObjectStorageService();

interface CruiseImage {
  id: number;
  name: string;
  hero_image_url: string;
}

const cruiseImages: CruiseImage[] = [
  {
    id: 1,
    name: "Greek Isles Adventure",
    hero_image_url: "https://s3.amazonaws.com/a-us.storyblok.com/f/1005231/594cc18563/virgin-voyages_resilient-lady_persepone-and-hades_entertainment_kyle-valenta_18913661.jpg"
  },
  {
    id: 2,
    name: "Mediterranean Dreams", 
    hero_image_url: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
  },
  {
    id: 3,
    name: "Caribbean Paradise",
    hero_image_url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
  },
  {
    id: 4,
    name: "Baltic Capitals Explorer",
    hero_image_url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
  },
  {
    id: 5,
    name: "Alaska Inside Passage",
    hero_image_url: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
  },
  {
    id: 6,
    name: "Transatlantic Crossing",
    hero_image_url: "https://images.unsplash.com/photo-1495954484750-af469f2f9be5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
  }
];

function getImageExtension(url: string): string {
  // Check for explicit extension in URL
  const urlParts = url.split('?')[0]; // Remove query parameters
  const extension = urlParts.split('.').pop()?.toLowerCase();
  
  if (extension && ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension)) {
    return extension;
  }
  
  // Default to jpg for Unsplash and other photo services
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

function createFilename(cruiseId: number, cruiseName: string, extension: string): string {
  // Create a clean filename from cruise name
  const cleanName = cruiseName.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with dashes
    .replace(/-+/g, '-') // Replace multiple dashes with single dash
    .trim();
  
  return `cruise-${cruiseId}-${cleanName}.${extension}`;
}

async function downloadAndUploadImage(cruise: CruiseImage): Promise<{ filename: string; localUrl: string }> {
  try {
    console.log(`Downloading image for ${cruise.name}...`);
    
    // Download the image
    const response = await fetch(cruise.hero_image_url);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`);
    }
    
    const buffer = Buffer.from(await response.arrayBuffer());
    const extension = getImageExtension(cruise.hero_image_url);
    const contentType = getContentType(extension);
    const filename = createFilename(cruise.id, cruise.name, extension);
    
    // Upload to object storage
    console.log(`Uploading ${filename} to object storage...`);
    const storagePath = `/cruise-assets/images/cruise-images/${filename}`;
    
    await objectStorageService.uploadFile(storagePath, buffer, contentType);
    
    const localUrl = `/api/storage/cruise-images/${filename}`;
    
    console.log(`Successfully uploaded ${filename}`);
    return { filename, localUrl };
    
  } catch (error) {
    console.error(`Error processing ${cruise.name}:`, error);
    throw error;
  }
}

async function updateDatabase(cruiseId: number, localUrl: string): Promise<void> {
  try {
    console.log(`Updating database for cruise ${cruiseId} with local URL: ${localUrl}`);
    await cruiseStorage.updateCruise(cruiseId, { heroImageUrl: localUrl });
    console.log(`Database updated for cruise ${cruiseId}`);
  } catch (error) {
    console.error(`Error updating database for cruise ${cruiseId}:`, error);
    throw error;
  }
}

export async function migrateAllImages(): Promise<void> {
  console.log('Starting image migration...');
  
  for (const cruise of cruiseImages) {
    try {
      const { filename, localUrl } = await downloadAndUploadImage(cruise);
      await updateDatabase(cruise.id, localUrl);
      console.log(`✅ Completed migration for ${cruise.name}`);
    } catch (error) {
      console.error(`❌ Failed migration for ${cruise.name}:`, error);
      // Continue with other images even if one fails
    }
  }
  
  console.log('Image migration completed!');
}

// Run migration if called directly
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
}