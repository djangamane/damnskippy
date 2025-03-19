import { Router, Request, Response } from 'express';
import { authenticate, extractUserFromRequest } from './auth';
import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';
import mongoose from 'mongoose';

const router = Router();

// Configure email transport - multiple options
let transporter: any = null;
// More explicit debug logging for environment variables
console.log('Email config debug:');
console.log(`USE_SENDGRID=${process.env.USE_SENDGRID}`);
console.log(`SENDGRID_API_KEY exists: ${!!process.env.SENDGRID_API_KEY}`);
console.log(`ADMIN_EMAIL=${process.env.ADMIN_EMAIL}`);

let useSendGrid = process.env.USE_SENDGRID === 'true' && process.env.SENDGRID_API_KEY;

// Setup SendGrid if API key is provided
if (useSendGrid) {
  try {
    console.log('Configuring SendGrid for email delivery');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');
    console.log('SendGrid configured successfully');
  } catch (error) {
    console.error('Failed to set up SendGrid:', error);
    useSendGrid = false;
  }
} else {
  console.log('SendGrid not configured - missing API key or USE_SENDGRID not set to true');
}

// Set up SMTP as backup option
if (!useSendGrid) {
  try {
    // Configuration for Titan email with more debugging
    console.log('Setting up SMTP email transporter');
    
    // Check if Titan email is properly configured
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      // Use exact port 465 and secure=true for Titan email
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.titan.email',
        port: parseInt(process.env.SMTP_PORT || '465'),
        secure: process.env.SMTP_SECURE === 'true' || true, // Force SSL
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        },
        debug: true, // Enable debugging
        logger: true // Log to console
      });
      
      console.log(`Using SMTP host: ${process.env.SMTP_HOST || 'smtp.titan.email'} on port ${process.env.SMTP_PORT || '465'} with secure=${process.env.SMTP_SECURE || 'true'}`);
      
      // Verify the connection after setup (for Titan)
      if (transporter) {
        transporter.verify(function(error, success) {
          if (error) {
            console.error('Email transporter verification failed:', error);
          } else {
            console.log('Email server is ready to send messages');
          }
        });
      }
    } else {
      // Fallback to Ethereal for testing if no credentials provided
      console.log('No email credentials provided, creating test account with Ethereal');
      nodemailer.createTestAccount().then(testAccount => {
        if (testAccount) {
          console.log('Created test email account:', testAccount.user);
          transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
              user: testAccount.user,
              pass: testAccount.pass
            }
          });
          
          // Verify the connection after creating test account
          if (transporter) {
            transporter.verify(function(error, success) {
              if (error) {
                console.error('Ethereal email verification failed:', error);
              } else {
                console.log('Ethereal email server is ready to send messages');
              }
            });
          }
        }
      }).catch(err => {
        console.error('Failed to create test email account:', err);
      });
    }
  } catch (error) {
    console.error('Failed to create email transporter:', error);
  }
}

