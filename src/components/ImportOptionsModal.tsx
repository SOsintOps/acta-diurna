
import React from 'react';
import PulsingTriangle from './icons/PulsingTriangle';

interface ImportOptionsModalProps {
    onOverwrite: () => void;
    onIntegrate: () => void;
    onCancel: () => void;
}

const ImportOptionsModal: React.FC<ImportOptionsModalProps> = ({ onOverwrite, onIntegrate, onCancel }) => {
    
    const modalBg = 'sam-panel';
    const textColor = 'sam-fg';
    const mutedTextColor = 'sam-muted';
    const buttonClass = 'sam-action sam-action-ghost';

    return (
        <div 
            className="sam-scrim fixed inset-0 z-[2000] flex items-center justify-center"
            onClick={onCancel}
        >
            <div
                className={`w-full max-w-lg m-4 p-6 border ${modalBg} ${textColor} flex flex-col font-mono`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center mb-4">
                    <PulsingTriangle className="w-5 h-5 sam-threat mr-3" staticPulse />
                    <h2 className="text-xl tracking-wider">OPZIONI DI IMPORTAZIONE</h2>
                </div>
                
                <p className={`text-sm mb-6 ${mutedTextColor}`}>
                    Hai selezionato un file di backup. Come vuoi procedere?
                </p>

                <div className="space-y-4">
                    <button
                        onClick={onIntegrate}
                        className={`w-full text-left p-4 border transition-colors sam-edge sam-edge-second sam-row`}
                    >
                        <h3 className={`text-base font-bold sam-second`}>Integra con Database Attuale</h3>
                        <p className={`text-xs mt-1 ${mutedTextColor}`}>
                            Unisci i dati importati con quelli esistenti. Aggiunge nuovi casi e fonde la cronologia di apprendimento dell'IA. Ideale per la collaborazione.
                        </p>
                    </button>
                    
                     <button
                        onClick={onOverwrite}
                        className={`w-full text-left p-4 border transition-colors sam-edge sam-edge-threat sam-row`}
                    >
                        <h3 className={`text-base font-bold sam-threat`}>Sovrascrivi Database Attuale</h3>
                        <p className={`text-xs mt-1 ${mutedTextColor}`}>
                           Cancella tutti i dati correnti e li sostituisce con il contenuto del backup. Utile per ripristinare o clonare un ambiente.
                        </p>
                    </button>
                </div>

                <button 
                    onClick={onCancel}
                    className={`mt-6 w-full p-2 font-mono tracking-widest text-sm transition-colors ${buttonClass}`}
                >
                    ANNULLA
                </button>
            </div>
        </div>
    );
};

export default ImportOptionsModal;
