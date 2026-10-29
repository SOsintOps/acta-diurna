

import React from 'react';
import PulsingTriangle from './icons/PulsingTriangle';

const ImportProgressModal: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-black/70 z-[2000] flex flex-col items-center justify-center backdrop-blur-sm">
      <PulsingTriangle className="w-12 h-12 text-red-500 mb-4" />
      <p className="font-mono text-xl text-white tracking-widest">
        Importazione in corso...
      </p>
    </div>
  );
};

export default ImportProgressModal;