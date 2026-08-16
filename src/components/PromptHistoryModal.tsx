
import React, { useState, useEffect } from 'react';
import * as db from '../db';
import type { PromptHistoryEntry } from '../types';
import PulsingTriangle from './icons/PulsingTriangle';

interface PromptHistoryModalProps {
    onClose: () => void;
    onSetActive: (promptText: string, baseEntry?: PromptHistoryEntry) => Promise<void>;
}

const PromptHistoryModal: React.FC<PromptHistoryModalProps> = ({ onClose, onSetActive }) => {
        const [history, setHistory] = useState<PromptHistoryEntry[]>([]);
    const [selectedEntry, setSelectedEntry] = useState<PromptHistoryEntry | null>(null);
    const [activePrompt, setActivePrompt] = useState<PromptHistoryEntry | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    useEffect(() => {
        const loadHistory = async () => {
            setIsLoading(true);
            const loadedHistory = await db.getPromptHistory();
            const active = await db.getActivePrompt();
            setHistory(loadedHistory);
            setActivePrompt(active);
            setSelectedEntry(active); // Select the active prompt by default
            setIsLoading(false);
        };
        loadHistory();
    }, []);

    const handleCopy = () => {
        if (selectedEntry) {
            navigator.clipboard.writeText(selectedEntry.prompt);
            alert('Prompt copiato negli appunti.');
        }
    };
    
    const handleSetActive = async () => {
        if (selectedEntry && selectedEntry.version !== activePrompt?.version) {
            const confirmed = window.confirm(`Sei sicuro di voler impostare la versione ${selectedEntry.version} come prompt attivo? Verrà creata una nuova versione basata su questa.`);
            if (confirmed) {
                setIsSubmitting(true);
                await onSetActive(selectedEntry.prompt, selectedEntry);
                setIsSubmitting(false);
            }
        }
    };

    // Style classes
    const modalBg = 'sam-panel';
    const textColor = 'sam-fg';
    const mutedTextColor = 'sam-muted';
    const itemHoverBg = 'sam-row';
    const selectedItemBg = 'sam-chip';
    const buttonClass = 'sam-action sam-action-ghost';
    const primaryButtonClass = 'sam-action sam-action-second';

    return (
        <div className="sam-scrim fixed inset-0 z-[2000] flex items-center justify-center" onClick={onClose}>
            <div
                className={`w-full max-w-4xl h-[80vh] m-4 p-4 border ${modalBg} ${textColor} flex flex-col font-mono`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                    <div className="flex items-center">
                       <PulsingTriangle className="w-5 h-5 sam-threat mr-3" staticPulse />
                       <h2 className="text-xl tracking-wider">CRONOLOGIA PROMPT DI RICERCA</h2>
                    </div>
                     <button onClick={onClose} className={`px-3 py-1 text-sm ${buttonClass}`}>CHIUDI</button>
                </div>
                
                {isLoading ? (
                    <div className="flex-grow flex items-center justify-center">
                        <p className={mutedTextColor}>Caricamento cronologia...</p>
                    </div>
                ) : (
                <div className="flex-grow flex gap-4 overflow-hidden">
                    {/* Left Panel: History List */}
                    <div className="w-1/3 flex flex-col border /50">
                        <h3 className="p-2 border-b /50 text-sm tracking-wider">Versioni</h3>
                        <div className="overflow-y-auto feed-scrollbar">
                        {history.map(entry => (
                            <div
                                key={entry.version}
                                onClick={() => setSelectedEntry(entry)}
                                className={`p-2 cursor-pointer border-b /50 ${itemHoverBg} ${selectedEntry?.version === entry.version ? selectedItemBg : ''}`}
                            >
                                <div className="flex justify-between items-center">
                                <span className={activePrompt?.version === entry.version ? 'font-bold sam-threat' : ''}>
                                    Versione {entry.version} {activePrompt?.version === entry.version && '(Attivo)'}
                                </span>
                                <span className={`text-xs ${mutedTextColor}`}>
                                    {new Date(entry.timestamp).toLocaleDateString('it-IT')}
                                </span>
                                </div>
                            </div>
                        ))}
                        </div>
                    </div>

                    {/* Right Panel: Details */}
                    <div className="w-2/3 flex flex-col overflow-hidden">
                        {selectedEntry ? (
                            <>
                                <div className="flex justify-between items-center mb-2 flex-shrink-0">
                                   <h3 className="text-lg">Dettagli Versione {selectedEntry.version}</h3>
                                   <div className="flex gap-2">
                                       <button onClick={handleCopy} className={`px-3 py-1 text-sm ${buttonClass}`}>COPIA PROMPT</button>
                                       <button onClick={handleSetActive} disabled={selectedEntry.version === activePrompt?.version || isSubmitting} className={`px-3 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed ${primaryButtonClass}`}>
                                           {isSubmitting ? 'IMPOSTANDO...' : 'IMPOSTA COME ATTIVO'}
                                       </button>
                                   </div>
                                </div>
                                <div className={`flex-grow p-3 border /50 bg-black/20 overflow-y-auto feed-scrollbar`}>
                                     <textarea readOnly value={selectedEntry.prompt} className="w-full h-full bg-transparent border-0 resize-none font-mono text-sm leading-relaxed focus:outline-none"/>
                                </div>
                                <div className={`mt-2 p-2 border /50 bg-black/20 text-xs ${mutedTextColor} flex-shrink-0`}>
                                    <h4 className="font-bold sam-muted mb-1">BASATO SU FEEDBACK:</h4>
                                    <span>{selectedEntry.basedOn.highPriority} Importanti | </span>
                                    <span>{selectedEntry.basedOn.mediumPriority} Medi | </span>
                                    <span>{selectedEntry.basedOn.standard} Standard</span>
                                </div>
                            </>
                        ) : (
                            <div className="flex-grow flex items-center justify-center">
                                <p className={mutedTextColor}>Seleziona una versione per visualizzare i dettagli.</p>
                            </div>
                        )}
                    </div>
                </div>
                )}
            </div>
        </div>
    );
};

export default PromptHistoryModal;
