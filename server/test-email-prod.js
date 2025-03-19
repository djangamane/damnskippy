// This file is for testing email delivery in the production environment
// It should only be accessible in development mode

const sgMail = require('@sendgrid/mail');
const nodemailer = require('nodemailer');

async function testEmailEndpoint(req, res) {
  try {
    // Return environment variables only first to diagnose configuration
    return res.json({
      message: "Environment check only - not sending emails",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      emailConfig: {
        USE_SENDGRID: process.env.USE_SENDGRID,
        SENDGRID_API_KEY_EXISTS: !!process.env.SENDGRID_API_KEY,
        ADMIN_EMAIL: process.env.ADMIN_EMAIL,
        EMAIL_USER: process.env.EMAIL_USER,
        EMAIL_PASSWORD_EXISTS: !!process.env.EMAIL_PASSWORD,
        SMTP_HOST: process.env.SMTP_HOST,
        SMTP_PORT: process.env.SMTP_PORT,
        SMTP_SECURE: process.env.SMTP_SECURE
      }
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    return res.status(500).json({
      error: error.toString(),
      stack: error.stack
    });
  }
}

module.exports = { testEmailEndpoint }; 