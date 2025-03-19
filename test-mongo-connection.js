// Test MongoDB connection
const { MongoClient } = require('mongodb');

// MongoDB Connection URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://janga:busseja@janga0.f5z2f6j.mongodb.net/damnskippy?retryWrites=true&w=majority';

async function testConnection() {
  console.log('Testing MongoDB connection with URI:', MONGODB_URI.replace(/:[^:]*@/, ':****@'));
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('Attempting to connect to MongoDB...');
    await client.connect();
    console.log('Successfully connected to MongoDB!');
    
    // List available databases
    const dbList = await client.db().admin().listDatabases();
    console.log('Available databases:');
    console.log(dbList.databases.map(db => db.name).join(', '));
    
    // Try connecting to the specific database
    const db = client.db('damnskippy');
    console.log('Connected to database:', db.databaseName);
    
    // List collections
    const collections = await db.listCollections().toArray();
    console.log('Available collections:');
    if (collections.length === 0) {
      console.log('No collections found. This might be a new database.');
    } else {
      console.log(collections.map(col => col.name).join(', '));
    }
    
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

testConnection().catch(console.error);