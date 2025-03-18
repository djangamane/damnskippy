import express, { Request, Response, Router, RequestHandler, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { MongoClient, ObjectId } from 'mongodb';
import fs from 'fs';
import { researchRouter } from './research.js';
import { authRouter } from './auth.js';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = path.join(process.cwd(), '.env.server');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log('Environment loading from:', envPath);
} else {
  dotenv.config();
  console.log('Using default .env file');
}

// Log loaded environment variables
console.log('Environment variables loaded:', {
  MONGODB_URI: process.env.MONGODB_URI ? 'Set (hidden)' : 'Not set',
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY ? 'Set (hidden)' : 'Not set',
  JWT_SECRET: process.env.JWT_SECRET ? 'Set (hidden)' : 'Not set'
});

// Process management
process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Performing graceful shutdown...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT. Performing graceful shutdown...');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Keep the process alive but log the error
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Keep the process alive but log the error
});

// Port management
const PORT = process.env.PORT || 3001;
let server: any = null;

function startServer(app: express.Application) {
  return new Promise((resolve, reject) => {
    try {
      server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        resolve(server);
      });

      server.on('error', (error: any) => {
        if (error.code === 'EADDRINUSE') {
          console.log(`Port ${PORT} is busy, attempting to close existing connections...`);
          require('child_process').exec(`npx kill-port ${PORT}`, (err: any) => {
            if (err) {
              console.error('Error killing port:', err);
              reject(err);
            } else {
              console.log(`Port ${PORT} has been freed`);
              startServer(app).then(resolve).catch(reject);
            }
          });
        } else {
          console.error('Server error:', error);
          reject(error);
        }
      });
    } catch (error) {
      console.error('Error starting server:', error);
      reject(error);
    }
  });
}

// API Routes
const apiRouter = Router();

// Authentication middleware
interface AuthRequest extends Request {
  user?: {
    _id: string;
    email: string;
    displayName?: string;
    isPaidUser?: boolean;
  };
}

const authenticateToken: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthRequest;
  const authHeader = authReq.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN format
  
  if (!token) {
    res.status(401).json({ error: 'Access denied. No token provided.' });
    return;
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      _id: string;
      email: string;
      displayName?: string;
      isPaidUser?: boolean;
    };
    
    authReq.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid token.' });
    return;
  }
};

// Test user credentials
const TEST_USER = {
  _id: 'test123',
  email: 'tzuracializm@gmail.com',
  password: 'millions24',
  displayName: 'Test User',
  isPaidUser: false
};

// Authentication routes
const signInHandler = (req: Request, res: Response, next: NextFunction) => {
  (async () => {
    try {
      console.log('Sign-in request received:', { ...req.body, password: '[REDACTED]' });
      const { email, password } = req.body;

      // Input validation
      if (!email || typeof email !== 'string' || !email.includes('@')) {
        console.log('Invalid email format:', email);
        res.status(400).json({
          success: false,
          error: 'Invalid email format',
          message: 'Please provide a valid email address'
        });
        return;
      }

      if (!password || typeof password !== 'string' || password.length < 6) {
        console.log('Invalid password format');
        res.status(400).json({
          success: false,
          error: 'Invalid password format',
          message: 'Password must be at least 6 characters long'
        });
        return;
      }

      // Test account check
      if (email === TEST_USER.email && password === TEST_USER.password) {
        console.log('Test account login successful');
        
        const userData = {
          _id: TEST_USER._id,
          email: TEST_USER.email,
          displayName: TEST_USER.displayName,
          isPaidUser: TEST_USER.isPaidUser
        };

        const token = jwt.sign(
          userData,
          process.env.JWT_SECRET || 'fallback-secret-key-for-development',
          { expiresIn: '24h' }
        );

        // Log the response being sent
        console.log('Sending successful response with token and user data');
        
        res.status(200).json({
          success: true,
          data: userData,
          token
        });
        return;
      }

      // If credentials don't match
      console.log('Invalid credentials for:', email);
      res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'The provided email or password is incorrect'
      });

    } catch (error) {
      console.error('Sign-in error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred during sign-in'
      });
    }
  })().catch(next);
};

apiRouter.post('/auth/signin', signInHandler);

// Add research routes
apiRouter.use('/research', authenticateToken, researchRouter);

// Initialize Express app
const app = express();

// CORS configuration for development only
if (process.env.NODE_ENV !== 'production') {
  const corsOptions = {
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
  };
  app.use(cors(corsOptions));
}

// Middleware
app.use(express.json());

// API Routes
app.use('/api', apiRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// In production, serve static files and handle client routing
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the dist directory
  app.use(express.static(path.join(__dirname, '../../dist')));

  // Handle client-side routing - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, '../../dist/index.html'));
    }
  });
}

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
  });
});

// Start server with proper error handling
startServer(app).catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

export default app; 