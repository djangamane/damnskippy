import React from 'react';

interface LogoProps {
  size?: number;
}

const Logo: React.FC<LogoProps> = ({ size = 48 }) => {
  // Primary colors for the logo
  const primaryColor = "#4F46E5"; // Indigo
  const secondaryColor = "#7C3AED"; // Purple
  const accentColor = "#10B981"; // Emerald

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Gear icon representing automation */}
      <circle cx="24" cy="24" r="20" fill={primaryColor} />
      <circle cx="24" cy="24" r="16" fill="white" opacity="0.2" />
      <circle cx="24" cy="24" r="10" fill={secondaryColor} />
      
      {/* Gear teeth */}
      {[...Array(8)].map((_, i) => (
        <rect
          key={i}
          x="22"
          y="2"
          width="4"
          height="8"
          fill={accentColor}
          transform={`rotate(${i * 45} 24 24)`}
          rx="1"
        />
      ))}
      
      {/* Center dot */}
      <circle cx="24" cy="24" r="4" fill="white" />
      
      {/* Lightning bolt for AI/power */}
      <path
        d="M24 14L20 24H24L22 34L30 22H25L28 14H24Z"
        fill={accentColor}
      />
    </svg>
  );
};

export default Logo; 