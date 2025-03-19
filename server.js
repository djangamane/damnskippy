// Simple monolithic server.js for production
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const port = process.env.PORT || 3001;

// For MongoDB connection issues in development, fall back to in-memory storage
let useInMemoryStorage = true; // Default to in-memory storage
const users = [
  {
    _id: '123456789',
    email: 'test@example.com',
    password: 'test123',
    displayName: 'Test User'
  },
  {
    _id: '987654321',
    email: 'the.nonprofit.org@gmail.com',
    password: 'test123',
    displayName: 'Nonprofit User'
  }
];

// Try to connect to MongoDB, but don't block server startup
try {
  const mongoose = require('mongoose');
  const bcrypt = require('bcrypt');
  
  // MongoDB Connection
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://janga:busseja@janga0.f5z2f6j.mongodb.net/damnskippy?retryWrites=true&w=majority';
  
  mongoose.connect(MONGODB_URI, {
    // These options help with connection issues
    connectTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    serverSelectionTimeoutMS: 60000,
  })
    .then(() => {
      console.log('Connected to MongoDB successfully');
      console.log('Database:', mongoose.connection.db.databaseName);
      console.log('MongoDB connection state:', mongoose.connection.readyState);
      useInMemoryStorage = false;
      
      // User Schema and Model
      const userSchema = new mongoose.Schema({
        email: { 
          type: String, 
          required: true, 
          unique: true,
          trim: true,
          lowercase: true
        },
        password: { 
          type: String, 
          required: true 
        },
        displayName: { 
          type: String, 
          default: function() {
            return this.email.split('@')[0];
          }
        },
        isPaidUser: {
          type: Boolean,
          default: false
        },
        createdAt: { 
          type: Date, 
          default: Date.now 
        },
        lastLoginAt: { 
          type: Date 
        }
      });
      
      // Pre-save hook to hash password
      userSchema.pre('save', async function(next) {
        // Only hash the password if it's modified (or new)
        if (!this.isModified('password')) return next();
        
        try {
          // Generate a salt
          const salt = await bcrypt.genSalt(10);
          // Hash the password along with the new salt
          this.password = await bcrypt.hash(this.password, salt);
          next();
        } catch (error) {
          next(error);
        }
      });
      
      // Method to compare passwords
      userSchema.methods.comparePassword = async function(candidatePassword) {
        try {
          return await bcrypt.compare(candidatePassword, this.password);
        } catch (error) {
          throw error;
        }
      };
      
      // Create the User model
      const User = mongoose.model('User', userSchema);
      
      // Create test users if they don't exist
      async function createTestUsers() {
        try {
          // Check if test user exists
          const testUser = await User.findOne({ email: 'test@example.com' });
          if (!testUser) {
            await User.create({
              email: 'test@example.com',
              password: 'test123',
              displayName: 'Test User'
            });
            console.log('Created test user');
          }
          
          // Check if nonprofit user exists
          const nonprofitUser = await User.findOne({ email: 'the.nonprofit.org@gmail.com' });
          if (!nonprofitUser) {
            await User.create({
              email: 'the.nonprofit.org@gmail.com',
              password: 'test123',
              displayName: 'Nonprofit User'
            });
            console.log('Created nonprofit user');
          }
        } catch (error) {
          console.error('Error creating test users:', error);
        }
      }
      
      // Call the function to create test users
      createTestUsers();
      
      // Export the User model for use in routes
      global.User = User;
      
      // Load our models
      try {
        // Import and register Research Thread model
        const ResearchThreadSchema = new mongoose.Schema({
          userId: {
            type: String,
            required: true,
            index: true
          },
          query: {
            type: String,
            required: true
          },
          result: {
            type: String,
            required: true
          },
          timestamp: {
            type: Date,
            default: Date.now
          },
          tags: {
            type: [String],
            default: []
          }
        });
        
        global.ResearchThread = mongoose.model('ResearchThread', ResearchThreadSchema);
        
        // Import and register Custom Workflow model
        const WorkflowStepSchema = new mongoose.Schema({
          title: {
            type: String,
            required: true
          },
          description: {
            type: String,
            required: true
          },
          order: {
            type: Number,
            required: true
          },
          isCompleted: {
            type: Boolean,
            default: false
          }
        });
        
        const CustomWorkflowSchema = new mongoose.Schema({
          userId: {
            type: String,
            required: true,
            index: true
          },
          name: {
            type: String,
            required: true
          },
          description: {
            type: String,
            required: true
          },
          steps: {
            type: [WorkflowStepSchema],
            default: []
          },
          status: {
            type: String,
            enum: ['active', 'draft', 'archived'],
            default: 'draft'
          },
          createdAt: {
            type: Date,
            default: Date.now
          },
          updatedAt: {
            type: Date,
            default: Date.now
          }
        });
        
        // Update timestamp on save
        CustomWorkflowSchema.pre('save', function(next) {
          this.updatedAt = new Date();
          next();
        });
        
        global.CustomWorkflow = mongoose.model('CustomWorkflow', CustomWorkflowSchema);
        
        console.log('All models loaded successfully');
      } catch (modelError) {
        console.error('Error loading models:', modelError);
      }
    })
    .catch(err => {
      console.error('MongoDB connection error:', err);
      console.log('Using in-memory storage for users');
    });
} catch (error) {
  console.error('Error loading MongoDB modules:', error.message);
  console.log('Using in-memory storage for users');
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Set server-wide timeout values
app.timeout = 180000; // 3 minutes

// Increase server timeout for long-running requests
app.use((req, res, next) => {
  // Set timeouts at the request level
  req.setTimeout(180000); // 3 minutes
  res.setTimeout(180000); // 3 minutes
  req.socket.setTimeout(180000); // 3 minutes
  console.log('Set request timeout to 3 minutes');
  next();
});

// Determine static file path
const staticPath = path.join(__dirname, 'dist');
console.log(`Serving static files from: ${staticPath}`);

// Serve static files
app.use(express.static(staticPath));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', environment: process.env.NODE_ENV });
});

