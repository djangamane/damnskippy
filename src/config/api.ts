// API configuration
const config = {
  apiUrl: process.env.NODE_ENV === 'production' || import.meta.env.PROD
    ? window.location.origin // Use the same origin in production
    : 'http://localhost:3001', // Development backend URL
  timeout: 10000, // 10 seconds timeout
};

// Log the current environment and API URL for debugging
console.log('API Configuration:', {
  NODE_ENV: process.env.NODE_ENV,
  PROD: import.meta.env.PROD,
  apiUrl: config.apiUrl,
  origin: window.location.origin,
  timestamp: new Date().toISOString()
});

// Configure axios defaults
import axios from 'axios';
axios.defaults.baseURL = config.apiUrl;
axios.defaults.timeout = config.timeout;
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.withCredentials = true; // Include credentials in cross-origin requests

// Add request interceptor for debugging
axios.interceptors.request.use(
  config => {
    console.log('API Request:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      data: config.data,
      timestamp: new Date().toISOString()
    });
    return config;
  },
  error => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
axios.interceptors.response.use(
  response => {
    console.log('API Response:', {
      url: response.config.url,
      method: response.config.method,
      status: response.status,
      data: response.data,
      timestamp: new Date().toISOString()
    });
    return response;
  },
  error => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      timestamp: new Date().toISOString()
    });
    return Promise.reject(error);
  }
);

export default config; 