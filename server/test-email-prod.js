// This file is for testing email delivery in the production environment
// It should only be accessible in development mode

const sgMail = require('@sendgrid/mail');
const nodemailer = require('nodemailer');

async function testEmailEndpoint(req, res) {
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_TEST_ENDPOINTS) {
    return res.status(403).json({ error: 'Test endpoints not available in production' });
  }

  console.log('========== EMAIL TEST ENDPOINT ==========');
  console.log('Email environment variables:');
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`USE_SENDGRID: ${process.env.USE_SENDGRID}`);
  console.log(`SENDGRID_API_KEY exists: ${!!process.env.SENDGRID_API_KEY}`);
  console.log(`ADMIN_EMAIL: ${process.env.ADMIN_EMAIL}`);
  console.log(`EMAIL_USER: ${process.env.EMAIL_USER}`);
  console.log(`EMAIL_PASSWORD exists: ${!!process.env.EMAIL_PASSWORD}`);
  console.log(`SMTP_HOST: ${process.env.SMTP_HOST}`);
  console.log(`SMTP_PORT: ${process.env.SMTP_PORT}`);
  console.log(`SMTP_SECURE: ${process.env.SMTP_SECURE}`);

  const results = {
    sendgrid: { attempted: false, success: false, error: null },
    smtp: { attempted: false, success: false, error: null }
  };

  // Test SendGrid if configured
  if (process.env.USE_SENDGRID === 'true' && process.env.SENDGRID_API_KEY) {
    try {
      results.sendgrid.attempted = true;
      console.log('Testing SendGrid email...');
      
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      
      const msg = {
        to: process.env.ADMIN_EMAIL || 'jason@abitofadvicellc.com',
        from: process.env.EMAIL_USER || 'jason@abitofadvicellc.com',
        subject: 'Test Email from Production',
        text: 'This is a test email sent from the production environment',
        html: '<p>This is a test email sent from the production environment</p>',
      };
      
      await sgMail.send(msg);
      console.log('SendGrid test email sent successfully');
      results.sendgrid.success = true;
    } catch (error) {
      console.error('SendGrid test failed:', error);
      results.sendgrid.error = error.toString();
      if (error.response) {
        console.error('SendGrid error details:', JSON.stringify(error.response.body, null, 2));
        results.sendgrid.errorDetails = error.response.body;
      }
    }
  } else {
    console.log('SendGrid not configured, skipping test');
  }

  // Test SMTP if configured
  if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    try {
      results.smtp.attempted = true;
      console.log('Testing SMTP email...');
      
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.titan.email',
        port: parseInt(process.env.SMTP_PORT || '465'),
        secure: process.env.SMTP_SECURE === 'true' || true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        },
        debug: true,
        logger: true
      });
      
      // Verify connection first
      await new Promise((resolve, reject) => {
        transporter.verify(function(error, success) {
          if (error) {
            console.error('SMTP verification failed:', error);
            reject(error);
          } else {
            console.log('SMTP server is ready');
            resolve(success);
          }
        });
      });
      
      // Send test email
      const info = await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.ADMIN_EMAIL || 'jason@abitofadvicellc.com',
        subject: 'SMTP Test from Production',
        text: 'This is a test email sent via SMTP from production',
        html: '<p>This is a test email sent via SMTP from production</p>'
      });
      
      console.log('SMTP test email sent:', info.messageId);
      results.smtp.success = true;
      results.smtp.messageId = info.messageId;
    } catch (error) {
      console.error('SMTP test failed:', error);
      results.smtp.error = error.toString();
    }
  } else {
    console.log('SMTP not fully configured, skipping test');
  }

  return res.json({
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    results
  });
}

module.exports = { testEmailEndpoint }; 