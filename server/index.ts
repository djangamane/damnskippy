import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import path from 'path';
import { apiRouter } from './routes.js';

const __filename = path.join(process.cwd(), 'server', 'index.ts');
const __dirname = path.dirname(__filename);

config();

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
  staticPath = path.join('/opt/render/project/src/dist');
  currentPath = path.join('/opt/render/project/src/dist', 'index.html');
} else if (process.env.NODE_ENV === 'production') {
  // In other production environments
  staticPath = path.join(path.dirname(__dirname));
  currentPath = path.join(path.dirname(path.dirname(__dirname)), 'index.html');
} else {
  // In development
  staticPath = path.join(path.dirname(path.dirname(__dirname)), 'dist');
  currentPath = path.join(path.dirname(path.dirname(__dirname)), 'index.html');
}

console.log('Static path:', staticPath);
console.log('Current path:', currentPath);

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
app.get('/api/health', (req: any, res: any) => {
  res.json({ status: 'ok' });
});

// Serve index.html for client-side routing
app.get('*', (req: any, res: any) => {
  console.log(`Serving index.html from: ${currentPath}`);
  res.sendFile(currentPath);
});

async function startServer() {
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
}

// Start server
startServer();