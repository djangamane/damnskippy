// Ultra-simple script to directly update a user in MongoDB
// This can be run directly in the Render shell

const USER_ID = '67daf045e191a7f5cbf85961';

// This assumes mongoose is already set up in the app
async function upgradeUser() {
  try {
    const { ObjectId } = require('mongodb');
    const userId = new ObjectId(USER_ID);
    
    console.log(`Attempting to upgrade user: ${USER_ID}`);
    
    // Try using the mongoose model directly
    const result = await db.collection('users').updateOne(
      { _id: userId },
      { $set: { isPaidUser: true } }
    );
    
    console.log('Update result:', result);
    
    if (result.matchedCount > 0) {
      if (result.modifiedCount > 0) {
        console.log('✅ SUCCESS: User upgraded to paid status!');
      } else {
        console.log('User found but not modified (may already be paid)');
      }
      
      // Verify
      const user = await db.collection('users').findOne({ _id: userId });
      console.log('User status:', {
        id: user._id.toString(),
        email: user.email,
        isPaidUser: user.isPaidUser
      });
      
      return true;
    } else {
      console.log('User not found with ID:', USER_ID);
      return false;
    }
  } catch (error) {
    console.error('Error upgrading user:', error);
    return false;
  }
}

// Call the function
upgradeUser(); 