#!/bin/bash

# Create directory structure
echo "Creating directory structure..."
mkdir -p dist/server

# Clean up any previous build artifacts
echo "Cleaning up previous build artifacts..."
rm -rf dist

# Build the client
echo "Building client..."
npm run build

# Build the server
echo "Building server..."
npm run build:server

# Log build info
echo "Build completed!"
echo "Directory structure:"
ls -la dist/
echo "Server directory:"
ls -la dist/server/
echo "Server index.js file:"
cat dist/server/index.js | head -n 10 