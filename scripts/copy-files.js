import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Ensure dist/server directory exists
const serverDist = join(rootDir, 'dist', 'server');
if (!existsSync(serverDist)) {
  mkdirSync(serverDist, { recursive: true });
}

// Copy environment file if it exists
const envFile = join(rootDir, '.env');
const envDistFile = join(serverDist, '.env');
if (existsSync(envFile)) {
  copyFileSync(envFile, envDistFile);
  console.log('✓ Environment file copied');
} else {
  console.log('⚠ No .env file found');
}

// Copy package files
const packageFiles = ['package.json', 'package-lock.json'];
packageFiles.forEach(file => {
  const src = join(rootDir, file);
  const dest = join(rootDir, 'dist', file);
  if (existsSync(src)) {
    copyFileSync(src, dest);
    console.log(`✓ ${file} copied`);
  }
});

console.log('File copying completed successfully'); 