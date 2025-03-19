import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { apiRouter } from './routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set up paths based on environment
let staticPath = '';
let currentPath = '';

// Determine if we're in Render's environment
const isRender = process.env.RENDER === 'true' || process.env.IS_RENDER === 'true';

// Log working directory and file path for debugging
console.log('Working directory:', process.cwd());
console.log('__dirname:', __dirname);
console.log('Is Render environment:', isRender);

// Configure paths based on environment
if (isRender) {
  // In Render, static files are at /opt/render/project/src/dist
  staticPath = join('/opt/render/project/src/dist');
  currentPath = join('/opt/render/project/src');
} else if (process.env.NODE_ENV === 'production') {
  // In other production environments
  staticPath = join(dirname(__dirname));
  currentPath = join(dirname(dirname(__dirname)));
} else {
  // In development
  staticPath = join(dirname(dirname(__dirname)), 'dist');
  currentPath = dirname(dirname(__dirname));
}

// Load environment variables
const envPath = process.env.NODE_ENV === 'production' 
  ? join(currentPath, '.env')
  : join(currentPath, '.env.server');

config({ path: envPath });

console.log(`Environment loading from: ${envPath}`);
console.log('Environment variables status:', {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'Present' : 'Not present',
  MONGODB_URI: process.env.MONGODB_URI ? 'Present' : 'Not present',
  JWT_SECRET: process.env.JWT_SECRET ? 'Present' : 'Not present'
});
console.log(`Static files will be served from: ${staticPath}`);

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(staticPath));

// API routes
app.use('/api', apiRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve index.html for client-side routing
app.get('*', (req, res) => {
  const indexPath = join(staticPath, 'index.html');
  console.log(`Serving index.html from: ${indexPath}`);
  res.sendFile(indexPath);
});

// Start server
const startServer = async () => {
  try {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
      console.log(`Working directory: ${process.cwd()}`);
      console.log(`__dirname: ${__dirname}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 