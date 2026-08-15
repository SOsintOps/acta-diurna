
import React from 'react';
import PulsingTriangle from './icons/PulsingTriangle';

const LoadingScreen: React.FC = () => {
  const text = "NETWORK ANALYSIS ... IN PROGRESS";
  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-transparent">
      <PulsingTriangle className="w-16 h-16 text-red-600 mb-8" />
      <div className="font-mono text-xl sm:text-3xl tracking-widest flex" aria-label={text}>
        {text.split('').map((char, index) => (
          <span
            key={index}
            className="animate-fadeInUp"
            style={{ animationDelay: `${index * 0.05}s` }}
            aria-hidden="true"
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        ))}
      </div>
    </div>
  );
};

export default LoadingScreen;
