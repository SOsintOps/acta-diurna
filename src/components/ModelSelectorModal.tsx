
import React, { useContext } from 'react';
import { useCaseStore } from '../store/caseStore';
import { ThemeContext } from '../contexts/ThemeContext';
import PulsingTriangle from './icons/PulsingTriangle';

const availableModels = [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Veloce ed efficiente, ideale per la maggior parte delle attività.' },
    // Aggiungere qui altri modelli testati e pertinenti se necessario
];

const ModelSelectorModal: React.FC = () => {
    const { isModelSelectorOpen, setIsModelSelectorOpen, aiModel, setAiModel } = useCaseStore();
    const { theme } = useContext(ThemeContext);

    if (!isModelSelectorOpen) {
        return null;
    }

    const handleSelectModel = (modelId: string) => {
        setAiModel(modelId);
        setIsModelSelectorOpen(false);
    };
    
    const modalBg = theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-zinc-300';
    const textColor = theme === 'dark' ? 'text-white' : 'text-black';
    const mutedTextColor = theme === 'dark' ? 'text-gray-400' : 'text-zinc-500';
    const itemHoverBg = theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-zinc-100';
    const selectedItemRing = theme === 'dark' ? 'ring-red-500' : 'ring-red-600';
    const closeButtonBg = theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-zinc-200 hover:bg-zinc-300';

    return (
        <div 
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm"
            onClick={() => setIsModelSelectorOpen(false)}
        >
            <div
                className={`w-full max-w-md m-4 p-4 rounded-lg border shadow-lg ${modalBg} ${textColor} flex flex-col font-mono`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center mb-4">
                    <PulsingTriangle className="w-5 h-5 text-red-500 mr-3" staticPulse />
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
                            className={`p-3 border rounded-md cursor-pointer transition-all duration-200 ${itemHoverBg} ${
                                aiModel === model.id ? `ring-2 ${selectedItemRing}` : (theme === 'dark' ? 'border-gray-700' : 'border-zinc-200')
                            }`}
                        >
                            <p className="font-bold text-base">{model.name}</p>
                            <p className={`text-xs mt-1 ${mutedTextColor}`}>{model.description}</p>
                        </div>
                    ))}
                </div>

                <button 
                    onClick={() => setIsModelSelectorOpen(false)}
                    className={`mt-6 w-full p-2 rounded-md font-mono tracking-widest text-sm transition-colors ${closeButtonBg}`}
                >
                    CHIUDI
                </button>
            </div>
        </div>
    );
};

export default ModelSelectorModal;
