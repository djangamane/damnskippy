import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: '.env.server' });

async function checkUsers() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('skipthegames4ai');
    const users = await db.collection('users').find({}).toArray();
    
    console.log('\nUsers in database:');
    users.forEach(user => {
      console.log(`\nEmail: ${user.email}`);
      console.log(`ID: ${user._id}`);
      console.log(`Display Name: ${user.displayName || 'Not set'}`);
      console.log(`Last Login: ${user.lastLoginAt || 'Never'}`);
      console.log(`Is Paid User: ${user.isPaidUser ? 'Yes' : 'No'}`);
      console.log('------------------------');
    });
    
    console.log(`\nTotal users: ${users.length}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkUsers(); 