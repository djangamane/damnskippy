#!/bin/bash

# Install dependencies
echo "Installing dependencies..."
npm install

# Install jsonwebtoken explicitly
echo "Installing jsonwebtoken explicitly..."
npm install jsonwebtoken @types/jsonwebtoken

# Build the client manually without using npm scripts
echo "Building client..."
npx tsc
npx vite build

# Build the server manually
echo "Building server..."
npx tsc -p tsconfig.server.json

# Create the directory structure
echo "Creating directory structure..."
mkdir -p dist/server
cp -r dist/server/* dist/server/ 2>/dev/null || true

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