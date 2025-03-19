// Direct MongoDB update script for Render Shell
const { MongoClient, ObjectId } = require('mongodb');

// User ID to upgrade
const USER_ID = '67daf045e191a7f5cbf85961';

// Connection URI (use the same connection string from your .env file)
const uri = 'mongodb+srv://janga:busseja@janga0.f5z2f6j.mongodb.net/damnskippy?retryWrites=true&w=majority';

async function upgradeUser() {
  console.log('Starting user upgrade script...');
  
  // Create a new MongoClient
  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  
  try {
    // Connect to the MongoDB server
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected to MongoDB');
    
    // Access the database and collection
    const database = client.db('damnskippy');
    const users = database.collection('users');
    
    // Create ObjectId from string
    const userId = new ObjectId(USER_ID);
    
    // Update the user
    console.log(`Attempting to upgrade user with ID: ${USER_ID}`);
    const updateResult = await users.updateOne(
      { _id: userId },
      { $set: { isPaidUser: true } }
    );
    
    console.log('Update result:', updateResult);
    
    if (updateResult.matchedCount > 0) {
      if (updateResult.modifiedCount > 0) {
        console.log('✅ SUCCESS: User successfully upgraded to paid status!');
      } else {
        console.log('ℹ️ User was found but not modified (might already be a paid user)');
      }
      
      // Verify the update
      const user = await users.findOne({ _id: userId });
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
    await client.close();
    console.log('MongoDB connection closed');
  }
}

// Run the update function
upgradeUser(); 