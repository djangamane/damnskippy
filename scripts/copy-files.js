import { copyFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Helper function to copy directory recursively
function copyDir(src, dest) {
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true });
  }

  const entries = readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      try {
        copyFileSync(srcPath, destPath);
        console.log(`✓ Copied ${entry.name}`);
      } catch (error) {
        console.error(`⚠ Error copying ${entry.name}:`, error.message);
      }
    }
  }
}

// Ensure dist/server directory exists
const serverDist = join(rootDir, 'dist', 'server');
mkdirSync(serverDist, { recursive: true });

// Copy server files
const serverSrc = join(rootDir, 'server');
if (existsSync(serverSrc)) {
  console.log('Copying server files...');
  copyDir(serverSrc, serverDist);
  console.log('✓ Server files copied');
}

// Copy environment file if it exists
const envFile = join(rootDir, '.env');
if (existsSync(envFile)) {
  try {
    copyFileSync(envFile, join(serverDist, '.env'));
    console.log('✓ Environment file copied');
  } catch (error) {
    console.error('⚠ Error copying environment file:', error.message);
  }
} else {
  console.log('⚠ No .env file found');
}

// Copy package files to dist
const packageFiles = ['package.json', 'package-lock.json'];
packageFiles.forEach(file => {
  const src = join(rootDir, file);
  const dest = join(rootDir, 'dist', file);
  if (existsSync(src)) {
    try {
      copyFileSync(src, dest);
      console.log(`✓ ${file} copied`);
    } catch (error) {
      console.error(`⚠ Error copying ${file}:`, error.message);
    }
  }
});

// Copy TypeScript type definitions
const typesDir = join(rootDir, 'node_modules', '@types');
const distTypesDir = join(rootDir, 'dist', 'node_modules', '@types');
if (existsSync(typesDir)) {
  console.log('Copying TypeScript type definitions...');
  mkdirSync(distTypesDir, { recursive: true });
  copyDir(typesDir, distTypesDir);
  console.log('✓ TypeScript type definitions copied');
}

console.log('File copying completed successfully'); 