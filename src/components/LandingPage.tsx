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
    await signIn(provider);
    navigate('/dashboard');
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-cyan-500/30 rounded-lg p-8 max-w-md w-full shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Sign In to Continue</h2>
        
        <div className="space-y-4">
          <button 
            onClick={() => handleSignIn('google')}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>
          
          <button 
            onClick={() => handleSignIn('email')}
            className="w-full flex items-center justify-center gap-3 bg-cyan-600 text-white py-3 px-4 rounded-lg hover:bg-cyan-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Continue with Email
          </button>
          
          <button 
            onClick={() => handleSignIn('github')}
            className="w-full flex items-center justify-center gap-3 bg-gray-800 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            Continue with GitHub
          </button>
        </div>
        
        <div className="mt-6 text-center">
          <button 
            onClick={onClose}
            className="text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Cancel
          </button>
        </div>
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
              <span className="ml-2 text-2xl font-bold text-cyan-400">SkipTheGames.AI</span>
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
                  alt="SkipTheGames.AI Logo" 
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
                            <text x="100" y="160" text-anchor="middle" fill="#06b6d4" font-size="24" font-weight="bold">SkipTheGames</text>
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
            <h2 className="text-3xl font-bold text-cyan-400 mb-4">Why Choose SkipTheGames.AI?</h2>
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
            Join thousands of businesses already using SkipTheGames.AI to automate their growth
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
              <span className="ml-2 text-xl font-bold text-cyan-400">SkipTheGames.AI</span>
            </div>
            <div className="text-gray-400 text-sm">
              © {new Date().getFullYear()} SkipTheGames.AI. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} navigate={navigate} />
    </div>
  );
} 