
import React from 'react';
import { useCaseStore } from '../store/caseStore';
import { CLAUDE_PHASES } from '../services/llm/claude';
import type { AiProvider } from '../services/llm';
import { hasApiKey } from '../services/apiKey';
import PulsingTriangle from './icons/PulsingTriangle';

// Ogni voce sceglie un fornitore. Gemini usa un modello unico per tutte le
// fasi; Claude usa il modello piu' adatto a ciascuna, vedi CLAUDE_PHASES.
const availableModels: { id: string; provider: AiProvider; name: string; description: string }[] = [
    { id: 'claude', provider: 'claude', name: 'Claude', description: 'Predefinito. Un modello per fase: Haiku per le domande semplici, Sonnet per ricerca ed estrazione, Opus per il report.' },
    { id: 'gemini-2.5-flash', provider: 'gemini', name: 'Gemini 2.5 Flash', description: 'Alternativa, con un modello unico per tutte le fasi. Richiede una chiave Google.' },
];

const ModelSelectorModal: React.FC = () => {
    const { isModelSelectorOpen, setIsModelSelectorOpen, aiModel, setAiModel, aiProvider, setAiProvider, setIsApiKeyModalOpen } = useCaseStore();

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
        if (!(await hasApiKey(model.provider))) {
            setIsApiKeyModalOpen(true);
        }
    };

    const isSelected = (model: typeof availableModels[number]) =>
        model.provider === aiProvider && (model.provider === 'claude' || model.id === aiModel);

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
                    Ogni fornitore ha la sua chiave API.
                </p>

                <div className="space-y-3">
                    {availableModels.map(model => (
                        <div
                            key={model.id}
                            onClick={() => handleSelectModel(model)}
                            className={`p-3 border  cursor-pointer transition-all duration-200 ${itemHoverBg} ${
                                isSelected(model) ? `ring-2 ${selectedItemRing}` : ('sam-edge')
                            }`}
                        >
                            <p className="font-bold text-base">{model.name}</p>
                            <p className={`text-xs mt-1 ${mutedTextColor}`}>{model.description}</p>
                        </div>
                    ))}
                </div>

                {aiProvider === 'claude' && (
                    <table className="w-full mt-4 text-[10px]">
                        <tbody>
                            {Object.values(CLAUDE_PHASES).map(phase => (
                                <tr key={phase.label} className="sam-edge border-b">
                                    <td className="py-1 pr-2">{phase.label.toUpperCase()}</td>
                                    <td className="py-1 pr-2">{phase.model.replace('claude-', '')}</td>
                                    <td className={`py-1 ${mutedTextColor}`}>{phase.reason}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

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
