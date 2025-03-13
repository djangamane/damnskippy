// API configuration
const config = {
  apiUrl: import.meta.env.PROD 
    ? 'https://skipthegames4ai-api.onrender.com' // Production backend URL
    : 'http://localhost:3001', // Development backend URL
};

export default config; 