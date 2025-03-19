// This file is used as the entry point for Render deployment
const path = require('path');
const fs = require('fs');

// Check if we're in production (Render) environment
const isRender = process.env.IS_RENDER === 'true';

if (isRender) {
  // In production, use the compiled server code
  console.log('Starting server in production mode...');
  const serverDistPath = path.join(__dirname, 'dist', 'server');
  const serverPath = path.join(serverDistPath, 'index.js');

  if (fs.existsSync(serverPath)) {
    console.log(`Server file found at: ${serverPath}`);
    process.env.NODE_ENV = 'production';
    require(serverPath);
  } else {
    console.error(`Server file not found at: ${serverPath}`);
    console.error('Available files in dist directory:');
    try {
      const distPath = path.join(__dirname, 'dist');
      if (fs.existsSync(distPath)) {
        console.log('Contents of dist directory:');
        console.log(fs.readdirSync(distPath));
        
        if (fs.existsSync(serverDistPath)) {
          console.log('Contents of dist/server directory:');
          console.log(fs.readdirSync(serverDistPath));
        } else {
          console.log('dist/server directory does not exist');
        }
      } else {
        console.log('dist directory does not exist');
      }
    } catch (err) {
      console.error('Error listing directories:', err);
    }
    process.exit(1);
  }
} else {
  // In development, use ts-node to run the TypeScript server directly
  console.log('Starting server in development mode...');
  process.env.NODE_ENV = 'development';
  require('ts-node').register({
    project: path.join(__dirname, 'tsconfig.server.json')
  });
  require('./server/index.ts');
}

// Simple monolithic server.js for production
const express = require('express');
const cors = require('cors');

// Initialize Express app
const app = express();
const port = process.env.PORT || 3001;

// Log environment details
console.log('Starting server with CommonJS syntax');
console.log(`Node environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`Working directory: ${process.cwd()}`);

// Check if the dist directory exists
if (!fs.existsSync(path.join(__dirname, 'dist'))) {
  console.error('Error: dist directory not found!');
  console.log('Contents of current directory:');
  console.log(fs.readdirSync(__dirname));
}

// Set up middleware
app.use(cors());
app.use(express.json());

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    serverType: 'CommonJS'
  });
});

// Catch-all route to serve the React app
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Application files not found. The build may not have completed successfully.');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Working directory: ${process.cwd()}`);
}); 