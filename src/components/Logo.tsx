import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

const Logo: React.FC<LogoProps> = ({ className = "", size = 32 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background circle with gradient */}
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
      
      {/* Main circle background */}
      <circle cx="16" cy="16" r="16" fill="url(#logoGradient)" />
      
      {/* Letter P design */}
      <path
        d="M10 8 L10 24 M10 8 L18 8 Q22 8 22 12 Q22 16 18 16 L10 16"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Small accent dot */}
      <circle cx="20" cy="20" r="1.5" fill="white" opacity="0.8" />
    </svg>
  );
};

export default Logo;