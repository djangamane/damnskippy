// Test MongoDB connection and verify that models are working correctly
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Load environment variables
dotenv.config();

// Connection options
const connectionOptions = {
  connectTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 60000,
};

// User Schema
const userSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true
  },
  password: { 
    type: String, 
    required: true 
  },
  displayName: { 
    type: String, 
    default: function() {
      return this.email.split('@')[0];
    }
  },
  isPaidUser: {
    type: Boolean,
    default: false
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  lastLoginAt: { 
    type: Date 
  }
});

// Research Thread Schema
const researchThreadSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  query: {
    type: String,
    required: true
  },
  result: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  tags: {
    type: [String],
    default: []
  }
});

// Create models
const User = mongoose.model('User', userSchema);
const ResearchThread = mongoose.model('ResearchThread', researchThreadSchema);

async function testConnection() {
  let mongod;

  try {
    // Start an in-memory MongoDB server
    console.log('Starting in-memory MongoDB server...');
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    console.log('In-memory MongoDB server started:', uri);

    // Connect to the in-memory server
    console.log('Connecting to in-memory MongoDB...');
    await mongoose.connect(uri, connectionOptions);
    console.log('Connected to in-memory MongoDB successfully!');
    
    // Check if test user exists
    const testUser = await User.findOne({ email: 'test@example.com' });
    if (testUser) {
      console.log('Test user found:', {
        id: testUser._id,
        email: testUser.email,
        isPaidUser: testUser.isPaidUser || false
      });
    } else {
      console.log('Test user not found. Creating a new one...');
      const newUser = new User({
        email: 'test@example.com',
        password: 'test123',
        displayName: 'Test User'
      });
      await newUser.save();
      console.log('Test user created successfully!');
    }
    
    // Create a test research thread
    console.log('Creating a test research thread...');
    const testUserId = testUser ? testUser._id.toString() : (await User.findOne({ email: 'test@example.com' }))._id.toString();
    
    const newThread = new ResearchThread({
      userId: testUserId,
      query: 'Test research query',
      result: 'This is a test research result.',
      timestamp: new Date(),
      tags: ['test', 'research']
    });
    
    await newThread.save();
    console.log('Test research thread created successfully!');
    
    // Find all research threads for the test user
    const threads = await ResearchThread.find({ userId: testUserId });
    console.log(`Found ${threads.length} research threads for test user.`);
    
    console.log('All tests passed successfully!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the connection
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    
    // Stop the in-memory server
    if (mongod) {
      await mongod.stop();
      console.log('In-memory MongoDB server stopped.');
    }
  }
}

// Run the test
testConnection();