import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env.server') });
dotenv.config();

async function createTestUser() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    console.log('MongoDB URI:', mongoUri ? 'URI found (hidden for security)' : 'URI not found');
    
    if (!mongoUri) {
      throw new Error('MongoDB URI is not defined in environment variables');
    }
    
    const client = new MongoClient(mongoUri);
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('skipthegames4ai');
    
    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ email: 'test@example.com' });
    if (existingUser) {
      console.log('Test user already exists');
      await client.close();
      return;
    }
    
    const hashedPassword = await bcrypt.hash('test123', 10);
    const user = {
      email: 'test@example.com',
      password: hashedPassword,
      displayName: 'Test User',
      isPaidUser: false,
      createdAt: new Date(),
      lastLoginAt: new Date()
    };
    
    const result = await db.collection('users').insertOne(user);
    console.log('Test user created with ID:', result.insertedId);
    
    await client.close();
  } catch (err) {
    console.error('Error creating test user:', err);
  }
}

createTestUser(); 