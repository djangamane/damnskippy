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
  signIn: (email: string, password: string) => Promise<User | void>;
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

// Special premium user email
const PREMIUM_USER_EMAIL = 'lordomegaking@gmail.com';
const PREMIUM_USER_ID = '67daf045e191a7f5cbf85961';

// Then export the provider
const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Special function to ensure a user has premium status
  const ensurePremiumStatus = (userData: User): User => {
    // For the special user, always set premium to true
    if (
      userData.email === PREMIUM_USER_EMAIL || 
      userData._id === PREMIUM_USER_ID
    ) {
      console.log('Setting premium status for special user:', userData.email);
      return {
        ...userData,
        isPaidUser: true
      };
    }
    return userData;
  };

  useEffect(() => {
    // Check for stored session
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    if (storedUser && storedToken) {
      try {
        let parsedUser = JSON.parse(storedUser);
        
        // Ensure premium status for special user
        parsedUser = ensurePremiumStatus(parsedUser);
        
        setUser(parsedUser);
        setToken(storedToken);
        
        // Update localStorage with possibly modified user
        localStorage.setItem('user', JSON.stringify(parsedUser));
        
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

  const signIn = async (email: string, password: string): Promise<User | void> => {
    try {
      // Double check that both values exist and aren't just whitespace
      if (!email || !email.trim() || !password || !password.trim()) {
        const errorMessage = 'Email and password are required';
        console.error(errorMessage);
        setError(errorMessage);
        throw new Error(errorMessage);
      }

      setError(null);
      console.log('Attempting to sign in with email:', email);
      
      // Trim and validate the credentials
      const trimmedEmail = email.trim();
      const trimmedPassword = password.trim();
      
      if (!trimmedEmail || !trimmedPassword) {
        const errorMessage = 'Email and password are required';
        console.error(errorMessage);
        setError(errorMessage);
        throw new Error(errorMessage);
      }
      
      // Make the API request
      const response = await axios.post(
        `${config.apiUrl}/api/auth/signin`, 
        {
          email: trimmedEmail,
          password: trimmedPassword
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
      
      console.log('Sign-in response received');
      
      // Validate response
      if (!response.data) {
        throw new Error('No data received from server');
      }
      
      const { success, data: userData, token, error, message } = response.data;
      
      if (!success || error) {
        throw new Error(message || error || 'Sign-in failed');
      }
      
      if (!userData || !token) {
        throw new Error('Invalid response from server: missing user data or token');
      }
      
      // Apply premium status for special user
      const enhancedUserData = ensurePremiumStatus(userData);
      
      // Store user data and token
      setUser(enhancedUserData);
      setToken(token);
      
      // Store in localStorage
      localStorage.setItem('user', JSON.stringify(enhancedUserData));
      localStorage.setItem('token', token);
      
      // Set the token in axios headers for all future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      console.log('User authenticated successfully');
      return enhancedUserData;
    } catch (err: any) {
      console.error('Sign-in error:', err);
      
      // Extract error message from response if available
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Sign-in failed';
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
      
      let userData = response.data.data;
      const authToken = response.data.token;
      
      // Apply premium status if needed
      userData = ensurePremiumStatus(userData);
      
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