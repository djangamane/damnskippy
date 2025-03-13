#!/bin/bash

# Install dependencies
echo "Installing dependencies..."
npm install

# Install jsonwebtoken explicitly
echo "Installing jsonwebtoken explicitly..."
npm install jsonwebtoken @types/jsonwebtoken

# Run the render-build script
echo "Running render-build script..."
npm run render-build

# Print directory structure for debugging
echo "Directory structure:"
ls -la
echo "dist directory:"
ls -la dist || echo "dist directory not found"
echo "server directory:"
ls -la server || echo "server directory not found"
echo "dist/server directory:"
ls -la dist/server || echo "dist/server directory not found"

echo "Build completed successfully!" 