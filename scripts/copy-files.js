import { copyFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('Starting file copy process...');
console.log('Root directory:', rootDir);

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

// Ensure dist directory exists
const distDir = join(rootDir, 'dist');
mkdirSync(distDir, { recursive: true });
console.log('Created dist directory:', distDir);

// Ensure dist/server directory exists
const serverDist = join(distDir, 'server');
mkdirSync(serverDist, { recursive: true });
console.log('Created server directory:', serverDist);

// Copy server files
console.log('Copying server files...');
const serverSrc = join(rootDir, 'server');
if (existsSync(serverSrc)) {
  const files = readdirSync(serverSrc);
  for (const file of files) {
    const srcPath = join(serverSrc, file);
    const destPath = join(serverDist, file);
    try {
      copyFileSync(srcPath, destPath);
      console.log(`✓ Copied server file: ${file}`);
    } catch (error) {
      console.error(`⚠ Error copying server file ${file}:`, error.message);
    }
  }
  console.log('✓ Server files copied');
} else {
  console.error('⚠ Server source directory not found:', serverSrc);
}

// Copy environment files
const envFiles = ['.env', '.env.production'];
envFiles.forEach(envFile => {
  const envPath = join(rootDir, envFile);
  if (existsSync(envPath)) {
    const destPath = join(distDir, envFile);
    try {
      copyFileSync(envPath, destPath);
      console.log(`✓ Copied ${envFile}`);
    } catch (error) {
      console.error(`⚠ Error copying ${envFile}:`, error.message);
    }
  } else {
    console.log(`⚠ ${envFile} not found`);
  }
});

// Copy package files to dist
const packageFiles = ['package.json', 'package-lock.json'];
packageFiles.forEach(file => {
  const src = join(rootDir, file);
  const dest = join(distDir, file);
  if (existsSync(src)) {
    try {
      copyFileSync(src, dest);
      console.log(`✓ Copied ${file}`);
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