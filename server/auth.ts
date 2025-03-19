import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../src/models/User';
import mongoose from 'mongoose';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';

export const authRouter = Router();

// Interface for JWT payload
interface JwtPayload {
  id: string;
  email: string;
}

// Authentication middleware
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// Add user to Request type
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// Extract user from request
export const extractUserFromRequest = async (req: Request): Promise<User | null> => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    
    // Find user in database
    if (global.User) {
      const user = await global.User.findById(decoded.id);
      if (!user) return null;
      
      // Convert to User type
      return {
        id: user._id.toString(),
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        isPaidUser: user.isPaidUser || false,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting user from token:', error);
    return null;
  }
};

// Test account credentials
const TEST_EMAIL = 'tzuracializm@gmail.com';
const TEST_PASSWORD = 'test123';

// Sign in route
authRouter.post('/signin', async (req: Request, res: Response): Promise<void> => {
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
        user: {
          email: TEST_EMAIL,
          name: 'Test User'
        }
      });
      return;
    }

    console.log('Invalid credentials for:', req.body.email);
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
    return;
  } catch (error) {
    console.error('Sign-in error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
    return;
  }
});

// Sign out route
authRouter.post('/signout', (req: Request, res: Response): void => {
  // In a stateless JWT setup, the client is responsible for removing the token
  res.json({ success: true });
});

// Special upgrade endpoint - accessible to anyone who knows the URL
// This is a direct upgrade for a specific user
authRouter.get('/force-upgrade-user', async (req: Request, res: Response): Promise<void> => {
  try {
    // Hardcoded user ID to upgrade
    const userId = '67daf045e191a7f5cbf85961'; // lordomegaking@gmail.com
    
    console.log(`Attempting to force-upgrade user with ID: ${userId}`);
    
    let success = false;
    let userInfo = null;
    
    // Try all possible ways to upgrade the user
    
    // Try using global User model
    if (typeof global.User === 'function') {
      try {
        console.log('Using global User model');
        const user = await global.User.findById(userId);
        
        if (user) {
          user.isPaidUser = true;
          await user.save();
          
          console.log(`User ${user.email} upgraded via global User model`);
          success = true;
          userInfo = {
            email: user.email,
            isPaidUser: user.isPaidUser
          };
        }
      } catch (error) {
        console.error('Error using global User model:', error);
      }
    }
    
    // Try direct mongoose if global failed
    if (!success) {
      try {
        console.log('Trying direct mongoose access');
        
        // Build a minimal User model to avoid validation issues
        const userSchema = new mongoose.Schema({
          email: String,
          isPaidUser: Boolean
        }, { strict: false });
        
        const DirectUser = mongoose.model('User_DirectAccess', userSchema, 'users');
        
        const updateResult = await DirectUser.findByIdAndUpdate(
          userId,
          { isPaidUser: true },
          { new: true }
        );
        
        if (updateResult) {
          console.log(`User ${updateResult.email} upgraded via direct mongoose`);
          success = true;
          userInfo = {
            email: updateResult.email,
            isPaidUser: updateResult.isPaidUser
          };
        }
      } catch (error) {
        console.error('Error with direct mongoose update:', error);
      }
    }
    
    if (success) {
      res.json({
        success: true,
        message: 'User upgraded successfully!',
        user: userInfo
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to upgrade user. Try logging out and back in.'
      });
    }
  } catch (error) {
    console.error('Force upgrade error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during force upgrade'
    });
  }
}); 