// Simple API endpoint for testing
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from the server!' });
});

// Authentication endpoints
// Sign in route
app.post('/api/auth/signin', async (req, res) => {
  try {
    console.log('Sign-in request received:', { email: req.body.email, password: '[REDACTED]' });
    
    // Validate request
    if (!req.body.email || !req.body.password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }
    
    let user;
    let isPasswordValid;
    
    if (useInMemoryStorage) {
      user = users.find(u => u.email === req.body.email);
      isPasswordValid = user && user.password === req.body.password;
    } else {
      user = await global.User.findOne({ email: req.body.email });
      isPasswordValid = user && await user.comparePassword(req.body.password);
    }
    
    // Check if user exists
    if (!user) {
      console.log('User not found:', req.body.email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Check password
    if (!isPasswordValid) {
      console.log('Invalid password for:', req.body.email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    console.log('Login successful for:', user.email);
    
    // Update last login time (only for MongoDB storage)
    if (!useInMemoryStorage) {
      user.lastLoginAt = new Date();
      await user.save();
    }
    
    // Generate token
    const token = jwt.sign(
      { email: user.email, id: user._id },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '24h' }
    );
    
    // Return user data without password
    const userData = {
      _id: user._id,
      email: user.email,
      displayName: user.displayName,
      isPaidUser: user.isPaidUser || false,
      createdAt: user.createdAt
    };
    
    console.log('Sending successful response with token and user data');
    res.json({
      success: true,
      token,
      data: userData
    });
  } catch (error) {
    console.error('Sign-in error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Sign out route
app.post('/api/auth/signout', (req, res) => {
  // In a stateless JWT setup, the client is responsible for removing the token
  res.json({
    success: true
  });
});

// Sign up route
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;
    console.log('Signup attempt for email:', email);
    console.log('MongoDB connection state:', mongoose.connection.readyState);
    console.log('Using in-memory storage:', useInMemoryStorage);

    // Validate request
    if (!email || !password) {
      console.log('Signup validation failed: missing email or password');
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Check if user already exists
    const existingUser = await global.User.findOne({ email: email.toLowerCase() });
    console.log('Existing user check result:', existingUser ? 'User exists' : 'User does not exist');
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }

    // Create new user
    console.log('Creating new user with email:', email);
    const user = new global.User({
      email: email.toLowerCase(),
      password, // Password will be hashed by the pre-save hook
      displayName: displayName || email.split('@')[0],
      isPaidUser: false,
      createdAt: new Date()
    });

    const savedUser = await user.save();
    console.log('User saved successfully:', savedUser._id);

    // Generate token
    const token = jwt.sign(
      { email: user.email, id: user._id },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '24h' }
    );

    // Return user data without password
    const userData = {
      _id: user._id,
      email: user.email,
      displayName: user.displayName,
      isPaidUser: user.isPaidUser,
      createdAt: user.createdAt
    };

    console.log('Signup successful, returning user data');
    res.status(201).json({
      success: true,
      token,
      data: userData
    });
  } catch (error) {
    console.error('Sign-up error details:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Internal server error: ' + error.message
    });
  }
});

// Load research router to handle API requests
try {
  const { researchRouter } = require('./server/research');
  app.use('/api/research', researchRouter);
  console.log('Research router loaded successfully');
} catch (error) {
  console.error('Failed to load research router:', error);
  console.log('Using fallback research handling...');
  
  // Fallback research handling if the router fails to load
  app.post('/api/research', async (req, res) => {
    try {
      const { query } = req.body;
      const token = req.headers.authorization?.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Simulation mode response
      const result = `Fallback simulated response for query: "${query}"\n\nThis is a placeholder response since the research router failed to load.`;
      
      // Save the research thread
      const thread = await global.ResearchThread.create({
        userId: decoded.userId,
        query,
        result
      });
      
      res.json({
        success: true,
        threadId: thread._id,
        result
      });
    } catch (error) {
      console.error('Research error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process research request'
      });
    }
  });
  
  app.get('/api/research/history', async (req, res) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const threads = await global.ResearchThread.find({ userId: decoded.userId })
        .sort({ timestamp: -1 })
        .limit(50);
      
      res.json(threads.map(thread => ({
        id: thread._id,
        query: thread.query,
        result: thread.result,
        timestamp: thread.timestamp
      })));
    } catch (error) {
      console.error('Error fetching research history:', error);
      res.status(500).json({ error: 'Failed to fetch research history' });
    }
  });
}

