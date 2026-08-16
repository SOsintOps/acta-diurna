

import React from 'react';
import PulsingTriangle from './icons/PulsingTriangle';

const RevisionProgressModal: React.FC = () => {
  return (
    <div className="sam-scrim fixed inset-0 z-[2000] flex flex-col items-center justify-center">
      <PulsingTriangle className="w-12 h-12 sam-threat mb-4" />
      <p className="font-mono text-xl text-white tracking-widest">
        APPRENDIMENTO IN CORSO...
      </p>
      <p className="font-mono text-sm sam-muted mt-2">
        Il sistema sta affinando i criteri di ricerca.
      </p>
    </div>
  );
};

export default RevisionProgressModal;