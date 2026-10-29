
import React, { useEffect, useState } from 'react';
import { useCaseStore } from '../store/caseStore';
import { clearApiKey, hasApiKey, isEnvOverrideActive, setApiKey, PROVIDER_LABEL } from '../services/apiKey';
import type { AiProvider } from '../services/llm';
import { getFederationState, type FederationState } from '../services/llm/federation';

// Dove si ottiene la chiave di ciascun fornitore, in ordine di presentazione.
const PROVIDERS: { id: AiProvider; url: string }[] = [
    { id: 'claude', url: 'https://platform.claude.com/settings/keys' },
    { id: 'gemini', url: 'https://aistudio.google.com/apikey' },
];

/**
 * La chiave di un fornitore: stato, inserimento e revoca.
 *
 * Mostra soltanto se una chiave e' presente, mai il suo valore: chi apre le
 * impostazioni non deve poter leggere la chiave di chi l'ha inserita.
 */
const ProviderKey: React.FC<{ provider: AiProvider; url: string; inUse: boolean; isOpen: boolean }> = ({ provider, url, inUse, isOpen }) => {
    const [value, setValue] = useState('');
    const [keyPresent, setKeyPresent] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [federation, setFederation] = useState<FederationState>({ state: 'off' });

    const overrideActive = isEnvOverrideActive(provider);

    useEffect(() => {
        if (!isOpen) {
            return;
        }
        setValue('');
        setMessage(null);
        hasApiKey(provider).then(setKeyPresent);
        if (provider === 'claude') {
            getFederationState().then(setFederation);
        }
    }, [isOpen, provider]);

    const handleSave = async () => {
        setIsSaving(true);
        setMessage(null);
        try {
            await setApiKey(provider, value);
            setKeyPresent(true);
            setValue('');
            setMessage('Chiave salvata.');
        } catch (error: any) {
            setMessage(error?.message ?? 'Salvataggio non riuscito.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleClear = async () => {
        await clearApiKey(provider);
        setKeyPresent(false);
        setMessage('Chiave rimossa.');
    };

    return (
        <div className="mb-6">
            <div className="flex items-center text-xs mb-3">
                <span className="sam-status">CHIAVE {PROVIDER_LABEL[provider]}</span>
                {keyPresent ? (
                    <span className="sam-confirm px-2 tracking-[2px]">CONFIGURATA</span>
                ) : (
                    <span className={`sam-status-value ${inUse ? 'sam-blink' : ''}`}>ASSENTE</span>
                )}
                {inUse && <span className="sam-threat ml-auto text-[10px] tracking-[2px]">IN USO</span>}
            </div>

            {provider === 'claude' && <FederationStatus federation={federation} overrideActive={overrideActive} />}

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
                        autoFocus={inUse && !keyPresent}
                        className="sam-field w-full p-2 text-xs"
                    />
                    <p className="sam-body sam-muted text-[10px] mt-2 leading-tight">
                        Si ottiene da <a href={url} target="_blank" rel="noreferrer" className="underline">{new URL(url).host}</a>.
                        Salvata nel database dell'applicazione, su questo browser; non viene mai mostrata di nuovo.
                    </p>

                    <div className="flex gap-2 mt-3">
                        <button
                            onClick={handleSave}
                            disabled={isSaving || !value.trim()}
                            className="sam-action flex-1 p-2 text-xs"
                        >
                            {isSaving ? 'SALVATAGGIO' : 'CONFERMA'}
                        </button>
                        {keyPresent && (
                            <button
                                onClick={handleClear}
                                className="sam-action sam-action-threat flex-1 p-2 text-xs"
                            >
                                REVOCA
                            </button>
                        )}
                    </div>
                </>
            )}

            {message && (
                <p className="sam-status-value sam-body text-xs mt-2">{message}</p>
            )}
        </div>
    );
};

/**
 * Stato della federazione d'identita' di Claude. Si configura sul server, in
 * .env: qui si legge soltanto, senza mai mostrare identificativi o token.
 */
const FederationStatus: React.FC<{ federation: FederationState; overrideActive: boolean }> = ({ federation, overrideActive }) => (
    <div className="mb-3">
        <div className="flex items-center text-xs mb-1">
            <span className="sam-status">FEDERAZIONE</span>
            {federation.state === 'on' && <span className="sam-confirm px-2 tracking-[2px]">ATTIVA</span>}
            {federation.state === 'error' && <span className="sam-status-value sam-threat">ERRORE</span>}
            {federation.state === 'off' && <span className="sam-status-value">NON CONFIGURATA</span>}
        </div>
        <p className="sam-body sam-muted text-[10px] leading-tight">
            {federation.state === 'on' && (overrideActive
                ? 'Attiva, ma la chiave da ambiente di compilazione ha la precedenza.'
                : "Il server scambia l'identità con un token di breve durata, che ha la precedenza sulla chiave salvata.")}
            {federation.state === 'error' && federation.message}
            {federation.state === 'off' && 'Si attiva dal file .env del server, al posto della chiave: vedi .env.example.'}
        </p>
    </div>
);

/**
 * Impostazioni: le chiavi API di tutti i fornitori, non solo di quello in uso,
 * cosi' si puo' preparare un fornitore prima di passarci.
 *
 * Grafica in direzione Samaritan: filo di 2px, spigolo vivo, nessun raggio,
 * nessuna sfocatura, titolo che sborda dal riquadro. I colori arrivano dai
 * gettoni in index.css e non da ternari sul tema.
 */
const SettingsModal: React.FC = () => {
    const { isApiKeyModalOpen, setIsApiKeyModalOpen, aiProvider, setIsModelSelectorOpen } = useCaseStore();

    if (!isApiKeyModalOpen) {
        return null;
    }

    const openModelSelector = () => {
        setIsApiKeyModalOpen(false);
        setIsModelSelectorOpen(true);
    };

    return (
        <div
            className="sam-scrim fixed inset-0 z-[2000] flex items-center justify-center"
            onClick={() => setIsApiKeyModalOpen(false)}
        >
            <div
                className="sam-panel w-full max-w-md m-4 text-sm max-h-[90vh] overflow-y-auto overflow-x-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <span className="sam-title text-xs">IMPOSTAZIONI</span>

                <div className="px-3 pt-6 pb-3">
                    <div className="flex items-center text-xs mb-4">
                        <span className="sam-status">FORNITORE</span>
                        <span className="sam-status-value">{PROVIDER_LABEL[aiProvider]}</span>
                        <button onClick={openModelSelector} className="sam-action-compact ml-auto px-2 text-[10px]">
                            CAMBIA AI
                        </button>
                    </div>

                    <div className="sam-rule mb-4" />

                    {PROVIDERS.map(p => (
                        <ProviderKey
                            key={p.id}
                            provider={p.id}
                            url={p.url}
                            inUse={p.id === aiProvider}
                            isOpen={isApiKeyModalOpen}
                        />
                    ))}

                    <button
                        onClick={() => setIsApiKeyModalOpen(false)}
                        className="sam-action sam-action-ghost w-full p-2 mt-2 text-xs"
                    >
                        CHIUDI
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
