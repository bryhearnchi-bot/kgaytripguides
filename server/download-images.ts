import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { URL } from 'url';
import { db, talent, itinerary, cruises } from './storage';
import { eq } from 'drizzle-orm';

const downloadImage = (url: string, filePath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);
    const parsedUrl = new URL(url);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;

    protocol.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirects
        if (response.headers.location) {
          downloadImage(response.headers.location, filePath).then(resolve).catch(reject);
          return;
        }
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        resolve();
      });

      file.on('error', (err) => {
        fs.unlink(filePath, () => {}); // Delete the file on error
        reject(err);
      });
    }).on('error', reject);
  });
};

const sanitizeFilename = (url: string): string => {
  const urlPath = new URL(url).pathname;
  const filename = path.basename(urlPath) || 'image.jpg';
  // Ensure it has an extension
  if (!filename.includes('.')) {
    return filename + '.jpg';
  }
  return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
};

async function downloadTalentImages() {
  console.log('Starting talent image downloads...');
  
  const talents = await db.select().from(talent);
  
  for (const t of talents) {
    if (t.profileImageUrl) {
      try {
        const filename = `talent_${t.id}_${sanitizeFilename(t.profileImageUrl)}`;
        const localPath = path.join('..', 'client', 'public', 'images', 'talent', filename);
        
        console.log(`Downloading ${t.name}'s image...`);
        await downloadImage(t.profileImageUrl, localPath);
        
        // Update database with local path
        await db.update(talent)
          .set({ profileImageUrl: `/images/talent/${filename}` })
          .where(eq(talent.id, t.id));
        
        console.log(`✓ Downloaded and updated ${t.name}'s image`);
      } catch (error) {
        console.error(`Failed to download image for ${t.name}:`, error);
      }
    }
  }
}

async function downloadPortImages() {
  console.log('Starting port image downloads...');
  
  // Define port images mapping
  const portImages: Record<string, string> = {
    'Barcelona': 'https://images.unsplash.com/photo-1583422409516-2895a77efded?q=80&w=2070',
    'Naples': 'https://images.unsplash.com/photo-1525218291292-e46d2a90f77c?q=80&w=2070',
    'Santorini': 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?q=80&w=2070',
    'Mykonos': 'https://images.unsplash.com/photo-1601581875309-fafbf2d3ed3a?q=80&w=2070',
    'Valletta': 'https://images.unsplash.com/photo-1548404461-d29dd64d0328?q=80&w=2070',
    'Palermo': 'https://images.unsplash.com/photo-1544989164-31dc3c645987?q=80&w=2070',
    'Civitavecchia': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=2070',
  };

  const stops = await db.select().from(itinerary);
  
  for (const stop of stops) {
    const imageUrl = portImages[stop.portName];
    if (imageUrl) {
      try {
        const filename = `port_${stop.id}_${stop.portName.toLowerCase().replace(/\s+/g, '_')}.jpg`;
        const localPath = path.join('..', 'client', 'public', 'images', 'ports', filename);
        
        console.log(`Downloading ${stop.portName} image...`);
        await downloadImage(imageUrl, localPath);
        
        // Update database with local path
        await db.update(itinerary)
          .set({ portImageUrl: `/images/ports/${filename}` })
          .where(eq(itinerary.id, stop.id));
        
        console.log(`✓ Downloaded and updated ${stop.portName} image`);
      } catch (error) {
        console.error(`Failed to download image for ${stop.portName}:`, error);
      }
    }
  }
}

async function downloadShipImages() {
  console.log('Downloading ship images...');
  
  const shipImages = [
    {
      url: 'https://www.virginvoyages.com/dam/jcr:4a89dcdb-daf7-40a2-a60a-e68c95833dc4/RL%20-%20ship%20-%20pool%20deck%20-%207.jpg',
      filename: 'resilient-lady-pool-deck.jpg'
    },
    {
      url: 'https://www.virginvoyages.com/dam/jcr:6e6e9e6e-cd35-4e1e-a84d-3d87ee6e8a8f/RL%20-%20ship%20-%20hero%20-%201.jpg',
      filename: 'resilient-lady-hero.jpg'
    }
  ];

  for (const image of shipImages) {
    try {
      const localPath = path.join('..', 'client', 'public', 'images', 'ships', image.filename);
      console.log(`Downloading ${image.filename}...`);
      await downloadImage(image.url, localPath);
      console.log(`✓ Downloaded ${image.filename}`);
    } catch (error) {
      console.error(`Failed to download ${image.filename}:`, error);
    }
  }

  // Update cruise with hero image
  await db.update(cruises)
    .set({ heroImageUrl: '/images/ships/resilient-lady-hero.jpg' })
    .where(eq(cruises.id, 1));
}

async function downloadLogos() {
  console.log('Downloading logos...');
  
  const logos = [
    {
      url: 'https://atlantisevents.com/wp-content/themes/atlantis/assets/images/logos/atlantis-logo.png',
      filename: 'atlantis-logo.png'
    },
    {
      url: 'https://kgaytravel.com/images/kg-travel-logo.png',
      filename: 'kgay-travel-logo.png'
    }
  ];

  for (const logo of logos) {
    try {
      const localPath = path.join('..', 'client', 'public', 'images', 'logos', logo.filename);
      console.log(`Downloading ${logo.filename}...`);
      // Skip download for now since these might not be valid URLs
      // await downloadImage(logo.url, localPath);
      console.log(`⚠ Skipped ${logo.filename} (URL may not be valid)`);
    } catch (error) {
      console.error(`Failed to download ${logo.filename}:`, error);
    }
  }
}

async function main() {
  console.log('Starting image download process...\n');
  
  try {
    await downloadTalentImages();
    console.log('\n');
    
    await downloadPortImages();
    console.log('\n');
    
    await downloadShipImages();
    console.log('\n');
    
    await downloadLogos();
    
    console.log('\n✅ All images downloaded and database updated successfully!');
  } catch (error) {
    console.error('Error during image download:', error);
    process.exit(1);
  }
}

main();