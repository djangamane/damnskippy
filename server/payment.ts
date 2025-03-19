import { Router, Request, Response } from 'express';
import { authenticate, extractUserFromRequest } from './auth';
import nodemailer from 'nodemailer';

const router = Router();

// Configure email transport
let transporter: any;

try {
  // Configuration for Titan email
  transporter = nodemailer.createTransport({
    host: 'smtp.titan.email',
    port: 587,
    secure: false, // Use TLS
    auth: {
      user: process.env.EMAIL_USER || 'jason@abitofadvicellc.com',
      pass: process.env.EMAIL_PASSWORD
    }
  });
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
    
    // Send email notification to admin
    if (transporter) {
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
      
      await transporter.sendMail(mailOptions);
      console.log(`Payment confirmation email sent for user ${user.email}`);
    } else {
      console.warn('Email transporter not configured, skipping confirmation email');
    }
    
    // Save transaction record
    // Note: In a production system, we would save this to the database
    console.log(`Payment transaction recorded: ${transactionId} for user ${user.id}`);
    
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