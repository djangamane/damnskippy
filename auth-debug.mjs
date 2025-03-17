// Authentication API Diagnostic Tool
import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });
if (fs.existsSync(path.join(__dirname, '.env.server'))) {
  dotenv.config({ path: path.join(__dirname, '.env.server') });
}

// Change these values to match your test credentials
const testEmail = 'test@example.com';
const testPassword = 'test123';
const apiUrl = process.env.API_URL || 'https://damnskippy.onrender.com'; // Try the production URL

async function testAuthAPI() {
  console.log('=== Authentication API Diagnostic ===');
  console.log(`Testing against API: ${apiUrl}`);
  console.log(`Test Credentials: ${testEmail} / ${testPassword.replace(/./g, '*')}`);
  
  // Test 1: Direct Sign-in API Call
  console.log('\n=== Test 1: Direct Sign-in API Call ===');
  try {
    console.log('Request payload:', { email: testEmail, password: '******' });
    const response = await axios({
      method: 'post',
      url: `${apiUrl}/api/auth/signin`,
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        email: testEmail,
        password: testPassword
      }
    });
    
    console.log('Success! Response status:', response.status);
    console.log('Response headers:', response.headers);
    console.log('Response data:', response.data);
  } catch (error) {
    console.error('Error during sign-in:');
    if (error.response) {
      // The request was made and the server responded with a status code outside of 2xx
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received, server may not be running');
    } else {
      // Something happened in setting up the request
      console.error('Request setup error:', error.message);
    }
  }
  
  // Test 2: Sign-in with fetch API
  console.log('\n=== Test 2: Sign-in with fetch API ===');
  try {
    const fetchResponse = await fetch(`${apiUrl}/api/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });
    
    const fetchData = await fetchResponse.json();
    console.log('Success with fetch! Status:', fetchResponse.status);
    console.log('Response data:', fetchData);
  } catch (error) {
    console.error('Error during sign-in with fetch:', error.message);
  }
}

testAuthAPI().catch(console.error); 