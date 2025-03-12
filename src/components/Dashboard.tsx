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

  return (
    <div className="min-h-screen bg-black flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 min-h-screen p-4">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-cyan-500">Dashboard</h1>
          {user?.isPaidUser && (
            <span className="bg-cyan-500 text-white px-2 py-1 rounded-full text-sm mt-2 inline-block">
              Premium
            </span>
          )}
        </div>

        <nav className="space-y-2">
          <button
            onClick={() => setActiveTab('threads')}
            className={`w-full text-left px-4 py-2 rounded ${
              activeTab === 'threads'
                ? 'bg-cyan-600 text-white'
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            Research Threads
          </button>
          {user?.isPaidUser && (
            <button
              onClick={() => setActiveTab('workflows')}
              className={`w-full text-left px-4 py-2 rounded ${
                activeTab === 'workflows'
                  ? 'bg-cyan-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              Custom Workflows
            </button>
          )}
        </nav>

        <div className="mt-auto pt-8">
          <div className="text-gray-400 text-sm">
            <div className="mb-2">
              <span className="block">Signed in as:</span>
              <span className="block font-medium text-white">{user?.email}</span>
            </div>
            <button
              onClick={handleSignOut}
              className="text-cyan-500 hover:text-cyan-400"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Top Navigation */}
        <div className="bg-gray-900 p-4 flex justify-end items-center space-x-4">
          <button
            onClick={() => navigate('/research')}
            className="bg-cyan-500 text-white px-4 py-2 rounded hover:bg-cyan-600 transition duration-200"
          >
            Start Research
          </button>
          <button
            onClick={() => window.open('https://docs.google.com/forms/d/e/1FAIpQLScKYVYdIFqyUphutKENs8uedY1MtR0OSW1hJOrbg_nWaMx5WQ/viewform?usp=header', '_blank')}
            className="bg-cyan-600 text-white px-4 py-2 rounded hover:bg-cyan-700 transition duration-200"
          >
            Create Workflow
          </button>
          <button
            onClick={openCalendly}
            className="bg-cyan-700 text-white px-4 py-2 rounded hover:bg-cyan-800 transition duration-200"
          >
            Schedule Discovery Call
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {activeTab === 'threads' ? (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Research Threads</h2>
              {user?.isPaidUser ? (
                threads.length > 0 ? (
                  <div className="grid gap-4">
                    {threads.map(thread => (
                      <div key={thread.id} className="bg-gray-800 p-4 rounded-lg">
                        <h3 className="text-white font-medium">{thread.query}</h3>
                        <p className="text-gray-400 text-sm mt-2">
                          {new Date(thread.timestamp).toLocaleDateString()}
                        </p>
                        <span className={`inline-block px-2 py-1 rounded text-sm mt-2 ${
                          thread.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'
                        }`}>
                          {thread.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400">No research threads yet. Start your first research!</p>
                )
              ) : (
                <div className="bg-gray-800 p-6 rounded-lg">
                  <h3 className="text-white font-medium mb-2">Upgrade to Premium</h3>
                  <p className="text-gray-400 mb-4">
                    Get access to unlimited research threads and custom workflows.
                  </p>
                  <button
                    onClick={openCalendly}
                    className="bg-cyan-500 text-white px-4 py-2 rounded hover:bg-cyan-600 transition duration-200"
                  >
                    Schedule a Demo
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Custom Workflows</h2>
              {workflows.length > 0 ? (
                <div className="grid gap-4">
                  {workflows.map(workflow => (
                    <div key={workflow.id} className="bg-gray-800 p-4 rounded-lg">
                      <h3 className="text-white font-medium">{workflow.name}</h3>
                      <p className="text-gray-400 mt-2">{workflow.description}</p>
                      <span className={`inline-block px-2 py-1 rounded text-sm mt-2 ${
                        workflow.status === 'active' ? 'bg-green-500' : 'bg-gray-500'
                      }`}>
                        {workflow.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No custom workflows yet. Create your first workflow!</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 