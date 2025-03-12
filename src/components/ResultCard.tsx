import React from 'react';
import { ExternalLink, PenTool as Tool, BookOpen, Crown } from 'lucide-react';
import { SearchResult } from '../types';

interface ResultCardProps {
  result: SearchResult;
}

export function ResultCard({ result }: ResultCardProps) {
  const getIcon = () => {
    switch (result.type) {
      case 'free':
        return <Tool className="w-6 h-6 text-green-500" />;
      case 'diy':
        return <BookOpen className="w-6 h-6 text-blue-500" />;
      case 'premium':
        return <Crown className="w-6 h-6 text-purple-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-gray-50 rounded-lg">
          {getIcon()}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2">{result.title}</h3>
          <p className="text-gray-600 mb-4">{result.description}</p>
          {result.url && (
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-blue-500 hover:text-blue-600"
            >
              Learn more <ExternalLink className="w-4 h-4 ml-1" />
            </a>
          )}
          {result.type === 'premium' && result.price && (
            <div className="mt-4">
              <button className="bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600 transition-colors">
                Get Started - ${result.price}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}