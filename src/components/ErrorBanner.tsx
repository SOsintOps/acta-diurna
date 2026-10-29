

import React, { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';

interface ErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, onDismiss }) => {
  const { theme } = useContext(ThemeContext);

  const bgColor = theme === 'dark' ? 'bg-red-900/80 border-red-700' : 'bg-red-100 border-red-300';
  const textColor = theme === 'dark' ? 'text-red-200' : 'text-red-800';
  const buttonColor = theme === 'dark' ? 'text-red-200 hover:text-white' : 'text-red-600 hover:text-red-900';

  return (
    <div
      className={`w-full p-3 mb-2 border ${bgColor} ${textColor} flex items-center justify-between rounded-md shadow-lg transition-all duration-300`}
      role="alert"
    >
      <div className="flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <span className="font-mono text-sm">{message}</span>
      </div>
      <button
        onClick={onDismiss}
        aria-label="Dismiss error message"
        className={`p-1 rounded-full transition-colors ${buttonColor}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export default ErrorBanner;