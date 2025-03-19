// Simple monolithic server.js for production
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Initialize Express app
const app = express();
const port = process.env.PORT || 3001;

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://janga:busseja@janga0.f5z2f6j.mongodb.net/?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });

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

// Middleware
app.use(cors());
app.use(express.json());

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
    
    // Find user by email
    const user = await User.findOne({ email: req.body.email });
    
    // Check if user exists
    if (!user) {
      console.log('User not found:', req.body.email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Check password
    const isPasswordValid = await user.comparePassword(req.body.password);
    if (!isPasswordValid) {
      console.log('Invalid password for:', req.body.email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    console.log('Login successful for:', user.email);
    
    // Update last login time
    user.lastLoginAt = new Date();
    await user.save();
    
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
  res.json({ success: true });
});

// Sign up route
app.post('/api/auth/signup', async (req, res) => {
  try {
    console.log('Sign-up request received:', { 
      email: req.body.email, 
      password: '[REDACTED]',
      displayName: req.body.displayName 
    });
    
    // Validate request
    if (!req.body.email || !req.body.password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    // Create new user
    const newUser = new User({
      email: req.body.email,
      password: req.body.password,
      displayName: req.body.displayName || req.body.email.split('@')[0],
      createdAt: new Date()
    });
    
    // Save user to database
    await newUser.save();
    
    console.log('User created successfully:', { id: newUser._id, email: newUser.email });
    
    // Generate token
    const token = jwt.sign(
      { email: newUser.email, id: newUser._id },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '24h' }
    );
    
    // Return user data without password
    const userData = {
      _id: newUser._id,
      email: newUser.email,
      displayName: newUser.displayName,
      createdAt: newUser.createdAt
    };
    
    // Return success response
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      token,
      data: userData
    });
  } catch (error) {
    console.error('Sign-up error:', error);
    
    // Check for duplicate key error (MongoDB error code 11000)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Research API endpoint
app.post('/api/research', async (req, res) => {
  try {
    console.log('Research request received:', req.body);
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Missing query parameter',
        message: 'Please provide a search query'
      });
    }
    
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key is missing');
      return res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'The research service is currently unavailable due to configuration issues. Please try again later.'
      });
    }
    
    // Initialize OpenAI
    const OpenAI = require('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    console.log('Performing research with OpenAI for:', query);
    
    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are an AI research assistant specializing in automation solutions. 
          When asked about automation, provide detailed, practical advice including:
          1. Step-by-step implementation guide
          2. Recommended tools and services
          3. Best practices and potential pitfalls
          4. Cost estimates and ROI considerations
          5. Integration tips with existing systems
          Format your response in clear sections with markdown headings.`
        },
        {
          role: "user",
          content: query
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });
    
    console.log('OpenAI response received');
    res.json({
      success: true,
      result: completion.choices[0].message.content || 'No results found'
    });
  } catch (error) {
    console.error('Research error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// Catch-all route to serve the SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Current directory: ${__dirname}`);
  console.log(`Files in dist directory:`);
  try {
    const files = fs.readdirSync(staticPath);
    console.log(files);
  } catch (err) {
    console.error(`Error reading dist directory: ${err.message}`);
  }
});