import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export const authRouter = Router();

// Test user credentials - in production, this would come from a database
const TEST_USER = {
  _id: 'test123',
  email: 'test@example.com',
  password: 'test123',
  displayName: 'Test User',
  isPaidUser: false
};

// Sign-in handler
authRouter.post('/signin', async (req: Request, res: Response) => {
  try {
    console.log('Sign-in request received:', { ...req.body, password: '[REDACTED]' });
    const { email, password } = req.body;

    // Input validation
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      console.log('Invalid email format:', email);
      return res.status(400).json({
        error: 'Invalid email format',
        details: 'Please provide a valid email address'
      });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      console.log('Invalid password format');
      return res.status(400).json({
        error: 'Invalid password format',
        details: 'Password must be at least 6 characters long'
      });
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
      
      return res.status(200).json({
        success: true,
        token,
        user: userData
      });
    }

    // If credentials don't match
    console.log('Invalid credentials for:', email);
    return res.status(401).json({
      error: 'Invalid credentials',
      details: 'The provided email or password is incorrect'
    });

  } catch (error) {
    console.error('Sign-in error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: 'An unexpected error occurred during sign-in'
    });
  }
}); 