// Simple monolithic server.js for production
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');

// Initialize Express app
const app = express();
const port = process.env.PORT || 3001;

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
// Test account credentials
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'test123';

// Sign in route
app.post('/api/auth/signin', (req, res) => {
  try {
    console.log('Sign-in request received:', { email: req.body.email, password: '[REDACTED]' });
    
    // Check test account credentials
    if (req.body.email === TEST_EMAIL && req.body.password === TEST_PASSWORD) {
      console.log('Test account login successful');
      
      const token = jwt.sign(
        { email: TEST_EMAIL },
        process.env.JWT_SECRET || 'default-secret',
        { expiresIn: '24h' }
      );

      console.log('Sending successful response with token and user data');
      res.json({
        success: true,
        token,
        data: {
          _id: '123456789',
          email: TEST_EMAIL,
          displayName: 'Test User'
        }
      });
      return;
    }
    
    // Also accept the nonprofit email from the login page
    if (req.body.email === 'the.nonprofit.org@gmail.com' && req.body.password === TEST_PASSWORD) {
      console.log('Nonprofit account login successful');
      
      const token = jwt.sign(
        { email: 'the.nonprofit.org@gmail.com' },
        process.env.JWT_SECRET || 'default-secret',
        { expiresIn: '24h' }
      );

      console.log('Sending successful response with token and user data');
      res.json({
        success: true,
        token,
        data: {
          _id: '987654321',
          email: 'the.nonprofit.org@gmail.com',
          displayName: 'Nonprofit User'
        }
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