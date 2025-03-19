// Test SendGrid email sending
require('dotenv').config();
const sgMail = require('@sendgrid/mail');

console.log('Starting SendGrid test...');

// Check if SendGrid API key is present
if (!process.env.SENDGRID_API_KEY) {
  console.error('Error: SendGrid API key is missing from .env file');
  process.exit(1);
}

try {
  // Set SendGrid API key
  console.log('Setting up SendGrid with API key:', process.env.SENDGRID_API_KEY.substring(0, 10) + '...');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  // Create email message
  const msg = {
    to: process.env.ADMIN_EMAIL || 'jason@abitofadvicellc.com',
    from: process.env.EMAIL_USER || 'jason@abitofadvicellc.com',
    subject: 'SendGrid Test Email',
    text: 'This is a test email from SendGrid to verify the configuration is working correctly.',
    html: '<h1>SendGrid Test</h1><p>This is a test email from SendGrid to verify the configuration is working correctly.</p>'
  };

  console.log('Sending test email to:', msg.to);

  // Send email
  sgMail.send(msg)
    .then(response => {
      console.log('Email sent successfully!');
      console.log('Status code:', response[0].statusCode);
      console.log('Headers:', JSON.stringify(response[0].headers));
      process.exit(0);
    })
    .catch(error => {
      console.error('Error sending email:', error);
      
      if (error.response) {
        console.error('SendGrid API error response:');
        console.error(error.response.body);
      }
      
      process.exit(1);
    });
} catch (error) {
  console.error('Unexpected error:', error);
  process.exit(1);
} 