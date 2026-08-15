
import React from 'react';

interface PulsingTriangleProps {
  className?: string;
  staticPulse?: boolean; // If true, applies a static glow instead of animation
}

const PulsingTriangle: React.FC<PulsingTriangleProps> = ({ className, staticPulse = false }) => {
  const animationClass = staticPulse ? 'opacity-75' : 'animate-pulse';
  
  return (
    <svg 
      viewBox="0 0 24 24" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
      style={{ filter: 'drop-shadow(0 0 3px currentColor)' }}
    >
      <g className={animationClass}>
        <path d="M12 2L1.5 21h21L12 2z" fill="currentColor" />
      </g>
    </svg>
  );
};

export default PulsingTriangle;