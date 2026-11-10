import React from 'react';

interface AudioVisualizerProps {
  active: boolean;
  bars?: number;
  label?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  active,
  bars = 9,
  label = 'Harvey is processing...',
}) => {
  return (
    <div className="flex items-center gap-3 py-1.5 px-3 bg-cyan-950/40 border border-cyan-500/20 rounded-xl backdrop-blur-md">
      <div className="flex items-center gap-1 h-5">
        {Array.from({ length: bars }).map((_, idx) => {
          // Dynamic varying height animation for sound wave
          const heights = ['h-2', 'h-4', 'h-3', 'h-5', 'h-4', 'h-5', 'h-3', 'h-4', 'h-2'];
          const delays = [
            'animation-delay-0',
            'animation-delay-150',
            'animation-delay-300',
            'animation-delay-75',
            'animation-delay-200',
            'animation-delay-100',
            'animation-delay-250',
            'animation-delay-50',
            'animation-delay-175',
          ];

          return (
            <span
              key={idx}
              className={`w-0.5 rounded-full transition-all duration-300 ${
                active
                  ? `bg-cyan-400 ${heights[idx % heights.length]} animate-pulse ${delays[idx % delays.length]}`
                  : 'bg-cyan-800/60 h-1.5'
              }`}
            />
          );
        })}
      </div>
      {label && (
        <span className="text-xs font-medium tracking-wide text-cyan-300/90 font-mono">
          {label}
        </span>
      )}
    </div>
  );
};
