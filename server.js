// This file is used as the entry point for Render deployment
// It simply imports and runs the compiled server code

const path = require('path');
const fs = require('fs');

const __dirname = path.resolve();

// Check if the compiled server file exists
const serverPath = path.join(__dirname, 'dist', 'server', 'index.js');

if (fs.existsSync(serverPath)) {
  console.log(`Server file found at: ${serverPath}`);
  require(serverPath);
  console.log('Server started successfully via server.js entry point');
} else {
  console.error(`Server file not found at: ${serverPath}`);
  console.error('Please ensure the server has been built correctly');
  process.exit(1);
}

// Simple monolithic server.js for production
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

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