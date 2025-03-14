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

# Copy server files to dist/server
cp -r dist/server/* dist/server/

# Install any missing dependencies
echo "Installing jsonwebtoken explicitly..."
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