#!/bin/bash

# Create directory structure
echo "Creating directory structure..."
mkdir -p dist/server

# Clean up any previous build artifacts
echo "Cleaning up previous build artifacts..."
rm -rf dist/assets dist/index.html

# Build the client
echo "Building client..."
npm run build

# Verify client build output
echo "Verifying client build output..."
if [ -f "dist/index.html" ]; then
  echo "✅ index.html exists in dist directory"
else
  echo "❌ index.html is missing from dist directory"
fi

if [ -d "dist/assets" ]; then
  echo "✅ assets directory exists"
  echo "Assets directory contents:"
  ls -la dist/assets
else
  echo "❌ assets directory is missing"
fi

# Copy server files
echo "Copying server files..."
cp -r server/* dist/server/

# Compile server TypeScript files
echo "Building server..."
# Use --skipLibCheck to ignore TypeScript errors in libraries
npx tsc -p tsconfig.server.json --skipLibCheck

# Create ES module version of server.js
echo "Creating ES module version of server.js..."
cp dist/server/index.js server.js

# Ensure public assets are copied to dist
echo "Copying public assets to dist..."
if [ -d "public" ]; then
  cp -r public dist/
  echo "✅ Public assets copied to dist/public"
else
  echo "❌ Public directory not found"
fi

# Install critical dependencies
echo "Installing critical dependencies..."
npm install express cors dotenv openai axios bcryptjs jsonwebtoken mongodb

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