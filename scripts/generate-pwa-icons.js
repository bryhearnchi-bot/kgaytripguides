import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a simple SVG icon for PWA
const createIcon = (size) => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${Math.floor(size * 0.125)}" fill="url(#gradient0_linear_1_1)"/>
  <path d="M${size/2} ${size/4}C${size * 0.646} ${size/4} ${size * 0.75} ${size * 0.354} ${size * 0.75} ${size/2}C${size * 0.75} ${size * 0.646} ${size * 0.646} ${size * 0.75} ${size/2} ${size * 0.75}C${size * 0.396} ${size * 0.75} ${size * 0.310} ${size * 0.678} ${size * 0.277} ${size * 0.583}H${size * 0.723}C${size * 0.690} ${size * 0.678} ${size * 0.604} ${size * 0.75} ${size/2} ${size * 0.75}Z" fill="white" fill-opacity="0.9"/>
  <circle cx="${size/2}" cy="${size * 0.469}" r="${size * 0.094}" fill="white"/>
  <defs>
    <linearGradient id="gradient0_linear_1_1" x1="0" y1="0" x2="${size}" y2="${size}" gradientUnits="userSpaceOnUse">
      <stop stop-color="#1E40AF"/>
      <stop offset="1" stop-color="#3B82F6"/>
    </linearGradient>
  </defs>
</svg>`;

// Icon sizes needed for PWA
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create icons directory
const iconsDir = path.join(__dirname, 'client/public/images/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG icons (we'll use these as placeholders)
iconSizes.forEach(size => {
  const svgContent = createIcon(size);
  const fileName = `icon-${size}x${size}.svg`;
  const filePath = path.join(iconsDir, fileName);

  fs.writeFileSync(filePath, svgContent);
  console.log(`Generated ${fileName}`);

  // For now, copy SVG as PNG placeholder (in real implementation, you'd convert to PNG)
  const pngFileName = `icon-${size}x${size}.png`;
  const pngFilePath = path.join(iconsDir, pngFileName);
  fs.writeFileSync(pngFilePath, svgContent); // This is a placeholder - normally you'd use a proper image conversion
  console.log(`Generated ${pngFileName}`);
});

console.log('PWA icons generated successfully!');