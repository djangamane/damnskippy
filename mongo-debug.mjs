// MongoDB connection debugging script for Render
import { MongoClient } from 'mongodb';
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

async function debugMongoDB() {
  console.log('=== MongoDB Connection Debugging ===');
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Current directory:', __dirname);
  
  // Check for MongoDB environment variables
  const envVars = Object.keys(process.env).filter(key => 
    key.includes('MONGO') || key.includes('DB')
  );
  
  console.log('MongoDB-related environment variables:', envVars);
  
  // Get MongoDB URI
  const mongoURI = process.env.MONGODB_URI || process.env.VITE_MONGODB_URI;
  
  if (!mongoURI) {
    console.error('ERROR: No MongoDB URI found!');
    console.log('Available environment variables:', Object.keys(process.env));
    return;
  }
  
  console.log('MongoDB URI is set');
  
  // Parse MongoDB URI to check structure (without exposing password)
  try {
    const uriParts = mongoURI.split('@');
    if (uriParts.length !== 2) {
      console.error('ERROR: MongoDB URI format is invalid');
      return;
    }
    
    const credentials = uriParts[0].split('://')[1].split(':');
    const username = credentials[0];
    
    const serverParts = uriParts[1].split('/');
    const host = serverParts[0];
    const dbname = serverParts[1].split('?')[0];
    
    console.log('MongoDB URI structure:');
    console.log(`- Username: ${username}`);
    console.log(`- Password: ${credentials.length > 1 ? '********' : 'MISSING'}`);
    console.log(`- Host: ${host}`);
    console.log(`- Database: ${dbname}`);
  } catch (error) {
    console.error('ERROR: Failed to parse MongoDB URI:', error.message);
  }
  
  // Test connection
  console.log('\nAttempting to connect to MongoDB...');
  const client = new MongoClient(mongoURI);
  
  try {
    await client.connect();
    console.log('SUCCESS: Connected to MongoDB!');
    
    // Test database access
    const db = client.db('skipthegames4ai');
    const collections = await db.listCollections().toArray();
    
    console.log(`Found ${collections.length} collections:`, 
      collections.map(c => c.name).join(', '));
      
    // Test a simple query
    const users = await db.collection('users').countDocuments();
    console.log(`Users collection contains ${users} documents`);
    
  } catch (error) {
    console.error('ERROR: Failed to connect to MongoDB!');
    console.error('Error details:', error.message);
    console.error('Error code:', error.code);
    
    // Special handling for authentication errors
    if (error.code === 18 || error.message.includes('Authentication failed')) {
      console.error('\n=== AUTHENTICATION ERROR ===');
      console.error('The username or password in your MongoDB URI is incorrect.');
      console.error('Please update your MONGODB_URI environment variable on Render.');
      console.error('Make sure you\'ve updated both MONGODB_URI and VITE_MONGODB_URI.');
    }
    
    // Special handling for connection errors
    if (error.code === 'ENOTFOUND' || error.message.includes('getaddrinfo')) {
      console.error('\n=== CONNECTION ERROR ===');
      console.error('Could not reach the MongoDB server.');
      console.error('Please check if IP access is allowed in MongoDB Atlas.');
    }
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

debugMongoDB().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 