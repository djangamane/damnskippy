import { Router, Request, Response } from 'express';
import { authenticate, extractUserFromRequest } from './auth';
import nodemailer from 'nodemailer';

const router = Router();

// Configure email transport
let transporter: any;

try {
  // Configuration for Titan email with more debugging
  console.log('Setting up email transporter');
  
  // Check if Titan email is properly configured
  if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.titan.email',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      debug: true, // Enable debugging
      logger: true // Log to console
    });
    
    console.log(`Using SMTP host: ${process.env.SMTP_HOST || 'smtp.titan.email'}`);
  } else {
    // Fallback to Ethereal for testing if no credentials provided
    console.log('No email credentials provided, creating test account with Ethereal');
    nodemailer.createTestAccount().then(testAccount => {
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
    }).catch(err => {
      console.error('Failed to create test email account:', err);
    });
  }
  
  // Verify the connection after setup
  if (transporter) {
    transporter.verify(function(error, success) {
      if (error) {
        console.error('Email transporter verification failed:', error);
      } else {
        console.log('Email server is ready to send messages');
      }
    });
  }
} catch (error) {
  console.error('Failed to create email transporter:', error);
}

// Payment confirmation route
router.post('/confirm', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await extractUserFromRequest(req);
    const { transactionId } = req.body;
    
    if (!user) {
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
    
    console.log(`Attempting to send email notification for user ${user.email} with transaction ${transactionId}`);
    
    // Save transaction record immediately in logs
    console.log(`PAYMENT NOTIFICATION: User ${user.email} (${user.id}) submitted transaction ${transactionId}`);
    
    // Send email notification to admin
    if (transporter) {
      try {
        const mailOptions = {
          from: process.env.EMAIL_USER || 'jason@abitofadvicellc.com',
          to: process.env.ADMIN_EMAIL || 'jason@abitofadvicellc.com',
          subject: `Payment Confirmation - ${user.email}`,
          html: `
            <h2>Payment Confirmation</h2>
            <p><strong>User:</strong> ${user.email} (${user.displayName || 'Unknown'})</p>
            <p><strong>User ID:</strong> ${user.id}</p>
            <p><strong>Transaction ID:</strong> ${transactionId}</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            <p>Please verify this transaction and upgrade the user's account status.</p>
          `
        };
        
        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully: ${JSON.stringify(info)}`);
        
        // If using Ethereal, provide the URL to view the message
        if (info.messageId && info.envelope && info.envelope.from && info.envelope.from.includes('ethereal.email')) {
          console.log(`Ethereal email preview URL: ${nodemailer.getTestMessageUrl(info)}`);
        }
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
        // Continue execution even if email fails
      }
    } else {
      console.warn('Email transporter not configured, skipping confirmation email');
    }
    
    // Respond to the user
    res.json({
      success: true,
      message: 'Payment confirmation received. Your account will be upgraded once the payment is verified.'
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