

import React from 'react';
import PulsingTriangle from './icons/PulsingTriangle';

const ImportProgressModal: React.FC = () => {
  return (
    <div className="sam-scrim fixed inset-0 z-[2000] flex flex-col items-center justify-center">
      <PulsingTriangle className="w-12 h-12 sam-threat mb-4" />
      <p className="font-mono text-xl text-white tracking-widest">
        Importazione in corso...
      </p>
    </div>
  );
};

export default ImportProgressModal;