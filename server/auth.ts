import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

// Test account credentials
const TEST_EMAIL = 'tzuracializm@gmail.com';
const TEST_PASSWORD = 'test123';

// Sign in route
router.post('/signin', async (req: Request, res: Response): Promise<void> => {
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
router.post('/signout', (req: Request, res: Response): void => {
  // In a stateless JWT setup, the client is responsible for removing the token
  res.json({ success: true });
});

export const authRouter = router; 