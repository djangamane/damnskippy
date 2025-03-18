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
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.withCredentials = true; // Include credentials in cross-origin requests

// Add request interceptor for debugging - focusing on the actual data being sent
axios.interceptors.request.use(
  config => {
    // Get the auth token from localStorage
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // Ensure Content-Type is set for POST requests
    if (config.method?.toLowerCase() === 'post') {
      config.headers['Content-Type'] = 'application/json';
    }
    
    // Sanitize the data for logging (remove passwords)
    let sanitizedData = null;
    if (config.data) {
      if (typeof config.data === 'string') {
        try {
          // Try to parse it if it's a JSON string
          const parsed = JSON.parse(config.data);
          sanitizedData = { ...parsed };
          if (sanitizedData.password) sanitizedData.password = '********';
        } catch (e) {
          sanitizedData = 'String data present (could not parse)';
        }
      } else if (typeof config.data === 'object') {
        sanitizedData = { ...config.data };
        if (sanitizedData.password) sanitizedData.password = '********';
      } else {
        sanitizedData = `Data present (type: ${typeof config.data})`;
      }
    }
    
    // Ensure data is always properly stringified for POST requests
    if (config.method?.toLowerCase() === 'post' && config.data && typeof config.data === 'object') {
      config.data = JSON.stringify(config.data);
      console.log('Stringified request data:', config.data ? 'Data present' : 'No data');
    }
    
    // Log request details
    console.log('API Request:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      data: sanitizedData,
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
      statusText: response.statusText,
      headers: response.headers,
      hasData: !!response.data,
      timestamp: new Date().toISOString()
    });
    return response;
  },
  error => {
    // Create a detailed error log with proper typing
    const errorDetails: {
      url?: string;
      method?: string;
      timestamp: string;
      status?: number;
      statusText?: string;
      data?: any;
      headers?: any;
      request?: string;
      requestData?: any;
      message?: string;
    } = {
      url: error.config?.url,
      method: error.config?.method,
      timestamp: new Date().toISOString()
    };
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      errorDetails.status = error.response.status;
      errorDetails.statusText = error.response.statusText;
      errorDetails.data = error.response.data;
      errorDetails.headers = error.response.headers;
      console.error('API Error (Server Response):', errorDetails);
    } else if (error.request) {
      // The request was made but no response was received
      errorDetails.request = 'Request made but no response received';
      errorDetails.requestData = error.config?.data;
      console.error('API Error (No Response):', errorDetails);
    } else {
      // Something happened in setting up the request that triggered an Error
      errorDetails.message = error.message;
      console.error('API Error (Request Setup):', errorDetails);
    }
    
    return Promise.reject(error);
  }
);

export default config; 