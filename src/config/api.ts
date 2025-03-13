// API configuration
const config = {
  apiUrl: process.env.NODE_ENV === 'production' || import.meta.env.PROD
    ? 'https://damnskippy.onrender.com' // Production backend URL
    : 'http://localhost:3001', // Development backend URL
};

// Log the current environment and API URL for debugging
console.log('Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  PROD: import.meta.env.PROD,
  apiUrl: config.apiUrl
});

export default config; 