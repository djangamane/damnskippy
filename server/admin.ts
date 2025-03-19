import { Router, Request, Response } from 'express';
import { authenticate, extractUserFromRequest } from './auth';

const router = Router();

// Admin-only middleware
const requireAdmin = async (req: Request, res: Response, next: Function) => {
  try {
    const user = await extractUserFromRequest(req);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Check if user is admin (either by role or specific email)
    const adminEmails = ['janga.bussaja@gmail.com', 'admin@damnskippy.com']; 
    const isAdmin = adminEmails.includes(user.email.toLowerCase());
    
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Upgrade user to premium
router.post('/upgrade-user', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { userId, transactionId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    // Find and update user in database
    const user = await global.User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update user to premium
    user.isPaidUser = true;
    await user.save();
    
    console.log(`User ${userId} upgraded to premium status. Transaction: ${transactionId || 'Not provided'}`);
    
    res.json({
      success: true,
      message: `User ${user.email} has been upgraded to premium status`
    });
  } catch (error: any) {
    console.error('Error upgrading user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upgrade user'
    });
  }
});

// Get list of users (admin only)
router.get('/users', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const users = await global.User.find({}, '-password');
    
    res.json({
      success: true,
      data: users
    });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

export const adminRouter = router; 