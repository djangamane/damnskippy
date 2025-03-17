import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  // Debug store to persist values through minification
  const [debug, setDebug] = useState({
    lastAttempt: null as any,
    submitCount: 0
  });

  useEffect(() => {
    console.log('Login component mounted');
    
    // Log any prefilled values from localStorage for debugging
    const storedEmail = localStorage.getItem('debug_email');
    if (storedEmail) {
      console.log('Found stored debug email:', storedEmail);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted. Form values:', { email, password: '****' });
    
    // Validate form inputs
    if (!email || !email.trim()) {
      console.log('Email validation failed - empty value');
      setError('Email is required');
      return;
    }
    
    if (!password || !password.trim()) {
      console.log('Password validation failed - empty value');
      setError('Password is required');
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      // Store attempt info for debugging
      const attemptInfo = {
        timestamp: new Date().toISOString(),
        email,
        isLogin,
      };
      setDebug(prev => ({
        ...prev,
        lastAttempt: attemptInfo,
        submitCount: prev.submitCount + 1
      }));
      
      if (isLogin) {
        await signIn(email, password);
        navigate('/dashboard');
      } else {
        await signUp(email, password, displayName);
        navigate('/signup-success'); // Redirect to success page after signup
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      
      // Store error info for debugging
      setDebug(prev => ({
        ...prev,
        lastError: err
      }));
    }
    
    setLoading(false);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    // Clear error when user starts typing
    if (error) setError('');
  };

  const testDirectLogin = async () => {
    // Use the test account credentials directly
    const testEmail = 'test@example.com';
    const testPassword = 'test123';
    
    setLoading(true);
    setError('');
    console.log('Testing direct login with test account');
    
    try {
      // First, try fetch API
      console.log('Attempting fetch API login');
      const fetchResponse = await fetch('https://damnskippy.onrender.com/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword
        })
      });
      
      const fetchData = await fetchResponse.json();
      console.log('Fetch API login result:', {
        status: fetchResponse.status,
        success: fetchResponse.ok,
        hasData: !!fetchData
      });
      
      if (fetchResponse.ok && fetchData) {
        console.log('Direct test login successful!');
        setError('Test login successful! The API is working correctly.');
      } else {
        console.error('Direct test login failed with fetch API');
        setError('Test login failed. API error: ' + (fetchData?.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error in direct test login:', err);
      setError('Test login network error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="bg-gray-900 p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold text-cyan-500 mb-6 text-center">
          {isLogin ? 'Login' : 'Sign Up'}
        </h2>
        {error && (
          <div className={`p-3 rounded mb-4 text-center ${error.includes('successful') ? 'bg-green-500' : 'bg-red-500'} text-white`}>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="mb-4">
              <label className="block text-gray-300 mb-2" htmlFor="displayName">
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          )}
          <div className="mb-4">
            <label className="block text-gray-300 mb-2" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-cyan-500 focus:outline-none"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-300 mb-2" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={handlePasswordChange}
              className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-cyan-500 focus:outline-none"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-cyan-500 text-white py-2 px-4 rounded hover:bg-cyan-600 transition duration-200 ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>
        <div className="mt-4 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-cyan-500 hover:text-cyan-400"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
        <div className="mt-4 text-center text-gray-400 text-sm">
          <p>Test account: test@example.com / test123</p>
        </div>
        
        {/* Debug information */}
        {debug.lastAttempt && (
          <div className="mt-4 text-xs text-gray-500">
            Last attempt: {debug.lastAttempt.email} at {debug.lastAttempt.time} (#{debug.lastAttempt.count})
          </div>
        )}
        
        {/* Test API Button */}
        <div className="mt-4 text-center">
          <button
            onClick={testDirectLogin}
            disabled={loading}
            className="text-xs text-gray-400 hover:text-cyan-400"
          >
            Test API Directly
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login; 