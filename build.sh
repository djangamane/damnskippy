#!/bin/bash

# Install dependencies
echo "Installing dependencies..."
npm install

# Install jsonwebtoken explicitly
echo "Installing jsonwebtoken explicitly..."
npm install jsonwebtoken @types/jsonwebtoken

# Build the client
echo "Building client..."
npm run build

# Build the server
echo "Building server..."
npm run build:server

echo "Build completed successfully!" 