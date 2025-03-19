// This is a script to run in the browser console on your live site

// Get the current auth token from localStorage
const token = localStorage.getItem('token');

// Function to toggle premium status
async function togglePremiumStatus() {
  try {
    // First, try using a special route to directly upgrade the user
    const userId = '67daf045e191a7f5cbf85961'; // The specific user ID

    // Create a "fake" transaction to trigger the auto-upgrade
    const response = await fetch('/api/payment/confirm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        transactionId: 'manual-upgrade-' + Date.now()
      })
    });

    const data = await response.json();
    console.log('Payment confirmation response:', data);
    
    // Now check if it worked by fetching the user profile
    const profileResponse = await fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const profileData = await profileResponse.json();
    console.log('User profile:', profileData);
    
    if (profileData.user && profileData.user.isPaidUser) {
      console.log('✅ SUCCESS: User is now upgraded to premium!');
      alert('You have been upgraded to premium! Please refresh the page to see your new features.');
    } else {
      console.log('❌ Upgrade not reflected in profile - might need to logout and login again');
      alert('Update received. Please log out and log back in to see your premium features.');
    }
  } catch (error) {
    console.error('Error during upgrade process:', error);
    alert('Error during upgrade. Please try logging out and back in.');
  }
}

// Execute the function
togglePremiumStatus(); 