import React from 'react';

interface HarveyLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isThinking?: boolean;
  className?: string;
}

export const HarveyLogo: React.FC<HarveyLogoProps> = ({
  size = 'md',
  isThinking = false,
  className = '',
}) => {
  const sizeMap = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${sizeMap[size]} ${className}`}>
      {/* Outer ambient glow */}
      <div
        className={`absolute inset-0 rounded-full bg-cyan-500/20 blur-md transition-all duration-700 ${
          isThinking ? 'scale-125 bg-cyan-400/40 animate-pulse' : 'scale-100'
        }`}
      />

      {/* SVG Arc Reactor / Hologram Logo */}
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full relative z-10 drop-shadow-[0_0_12px_rgba(6,182,212,0.4)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#0ea5e9" />
          </linearGradient>
          <linearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#67e8f9" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
        </defs>

        {/* Outer Orbit Ring */}
        <circle
          cx="50"
          cy="50"
          r="46"
          stroke="url(#cyanGrad)"
          strokeWidth="1.5"
          strokeDasharray="4 6"
          className={isThinking ? 'animate-orbit-slow origin-center' : 'opacity-70'}
        />

        {/* Segmented Arc Brackets */}
        <path
          d="M 22 22 A 40 40 0 0 1 78 22"
          stroke="#38bdf8"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="opacity-80"
        />
        <path
          d="M 78 78 A 40 40 0 0 1 22 78"
          stroke="#06b6d4"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="opacity-80"
        />

        {/* Inner Tech Ring */}
        <circle
          cx="50"
          cy="50"
          r="30"
          stroke="#0ea5e9"
          strokeWidth="1.5"
          strokeDasharray="8 8"
          className={isThinking ? 'animate-spin origin-center duration-3000' : 'opacity-60'}
        />

        {/* Center Optical Core */}
        <circle
          cx="50"
          cy="50"
          r="16"
          fill="#0c4a6e"
          fillOpacity="0.8"
          stroke="url(#glowGrad)"
          strokeWidth="2"
        />

        {/* Stylized Modern 'H' Insignia */}
        <path
          d="M 43 40 L 43 60 M 57 40 L 57 60 M 43 50 L 57 50"
          stroke="#e0f2fe"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Optical Center Core Node */}
        <circle
          cx="50"
          cy="50"
          r="2.5"
          fill="#67e8f9"
          className={isThinking ? 'animate-ping origin-center' : 'animate-pulse'}
        />
      </svg>
    </div>
  );
};
