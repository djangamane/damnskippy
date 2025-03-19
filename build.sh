#!/bin/bash

echo "Starting simplified build process..."

# Clean up any previous build artifacts
echo "Cleaning dist directory..."
rm -rf dist

# Explicitly run vite from node_modules
echo "Building client-side app..."
./node_modules/.bin/vite build

# Create a simplified server.js in the root directory
echo "Creating server.js..."
cat > server.js << 'EOL'
// Simple monolithic server.js for production
const express = require('express');
const cors = require('cors');
const path = require('path');

// Initialize Express app
const app = express();
const port = process.env.PORT || 3001;

// Set up middleware
app.use(cors());
app.use(express.json());

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Catch-all route to serve the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Working directory: ${process.cwd()}`);
});
EOL

echo "Build process completed!"
ls -la
echo "Dist directory:"
ls -la dist 