#!/bin/bash

# Create directory structure
echo "Creating directory structure..."
mkdir -p dist/server

# Build the client
echo "Building client..."
npm run build

# Copy server files
echo "Copying server files..."
cp -r server dist/

# Compile server TypeScript files
echo "Building server..."
npx tsc -p tsconfig.server.json --skipLibCheck

# Create ES module version of server.js
echo "Creating ES module version of server.js..."
cp dist/server/index.js server.js
cp dist/server/index.js server.mjs

# Install critical dependencies
echo "Installing critical dependencies..."
npm install --production

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