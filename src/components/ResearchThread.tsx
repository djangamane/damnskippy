import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import DOMPurify from 'dompurify';

interface ResearchThread {
  id: string;
  query: string;
  result: string;
  timestamp: string;
}

export default function ResearchThread() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [thread, setThread] = useState<ResearchThread | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchThread = async () => {
      try {
        const response = await axios.get(`/api/research/thread/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setThread(response.data);
      } catch (err) {
        setError('Failed to load research thread');
        console.error('Error fetching thread:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchThread();
  }, [id, token]);

  const renderContent = (content: string) => {
    return { __html: DOMPurify.sanitize(content) };
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-600 text-center">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Dashboard Button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="absolute top-4 left-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Dashboard
        </button>

        <div className="max-w-4xl mx-auto mt-16">
          <h1 className="text-2xl font-bold mb-4">Research Results</h1>
          {thread && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Query: {thread.query}</h2>
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={renderContent(thread.result)}
              />
              <div className="mt-4 text-sm text-gray-500">
                {new Date(thread.timestamp).toLocaleString()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 