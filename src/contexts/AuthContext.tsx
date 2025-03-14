import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config/api';

interface User {
  _id: string;
  email: string;
  displayName?: string;
  isPaidUser?: boolean;
  createdAt?: string;
  lastLoginAt?: string;
}

interface AuthContextType {
  user: User | null;
  currentUser: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Export the useAuth hook first
const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Then export the provider
const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for stored session
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setToken(storedToken);
        
        // Set the token in axios headers for all future requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      console.log('Attempting to sign in with email:', email);
      
      // Add a timestamp to help with debugging
      console.log('Sign-in request started at:', new Date().toISOString());
      
      const response = await axios.post(`${config.apiUrl}/api/auth/signin`, {
        email,
        password
      });
      
      console.log('Sign-in response received at:', new Date().toISOString());
      console.log('Sign-in response status:', response.status);
      console.log('Sign-in response headers:', response.headers);
      console.log('Sign-in response data:', response.data);
      
      const userData = response.data.data;
      const authToken = response.data.token;
      
      if (!userData || !authToken) {
        console.error('Invalid response format:', response.data);
        throw new Error('Invalid response from server: missing user data or token');
      }
      
      // Get token from Authorization header if available
      const authHeader = response.headers['authorization'];
      const headerToken = authHeader ? authHeader.split(' ')[1] : null;
      
      // Use token from header if available, otherwise use token from response body
      const finalToken = headerToken || authToken;
      
      console.log('Using token from:', headerToken ? 'Authorization header' : 'response body');
      
      setUser(userData);
      setToken(finalToken);
      
      // Store in localStorage
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', finalToken);
      
      // Set the token in axios headers for all future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${finalToken}`;
      
      console.log('User authenticated successfully');
    } catch (err: any) {
      console.error('Sign-in error:', err);
      
      // Log detailed error information
      if (err.response) {
        console.error('Error response status:', err.response.status);
        console.error('Error response data:', err.response.data);
        console.error('Error response headers:', err.response.headers);
      } else if (err.request) {
        console.error('Error request:', err.request);
      }
      
      const errorMessage = err.response?.data?.error || err.message || 'Invalid email or password';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      setError(null);
      const response = await axios.post(`${config.apiUrl}/api/auth/signup`, {
        email,
        password,
        displayName
      });
      
      const userData = response.data.data;
      const authToken = response.data.token;
      
      setUser(userData);
      setToken(authToken);
      
      // Store in localStorage
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', authToken);
      
      // Set the token in axios headers for all future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred during sign up';
      setError(message);
      throw new Error(message);
    }
  };

  const signOut = async () => {
    try {
      await axios.post(`${config.apiUrl}/api/auth/signout`);
    } catch (err) {
      console.error('Error during sign out:', err);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      
      // Remove the token from axios headers
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  const value = {
    user,
    currentUser: user,
    loading,
    signIn,
    signUp,
    signOut,
    error,
    token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider, useAuth }; 