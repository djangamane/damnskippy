#!/bin/bash

# Install dependencies
npm install

# Build client
npm run build

# Build server
npm run build:server

# Create a proper directory structure for Render
echo "Creating directory structure..."
mkdir -p dist/server

# Copy server files to dist/server (ensure we're not copying to the same location)
if [ -d "dist/server" ]; then
  echo "Copying server files..."
  # List the files to verify
  ls -la dist/server/
fi

# Install any missing dependencies
echo "Installing critical dependencies..."
npm install jsonwebtoken bcryptjs mongodb cors express dotenv openai axios

# Create a .js version of the server.js file for compatibility
echo "Creating ES module version of server.js..."
cat > server.mjs << 'EOF'
// This file is used as the entry point for Render deployment
// It simply imports and runs the compiled server code

import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if the compiled server file exists
const serverPath = path.join(__dirname, 'dist', 'server', 'index.js');

if (fs.existsSync(serverPath)) {
  console.log(`Server file found at: ${serverPath}`);
  import(serverPath)
    .then(() => {
      console.log('Server started successfully via server.js entry point');
    })
    .catch(err => {
      console.error('Error starting server:', err);
      process.exit(1);
    });
} else {
  console.error(`Server file not found at: ${serverPath}`);
  console.error('Available files in dist directory:');
  try {
    const distFiles = fs.readdirSync(path.join(__dirname, 'dist'));
    console.log(distFiles);
    
    if (fs.existsSync(path.join(__dirname, 'dist', 'server'))) {
      const serverFiles = fs.readdirSync(path.join(__dirname, 'dist', 'server'));
      console.log('Files in dist/server:');
      console.log(serverFiles);
    }
  } catch (err) {
    console.error('Error listing directory:', err);
  }
  process.exit(1);
}
EOF

# Log directory structure
echo "Directory structure:"
ls -la
echo "dist directory:"
ls -la dist
echo "server directory:"
ls -la server
echo "dist/server directory:"
ls -la dist/server

echo "Build completed successfully!" 