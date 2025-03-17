// Test MongoDB connection
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from multiple files
dotenv.config({ path: path.join(__dirname, '.env') });
if (fs.existsSync(path.join(__dirname, '.env.server'))) {
  dotenv.config({ path: path.join(__dirname, '.env.server') });
}

async function testConnection() {
  // Use the environment variable for MongoDB connection string
  const uri = process.env.MONGODB_URI || process.env.VITE_MONGODB_URI;
  
  console.log('Testing MongoDB connection with URI:', uri ? 'URI is set (hidden for security)' : 'URI not found!');
  
  if (!uri) {
    console.error('No MongoDB URI found in environment variables!');
    console.error('Available environment variables:', Object.keys(process.env).filter(key => 
      key.includes('MONGO') || key.includes('DB')
    ));
    return;
  }
  
  const client = new MongoClient(uri);
  
  try {
    console.log('Attempting to connect to MongoDB...');
    await client.connect();
    console.log('Successfully connected to MongoDB!');
    
    // List available databases
    const dbList = await client.db().admin().listDatabases();
    console.log('Available databases:');
    console.log(dbList.databases.map(db => db.name).join(', '));
    
    // Try connecting to the specific database
    const db = client.db('skipthegames4ai');
    console.log('Connected to database:', db.databaseName);
    
    // List collections
    const collections = await db.listCollections().toArray();
    console.log('Available collections:');
    console.log(collections.map(col => col.name).join(', '));
    
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

testConnection().catch(console.error); 