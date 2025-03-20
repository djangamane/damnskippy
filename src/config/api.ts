// API configuration
const config = {
  // In production, API calls will be made to the same origin
  // In development, they will be proxied to the development server
  apiUrl: '',
  timeout: 300000, // 5 minutes timeout
};

// Configure axios defaults
import axios from 'axios';
axios.defaults.baseURL = config.apiUrl;
axios.defaults.timeout = config.timeout;
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.withCredentials = true;

// Add request interceptor for debugging
axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    if (config.method?.toLowerCase() === 'post') {
      config.headers['Content-Type'] = 'application/json';
    }
    
    // Log request details in development
    if (process.env.NODE_ENV === 'development') {
      console.log('API Request:', {
        url: config.url,
        method: config.method,
        headers: config.headers,
        timestamp: new Date().toISOString()
      });
    }
    
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
    // Log response details in development
    if (process.env.NODE_ENV === 'development') {
      console.log('API Response:', {
        url: response.config.url,
        method: response.config.method,
        status: response.status,
        statusText: response.statusText,
        hasData: !!response.data,
        timestamp: new Date().toISOString()
      });
    }
    return response;
  },
  error => {
    const errorDetails = {
      url: error.config?.url,
      method: error.config?.method,
      timestamp: new Date().toISOString(),
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    };
    
    console.error('API Error:', errorDetails);
    return Promise.reject(error);
  }
);

export default config; 