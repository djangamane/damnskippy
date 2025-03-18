import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const SignupSuccess = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-black/80 border border-cyan-500/30 rounded-lg p-8 shadow-lg">
        <div className="text-center">
          <div className="mb-6">
            <svg className="mx-auto h-12 w-12 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Welcome to A Bit of Advice!</h2>
          <p className="text-gray-300 mb-6">
            {user?.displayName ? `Great to have you here, ${user.displayName}!` : 'Your account has been created successfully!'}
          </p>
          <div className="space-y-4">
            <p className="text-gray-400 text-sm">
              You're now ready to explore our AI-powered features and get started with your research.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupSuccess; 