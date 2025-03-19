import { Router, Request, Response } from 'express';
import { authenticate, extractUserFromRequest } from './auth';
import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';

const router = Router();

// Configure email transport - multiple options
let transporter: any;
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
      transporter.verify(function(error, success) {
        if (error) {
          console.error('Email transporter verification failed:', error);
        } else {
          console.log('Email server is ready to send messages');
        }
      });
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
          transporter.verify(function(error, success) {
            if (error) {
              console.error('Ethereal email verification failed:', error);
            } else {
              console.log('Ethereal email server is ready to send messages');
            }
          });
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
    
    // Generate email content
    const htmlContent = `
      <h2>Payment Confirmation</h2>
      <p><strong>User:</strong> ${user.email} (${user.displayName || 'Unknown'})</p>
      <p><strong>User ID:</strong> ${user.id}</p>
      <p><strong>Transaction ID:</strong> ${transactionId}</p>
      <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
      <p>Please verify this transaction and upgrade the user's account status.</p>
    `;
    
    const subject = `Payment Confirmation - ${user.email}`;
    const from = process.env.EMAIL_USER || 'jason@abitofadvicellc.com';
    const to = process.env.ADMIN_EMAIL || 'jason@abitofadvicellc.com';
    
    console.log(`Email details: From: ${from}, To: ${to}, Subject: ${subject}`);
    
    // Try to send email
    let emailSent = false;
    
    // First try SendGrid if enabled
    if (useSendGrid) {
      try {
        console.log('Sending email via SendGrid');
        const msg = {
          to,
          from,
          subject,
          html: htmlContent,
        };
        
        await sgMail.send(msg);
        console.log('Email sent successfully with SendGrid');
        emailSent = true;
      } catch (sendGridError) {
        console.error('SendGrid email error:', sendGridError);
      }
    }
    
    // Fall back to SMTP if SendGrid fails or is not configured
    if (!emailSent && transporter) {
      try {
        console.log('Sending email via SMTP');
        const mailOptions = {
          from,
          to,
          subject,
          html: htmlContent
        };
        
        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully via SMTP: ${JSON.stringify(info)}`);
        
        // If using Ethereal, provide the URL to view the message
        if (info.messageId && info.envelope && info.envelope.from && info.envelope.from.includes('ethereal.email')) {
          console.log(`Ethereal email preview URL: ${nodemailer.getTestMessageUrl(info)}`);
        }
        
        emailSent = true;
      } catch (emailError) {
        console.error('SMTP email error:', emailError);
      }
    }
    
    if (!emailSent) {
      console.warn('Failed to send email notification. Check email configuration.');
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