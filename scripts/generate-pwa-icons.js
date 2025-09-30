#!/usr/bin/env node
import puppeteer from 'puppeteer';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const sizes = [72, 96, 128, 144, 152, 180, 192, 384, 512];
const iconsDir = join(projectRoot, 'client', 'public', 'images', 'icons');

async function generatePNGs() {
  console.log('🎨 Generating PWA icons from SVG...');

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  for (const size of sizes) {
    const svgPath = join(iconsDir, `icon-${size}x${size}.svg`);
    const pngPath = join(iconsDir, `icon-${size}x${size}.png`);

    if (!existsSync(svgPath)) {
      console.warn(`⚠️  SVG not found: ${svgPath}`);
      continue;
    }

    const svgContent = readFileSync(svgPath, 'utf8');

    await page.setViewport({ width: size, height: size });
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <body style="margin:0;padding:0;background:transparent;">
          ${svgContent}
        </body>
      </html>
    `);

    const screenshot = await page.screenshot({
      type: 'png',
      omitBackground: false,
    });

    writeFileSync(pngPath, screenshot);
    console.log(`✓ Generated icon-${size}x${size}.png`);
  }

  await browser.close();
  console.log('✅ All PWA icons generated!');
}

generatePNGs().catch(console.error);
