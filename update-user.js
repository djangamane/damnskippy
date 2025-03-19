// Simple script to directly update a user in MongoDB
require('dotenv').config();
const mongoose = require('mongoose');

// The user ID to upgrade
const USER_ID = '67daf045e191a7f5cbf85961';

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://janga:busseja@janga0.f5z2f6j.mongodb.net/damnskippy?retryWrites=true&w=majority';

async function updateUser() {
  console.log('Starting user upgrade script...');
  
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 60000,
    });
    
    console.log('Connected to MongoDB');
    
    // Create a minimal schema
    const userSchema = new mongoose.Schema({
      email: String,
      isPaidUser: Boolean
    }, { strict: false });
    
    // Use the users collection directly
    const User = mongoose.model('User', userSchema, 'users');
    
    // Update the user
    console.log(`Attempting to upgrade user with ID: ${USER_ID}`);
    
    const result = await User.updateOne(
      { _id: mongoose.Types.ObjectId.createFromHexString(USER_ID) },
      { $set: { isPaidUser: true } }
    );
    
    console.log('Update result:', result);
    
    if (result.matchedCount > 0) {
      if (result.modifiedCount > 0) {
        console.log('✅ User successfully upgraded to paid status!');
      } else {
        console.log('ℹ️ User was found but not modified (might already be a paid user)');
      }
      
      // Verify the update
      const user = await User.findById(USER_ID);
      console.log('User data after update:', {
        id: user._id.toString(),
        email: user.email,
        isPaidUser: user.isPaidUser
      });
    } else {
      console.log('❌ User not found with the provided ID');
    }
  } catch (error) {
    console.error('Error updating user:', error);
  } finally {
    // Close the connection
    try {
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
    } catch (err) {
      console.error('Error closing MongoDB connection:', err);
    }
    process.exit(0);
  }
}

// Run the update function
updateUser(); 