// Payment confirmation route
router.post('/confirm', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await extractUserFromRequest(req);
    const { transactionId } = req.body;
    
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }
    
    if (!transactionId) {
      res.status(400).json({
        success: false,
        message: 'Transaction ID is required'
      });
      return;
    }
    
    console.log(`Processing payment confirmation for user ${user.email} with transaction ${transactionId}`);
    
    // Save transaction record immediately in logs
    console.log(`PAYMENT NOTIFICATION: User ${user.email} (${user.id}) submitted transaction ${transactionId}`);
    
    // IMMEDIATE USER UPGRADE: Update the user to paid status directly
    let upgradeSuccess = false;
    
    try {
      // First try using global User model
      if (typeof global.User === 'function') {
        console.log('Using global User model to update user');
        const updatedUser = await global.User.findByIdAndUpdate(
          user.id,
          { isPaidUser: true },
          { new: true }
        );
        
        if (updatedUser) {
          console.log(`User ${updatedUser.email} upgraded to paid status via global model. isPaidUser=${updatedUser.isPaidUser}`);
          upgradeSuccess = true;
        } else {
          console.error(`Failed to find and update user with ID: ${user.id} via global model`);
        }
      } 
      // If global model fails, try mongoose model
      else {
        console.log('Trying mongoose User model');
        try {
          // Try to get User model from mongoose
          const User = mongoose.model('User');
          const updatedUser = await User.findByIdAndUpdate(
            user.id,
            { isPaidUser: true },
            { new: true }
          );
          
          if (updatedUser) {
            console.log(`User ${updatedUser.email} upgraded to paid status via mongoose. isPaidUser=${updatedUser.isPaidUser}`);
            upgradeSuccess = true;
          } else {
            console.error(`Failed to find and update user with ID: ${user.id} via mongoose model`);
          }
        } catch (modelError) {
          console.error('Error accessing User model from mongoose:', modelError);
        }
      }
      
      // Final fallback to in-memory approach
      if (!upgradeSuccess && global.users && Array.isArray(global.users)) {
        console.log('Using in-memory storage as fallback');
        const userIndex = global.users.findIndex(u => u._id.toString() === user.id.toString());
        if (userIndex !== -1) {
          global.users[userIndex].isPaidUser = true;
          console.log(`User ${user.email} upgraded to paid status (in-memory storage)`);
          upgradeSuccess = true;
        } else {
          console.error(`User with ID ${user.id} not found in in-memory storage`);
        }
      }
      
      // Last resort: Use direct database connection
      if (!upgradeSuccess) {
        console.log('Attempting direct database update as last resort');
        try {
          // Define a basic user schema if needed
          const userSchema = new mongoose.Schema({
            email: String,
            isPaidUser: Boolean
          });
          
          // Use a specific model name to avoid conflicts
          const UserDirect = mongoose.model('UserDirect', userSchema, 'users');
          
          const directUpdate = await UserDirect.updateOne(
            { _id: mongoose.Types.ObjectId.createFromHexString(user.id) },
            { $set: { isPaidUser: true } }
          );
          
          console.log('Direct database update result:', directUpdate);
          if (directUpdate.modifiedCount > 0) {
            console.log(`User ${user.email} upgraded via direct database update`);
            upgradeSuccess = true;
          }
        } catch (directDbError) {
          console.error('Direct database update failed:', directDbError);
        }
      }
    } catch (dbError) {
      console.error('Error during user upgrade process:', dbError);
    }
    
    if (!upgradeSuccess) {
      console.warn(`⚠️ CRITICAL: Failed to upgrade user ${user.email} (${user.id}) to paid status after multiple attempts`);
    } else {
      console.log(`✅ UPGRADE SUCCESS: User ${user.email} (${user.id}) is now a paid user`);
    }
    
    // Generate email content for admin notification (optional, as we're auto-upgrading)
    const htmlContent = `
      <h2>Payment Confirmation</h2>
      <p><strong>User:</strong> ${user.email} (${user.displayName || 'Unknown'})</p>
      <p><strong>User ID:</strong> ${user.id}</p>
      <p><strong>Transaction ID:</strong> ${transactionId}</p>
      <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
      <p><strong>Upgrade Status:</strong> ${upgradeSuccess ? 'SUCCESS' : 'FAILED'}</p>
      <p>${upgradeSuccess ? 'User has been automatically upgraded to paid status.' : 'URGENT: System failed to upgrade user. Manual upgrade required!'}</p>
    `;
    
    const subject = upgradeSuccess 
      ? `Payment Confirmed & User Upgraded - ${user.email}`
      : `URGENT: Payment Received but Upgrade Failed - ${user.email}`;
    
    const from = process.env.EMAIL_USER || 'jason@abitofadvicellc.com';
    const to = process.env.ADMIN_EMAIL || 'jason@abitofadvicellc.com';
    
    // Try to send email as a notification only (not critical anymore)
    let emailSent = false;
    
    // First try SendGrid if enabled
    if (useSendGrid) {
      try {
        console.log('Sending notification email via SendGrid');
        const msg = {
          to,
          from,
          subject,
          html: htmlContent,
        };
        
        await sgMail.send(msg);
        console.log('Email notification sent with SendGrid');
        emailSent = true;
      } catch (sendGridError) {
        console.error('SendGrid email error:', sendGridError);
        // Not critical as user is already upgraded
      }
    }
    
    // Fall back to SMTP if SendGrid fails or is not configured
    if (!emailSent && transporter) {
      try {
        console.log('Sending notification email via SMTP');
        const mailOptions = {
          from,
          to,
          subject,
          html: htmlContent
        };
        
        const info = await transporter.sendMail(mailOptions);
        console.log(`Email notification sent via SMTP: ${info.messageId}`);
        emailSent = true;
      } catch (emailError) {
        console.error('SMTP email error:', emailError);
        // Not critical as user is already upgraded
      }
    }
    
    // Respond to the user - immediate confirmation of upgrade
    res.json({
      success: true,
      message: upgradeSuccess 
        ? 'Payment confirmed. Your account has been upgraded to premium status!'
        : 'Payment received. Your account will be upgraded shortly.',
      isPaidUser: upgradeSuccess
    });
  } catch (error: any) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process payment confirmation'
    });
  }
});

export const paymentRouter = router; 