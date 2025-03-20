import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { useAuth } from '../contexts/AuthContext';
import Logo from './Logo';
import config from '../config/api';
import '../styles/workflow.css';

// Define types for workflow nodes and connections
interface WorkflowNode {
  id: string;
  name: string;
  type: string;
  position?: [number, number];
  parameters?: Record<string, any>;
}

interface WorkflowConnection {
  source: string;
  target: string;
}

interface Workflow {
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  name?: string;
  description?: string;
}

interface ResearchResult {
  title: string;
  content: string;
  workflow?: Workflow | null;
  success?: boolean;
  error?: string;
}

// Add Calendly popup functionality
declare global {
  interface Window {
    Calendly?: any;
  }
}

export default function ResearchEngine() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token, signOut } = useAuth();
  const navigate = useNavigate();

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

  // Function to open Calendly popup
  const openCalendly = (url: string) => {
    if (window.Calendly) {
      window.Calendly.initPopupWidget({
        url,
        prefill: {},
        utm: {},
        parentElement: document.body,
        text: 'Schedule time with me',
        color: '#4f46e5',
        textColor: '#ffffff',
        branding: false
      });
    } else {
      console.error('Calendly widget not loaded');
      window.open(url, '_blank');
    }
  };

  // Function to handle research submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) {
      setError('Please enter a query');
      return;
    }
    
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await axios.post(
        `${config.apiUrl}/api/research`,
        { query },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      setLoading(false);
      
      if (response.data && response.data.success) {
        const resultData = response.data.result || {};
        
        // Extract content and workflow from the result object
        const content = resultData.content || 'No content available';
        const workflow = resultData.workflow || null;
        
        setResult({
          title: 'Research Results',
          content,
          workflow,
          success: true
        });
      } else {
        const errorMessage = response.data?.error || response.data?.message || 'Unknown error occurred';
        setError(errorMessage);
        setResult({
          title: 'Error',
          content: `An error occurred: ${errorMessage}`,
          success: false,
          error: errorMessage
        });
      }
    } catch (err: any) {
      setLoading(false);
      const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'Unknown error occurred';
      setError(errorMessage);
      setResult({
        title: 'Error',
        content: `An error occurred: ${errorMessage}`,
        success: false,
        error: errorMessage
      });
    }
  };

  // Function to safely render markdown content
  const renderContent = (content: string) => {
    // Convert line breaks to <br> tags and preserve formatting
    const formattedContent = content
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/#{3} (.*?)\n/g, '<h3>$1</h3>')
      .replace(/#{2} (.*?)\n/g, '<h2>$1</h2>')
      .replace(/#{1} (.*?)\n/g, '<h1>$1</h1>');

    const sanitizedContent = DOMPurify.sanitize(formattedContent);
    return { __html: sanitizedContent };
  };

  // Function to render the workflow diagram
  const renderWorkflowDiagram = (workflow: Workflow) => {
    if (!workflow || !workflow.nodes || !Array.isArray(workflow.nodes)) {
      return <div>Unable to render workflow diagram. Invalid workflow format.</div>;
    }

    // Create a map of node connections for visualization
    const nodeConnections: Record<string, string[]> = {};
    
    if (workflow.connections && Array.isArray(workflow.connections)) {
      workflow.connections.forEach((connection: WorkflowConnection) => {
        if (connection && typeof connection === 'object' && 'source' in connection && 'target' in connection) {
          const { source, target } = connection;
          if (source && target) {
            if (!nodeConnections[source]) {
              nodeConnections[source] = [];
            }
            nodeConnections[source].push(target);
          }
        }
      });
    }

    return (
      <div className="workflow-diagram">
        <div className="flex flex-wrap justify-center gap-4 mb-4">
          {workflow.nodes.map((node: WorkflowNode, index: number) => {
            if (!node || typeof node !== 'object') {
              return null;
            }
            
            return (
              <div 
                key={node.id || `node-${index}`} 
                className="workflow-node"
                style={{ 
                  backgroundColor: getNodeColor(node.type || 'unknown'),
                  position: 'relative'
                }}
              >
                <div className="workflow-node-title">{node.name || `Node ${index + 1}`}</div>
                <div className="workflow-node-type">{node.type || 'Unknown Type'}</div>
                {node.id && nodeConnections[node.id] && (
                  <div className="workflow-node-connections">
                    <div className="text-xs mt-1">Connects to:</div>
                    <ul className="text-xs list-disc pl-4">
                      {nodeConnections[node.id].map((targetId: string, idx: number) => {
                        const targetNode = workflow.nodes.find((n: WorkflowNode) => n && n.id === targetId);
                        return (
                          <li key={idx}>{targetNode && targetNode.name ? targetNode.name : targetId}</li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="workflow-metadata mt-4 p-3 bg-gray-100 rounded-md">
          <p className="text-sm text-gray-600 mb-2">
            This is a simplified representation of the n8n workflow. For a complete implementation, 
            you can download the JSON and import it into n8n.
          </p>
          <button 
            onClick={() => downloadWorkflowJSON(workflow)}
            className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition-colors"
          >
            Download Workflow JSON
          </button>
        </div>
      </div>
    );
  };

  // Helper function to get node color based on type
  const getNodeColor = (nodeType: string): string => {
    const typeColors: Record<string, string> = {
      'trigger': '#e74c3c',
      'action': '#3498db',
      'if': '#f39c12',
      'switch': '#9b59b6',
      'loop': '#1abc9c',
      'http': '#2ecc71',
      'function': '#34495e',
      'email': '#e67e22',
      'api': '#2980b9',
      'webhook': '#8e44ad',
      'database': '#27ae60',
      'filter': '#f1c40f',
      'transform': '#16a085'
    };
    
    return typeColors[nodeType.toLowerCase()] || '#95a5a6'; // Default color for unknown types
  };

  // Function to download workflow JSON
  const downloadWorkflowJSON = (workflow: Workflow) => {
    if (!workflow) {
      console.error('Cannot download workflow: workflow is undefined');
      return;
    }
    
    try {
      const workflowJSON = JSON.stringify(workflow, null, 2);
      const blob = new Blob([workflowJSON], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = 'n8n-workflow.json';
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading workflow JSON:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Dashboard
        </button>
        <div className="flex justify-center mb-8">
          <Logo />
        </div>
        <div className="max-w-4xl mx-auto p-6">
          {/* Navigation Bar */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <Logo size={40} />
              <h1 className="text-2xl font-bold text-indigo-900">SkipTheGames4AI.com</h1>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  signOut().then(() => {
                    navigate('/');
                  }).catch((err: Error) => {
                    console.error('Error during sign out:', err);
                    navigate('/');
                  });
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Hero Section */}
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-3">
              <h1 className="text-5xl font-bold text-indigo-900">SkipTheGames4AI.com</h1>
            </div>
            <p className="text-xl text-indigo-700 max-w-2xl mx-auto">
              Discover AI-powered automation solutions with deep research capabilities
            </p>
          </div>
          
          {/* Research Engine Title */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <h2 className="text-2xl font-bold text-indigo-800">AI Build & Automation Research Engine</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="mb-8">
            <div className="flex gap-4">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What do you want to build or automate?"
                className="flex-1 p-3 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 shadow-sm"
              >
                {loading ? 'Researching...' : 'Research'}
              </button>
            </div>
          </form>

          {error && (
            <div className="p-4 mb-6 bg-red-100 text-red-700 rounded-lg border border-red-200 shadow-sm">
              {error}
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center my-12 space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              <p className="text-lg text-indigo-700 font-medium">Performing deep research on your request...</p>
              <p className="text-sm text-indigo-500">This may take a minute or two for comprehensive results</p>
            </div>
          )}

          {result && (
            <div className="space-y-8">
              {/* Research Results Section */}
              <div className="bg-white p-6 rounded-lg shadow-md border border-indigo-100">
                <h2 className="text-2xl font-semibold mb-4 text-indigo-900">Research Results</h2>
                <div className="prose max-w-none" dangerouslySetInnerHTML={renderContent(result.content)} />
              </div>

              {/* n8n Workflow Section */}
              {result.workflow && (
                <div className="bg-white p-6 rounded-lg shadow-md border border-indigo-100">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold text-indigo-900">n8n Workflow</h2>
                    <button 
                      onClick={() => {
                        if (result.workflow) {
                          downloadWorkflowJSON(result.workflow);
                        }
                      }}
                      className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition-colors"
                    >
                      Download JSON
                    </button>
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-2 text-indigo-800">Workflow Diagram</h3>
                    {renderWorkflowDiagram(result.workflow)}
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2 text-indigo-800">Workflow JSON</h3>
                    <div className="workflow-json">
                      <pre>{JSON.stringify(result.workflow, null, 2)}</pre>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Premium Service Section */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-8 rounded-lg shadow-lg text-white">
                <h2 className="text-4xl font-extrabold mb-6 text-center">LET US DO IT FOR YOU</h2>
                <p className="text-white/90 mb-4">
                  Need a more sophisticated solution for {query}? Our team can build a custom automation 
                  tailored to your specific business requirements with expert implementation and ongoing support.
                </p>
                <ul className="list-disc pl-5 mb-6 text-white/90">
                  <li>Personalized discovery call to understand your unique needs</li>
                  <li>Custom-built solution designed specifically for your workflow</li>
                  <li>Expert implementation with dedicated support</li>
                  <li>Ongoing maintenance and optimization</li>
                </ul>
                <div className="flex justify-center">
                  <button 
                    onClick={() => openCalendly('https://calendly.com/janga-bussaja/discovery')}
                    className="px-6 py-3 bg-white text-indigo-700 font-semibold rounded-lg hover:bg-indigo-50 transition-colors inline-flex items-center gap-2 shadow-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                    </svg>
                    Schedule Discovery Call
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Featured Packages Section - Always visible */}
          <div className="mt-12">
            <h2 className="text-3xl font-bold text-center text-indigo-900 mb-8">Featured Packages</h2>
            
            <div className="flex flex-col gap-8 max-w-2xl mx-auto">
              {/* GFE Special */}
              <div 
                onClick={() => openCalendly('https://calendly.com/janga-bussaja/discovery')}
                className="aspect-square bg-gradient-to-r from-emerald-600 to-indigo-700 rounded-xl shadow-xl overflow-hidden cursor-pointer transform transition-transform duration-200 hover:scale-[1.02]"
              >
                <div className="p-1 bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500">
                  <div className="bg-white p-8 h-full rounded-t-lg">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-2xl font-bold text-indigo-900">GFE Special</h3>
                      <div className="bg-red-600 text-white px-4 py-1 rounded-full font-bold text-sm">$1,000</div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="text-red-600 text-2xl">🔥</span>
                        <p className="font-semibold text-gray-800">100 Days of Fully Automated Cold Outreach (Mon-Fri)</p>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-indigo-600 text-xl">📩</span>
                          <p className="text-gray-700">25 Cold Emails/Day</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-indigo-600 text-xl">📞</span>
                          <p className="text-gray-700">25 Cold Calls/Day</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-indigo-600 text-xl">💬</span>
                          <p className="text-gray-700">25 Text Messages/Day</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-indigo-600 text-xl">🎥</span>
                          <p className="text-gray-700">25 Minutes of AI-Generated Content/Day</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-indigo-600 text-xl">📊</span>
                        <p className="text-gray-700">CRM Integration to Track & Nurture Leads (Upgrade Available)</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-indigo-600 text-xl">📈</span>
                        <p className="text-gray-700">10,000 Pre-Qualified Leads Provided</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mt-4">
                      <div className="flex items-start gap-2">
                        <span className="text-emerald-600 text-xl mt-0.5">✅</span>
                        <p className="text-gray-700">Hands-Free Lead Generation & Follow-Ups</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-emerald-600 text-xl mt-0.5">✅</span>
                        <p className="text-gray-700">AI-Powered Outreach That Works While You Sleep</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-emerald-600 text-xl mt-0.5">✅</span>
                        <p className="text-gray-700">Perfect for Nonprofits, Solopreneurs & Businesses</p>
                      </div>
                    </div>
                    
                    <div className="mt-6 bg-indigo-50 p-4 rounded-lg">
                      <div className="flex items-start gap-2">
                        <span className="text-indigo-600 text-xl mt-0.5">💡</span>
                        <p className="text-indigo-800">Want full CRM management & AI-driven follow-ups? We've got upgrades for that.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* QV Special */}
              <div 
                onClick={() => openCalendly('https://calendly.com/janga-bussaja/discovery')}
                className="aspect-square bg-gradient-to-r from-purple-600 to-pink-700 rounded-xl shadow-xl overflow-hidden cursor-pointer transform transition-transform duration-200 hover:scale-[1.02]"
              >
                <div className="p-1 bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500">
                  <div className="bg-white p-8 h-full rounded-t-lg">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-2xl font-bold text-indigo-900">QV Special</h3>
                      <div className="bg-red-600 text-white px-4 py-1 rounded-full font-bold text-sm">$500</div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="text-red-600 text-2xl">🚀</span>
                        <p className="font-semibold text-gray-800">Complete AI Website & Business Automation</p>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-indigo-600 text-xl">🌐</span>
                          <p className="text-gray-700">Custom AI-Powered Website</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-indigo-600 text-xl">🤖</span>
                          <p className="text-gray-700">AI Chatbot Integration</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-indigo-600 text-xl">📊</span>
                          <p className="text-gray-700">Business Process Automation</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-indigo-600 text-xl">📈</span>
                          <p className="text-gray-700">Analytics & Reporting Dashboard</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-indigo-600 text-xl">🔄</span>
                        <p className="text-gray-700">Automated Content Generation & Management</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-indigo-600 text-xl">🛠️</span>
                        <p className="text-gray-700">Custom Workflow Automation</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mt-4">
                      <div className="flex items-start gap-2">
                        <span className="text-emerald-600 text-xl mt-0.5">✅</span>
                        <p className="text-gray-700">24/7 Automated Business Operations</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-emerald-600 text-xl mt-0.5">✅</span>
                        <p className="text-gray-700">Seamless Integration with Existing Tools</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-emerald-600 text-xl mt-0.5">✅</span>
                        <p className="text-gray-700">Ongoing Support & Maintenance</p>
                      </div>
                    </div>
                    
                    <div className="mt-6 bg-indigo-50 p-4 rounded-lg">
                      <div className="flex items-start gap-2">
                        <span className="text-indigo-600 text-xl mt-0.5">💡</span>
                        <p className="text-indigo-800">Need additional customization? Let's discuss your specific requirements.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}