

import React from 'react';
import PulsingTriangle from './icons/PulsingTriangle';

const RevisionProgressModal: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-black/70 z-[2000] flex flex-col items-center justify-center backdrop-blur-sm">
      <PulsingTriangle className="w-12 h-12 text-red-500 mb-4" />
      <p className="font-mono text-xl text-white tracking-widest">
        APPRENDIMENTO IN CORSO...
      </p>
      <p className="font-mono text-sm text-gray-400 mt-2">
        Il sistema sta affinando i criteri di ricerca.
      </p>
    </div>
  );
};

export default RevisionProgressModal;