import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo';

// Feature card component
interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon, onClick }) => {
  return (
    <div 
      className="bg-black/80 border border-cyan-500/30 rounded-lg p-5 shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 cursor-pointer transform hover:-translate-y-1 hover:border-cyan-400/50 h-full"
      onClick={onClick}
    >
      <div className="flex items-center mb-3">
        <div className="text-cyan-400 mr-3 text-xl">{icon}</div>
        <h3 className="text-lg font-bold text-white">{title}</h3>
      </div>
      <p className="text-gray-300 text-sm">{description}</p>
    </div>
  );
};

// Authentication modal component
interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  navigate: (path: string) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, navigate }) => {
  const { signIn } = useAuth();

  if (!isOpen) return null;

  const handleSignIn = async (provider: string) => {
    if (provider === 'email') {
      // Redirect to the login page for email login
      navigate('/login');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-cyan-500/30 rounded-lg p-8 max-w-md w-full shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Sign In to Continue</h2>
        
        <div className="space-y-4">
          <button 
            onClick={() => handleSignIn('email')}
            className="w-full flex items-center justify-center gap-3 bg-cyan-500 text-white py-3 px-4 rounded-lg hover:bg-cyan-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Continue with Email
          </button>
        </div>
        
        <button
          onClick={onClose}
          className="mt-6 text-gray-400 hover:text-white text-sm text-center w-full"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default function LandingPage() {
  const { user } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to dashboard if user is already authenticated
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);
  
  const openAuthModal = () => {
    setIsAuthModalOpen(true);
  };
  
  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="border-b border-cyan-900/30 bg-black/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Logo size={40} />
              <span className="ml-2 text-2xl font-bold text-cyan-400">SkipTheGames4AI.com</span>
            </div>
            <div>
              <button
                onClick={openAuthModal}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-2 rounded-md hover:from-cyan-600 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-cyan-500/20"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background glow effect */}
        <div className="absolute inset-0 bg-gradient-radial from-cyan-900/20 to-transparent"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
              Automate Your Growth with AI
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
              Turn AI & Automation Into a Growth Engine
            </p>
          </div>

          {/* Center - Logo */}
          <div className="flex flex-col items-center justify-center mb-12">
            <div className="relative w-full max-w-md mx-auto" style={{ maxHeight: '350px', aspectRatio: '1/1' }}>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <img 
                  src="/images/logo.jpeg" 
                  alt="SkipTheGames4AI.com Logo" 
                  className="w-5/6 h-5/6 object-contain rounded-full"
                  onError={(e) => {
                    console.error("Image failed to load");
                    // If image fails to load, show the SVG logo
                    const container = e.currentTarget.parentElement;
                    if (container) {
                      container.innerHTML = `
                        <div class="w-5/6 h-5/6 flex items-center justify-center">
                          <svg 
                            viewBox="0 0 200 200" 
                            class="w-full h-full"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <defs>
                              <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stop-color="#06b6d4" />
                                <stop offset="100%" stop-color="#8b5cf6" />
                              </linearGradient>
                            </defs>
                            <circle cx="100" cy="100" r="90" fill="black" />
                            <circle cx="100" cy="100" r="85" fill="none" stroke="url(#logoGradient)" stroke-width="2" />
                            <path 
                              d="M50,70 C50,60 60,50 80,50 C100,50 110,60 110,70 C110,80 100,90 80,90 C60,90 50,80 50,70 Z M90,110 C90,100 100,90 120,90 C140,90 150,100 150,110 C150,120 140,130 120,130 C100,130 90,120 90,110 Z" 
                              fill="url(#logoGradient)" 
                              opacity="0.8"
                            />
                            <text x="100" y="160" text-anchor="middle" fill="#06b6d4" font-size="24" font-weight="bold">SkipTheGames4AI</text>
                            <text x="100" y="180" text-anchor="middle" fill="#8b5cf6" font-size="16" font-weight="bold">AI</text>
                          </svg>
                        </div>
                      `;
                    }
                  }}
                />
              </div>
              
              {/* Glowing effect */}
              <div className="absolute -inset-2 bg-cyan-500/10 rounded-full blur-xl"></div>
            </div>
            
            <button
              onClick={openAuthModal}
              className="mt-8 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-8 py-3 rounded-md hover:from-cyan-600 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-cyan-500/30 font-bold text-lg"
            >
              Unlock Your Free AI Blueprint
            </button>
          </div>

          {/* Plans Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Freebie Plan */}
            <FeatureCard
              title="Freebie Plan"
              description="Get a customized automation plan with our AI research engine. Discover the best tools and workflows for your needs."
              icon={<span>🎁</span>}
              onClick={openAuthModal}
            />

            {/* GFE Plan */}
            <FeatureCard
              title="GFE Plan"
              description="100 days of fully automated cold outreach with 10,000 pre-qualified leads for just $1,000."
              icon={<span>💃</span>}
              onClick={openAuthModal}
            />

            {/* Custom Plan */}
            <FeatureCard
              title="Custom Plan"
              description="Need something more tailored? Our team can build custom AI solutions for your specific business needs."
              icon={<span>⚙️</span>}
              onClick={openAuthModal}
            />
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gradient-to-b from-black to-gray-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-cyan-400 mb-4">Why Choose SkipTheGames4AI.com?</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Our AI-powered platform helps businesses automate their growth with cutting-edge technology
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-900/50 p-6 rounded-lg border border-cyan-900/30">
              <div className="text-cyan-400 text-3xl mb-4">💰</div>
              <h3 className="text-xl font-bold text-white mb-2">Increase Revenue</h3>
              <p className="text-gray-300">Automate your lead generation and follow-ups to close more deals without lifting a finger.</p>
            </div>

            <div className="bg-gray-900/50 p-6 rounded-lg border border-cyan-900/30">
              <div className="text-cyan-400 text-3xl mb-4">⏱️</div>
              <h3 className="text-xl font-bold text-white mb-2">Save Time</h3>
              <p className="text-gray-300">Let AI handle repetitive tasks while you focus on what matters most for your business.</p>
            </div>

            <div className="bg-gray-900/50 p-6 rounded-lg border border-cyan-900/30">
              <div className="text-cyan-400 text-3xl mb-4">📈</div>
              <h3 className="text-xl font-bold text-white mb-2">Scale Effortlessly</h3>
              <p className="text-gray-300">Our solutions grow with your business, from solopreneurs to enterprises.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-cyan-900/20 to-purple-900/20 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to Transform Your Business?</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Join thousands of businesses already using SkipTheGames4AI.com to automate their growth
          </p>
          <button
            onClick={openAuthModal}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-8 py-4 rounded-md hover:from-cyan-600 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-cyan-500/30 font-bold text-lg"
          >
            Get Started Today
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-black border-t border-cyan-900/30 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <Logo size={30} />
              <span className="ml-2 text-xl font-bold text-cyan-400">SkipTheGames4AI.com</span>
            </div>
            <div className="text-gray-400 text-sm">
              © {new Date().getFullYear()} SkipTheGames4AI.com. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} navigate={navigate} />
    </div>
  );
} 