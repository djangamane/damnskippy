import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';

// Add Calendly type
declare global {
  interface Window {
    Calendly?: any;
  }
}

interface ResearchThread {
  id: string;
  query: string;
  result: string;
  timestamp: string;
  tags?: string[];
}

interface CustomWorkflow {
  id: string;
  name: string;
  description: string;
  status: string;
  updatedAt: string;
}

const Dashboard = () => {
  const { user, signOut, token } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'threads' | 'workflows'>('threads');
  const [threads, setThreads] = useState<ResearchThread[]>([]);
  const [workflows, setWorkflows] = useState<CustomWorkflow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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

  // Fetch research threads and workflows when tab changes or for premium users
  useEffect(() => {
    if (!user?.isPaidUser || !token) return;
    
    async function fetchData() {
      setLoading(true);
      setError(null);
      
      try {
        if (activeTab === 'threads') {
          const response = await axios.get('/api/research/history', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.data.success) {
            setThreads(response.data.data);
          }
        } else {
          const response = await axios.get('/api/workflows', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.data.success) {
            setWorkflows(response.data.data);
          }
        }
      } catch (err: any) {
        console.error(`Failed to fetch ${activeTab}:`, err);
        setError(err.response?.data?.message || 'An error occurred while fetching data');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [activeTab, user?.isPaidUser, token]);

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

  const formatTimeAgo = (date: string | Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
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

  const viewThread = (threadId: string) => {
    navigate(`/research/${threadId}`);
  };

  const viewWorkflow = (workflowId: string) => {
    navigate(`/workflows/${workflowId}`);
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
                {loading ? (
                  <div className="flex justify-center items-center py-8">
                    <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                ) : error ? (
                  <div className="text-red-500 text-center py-4">{error}</div>
                ) : threads.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>You haven't created any research threads yet.</p>
                    <button 
                      onClick={() => navigate('/research')}
                      className="mt-4 text-indigo-600 font-medium hover:text-indigo-800"
                    >
                      Start your first research
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {threads.map(thread => (
                      <div 
                        key={thread.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors cursor-pointer"
                        onClick={() => viewThread(thread.id)}
                      >
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium text-lg text-gray-800">{thread.query}</h3>
                          <span className="text-xs text-gray-500">{formatTimeAgo(thread.timestamp)}</span>
                        </div>
                        <p className="mt-2 text-gray-600 line-clamp-2">{thread.result.substring(0, 150)}...</p>
                        {thread.tags && thread.tags.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {thread.tags.map(tag => (
                              <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <h3 className="text-xl font-semibold mb-4">Premium Feature</h3>
                <p className="text-gray-600 mb-6">
                  Upgrade to Premium to save and access your research history.
                </p>
                <button
                  onClick={navigateToPayment}
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-2 px-6 rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-200"
                >
                  Upgrade Now
                </button>
              </div>
            )
          ) : (
            // Workflows tab
            user?.isPaidUser ? (
              <div className="bg-white rounded-lg shadow p-6">
                {loading ? (
                  <div className="flex justify-center items-center py-8">
                    <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                ) : error ? (
                  <div className="text-red-500 text-center py-4">{error}</div>
                ) : workflows.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>You haven't created any custom workflows yet.</p>
                    <button 
                      onClick={openGoogleForm}
                      className="mt-4 text-indigo-600 font-medium hover:text-indigo-800"
                    >
                      Create your first workflow
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {workflows.map(workflow => (
                      <div 
                        key={workflow.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors cursor-pointer"
                        onClick={() => viewWorkflow(workflow.id)}
                      >
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium text-lg text-gray-800">{workflow.name}</h3>
                          <span className={`text-xs px-2 py-1 rounded ${
                            workflow.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : workflow.status === 'draft' 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : 'bg-gray-100 text-gray-800'
                          }`}>
                            {workflow.status.charAt(0).toUpperCase() + workflow.status.slice(1)}
                          </span>
                        </div>
                        <p className="mt-2 text-gray-600">{workflow.description}</p>
                        <div className="mt-3 text-xs text-gray-500">
                          Updated {formatTimeAgo(workflow.updatedAt)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <h3 className="text-xl font-semibold mb-4">Premium Feature</h3>
                <p className="text-gray-600 mb-6">
                  Upgrade to Premium to create and manage custom workflows.
                </p>
                <button
                  onClick={navigateToPayment}
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-2 px-6 rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-200"
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
}

export default Dashboard; 