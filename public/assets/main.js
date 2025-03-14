// This is a fallback JavaScript file that will be used if the main JavaScript file can't be found
console.log('Fallback JavaScript file loaded');

// Create a simple message to display to the user
document.addEventListener('DOMContentLoaded', function() {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <h1>skipthegames4AI.com</h1>
        <p>Welcome to skipthegames4AI.com, the AI-powered research automation platform.</p>
        <p>It looks like there was an issue loading the application. Please try refreshing the page.</p>
        <p>If the issue persists, please contact support.</p>
      </div>
    `;
  }
}); 