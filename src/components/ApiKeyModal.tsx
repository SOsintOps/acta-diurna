
import React, { useEffect, useState } from 'react';
import { useCaseStore } from '../store/caseStore';
import { clearApiKey, hasApiKey, isEnvOverrideActive, setApiKey, PROVIDER_LABEL } from '../services/apiKey';

/**
 * Inserimento della chiave API da parte dell'admin, per il fornitore scelto
 * nella finestra del modello: ogni fornitore ha la sua chiave.
 *
 * La finestra mostra soltanto se una chiave e' presente, mai il suo valore:
 * chi apre il pannello non deve poter leggere la chiave di chi l'ha inserita.
 *
 * Grafica in direzione Samaritan: filo di 2px, spigolo vivo, nessun raggio,
 * nessuna sfocatura, titolo che sborda dal riquadro. I colori arrivano dai
 * gettoni in index.css e non da ternari sul tema.
 */
const ApiKeyModal: React.FC = () => {
    const { isApiKeyModalOpen, setIsApiKeyModalOpen, aiProvider } = useCaseStore();

    const [value, setValue] = useState('');
    const [keyPresent, setKeyPresent] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const overrideActive = isEnvOverrideActive(aiProvider);

    useEffect(() => {
        if (!isApiKeyModalOpen) {
            return;
        }
        setValue('');
        setMessage(null);
        hasApiKey(aiProvider).then(setKeyPresent);
    }, [isApiKeyModalOpen, aiProvider]);

    if (!isApiKeyModalOpen) {
        return null;
    }

    const handleSave = async () => {
        setIsSaving(true);
        setMessage(null);
        try {
            await setApiKey(aiProvider, value);
            setKeyPresent(true);
            setValue('');
            setIsApiKeyModalOpen(false);
        } catch (error: any) {
            setMessage(error?.message ?? 'Salvataggio non riuscito.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleClear = async () => {
        await clearApiKey(aiProvider);
        setKeyPresent(false);
        setMessage('Chiave rimossa.');
    };

    return (
        <div
            className="sam-scrim fixed inset-0 z-[2000] flex items-center justify-center"
            onClick={() => setIsApiKeyModalOpen(false)}
        >
            <div
                className="sam-panel w-full max-w-md m-4 text-sm"
                onClick={(e) => e.stopPropagation()}
            >
                <span className="sam-title text-xs">ACCESSO</span>

                <div className="px-3 pt-6 pb-3">
                    <div className="flex items-center text-xs mb-4">
                        <span className="sam-status">CHIAVE {PROVIDER_LABEL[aiProvider]}</span>
                        {keyPresent ? (
                            <span className="sam-confirm px-2 tracking-[2px]">CONFIGURATA</span>
                        ) : (
                            <span className="sam-status-value sam-blink">ASSENTE</span>
                        )}
                        {overrideActive && <span className="sam-muted ml-auto text-[10px]">AMBIENTE</span>}
                    </div>

                    <div className="sam-rule mb-4" />

                    {overrideActive ? (
                        <p className="sam-body sam-muted text-xs leading-tight">
                            La chiave arriva dall'ambiente di compilazione e ha la precedenza su
                            qualunque valore salvato. Per cambiarla, ricompila senza chiave.
                        </p>
                    ) : (
                        <>
                            <input
                                type="password"
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && value.trim()) handleSave(); }}
                                placeholder="INSERIRE CHIAVE"
                                autoComplete="off"
                                autoFocus
                                className="sam-field w-full p-2 text-xs"
                            />
                            <p className="sam-body sam-muted text-[10px] mt-2 leading-tight">
                                Salvata nel database dell'applicazione, su questo browser.
                                Non viene mai mostrata di nuovo.
                            </p>

                            <button
                                onClick={handleSave}
                                disabled={isSaving || !value.trim()}
                                className="sam-action w-full p-2 mt-4 text-xs"
                            >
                                {isSaving ? 'SALVATAGGIO' : 'CONFERMA'}
                            </button>

                            {keyPresent && (
                                <button
                                    onClick={handleClear}
                                    className="sam-action sam-action-threat w-full p-2 mt-2 text-xs"
                                >
                                    REVOCA
                                </button>
                            )}
                        </>
                    )}

                    {message && (
                        <p className="sam-status-value sam-body text-xs mt-3">{message}</p>
                    )}

                    <button
                        onClick={() => setIsApiKeyModalOpen(false)}
                        className="sam-action sam-action-ghost w-full p-2 mt-6 text-xs"
                    >
                        CHIUDI
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ApiKeyModal;
