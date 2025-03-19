// Simple monolithic server.js for production
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');

// Initialize Express app
const app = express();
const port = process.env.PORT || 3001;

// In-memory user storage (for demonstration purposes)
// In a production app, this would be a database
const users = [
  {
    _id: '123456789',
    email: 'test@example.com',
    password: 'test123', // In a real app, this would be hashed
    displayName: 'Test User'
  },
  {
    _id: '987654321',
    email: 'the.nonprofit.org@gmail.com',
    password: 'test123', // In a real app, this would be hashed
    displayName: 'Nonprofit User'
  }
];

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
app.post('/api/auth/signin', (req, res) => {
  try {
    console.log('Sign-in request received:', { email: req.body.email, password: '[REDACTED]' });
    
    // Find user by email
    const user = users.find(u => u.email === req.body.email);
    
    // Check if user exists and password matches
    if (user && user.password === req.body.password) {
      console.log('Login successful for:', user.email);
      
      const token = jwt.sign(
        { email: user.email, id: user._id },
        process.env.JWT_SECRET || 'default-secret',
        { expiresIn: '24h' }
      );

      // Return user data without password
      const userData = {
        _id: user._id,
        email: user.email,
        displayName: user.displayName
      };

      console.log('Sending successful response with token and user data');
      res.json({
        success: true,
        token,
        data: userData
      });
      return;
    }

    console.log('Invalid credentials for:', req.body.email);
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
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
app.post('/api/auth/signup', (req, res) => {
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
    const existingUser = users.find(u => u.email === req.body.email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    // For demonstration purposes, we'll create a new user with a random ID
    const userId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // Create user object
    const newUser = {
      _id: userId,
      email: req.body.email,
      password: req.body.password, // In a real app, this would be hashed
      displayName: req.body.displayName || req.body.email.split('@')[0],
      createdAt: new Date().toISOString()
    };
    
    // Add user to our in-memory storage
    users.push(newUser);
    
    console.log('New user added to in-memory storage. Total users:', users.length);
    
    // Generate token
    const token = jwt.sign(
      { email: newUser.email, id: newUser._id },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '24h' }
    );
    
    console.log('User created successfully:', { userId, email: newUser.email });
    
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