// This is a fallback JavaScript file that will be used if the main JavaScript file can't be found
console.log('Fallback JavaScript file loaded');
console.log('Current URL:', window.location.href);
console.log('Document readyState:', document.readyState);

// Log browser information
console.log('User Agent:', navigator.userAgent);
console.log('Browser:', {
  cookiesEnabled: navigator.cookieEnabled,
  language: navigator.language,
  onLine: navigator.onLine,
  platform: navigator.platform
});

// Create a simple message to display to the user
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOMContentLoaded event fired in fallback script');
  console.log('Document title:', document.title);
  console.log('Document URL:', document.URL);
  
  // Check if the root element exists
  const root = document.getElementById('root');
  console.log('Root element found:', !!root);
  
  if (root) {
    console.log('Root element found, adding fallback content');
    console.log('Root element properties:', {
      id: root.id,
      tagName: root.tagName,
      childNodes: root.childNodes.length
    });
    
    root.innerHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; text-align: center;">
        <h1 style="color: #333;">skipthegameswithai.com</h1>
        <p style="font-size: 18px; margin-top: 20px;">Welcome to skipthegameswithai.com, the AI-powered research automation platform.</p>
        <p style="font-size: 16px; margin-top: 20px; color: #666;">It looks like there was an issue loading the application. Please try refreshing the page.</p>
        <button onclick="window.location.reload()" style="background-color: #4CAF50; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; margin-top: 20px;">Refresh Page</button>
        <p style="font-size: 14px; margin-top: 30px; color: #999;">If the issue persists, please contact support.</p>
        <div style="margin-top: 30px; padding: 15px; background-color: #f8f8f8; border-radius: 4px; text-align: left;">
          <h3 style="color: #333; margin-top: 0;">Debug Information</h3>
          <p style="font-family: monospace; font-size: 12px;">URL: ${window.location.href}</p>
          <p style="font-family: monospace; font-size: 12px;">Time: ${new Date().toISOString()}</p>
          <p style="font-family: monospace; font-size: 12px;">User Agent: ${navigator.userAgent}</p>
        </div>
      </div>
    `;
    console.log('Fallback content added to root element');
  } else {
    console.error('Root element not found');
    // If root element doesn't exist, create one
    const newRoot = document.createElement('div');
    newRoot.id = 'root';
    document.body.appendChild(newRoot);
    console.log('Created new root element with id:', newRoot.id);
    
    newRoot.innerHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; text-align: center;">
        <h1 style="color: #333;">skipthegameswithai.com</h1>
        <p style="font-size: 18px; margin-top: 20px;">Welcome to skipthegameswithai.com, the AI-powered research automation platform.</p>
        <p style="font-size: 16px; margin-top: 20px; color: #666;">It looks like there was an issue loading the application. Please try refreshing the page.</p>
        <button onclick="window.location.reload()" style="background-color: #4CAF50; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; margin-top: 20px;">Refresh Page</button>
        <p style="font-size: 14px; margin-top: 30px; color: #999;">If the issue persists, please contact support.</p>
        <div style="margin-top: 30px; padding: 15px; background-color: #f8f8f8; border-radius: 4px; text-align: left;">
          <h3 style="color: #333; margin-top: 0;">Debug Information</h3>
          <p style="font-family: monospace; font-size: 12px;">URL: ${window.location.href}</p>
          <p style="font-family: monospace; font-size: 12px;">Time: ${new Date().toISOString()}</p>
          <p style="font-family: monospace; font-size: 12px;">User Agent: ${navigator.userAgent}</p>
          <p style="font-family: monospace; font-size: 12px;">Note: Root element was missing and had to be created</p>
        </div>
      </div>
    `;
    console.log('Created new root element and added fallback content');
  }
  
  // Add a global error handler to catch any JavaScript errors
  window.onerror = function(message, source, lineno, colno, error) {
    console.error('Global error caught:', { message, source, lineno, colno });
    return false;
  };
}); 