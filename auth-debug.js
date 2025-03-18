// Authentication API Diagnostic Tool
const axios = require('axios');

// Change these values to match your test credentials
const testEmail = 'test@example.com';
const testPassword = 'test123';
const apiUrl = process.env.API_URL || 'http://localhost:3001';

async function testAuthAPI() {
  console.log('=== Authentication API Diagnostic ===');
  console.log(`Testing against API: ${apiUrl}`);
  console.log(`Test Credentials: ${testEmail} / ${testPassword.replace(/./g, '*')}`);
  
  // Test 1: Direct Sign-in API Call
  console.log('\n=== Test 1: Direct Sign-in API Call ===');
  try {
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
      console.error('No response received:', error.request);
    } else {
      // Something else happened in setting up the request
      console.error('Request setup error:', error.message);
    }
  }
  
  // Test 2: Sign-in with stringified JSON
  console.log('\n=== Test 2: Sign-in with stringified JSON ===');
  try {
    const response = await axios({
      method: 'post',
      url: `${apiUrl}/api/auth/signin`,
      headers: {
        'Content-Type': 'application/json'
      },
      data: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });
    
    console.log('Success! Response status:', response.status);
    console.log('Response data:', response.data);
  } catch (error) {
    console.error('Error during sign-in with stringified JSON:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
  
  // Test 3: Sign-in with x-www-form-urlencoded
  console.log('\n=== Test 3: Sign-in with x-www-form-urlencoded ===');
  const params = new URLSearchParams();
  params.append('email', testEmail);
  params.append('password', testPassword);
  
  try {
    const response = await axios({
      method: 'post',
      url: `${apiUrl}/api/auth/signin`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: params
    });
    
    console.log('Success! Response status:', response.status);
    console.log('Response data:', response.data);
  } catch (error) {
    console.error('Error during sign-in with form urlencoded:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testAuthAPI().catch(console.error); 