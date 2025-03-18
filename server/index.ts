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

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(dirname(__dirname))));
}

// API routes
app.use('/api', apiRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve index.html for client-side routing in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(join(dirname(__dirname), 'index.html'));
  });
}

// Start server
const startServer = async () => {
  try {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 