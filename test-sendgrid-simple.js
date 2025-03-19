require('dotenv').config();
const sgMail = require('@sendgrid/mail');

console.log('Starting SendGrid test...');

// Check if API key exists
const apiKey = process.env.SENDGRID_API_KEY;
if (!apiKey) {
  console.error('SendGrid API key is missing in .env file');
  process.exit(1);
}

console.log('API Key found in environment variables');
sgMail.setApiKey(apiKey);

// Configure the email message
const msg = {
  to: 'jason@abitofadvicellc.com',
  from: 'jason@abitofadvicellc.com',
  subject: 'SendGrid Test from damnskippy',
  text: 'This is a simple test email from SendGrid',
  html: '<p>This is a simple test email from SendGrid</p>',
};

console.log(`Attempting to send email to: ${msg.to}`);

// Send email with better error handling
sgMail.send(msg)
  .then(() => {
    console.log('Email sent successfully!');
  })
  .catch((error) => {
    console.error('SendGrid Error Details:');
    if (error.response) {
      console.error('Error Response Body:', error.response.body);
      console.error('Status Code:', error.response.statusCode);
    } else {
      console.error('Error:', error.toString());
    }
  }); 