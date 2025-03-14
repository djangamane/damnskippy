// This is a fallback JavaScript file that will be used if the main JavaScript file can't be found
console.log('Fallback JavaScript file loaded');

// Create a simple message to display to the user
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOMContentLoaded event fired in fallback script');
  const root = document.getElementById('root');
  if (root) {
    console.log('Root element found, adding fallback content');
    root.innerHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; text-align: center;">
        <h1 style="color: #333;">skipthegames4AI.com</h1>
        <p style="font-size: 18px; margin-top: 20px;">Welcome to skipthegames4AI.com, the AI-powered research automation platform.</p>
        <p style="font-size: 16px; margin-top: 20px; color: #666;">It looks like there was an issue loading the application. Please try refreshing the page.</p>
        <button onclick="window.location.reload()" style="background-color: #4CAF50; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; margin-top: 20px;">Refresh Page</button>
        <p style="font-size: 14px; margin-top: 30px; color: #999;">If the issue persists, please contact support.</p>
      </div>
    `;
    console.log('Fallback content added to root element');
  } else {
    console.error('Root element not found');
    // If root element doesn't exist, create one
    const newRoot = document.createElement('div');
    newRoot.id = 'root';
    document.body.appendChild(newRoot);
    
    newRoot.innerHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; text-align: center;">
        <h1 style="color: #333;">skipthegames4AI.com</h1>
        <p style="font-size: 18px; margin-top: 20px;">Welcome to skipthegames4AI.com, the AI-powered research automation platform.</p>
        <p style="font-size: 16px; margin-top: 20px; color: #666;">It looks like there was an issue loading the application. Please try refreshing the page.</p>
        <button onclick="window.location.reload()" style="background-color: #4CAF50; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; margin-top: 20px;">Refresh Page</button>
        <p style="font-size: 14px; margin-top: 30px; color: #999;">If the issue persists, please contact support.</p>
      </div>
    `;
    console.log('Created new root element and added fallback content');
  }
}); 