#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Define port images to download
const portImages = [
  {
    port: "athens",
    url: "https://images.unsplash.com/photo-1555993539-1732b0258235?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=200",
    filename: "athens-greece.jpg"
  },
  {
    port: "santorini",
    url: "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=200",
    filename: "santorini-greece.jpg"
  },
  {
    port: "kusadasi",
    url: "https://www.spotblue.com/app/uploads/2024/12/what-makes-Kusadasi-in-Turkey-special.jpg",
    filename: "kusadasi-turkey.jpg"
  },
  {
    port: "alexandria",
    url: "https://cdn.mos.cms.futurecdn.net/7YrobQvFFzw8aWsAUtoYXB.jpg",
    filename: "alexandria-egypt.jpg"
  },
  {
    port: "mykonos",
    url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSLQ4RgqnUpFnFbrKJKdMYbH7-QjOyh0IrDNA&s",
    filename: "mykonos-greece.jpg"
  },
  {
    port: "iraklion",
    url: "https://www.oreotravel.com/blog/wp-content/uploads/2024/08/heraklion-old-town.jpg",
    filename: "iraklion-crete.jpg"
  },
  {
    port: "istanbul-day1",
    url: "https://cdn-imgix.headout.com/media/images/fd89223056e350ae524f6c6120198677-Bluemosqueistanbul.jpg?auto=format&w=1222.3999999999999&h=687.6&q=90&ar=16%3A9&crop=faces&fit=crop",
    filename: "istanbul-turkey-day1.jpg"
  },
  {
    port: "istanbul-day2",
    url: "https://www.airpano.ru/files/mosques-istanbul-turkey/images/image1.jpg",
    filename: "istanbul-turkey-day2.jpg"
  },
  {
    port: "sea-day",
    url: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=200",
    filename: "sea-day.jpg"
  }
];

async function downloadImage(url: string, filepath: string): Promise<void> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(filepath, Buffer.from(buffer));
    console.log(`✓ Downloaded: ${path.basename(filepath)}`);
  } catch (error) {
    console.error(`✗ Failed to download ${url}:`, error);
  }
}

async function main() {
  // Create the ports directory
  const portsDir = path.join(__dirname, '../client/public/images/ports');
  if (!fs.existsSync(portsDir)) {
    fs.mkdirSync(portsDir, { recursive: true });
    console.log('Created directory:', portsDir);
  }

  console.log('Downloading port images...\n');
  
  // Download all images
  for (const image of portImages) {
    const filepath = path.join(portsDir, image.filename);
    await downloadImage(image.url, filepath);
  }
  
  console.log('\n✅ Port images download complete!');
  console.log('Images saved to:', portsDir);
}

main().catch(console.error);