// This is a fallback server file that will try to load the correct server file
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to find the server file
const possibleServerPaths = [
  path.join(__dirname, 'dist', 'server', 'index.js'),
  path.join(__dirname, 'server', 'index.js'),
  path.join(__dirname, 'dist', 'index.js')
];

let serverPath = null;
for (const path of possibleServerPaths) {
  try {
    if (fs.existsSync(path)) {
      serverPath = path;
      console.log(`Found server file at: ${serverPath}`);
      break;
    }
  } catch (err) {
    console.error(`Error checking path ${path}:`, err);
  }
}

if (!serverPath) {
  console.error('Could not find server file. Exiting.');
  process.exit(1);
}

// Import and run the server
try {
  console.log(`Importing server from: ${serverPath}`);
  import(serverPath).catch(err => {
    console.error('Error importing server:', err);
    process.exit(1);
  });
} catch (err) {
  console.error('Error running server:', err);
  process.exit(1);
} 