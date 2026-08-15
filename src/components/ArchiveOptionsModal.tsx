
import React, { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';
import PulsingTriangle from './icons/PulsingTriangle';
import type { UserFeedback } from '../types';

interface ArchiveOptionsModalProps {
    onArchive: (reason: UserFeedback) => void;
    onCancel: () => void;
}

const ArchiveOptionsModal: React.FC<ArchiveOptionsModalProps> = ({ onArchive, onCancel }) => {
    const { theme } = useContext(ThemeContext);

    const modalBg = theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-zinc-300';
    const textColor = theme === 'dark' ? 'text-white' : 'text-black';
    const mutedTextColor = theme === 'dark' ? 'text-gray-400' : 'text-zinc-500';
    const buttonClass = theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-zinc-200 hover:bg-zinc-300';
    const optionButtonClass = `w-full text-left p-4 border rounded-md transition-colors`;
    const optionButtonTheme = theme === 'dark' ? 'border-gray-700 hover:bg-gray-800' : 'border-zinc-300 hover:bg-zinc-100';


    return (
        <div 
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm"
            onClick={onCancel}
        >
            <div
                className={`w-full max-w-lg m-4 p-6 rounded-lg border shadow-lg ${modalBg} ${textColor} flex flex-col font-mono`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center mb-4">
                    <PulsingTriangle className="w-5 h-5 text-red-500 mr-3" staticPulse />
                    <h2 className="text-xl tracking-wider">ARCHIVIA CASO</h2>
                </div>
                
                <p className={`text-sm mb-6 ${mutedTextColor}`}>
                    Perché questo caso è irrilevante? Fornire un motivo aiuta l'IA a migliorare le future ricerche.
                </p>

                <div className="space-y-3">
                    <button
                        onClick={() => onArchive('irrelevant_duplicate')}
                        className={`${optionButtonClass} ${optionButtonTheme}`}
                    >
                        <h3 className={`text-base font-bold`}>Notizia Duplicata</h3>
                        <p className={`text-xs mt-1 ${mutedTextColor}`}>
                            Il caso è già presente nel sistema o è una variante della stessa notizia.
                        </p>
                    </button>
                    
                     <button
                        onClick={() => onArchive('irrelevant_too_old')}
                        className={`${optionButtonClass} ${optionButtonTheme}`}
                    >
                        <h3 className={`text-base font-bold`}>Notizia Troppo Vecchia</h3>
                        <p className={`text-xs mt-1 ${mutedTextColor}`}>
                           La notizia non è recente e non rientra nel periodo di analisi corrente.
                        </p>
                    </button>

                    <button
                        onClick={() => onArchive('irrelevant_not_crime')}
                        className={`${optionButtonClass} ${optionButtonTheme}`}
                    >
                        <h3 className={`text-base font-bold`}>Non è un Crimine Rilevante</h3>
                        <p className={`text-xs mt-1 ${mutedTextColor}`}>
                           La tipologia di reato o l'impatto della notizia non sono di interesse.
                        </p>
                    </button>
                    <button
                        onClick={() => onArchive('irrelevant')}
                        className={`${optionButtonClass} ${optionButtonTheme}`}
                    >
                        <h3 className={`text-base font-bold`}>Altro / Generico</h3>
                        <p className={`text-xs mt-1 ${mutedTextColor}`}>
                           Archivia senza specificare un motivo dettagliato.
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

export default ArchiveOptionsModal;
