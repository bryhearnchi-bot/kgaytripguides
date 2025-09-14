import fs from 'fs';
import https from 'https';
import { URL } from 'url';

// High-quality ship images from reliable sources
const shipImages = [
  {
    name: 'Virgin Scarlet Lady',
    filename: 'virgin-scarlet-lady.jpg',
    url: 'https://images.unsplash.com/photo-1566736342506-830bfd5b9cc1?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80' // Modern luxury cruise ship
  },
  {
    name: 'Virgin Valiant Lady',
    filename: 'virgin-valiant-lady.jpg',
    url: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80' // Luxury cruise ship at sea
  },
  {
    name: 'Virgin Resilient Lady',
    filename: 'virgin-resilient-lady.jpg',
    url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80' // Large modern cruise ship
  },
  {
    name: 'Virgin Explorer',
    filename: 'virgin-explorer.jpg',
    url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80' // Cruise ship in Caribbean
  },
  {
    name: 'Virgin Brilliant Lady',
    filename: 'virgin-brilliant-lady.jpg',
    url: 'https://images.unsplash.com/photo-1605538883669-825200433431?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80' // White cruise ship
  }
];

// Function to download an image
function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const file = fs.createWriteStream(`ship-images/${filename}`);

    const request = https.get(parsedUrl, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${filename}: ${response.statusCode}`));
        return;
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        console.log(`✅ Downloaded: ${filename}`);
        resolve(filename);
      });
    });

    request.on('error', (err) => {
      fs.unlink(`ship-images/${filename}`, () => {}); // Delete the file on error
      reject(err);
    });

    file.on('error', (err) => {
      fs.unlink(`ship-images/${filename}`, () => {}); // Delete the file on error
      reject(err);
    });
  });
}

async function downloadAllShipImages() {
  console.log('🚀 Starting download of ship images...\n');

  // Create ship-images directory if it doesn't exist
  if (!fs.existsSync('ship-images')) {
    fs.mkdirSync('ship-images');
  }

  const results = [];

  for (let i = 0; i < shipImages.length; i++) {
    const ship = shipImages[i];

    try {
      console.log(`⬇️  Downloading ${i + 1}/${shipImages.length}: ${ship.name}...`);
      await downloadImage(ship.url, ship.filename);

      results.push({
        name: ship.name,
        filename: ship.filename,
        success: true
      });

      // Small delay between downloads
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error(`❌ Failed to download ${ship.name}:`, error.message);
      results.push({
        name: ship.name,
        filename: ship.filename,
        success: false,
        error: error.message
      });
    }
  }

  // Save results
  fs.writeFileSync('ship-download-results.json', JSON.stringify(results, null, 2));

  console.log(`\n🎉 Download complete!`);
  console.log(`📊 Total downloaded: ${results.filter(r => r.success).length}/${results.length}`);
  console.log(`📋 Results saved to: ship-download-results.json\n`);

  // Show successful downloads
  console.log('✅ Successful downloads:');
  results.filter(r => r.success).forEach(result => {
    console.log(`${result.name}: ${result.filename}`);
  });

  if (results.some(r => !r.success)) {
    console.log('\n❌ Failed downloads:');
    results.filter(r => !r.success).forEach(result => {
      console.log(`${result.name}: ${result.error}`);
    });
  }
}

downloadAllShipImages();