// Get individual research thread
app.get('/api/research/thread/:id', async (req, res) => {
  try {
    const thread = await global.ResearchThread.findById(req.params.id);
    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }
    
    // Verify the user has access to this thread
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (thread.userId !== decoded.userId) {
      return res.status(403).json({ error: 'Unauthorized access to thread' });
    }
    
    res.json({
      id: thread._id,
      query: thread.query,
      result: thread.result,
      timestamp: thread.timestamp
    });
  } catch (error) {
    console.error('Error fetching research thread:', error);
    res.status(500).json({ error: 'Failed to fetch research thread' });
  }
});

// Payment confirmation endpoint
app.post('/api/payment/confirm', async (req, res) => {
  try {
    const { transactionId } = req.body;
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message: 'Transaction ID is required'
      });
    }
    
    const token = authHeader.split(' ')[1];
    let user;
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
      if (!useInMemoryStorage) {
        user = await global.User.findById(decoded.id);
      }
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }
    
    console.log(`Payment confirmation received - User: ${user.email}, Transaction: ${transactionId}`);
    
    // In a production environment, send email notification
    // For now, just log it
    console.log(`PAYMENT NOTIFICATION: User ${user.email} (${user._id}) submitted transaction ${transactionId}`);
    
    res.json({
      success: true,
      message: 'Payment confirmation received. Your account will be upgraded once the payment is verified.'
    });
  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process payment confirmation'
    });
  }
});

// Admin endpoint to upgrade user
app.post('/api/admin/upgrade-user', async (req, res) => {
  try {
    const { userId } = req.body;
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    const token = authHeader.split(' ')[1];
    let adminUser;
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
      if (!useInMemoryStorage) {
        adminUser = await global.User.findById(decoded.id);
      }
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (!adminUser) {
      return res.status(401).json({
        success: false,
        message: 'Admin user not found'
      });
    }
    
    // Check if user is admin (by email for simplicity)
    const adminEmails = ['jason@abitofadvicellc.com', 'the.nonprofit.org@gmail.com'];
    if (!adminEmails.includes(adminUser.email)) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    // Find and upgrade user
    if (useInMemoryStorage) {
      return res.status(500).json({
        success: false,
        message: 'Cannot upgrade users in memory-only mode'
      });
    }
    
    const userToUpgrade = await global.User.findById(userId);
    
    if (!userToUpgrade) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    userToUpgrade.isPaidUser = true;
    await userToUpgrade.save();
    
    console.log(`User ${userId} upgraded to premium by admin ${adminUser.email}`);
    
    res.json({
      success: true,
      message: `User ${userToUpgrade.email} has been upgraded to premium`
    });
  } catch (error) {
    console.error('Admin upgrade error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upgrade user'
    });
  }
});

// Serve index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

// Create HTTP server with proper timeout
const http = require('http');
const server = http.createServer(app);

// Set server-wide timeout (3 minutes = 180000ms)
server.timeout = 180000; // 3 minutes
server.keepAliveTimeout = 180000; // 3 minutes
server.headersTimeout = 180000; // 3 minutes

// Start the server
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Server timeout set to ${server.timeout}ms`);
});