
import React, { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';
import PulsingTriangle from './icons/PulsingTriangle';

interface ImportOptionsModalProps {
    onOverwrite: () => void;
    onIntegrate: () => void;
    onCancel: () => void;
}

const ImportOptionsModal: React.FC<ImportOptionsModalProps> = ({ onOverwrite, onIntegrate, onCancel }) => {
    const { theme } = useContext(ThemeContext);

    const modalBg = theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-zinc-300';
    const textColor = theme === 'dark' ? 'text-white' : 'text-black';
    const mutedTextColor = theme === 'dark' ? 'text-gray-400' : 'text-zinc-500';
    const buttonClass = theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-zinc-200 hover:bg-zinc-300';

    return (
        <div 
            className="fixed inset-0 bg-black/60 z-[2000] flex items-center justify-center backdrop-blur-sm"
            onClick={onCancel}
        >
            <div
                className={`w-full max-w-lg m-4 p-6 rounded-lg border shadow-lg ${modalBg} ${textColor} flex flex-col font-mono`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center mb-4">
                    <PulsingTriangle className="w-5 h-5 text-red-500 mr-3" staticPulse />
                    <h2 className="text-xl tracking-wider">OPZIONI DI IMPORTAZIONE</h2>
                </div>
                
                <p className={`text-sm mb-6 ${mutedTextColor}`}>
                    Hai selezionato un file di backup. Come vuoi procedere?
                </p>

                <div className="space-y-4">
                    <button
                        onClick={onIntegrate}
                        className={`w-full text-left p-4 border rounded-md transition-colors ${theme === 'dark' ? 'border-blue-600/50 hover:bg-blue-900/40' : 'border-blue-300 hover:bg-blue-50'}`}
                    >
                        <h3 className={`text-base font-bold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>Integra con Database Attuale</h3>
                        <p className={`text-xs mt-1 ${mutedTextColor}`}>
                            Unisci i dati importati con quelli esistenti. Aggiunge nuovi casi e fonde la cronologia di apprendimento dell'IA. Ideale per la collaborazione.
                        </p>
                    </button>
                    
                     <button
                        onClick={onOverwrite}
                        className={`w-full text-left p-4 border rounded-md transition-colors ${theme === 'dark' ? 'border-red-600/50 hover:bg-red-900/40' : 'border-red-200 hover:bg-red-50'}`}
                    >
                        <h3 className={`text-base font-bold ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>Sovrascrivi Database Attuale</h3>
                        <p className={`text-xs mt-1 ${mutedTextColor}`}>
                           Cancella tutti i dati correnti e li sostituisce con il contenuto del backup. Utile per ripristinare o clonare un ambiente.
                        </p>
                    </button>
                </div>

                <button 
                    onClick={onCancel}
                    className={`mt-6 w-full p-2 rounded-md font-mono tracking-widest text-sm transition-colors ${buttonClass}`}
                >
                    ANNULLA
                </button>
            </div>
        </div>
    );
};

export default ImportOptionsModal;
