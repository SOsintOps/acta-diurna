
import React from 'react';

/**
 * Sequenza di avvio, in direzione Samaritan: testo centrato tutto maiuscolo
 * con spaziatura marcata, trattino corto sotto, niente altro. Le lettere
 * entrano una per volta, come la rivelazione dell'avvio nella serie.
 */
const LoadingScreen: React.FC = () => {
  const text = "ANALISI DELLA RETE IN CORSO";
  return (
    <div className="w-full h-screen flex flex-col items-center justify-center">
      <div
        className="font-mono text-base sm:text-2xl flex"
        style={{ letterSpacing: '8px', color: 'var(--sam-fg)' }}
        aria-label={text}
      >
        {text.split('').map((char, index) => (
          <span
            key={index}
            className="animate-fadeInUp"
            style={{ animationDelay: `${index * 0.05}s` }}
            aria-hidden="true"
          >
            {char === ' ' ? ' ' : char}
          </span>
        ))}
      </div>
      <div className="sam-rule mt-6 sam-blink" />
    </div>
  );
};

export default LoadingScreen;
