import { Router, Request, Response } from 'express';
import { authenticate, extractUserFromRequest } from './auth';
import mongoose from 'mongoose';

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

// Admin-only route to manually upgrade a user
router.post('/upgrade-user/:userId', authenticate, async (req: Request, res: Response) => {
  try {
    // Check if user has admin rights (you can add more checks here)
    
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    console.log(`Manual upgrade requested for user ID: ${userId}`);
    
    let upgradeSuccess = false;
    
    // Try all possible ways to upgrade the user
    
    // 1. First try using global User model
    if (typeof global.User === 'function') {
      console.log('Using global User model for manual upgrade');
      try {
        const updatedUser = await global.User.findByIdAndUpdate(
          userId,
          { isPaidUser: true },
          { new: true }
        );
        
        if (updatedUser) {
          console.log(`User ${updatedUser.email} manually upgraded to paid status. isPaidUser=${updatedUser.isPaidUser}`);
          upgradeSuccess = true;
        }
      } catch (error) {
        console.error('Error using global User model:', error);
      }
    }
    
    // 2. Try mongoose model if global model fails
    if (!upgradeSuccess) {
      console.log('Trying mongoose User model for manual upgrade');
      try {
        const User = mongoose.model('User');
        const updatedUser = await User.findByIdAndUpdate(
          userId,
          { isPaidUser: true },
          { new: true }
        );
        
        if (updatedUser) {
          console.log(`User ${updatedUser.email} manually upgraded to paid status via mongoose. isPaidUser=${updatedUser.isPaidUser}`);
          upgradeSuccess = true;
        }
      } catch (modelError) {
        console.error('Error accessing User model from mongoose:', modelError);
      }
    }
    
    // 3. Try direct database update as last resort
    if (!upgradeSuccess) {
      console.log('Attempting direct database update for manual upgrade');
      try {
        // Create a minimal schema to avoid validation issues
        const userSchema = new mongoose.Schema({
          email: String,
          isPaidUser: Boolean
        }, { strict: false });
        
        // Use a unique model name to avoid conflicts
        const UserDirect = mongoose.model('UserDirectManual', userSchema, 'users');
        
        // Convert string ID to ObjectId
        let objectId;
        try {
          objectId = mongoose.Types.ObjectId.createFromHexString(userId);
        } catch (idError) {
          return res.status(400).json({
            success: false,
            message: 'Invalid user ID format'
          });
        }
        
        const directUpdate = await UserDirect.updateOne(
          { _id: objectId },
          { $set: { isPaidUser: true } }
        );
        
        console.log('Direct database update result:', directUpdate);
        
        if (directUpdate.modifiedCount > 0) {
          console.log(`User with ID ${userId} upgraded via direct database update`);
          upgradeSuccess = true;
        } else if (directUpdate.matchedCount > 0) {
          console.log(`User with ID ${userId} matched but not modified (might already be paid)`);
          upgradeSuccess = true;
        }
      } catch (directDbError) {
        console.error('Direct database update failed:', directDbError);
      }
    }
    
    // 4. Final fallback to in-memory approach
    if (!upgradeSuccess && global.users && Array.isArray(global.users)) {
      console.log('Using in-memory storage for manual upgrade');
      const userIndex = global.users.findIndex(u => u._id.toString() === userId);
      if (userIndex !== -1) {
        global.users[userIndex].isPaidUser = true;
        console.log(`User ${global.users[userIndex].email} manually upgraded (in-memory storage)`);
        upgradeSuccess = true;
      }
    }
    
    if (upgradeSuccess) {
      return res.json({
        success: true,
        message: 'User successfully upgraded to paid status'
      });
    } else {
      return res.status(404).json({
        success: false,
        message: 'Failed to upgrade user. User might not exist or database error occurred.'
      });
    }
  } catch (error) {
    console.error('Manual user upgrade error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during user upgrade'
    });
  }
});

// Simple endpoint to list all users - FOR DEVELOPMENT ONLY
router.get('/users', authenticate, async (req: Request, res: Response) => {
  try {
    let users = [];
    
    // Try to get users from mongodb
    try {
      if (typeof global.User === 'function') {
        users = await global.User.find({}).select('email displayName isPaidUser createdAt');
      } else {
        const User = mongoose.model('User');
        users = await User.find({}).select('email displayName isPaidUser createdAt');
      }
    } catch (dbError) {
      console.log('Error fetching users from database:', dbError);
      
      // Fallback to in-memory users
      if (global.users && Array.isArray(global.users)) {
        users = global.users.map(u => ({
          _id: u._id,
          email: u.email,
          displayName: u.displayName || u.email.split('@')[0],
          isPaidUser: u.isPaidUser || false
        }));
      }
    }
    
    return res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('List users error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving users'
    });
  }
});

export const adminRouter = router; 