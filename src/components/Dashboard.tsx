import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Add Calendly type
declare global {
  interface Window {
    Calendly?: any;
  }
}

interface ResearchThread {
  id: string;
  query: string;
  timestamp: string;
  status: string;
}

interface CustomWorkflow {
  id: string;
  name: string;
  description: string;
  status: string;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'threads' | 'workflows'>('threads');
  const [threads, setThreads] = useState<ResearchThread[]>([]);
  const [workflows, setWorkflows] = useState<CustomWorkflow[]>([]);

  // Add Calendly script
  useEffect(() => {
    // Add Calendly styles
    const style = document.createElement('style');
    style.innerHTML = `
      .calendly-inline-widget,
      .calendly-inline-widget *,
      .calendly-badge-widget,
      .calendly-badge-widget *,
      .calendly-overlay,
      .calendly-overlay * {
        font-size: 16px;
        line-height: 1.2em;
      }
      
      .calendly-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        overflow: hidden;
        z-index: 9999;
        background-color: rgba(0, 0, 0, 0.75);
        opacity: 1;
      }
      
      .calendly-popup {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 95% !important;
        max-width: 1200px !important;
        height: 85vh !important;
        padding: 0;
        margin: 0;
        background: #ffffff;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        display: flex !important;
        flex-direction: column !important;
      }

      .calendly-popup-content {
        position: relative;
        width: 100%;
        flex: 1 !important;
        display: flex !important;
        flex-direction: column !important;
      }

      .calendly-popup-iframe {
        position: relative;
        width: 100%;
        flex: 1 !important;
        border: none;
        border-radius: 12px;
      }

      .calendly-popup-close {
        position: absolute;
        top: -40px;
        right: 0;
        color: white;
        font-size: 24px;
        cursor: pointer;
      }

      @media (max-width: 768px) {
        .calendly-popup {
          width: 98% !important;
          height: 90vh !important;
        }
      }
    `;
    document.head.appendChild(style);

    // Add Calendly script
    const script = document.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.head.removeChild(style);
      document.body.removeChild(script);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openCalendly = () => {
    if (window.Calendly) {
      window.Calendly.initPopupWidget({
        url: 'https://calendly.com/janga-bussaja/discovery',
        prefill: {},
        utm: {},
        parentElement: document.body,
        text: 'Schedule time with me',
        color: '#4f46e5',
        textColor: '#ffffff',
        branding: false
      });
    } else {
      window.open('https://calendly.com/janga-bussaja/discovery', '_blank');
    }
  };

  const openGoogleForm = () => {
    window.open('https://docs.google.com/forms/d/e/1FAIpQLScKYVYdIFqyUphutKENs8uedY1MtR0OSW1hJOrbg_nWaMx5WQ/viewform?usp=header', '_blank');
  };

  const navigateToPayment = () => {
    navigate('/payment');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white h-screen shadow-lg">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">Dashboard</h1>
              {!user?.isPaidUser && (
                <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded">Basic</span>
              )}
              {user?.isPaidUser && (
                <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded">Premium</span>
              )}
            </div>
            
            {!user?.isPaidUser && (
              <button
                onClick={navigateToPayment}
                className="w-full mb-6 bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-2 px-4 rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 shadow-md"
              >
                Upgrade to Premium
              </button>
            )}

            <div className="space-y-2">
              <button
                onClick={() => setActiveTab('threads')}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'threads'
                    ? 'bg-gray-100 text-purple-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Research Threads
              </button>
              <button
                onClick={() => setActiveTab('workflows')}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'workflows'
                    ? 'bg-gray-100 text-purple-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Custom Workflows
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-semibold text-gray-800">
              {activeTab === 'threads' ? 'Research Threads' : 'Custom Workflows'}
            </h2>
            <div className="flex space-x-4">
              <button
                onClick={openGoogleForm}
                className="bg-emerald-500 text-white py-2 px-4 rounded-lg hover:bg-emerald-600 transition-colors"
              >
                Create Workflow
              </button>
              <button
                onClick={() => navigate('/research')}
                className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Start Research
              </button>
              <button
                onClick={openCalendly}
                className="bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors"
              >
                Schedule Discovery Call
              </button>
            </div>
          </div>

          {/* Content based on active tab */}
          {activeTab === 'threads' ? (
            user?.isPaidUser ? (
              <div className="bg-white rounded-lg shadow p-6">
                {/* Research threads content */}
                <p>Your research history will appear here.</p>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-6 text-center">
                <h3 className="text-xl font-semibold text-yellow-800 mb-2">Upgrade to Access Research History</h3>
                <p className="text-yellow-700 mb-4">Premium users can view and manage their research threads.</p>
                <button
                  onClick={navigateToPayment}
                  className="bg-yellow-500 text-white py-2 px-6 rounded-lg hover:bg-yellow-600 transition-colors"
                >
                  Upgrade Now
                </button>
              </div>
            )
          ) : (
            user?.isPaidUser ? (
              <div className="bg-white rounded-lg shadow p-6">
                {/* Workflows content */}
                <p>Your custom workflows will appear here.</p>
              </div>
            ) : (
              <div className="bg-purple-50 border border-purple-100 rounded-lg p-6 text-center">
                <h3 className="text-xl font-semibold text-purple-800 mb-2">Upgrade to Access Custom Workflows</h3>
                <p className="text-purple-700 mb-4">Premium users can create and manage custom automation workflows.</p>
                <button
                  onClick={navigateToPayment}
                  className="bg-purple-500 text-white py-2 px-6 rounded-lg hover:bg-purple-600 transition-colors"
                >
                  Upgrade Now
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 