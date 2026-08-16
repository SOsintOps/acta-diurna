
import React from 'react';
import PulsingTriangle from './icons/PulsingTriangle';
import type { UserFeedback } from '../types';

interface ArchiveOptionsModalProps {
    onArchive: (reason: UserFeedback) => void;
    onCancel: () => void;
}

const ArchiveOptionsModal: React.FC<ArchiveOptionsModalProps> = ({ onArchive, onCancel }) => {
    
    const modalBg = 'sam-panel';
    const textColor = 'sam-fg';
    const mutedTextColor = 'sam-muted';
    const buttonClass = 'sam-action sam-action-ghost';
    const optionButtonClass = `w-full text-left p-4 border  transition-colors`;
    const optionButtonTheme = 'sam-edge sam-row';


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
                    className={`mt-6 w-full p-2 font-mono tracking-widest text-sm transition-colors ${buttonClass}`}
                >
                    ANNULLA
                </button>
            </div>
        </div>
    );
};

export default ArchiveOptionsModal;
