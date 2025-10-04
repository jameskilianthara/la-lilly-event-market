import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'light' | 'dark' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
}

export default function LaLillyLogoNew({ 
  className = '', 
  variant = 'gradient',
  size = 'md' 
}: LogoProps) {
  const sizeClasses = {
    sm: 'w-32 h-12',
    md: 'w-48 h-18',
    lg: 'w-64 h-24'
  };

  const getColors = () => {
    switch (variant) {
      case 'light':
        return {
          lily: '#1f2937',
          mainText: '#1f2937',
          subText: '#6b7280'
        };
      case 'dark':
        return {
          lily: '#ffffff',
          mainText: '#ffffff', 
          subText: '#d1d5db'
        };
      case 'gradient':
      default:
        return {
          lily: 'url(#lilyGradient)',
          mainText: 'url(#textGradient)',
          subText: '#6b7280'
        };
    }
  };

  const colors = getColors();

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <svg
        viewBox="0 0 240 72"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        role="img"
        aria-label="LaLilly - the event marketplace"
      >
        {/* Stylized Lily Flower - Centered */}
        <g transform="translate(16, 16)">
          {/* Main lily petals - simplified, elegant curves */}
          <path
            d="M20 20 C10 10, 10 5, 20 10 C30 5, 30 10, 20 20 Z"
            fill={colors.lily}
            opacity="0.9"
          />
          <path
            d="M20 20 C15 8, 10 8, 16 16 C10 8, 15 8, 20 20 Z"
            fill={colors.lily}
            opacity="0.7"
            transform="rotate(45 20 20)"
          />
          <path
            d="M20 20 C25 8, 30 8, 24 16 C30 8, 25 8, 20 20 Z"
            fill={colors.lily}
            opacity="0.7"
            transform="rotate(-45 20 20)"
          />
          
          {/* Center dot */}
          <circle cx="20" cy="20" r="2" fill={colors.lily} opacity="0.8" />
          
          {/* Subtle stem */}
          <line
            x1="20"
            y1="20"
            x2="20"
            y2="35"
            stroke={colors.lily}
            strokeWidth="1.5"
            opacity="0.4"
            strokeLinecap="round"
          />
        </g>

        {/* LaLilly Text - Centered */}
        <text
          x="120"
          y="35"
          fontFamily="Georgia, Times, serif"
          fontSize="24"
          fontWeight="400"
          fill={colors.mainText}
          letterSpacing="0.02em"
          textAnchor="middle"
        >
          LaLilly
        </text>
        
        {/* Subtitle - Centered and Balanced */}
        <text
          x="120"
          y="52"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="11"
          fontWeight="300"
          fill={colors.subText}
          letterSpacing="0.15em"
          textAnchor="middle"
          style={{ textTransform: 'uppercase' }}
        >
          the event marketplace
        </text>
        
        {/* Decorative underline for symmetry */}
        <line
          x1="80"
          y1="58"
          x2="160"
          y2="58"
          stroke={colors.subText}
          strokeWidth="0.5"
          strokeLinecap="round"
          opacity="0.3"
        />

        {/* Gradients */}
        <defs>
          <linearGradient id="lilyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="50%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
          
          <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1f2937" />
            <stop offset="50%" stopColor="#4b5563" />
            <stop offset="100%" stopColor="#1f2937" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}