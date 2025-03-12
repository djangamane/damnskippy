import React from 'react';

interface AiGraphicProps {
  size?: number;
}

export default function AiGraphic({ size = 400 }: AiGraphicProps) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Base circle with gradient */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/30 to-purple-500/30 animate-pulse"></div>
      
      {/* Circuit patterns */}
      <svg
        className="absolute inset-0"
        width={size}
        height={size}
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Circuit lines */}
        <g stroke="#0891b2" strokeWidth="0.5" fill="none">
          <path d="M100,20 L100,50 M60,100 L20,100 M140,100 L180,100 M100,150 L100,180" />
          <path d="M70,70 L40,40 M130,70 L160,40 M130,130 L160,160 M70,130 L40,160" />
          <circle cx="100" cy="100" r="60" />
          <circle cx="100" cy="100" r="40" />
          <circle cx="100" cy="100" r="20" />
        </g>
        
        {/* Nodes */}
        <g fill="#0891b2">
          <circle cx="100" cy="20" r="3" />
          <circle cx="20" cy="100" r="3" />
          <circle cx="180" cy="100" r="3" />
          <circle cx="100" cy="180" r="3" />
          <circle cx="40" cy="40" r="3" />
          <circle cx="160" cy="40" r="3" />
          <circle cx="160" cy="160" r="3" />
          <circle cx="40" cy="160" r="3" />
        </g>
        
        {/* Central AI symbol */}
        <g transform="translate(70, 70)">
          <rect x="0" y="0" width="60" height="60" rx="10" fill="#0891b2" opacity="0.2" />
          <text x="30" y="40" fontSize="30" textAnchor="middle" fill="#0891b2" fontWeight="bold">AI</text>
        </g>
      </svg>
      
      {/* Glowing effect */}
      <div className="absolute -inset-4 bg-cyan-500/10 rounded-full blur-xl"></div>
      
      {/* Animated pulse rings */}
      <div className="absolute inset-0 rounded-full border-2 border-cyan-500/30 animate-ping opacity-20"></div>
      <div className="absolute inset-8 rounded-full border-2 border-purple-500/30 animate-ping opacity-20" style={{ animationDelay: '0.5s' }}></div>
    </div>
  );
} 