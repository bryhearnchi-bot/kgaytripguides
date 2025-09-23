#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const sourceDir = join(projectRoot, 'client', 'public');
const targetDir = join(projectRoot, 'dist', 'public');

// Ensure target directory exists
if (!existsSync(targetDir)) {
  mkdirSync(targetDir, { recursive: true });
}

// Files to copy
const filesToCopy = ['manifest.json', 'sw.js'];

filesToCopy.forEach(file => {
  const sourcePath = join(sourceDir, file);
  const targetPath = join(targetDir, file);
  
  if (existsSync(sourcePath)) {
    copyFileSync(sourcePath, targetPath);
    console.log(`✓ Copied ${file} to dist/public`);
  } else {
    console.warn(`✗ Source file not found: ${sourcePath}`);
  }
});

console.log('PWA files copy completed!');