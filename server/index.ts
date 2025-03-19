import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { apiRouter } from './routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = process.env.NODE_ENV === 'production' 
  ? join(__dirname, '.env')
  : join(dirname(dirname(__dirname)), '.env.server');

config({ path: envPath });

console.log(`Environment loading from: ${envPath}`);
console.log('Environment variables status:', {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'Present' : 'Not present',
  MONGODB_URI: process.env.MONGODB_URI ? 'Present' : 'Not present',
  JWT_SECRET: process.env.JWT_SECRET ? 'Present' : 'Not present'
});

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Determine static file path
const staticPath = process.env.NODE_ENV === 'production'
  ? join(dirname(__dirname))  // In production, static files are at the dist root
  : join(dirname(dirname(__dirname)), 'dist'); // In dev, they're in the project root's dist

console.log(`Serving static files from: ${staticPath}`);

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