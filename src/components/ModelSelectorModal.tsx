
import React from 'react';
import { useCaseStore } from '../store/caseStore';
import PulsingTriangle from './icons/PulsingTriangle';

const availableModels = [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Veloce ed efficiente, ideale per la maggior parte delle attività.' },
    // Aggiungere qui altri modelli testati e pertinenti se necessario
];

const ModelSelectorModal: React.FC = () => {
    const { isModelSelectorOpen, setIsModelSelectorOpen, aiModel, setAiModel } = useCaseStore();
    
    if (!isModelSelectorOpen) {
        return null;
    }

    const handleSelectModel = (modelId: string) => {
        setAiModel(modelId);
        setIsModelSelectorOpen(false);
    };
    
    const modalBg = 'sam-panel';
    const textColor = 'sam-fg';
    const mutedTextColor = 'sam-muted';
    const itemHoverBg = 'sam-row';
    const selectedItemRing = 'sam-glow-threat';
    const closeButtonBg = 'sam-action sam-action-ghost';

    return (
        <div 
            className="sam-scrim fixed inset-0 z-[2000] flex items-center justify-center"
            onClick={() => setIsModelSelectorOpen(false)}
        >
            <div
                className={`w-full max-w-md m-4 p-4 border ${modalBg} ${textColor} flex flex-col font-mono`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center mb-4">
                    <PulsingTriangle className="w-5 h-5 sam-threat mr-3" staticPulse />
                    <h2 className="text-xl tracking-wider">SELEZIONA MODELLO AI</h2>
                </div>
                
                <p className={`text-sm mb-4 ${mutedTextColor}`}>
                    Se riscontri problemi di quota, prova a selezionare un modello alternativo. La tua scelta verrà salvata.
                </p>

                <div className="space-y-3">
                    {availableModels.map(model => (
                        <div
                            key={model.id}
                            onClick={() => handleSelectModel(model.id)}
                            className={`p-3 border  cursor-pointer transition-all duration-200 ${itemHoverBg} ${
                                aiModel === model.id ? `ring-2 ${selectedItemRing}` : ('sam-edge')
                            }`}
                        >
                            <p className="font-bold text-base">{model.name}</p>
                            <p className={`text-xs mt-1 ${mutedTextColor}`}>{model.description}</p>
                        </div>
                    ))}
                </div>

                <button 
                    onClick={() => setIsModelSelectorOpen(false)}
                    className={`mt-6 w-full p-2 font-mono tracking-widest text-sm transition-colors ${closeButtonBg}`}
                >
                    CHIUDI
                </button>
            </div>
        </div>
    );
};

export default ModelSelectorModal;
