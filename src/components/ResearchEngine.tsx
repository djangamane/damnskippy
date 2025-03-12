import { useState, useEffect } from 'react';
import Logo from './Logo';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface AutomationWorkflow {
  title: string;
  description: string;
  url: string;
}

interface PremiumService {
  title: string;
  description: string;
  price: string;
  button: string;
}

interface N8nWorkflow {
  json: any;
  explanation: string;
  name: string;
}

interface ResearchResult {
  automation: AutomationWorkflow[];
  research: {
    content: string;
    sources: string[];
  };
  premium_service: PremiumService;
  n8n_workflow: N8nWorkflow;
  youtube_video?: {
    title: string;
    url: string;
    thumbnail: string;
    description: string;
  };
}

// Add Calendly popup functionality
declare global {
  interface Window {
    Calendly?: any;
  }
}

export default function ResearchEngine() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { signOut } = useAuth();
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

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('http://localhost:3001/api/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error('Research request failed');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError('Failed to perform research. Please try again.');
      console.error('Research error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadWorkflowJson = () => {
    if (!result) return;
    
    const workflowJson = JSON.stringify(result.n8n_workflow.json, null, 2);
    const blob = new Blob([workflowJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.n8n_workflow.name.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Navigation Bar */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <Logo size={40} />
            <h1 className="text-2xl font-bold text-indigo-900">SkipTheGames.AI</h1>
          </div>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Sign Out
          </button>
        </div>

        {/* Main Title and Tagline */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-3">
            <h1 className="text-5xl font-bold text-indigo-900">SkipTheGames.AI</h1>
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
              disabled={isLoading}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 shadow-sm"
            >
              {isLoading ? 'Researching...' : 'Research'}
            </button>
          </div>
        </form>

        {error && (
          <div className="p-4 mb-6 bg-red-100 text-red-700 rounded-lg border border-red-200 shadow-sm">
            {error}
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center my-12 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="text-lg text-indigo-700 font-medium">Finding your build/automation solution...</p>
          </div>
        )}

        {result && (
          <div className="space-y-8">
            {/* n8n Workflow Section */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-indigo-100">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-indigo-900">n8n Workflow: {result.n8n_workflow.name}</h2>
                <button
                  onClick={downloadWorkflowJson}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Download Workflow
                </button>
              </div>
              
              <div className="mb-4">
                <h3 className="text-xl font-medium mb-2 text-indigo-800">Explanation</h3>
                <p className="text-gray-700">{result.n8n_workflow.explanation}</p>
              </div>
              
              <div>
                <h3 className="text-xl font-medium mb-2 text-indigo-800">Workflow JSON</h3>
                <div className="bg-indigo-50 p-4 rounded-md overflow-auto max-h-60 border border-indigo-100">
                  <pre className="text-sm text-gray-800">
                    {JSON.stringify(result.n8n_workflow.json, null, 2)}
                  </pre>
                </div>
              </div>
            </div>

            {/* YouTube Video Section */}
            {result.youtube_video && (
              <div className="bg-white p-6 rounded-lg shadow-md border border-indigo-100">
                <h2 className="text-2xl font-semibold mb-4 text-indigo-900">Related Tutorial</h2>
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="md:w-1/3">
                    <img 
                      src={result.youtube_video.thumbnail} 
                      alt={result.youtube_video.title}
                      className="w-full rounded-lg shadow-md hover:shadow-lg transition-shadow"
                    />
                  </div>
                  <div className="md:w-2/3">
                    <h3 className="text-xl font-medium mb-2 text-indigo-800">{result.youtube_video.title}</h3>
                    <p className="text-gray-700 mb-4">{result.youtube_video.description}</p>
                    <a 
                      href={result.youtube_video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                      Watch Tutorial
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Research Results Section */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-indigo-100">
              <h2 className="text-2xl font-semibold mb-4 text-indigo-900">Research Results</h2>
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-gray-700">{result.research.content}</div>
              </div>
              
              {result.research.sources.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-xl font-semibold mb-3 text-indigo-800">Sources</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    {result.research.sources.map((source, index) => (
                      <li key={index} className="text-gray-600">
                        {source}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Premium Service Section */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-6 rounded-lg shadow-md text-white">
              <h2 className="text-2xl font-semibold mb-4">Custom Automation Solution</h2>
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
        
        {/* Featured Section - Always visible */}
        <div className="mt-16 pt-8 border-t border-indigo-200">
          <h2 className="text-3xl font-bold text-center text-indigo-900 mb-8">Featured Package</h2>
          
          <div className="bg-gradient-to-r from-emerald-600 to-indigo-700 rounded-xl shadow-xl overflow-hidden">
            <div className="p-1 bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500">
              <div className="bg-white p-6 rounded-t-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-2xl font-bold text-indigo-900">GFE Special</h3>
                  <div className="bg-red-600 text-white px-4 py-1 rounded-full font-bold text-sm">$1,000</div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-red-600 text-2xl">🔥</span>
                    <p className="font-semibold text-gray-800">100 Days of Fully Automated Cold Outreach (Mon-Fri)</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
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
                
                <div className="mt-6 space-y-3">
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
            
            <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-700 flex justify-center">
              <button 
                onClick={() => openCalendly('https://calendly.com/janga-bussaja/gfe-special')}
                className="px-8 py-4 bg-white text-indigo-700 font-bold rounded-lg hover:bg-indigo-50 transition-colors inline-flex items-center gap-2 shadow-md text-lg"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Automate My Lead Generation Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 