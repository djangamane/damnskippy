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

# Build the server
echo "Building server..."
npm run build:server

# Copy server files
echo "Copying server files..."
cp -r server/* dist/server/

# Ensure environment variables are available
echo "Setting up environment..."
if [ -f ".env" ]; then
  cp .env dist/server/.env
  echo "✅ Environment file copied"
else
  echo "⚠️ No .env file found"
fi

# Install production dependencies
echo "Installing production dependencies..."
npm ci --production

# Log build info
echo "Build completed!"
echo "Directory structure:"
ls -la dist/
echo "Server directory:"
ls -la dist/server/ 