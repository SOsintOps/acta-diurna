
import React, { useState, useEffect } from 'react';

interface AnimatedTextProps {
  text: string;
  speed?: number;
  mode?: 'char' | 'word';
  onComplete?: () => void;
}

const AnimatedText: React.FC<AnimatedTextProps> = ({ text, speed = 50, mode = 'char', onComplete }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    setDisplayedText(''); // Reset on text change

    if (mode === 'char') {
      let i = 0;
      const interval = setInterval(() => {
        if (i < text.length) {
          setDisplayedText(prev => prev + text.charAt(i));
          i++;
        } else {
          clearInterval(interval);
          if (onComplete) onComplete();
        }
      }, speed);
      return () => clearInterval(interval);
    } else { // word mode
      const words = text.split(' ');
      let i = 0;
      const interval = setInterval(() => {
        if (i < words.length) {
          // Use slice and join for a more robust way to build the string
          setDisplayedText(words.slice(0, i + 1).join(' '));
          i++;
        } else {
          clearInterval(interval);
          if (onComplete) onComplete();
        }
      }, speed * 2); // Words should appear slower
      return () => clearInterval(interval);
    }
  }, [text, speed, mode, onComplete]);

  return <span className="whitespace-pre-wrap">{displayedText}</span>;
};

export default AnimatedText;