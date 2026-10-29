import React, { useContext } from 'react';
import { useCaseStore } from '../store/caseStore';
import { ThemeContext } from '../contexts/ThemeContext';
import { CLAUDE_PHASES } from '../services/llm/claude';
import type { AiProvider } from '../services/llm';
import { hasCredentials } from '../services/apiKey';
import PulsingTriangle from './icons/PulsingTriangle';

// Ogni voce sceglie un fornitore. Gemini usa un modello unico per tutte le
// fasi; Claude usa il modello piu' adatto a ciascuna, vedi CLAUDE_PHASES.
const availableModels: { id: string; provider: AiProvider; name: string; description: string }[] = [
    { id: 'claude', provider: 'claude', name: 'Claude', description: 'Predefinito. Un modello per fase: Haiku per le domande semplici, Sonnet per ricerca ed estrazione, Opus per il report.' },
    { id: 'gemini-2.5-flash', provider: 'gemini', name: 'Gemini 2.5 Flash', description: 'Alternativa, con un modello unico per tutte le fasi. Richiede una chiave Google.' },
];

const ModelSelectorModal: React.FC = () => {
    const { isModelSelectorOpen, setIsModelSelectorOpen, aiModel, setAiModel, aiProvider, setAiProvider, setIsApiKeyModalOpen } = useCaseStore();
    const { theme } = useContext(ThemeContext);

    if (!isModelSelectorOpen) {
        return null;
    }

    const handleSelectModel = async (model: typeof availableModels[number]) => {
        setAiProvider(model.provider);
        if (model.provider === 'gemini') {
            setAiModel(model.id);
        }
        setIsModelSelectorOpen(false);
        // Un fornitore appena scelto senza chiave non puo' rispondere: si chiede
        // subito la chiave invece di fallire alla prima rassegna.
        if (!(await hasCredentials(model.provider))) {
            setIsApiKeyModalOpen(true);
        }
    };

    const isSelected = (model: typeof availableModels[number]) =>
        model.provider === aiProvider && (model.provider === 'claude' || model.id === aiModel);

    const modalBg = theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-zinc-300';
    const textColor = theme === 'dark' ? 'text-white' : 'text-black';
    const mutedTextColor = theme === 'dark' ? 'text-gray-400' : 'text-zinc-500';
    const itemHoverBg = theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-zinc-100';
    const selectedItemRing = theme === 'dark' ? 'ring-red-500' : 'ring-red-600';
    const closeButtonBg = theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-zinc-200 hover:bg-zinc-300';
    const rowBorder = theme === 'dark' ? 'border-gray-800' : 'border-zinc-200';

    return (
        <div
            className="fixed inset-0 bg-black/60 z-[2000] flex items-center justify-center backdrop-blur-sm"
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
                    Ogni fornitore ha la sua chiave API.
                </p>

                <div className="space-y-3">
                    {availableModels.map(model => (
                        <div
                            key={model.id}
                            onClick={() => handleSelectModel(model)}
                            className={`p-3 border rounded-md cursor-pointer transition-all duration-200 ${itemHoverBg} ${
                                isSelected(model) ? `ring-2 ${selectedItemRing}` : (theme === 'dark' ? 'border-gray-700' : 'border-zinc-200')
                            }`}
                        >
                            <p className="font-bold text-base">{model.name}</p>
                            <p className={`text-xs mt-1 ${mutedTextColor}`}>{model.description}</p>
                        </div>
                    ))}
                </div>

                {aiProvider === 'claude' && (
                    <table className="w-full mt-4 text-xs">
                        <tbody>
                            {Object.values(CLAUDE_PHASES).map(phase => (
                                <tr key={phase.label} className={`border-b ${rowBorder}`}>
                                    <td className="py-1 pr-2">{phase.label}</td>
                                    <td className="py-1 pr-2">{phase.model.replace('claude-', '')}</td>
                                    <td className={`py-1 ${mutedTextColor}`}>{phase.reason}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

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
