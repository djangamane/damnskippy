#!/bin/bash

echo "Starting simplified build process..."

# Clean up any previous build artifacts
echo "Cleaning dist directory..."
rm -rf dist

# Build the client-side app
echo "Building client-side app..."
npm run build

# Copy files to ensure Render can find them
echo "Setting up production structure..."
cp -f server.js ./
cp -f package.json ./

echo "Build process completed!"
ls -la
echo "Dist directory:"
ls -la dist 