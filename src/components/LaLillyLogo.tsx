import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function LaLillyLogo({ className = '', size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: 'w-24 h-8',
    md: 'w-32 h-10',
    lg: 'w-40 h-12'
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <svg
        viewBox="0 0 160 50"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        role="img"
        aria-label="La-Lilly logo"
      >
        {/* Decorative lotus/flower element */}
        <g transform="translate(8, 8)">
          {/* Outer petals */}
          <path
            d="M17 16c-3-6-9-6-12 0 3-6 9-6 12 0z"
            fill="url(#gradient1)"
            className="opacity-80"
          />
          <path
            d="M17 16c3-6 9-6 12 0-3-6-9-6-12 0z"
            fill="url(#gradient1)"
            className="opacity-80"
            transform="rotate(60 17 16)"
          />
          <path
            d="M17 16c3-6 9-6 12 0-3-6-9-6-12 0z"
            fill="url(#gradient1)"
            className="opacity-80"
            transform="rotate(120 17 16)"
          />
          <path
            d="M17 16c3-6 9-6 12 0-3-6-9-6-12 0z"
            fill="url(#gradient1)"
            className="opacity-80"
            transform="rotate(180 17 16)"
          />
          <path
            d="M17 16c3-6 9-6 12 0-3-6-9-6-12 0z"
            fill="url(#gradient1)"
            className="opacity-80"
            transform="rotate(240 17 16)"
          />
          <path
            d="M17 16c3-6 9-6 12 0-3-6-9-6-12 0z"
            fill="url(#gradient1)"
            className="opacity-80"
            transform="rotate(300 17 16)"
          />
          
          {/* Center circle */}
          <circle cx="17" cy="16" r="4" fill="url(#gradient2)" />
          
          {/* Inner highlight */}
          <circle cx="17" cy="16" r="2" fill="#ffffff" className="opacity-40" />
        </g>

        {/* La-Lilly Text */}
        <text
          x="50"
          y="35"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="20"
          fontWeight="700"
          fill="url(#textGradient)"
          letterSpacing="-0.02em"
        >
          La-Lilly
        </text>
        
        {/* Decorative underline */}
        <line
          x1="50"
          y1="40"
          x2="140"
          y2="40"
          stroke="url(#gradient1)"
          strokeWidth="2"
          strokeLinecap="round"
          className="opacity-60"
        />

        {/* Gradients */}
        <defs>
          <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#db2777" />
            <stop offset="100%" stopColor="#9d174d" />
          </linearGradient>
          
          <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f472b6" />
            <stop offset="50%" stopColor="#db2777" />
            <stop offset="100%" stopColor="#9d174d" />
          </linearGradient>
          
          <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1f2937" />
            <stop offset="50%" stopColor="#374151" />
            <stop offset="100%" stopColor="#1f2937" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}