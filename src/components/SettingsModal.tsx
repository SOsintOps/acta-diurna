import React, { useContext, useEffect, useState } from 'react';
import { useCaseStore } from '../store/caseStore';
import { ThemeContext } from '../contexts/ThemeContext';
import { clearApiKey, hasApiKey, isEnvOverrideActive, setApiKey, PROVIDER_LABEL } from '../services/apiKey';
import type { AiProvider } from '../services/llm';
import { getFederationState, type FederationState } from '../services/llm/federation';
import { CLAUDE_PHASES } from '../services/llm/claude';
import type { Phase } from '../services/llm/types';
import { getDailyBudget, getUsageSummary, setDailyBudget, type UsageSummary, type UsageTotals } from '../services/usage';
import PulsingTriangle from './icons/PulsingTriangle';

// Dove si ottiene la chiave di ciascun fornitore, in ordine di presentazione.
const PROVIDERS: { id: AiProvider; url: string }[] = [
    { id: 'claude', url: 'https://platform.claude.com/settings/keys' },
    { id: 'gemini', url: 'https://aistudio.google.com/apikey' },
];

// Classi dello stile originale, come nelle altre finestre (ModelSelectorModal).
const useStyles = () => {
    const { theme } = useContext(ThemeContext);
    const dark = theme === 'dark';
    return {
        modalBg: dark ? 'bg-gray-900 border-gray-700' : 'bg-white border-zinc-300',
        textColor: dark ? 'text-white' : 'text-black',
        muted: dark ? 'text-gray-400' : 'text-zinc-500',
        sectionBorder: dark ? 'border-gray-700' : 'border-zinc-200',
        rowBorder: dark ? 'border-gray-800' : 'border-zinc-200',
        field: dark ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-zinc-300 text-black placeholder-zinc-400',
        primaryButton: dark ? 'border-blue-600/50 text-blue-400 hover:bg-blue-500 hover:text-black' : 'border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white',
        dangerButton: dark ? 'border-red-600/50 text-red-500 hover:bg-red-600 hover:text-black' : 'border-red-500 text-red-600 hover:bg-red-500 hover:text-white',
        closeButton: dark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-zinc-200 hover:bg-zinc-300',
        ok: dark ? 'text-green-400' : 'text-green-700',
        warn: dark ? 'text-red-400' : 'text-red-600',
    };
};

/**
 * La chiave di un fornitore: stato, inserimento e revoca.
 *
 * Mostra soltanto se una chiave e' presente, mai il suo valore: chi apre le
 * impostazioni non deve poter leggere la chiave di chi l'ha inserita.
 */
const ProviderKey: React.FC<{ provider: AiProvider; url: string; inUse: boolean; isOpen: boolean }> = ({ provider, url, inUse, isOpen }) => {
    const s = useStyles();
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
        <div className={`p-3 mb-3 border rounded-md ${inUse ? 'ring-2 ring-red-500' : s.sectionBorder}`}>
            <div className="flex items-center text-sm mb-2">
                <span className="font-bold">Chiave {PROVIDER_LABEL[provider] === 'CLAUDE' ? 'Claude' : 'Gemini'}</span>
                <span className={`ml-2 text-xs ${keyPresent ? s.ok : s.warn}`}>{keyPresent ? 'configurata' : 'assente'}</span>
                {inUse && <span className="ml-auto text-xs text-red-500">IN USO</span>}
            </div>

            {provider === 'claude' && federation.state !== 'off' && <FederationStatus federation={federation} overrideActive={overrideActive} />}

            {overrideActive ? (
                <p className={`text-xs ${s.muted}`}>
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
                        placeholder="Incolla qui la chiave"
                        autoComplete="off"
                        autoFocus={inUse && !keyPresent}
                        className={`w-full p-2 text-sm border rounded-md ${s.field}`}
                    />
                    <p className={`text-xs mt-1 ${s.muted}`}>
                        Si ottiene da <a href={url} target="_blank" rel="noreferrer" className="underline">{new URL(url).host}</a>.
                        Resta in questo browser e non viene mai mostrata di nuovo.
                    </p>

                    <div className="flex gap-2 mt-2">
                        <button
                            onClick={handleSave}
                            disabled={isSaving || !value.trim()}
                            className={`flex-1 p-2 font-mono text-sm border rounded-md transition-colors disabled:opacity-40 ${s.primaryButton}`}
                        >
                            {isSaving ? 'SALVATAGGIO...' : 'SALVA'}
                        </button>
                        {keyPresent && (
                            <button
                                onClick={handleClear}
                                className={`flex-1 p-2 font-mono text-sm border rounded-md transition-colors ${s.dangerButton}`}
                            >
                                REVOCA
                            </button>
                        )}
                    </div>
                </>
            )}

            {message && <p className={`text-xs mt-2 ${s.muted}`}>{message}</p>}
        </div>
    );
};

/**
 * Stato della federazione d'identita' di Claude, quando e' configurata sul
 * server in .env. Si mostra solo lo stato, mai identificativi o token.
 */
const FederationStatus: React.FC<{ federation: FederationState; overrideActive: boolean }> = ({ federation, overrideActive }) => {
    const s = useStyles();
    return (
        <p className={`text-xs mb-2 ${federation.state === 'on' ? s.ok : s.warn}`}>
            {federation.state === 'on' && (overrideActive
                ? 'Federazione attiva, ma la chiave da ambiente di compilazione ha la precedenza.'
                : "Federazione d'identità attiva: ha la precedenza sulla chiave salvata.")}
            {federation.state === 'error' && `Federazione configurata ma in errore: ${federation.message}`}
        </p>
    );
};

const usd = (value: number) => `$${value < 0.01 && value > 0 ? value.toFixed(4) : value.toFixed(2)}`;

/**
 * Consumi stimati delle chiamate a Claude, dal registro in services/usage.ts.
 * Una stima dal listino: il costo vero e' nella Console di Anthropic.
 */
const UsagePanel: React.FC<{ isOpen: boolean }> = ({ isOpen }) => {
    const s = useStyles();
    const [summary, setSummary] = useState<UsageSummary | null>(null);
    const [budget, setBudget] = useState('');
    const [budgetMessage, setBudgetMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        getUsageSummary().then(setSummary);
        getDailyBudget().then(value => setBudget(value.toFixed(2)));
        setBudgetMessage(null);
    }, [isOpen]);

    if (!summary) return null;

    const handleSaveBudget = async () => {
        try {
            await setDailyBudget(Number(budget.replace(',', '.')));
            setBudgetMessage('Tetto salvato.');
        } catch (error: any) {
            setBudgetMessage(error?.message ?? 'Salvataggio non riuscito.');
        }
    };

    const rows: [string, UsageTotals][] = [
        ['Oggi', summary.today],
        ['Ultimi 30 giorni', summary.last30Days],
        ['Totale', summary.total],
    ];
    const phases = (Object.keys(summary.byPhase) as Phase[])
        .map(phase => [CLAUDE_PHASES[phase].label, summary.byPhase[phase]!] as const)
        .sort((a, b) => b[1].costUsd - a[1].costUsd);

    return (
        <div className={`p-3 mb-3 border rounded-md ${s.sectionBorder}`}>
            <div className="flex items-center text-sm mb-2">
                <span className="font-bold">Consumi Claude</span>
                <span className={`ml-auto text-xs ${s.muted}`}>stima</span>
            </div>
            <div className="flex items-center gap-2 text-xs mb-3">
                <label htmlFor="daily-budget">Tetto giornaliero $</label>
                <input
                    id="daily-budget"
                    type="text"
                    inputMode="decimal"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveBudget(); }}
                    className={`w-20 p-1 text-xs border rounded-md ${s.field}`}
                />
                <button
                    onClick={handleSaveBudget}
                    className={`px-2 py-1 font-mono text-xs border rounded-md transition-colors ${s.primaryButton}`}
                >
                    SALVA
                </button>
                <span className={`ml-auto ${summary.today.costUsd >= Number(budget.replace(',', '.')) ? s.warn : s.muted}`}>
                    oggi {usd(summary.today.costUsd)}
                </span>
            </div>
            {budgetMessage && <p className={`text-xs mb-2 ${s.muted}`}>{budgetMessage}</p>}
            <table className="w-full text-xs">
                <tbody>
                    {rows.map(([label, t]) => (
                        <tr key={label} className={`border-b ${s.rowBorder}`}>
                            <td className="py-1">{label}</td>
                            <td className={`py-1 text-right ${s.muted}`}>{t.calls} chiamate</td>
                            <td className={`py-1 text-right ${s.muted}`}>{t.webSearches} ricerche</td>
                            <td className="py-1 text-right font-bold">{usd(t.costUsd)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {phases.length > 0 && (
                <table className="w-full text-xs mt-2">
                    <tbody>
                        {phases.map(([label, t]) => (
                            <tr key={label}>
                                <td className={`py-0.5 ${s.muted}`}>{label}</td>
                                <td className={`py-0.5 text-right ${s.muted}`}>{t.calls} × {usd(t.costUsd / t.calls)}</td>
                                <td className="py-0.5 text-right">{usd(t.costUsd)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
            <p className={`text-xs mt-2 ${s.muted}`}>
                Calcolati dal listino sui token e sulle ricerche di ogni chiamata. Il costo
                effettivo è nella Console di Anthropic.
            </p>
        </div>
    );
};

/**
 * Impostazioni: le chiavi API di tutti i fornitori, non solo di quello in uso,
 * cosi' si puo' preparare un fornitore prima di passarci, e i consumi.
 */
const SettingsModal: React.FC = () => {
    const s = useStyles();
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
            className="fixed inset-0 bg-black/60 z-[2000] flex items-center justify-center backdrop-blur-sm"
            onClick={() => setIsApiKeyModalOpen(false)}
        >
            <div
                className={`w-full max-w-md m-4 p-4 rounded-lg border shadow-lg ${s.modalBg} ${s.textColor} flex flex-col font-mono max-h-[90vh] overflow-y-auto`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center mb-4">
                    <PulsingTriangle className="w-5 h-5 text-red-500 mr-3" staticPulse />
                    <h2 className="text-xl tracking-wider">IMPOSTAZIONI</h2>
                </div>

                <div className="flex items-center text-sm mb-4">
                    <span className={s.muted}>Fornitore in uso:</span>
                    <span className="ml-2 font-bold">{PROVIDER_LABEL[aiProvider] === 'CLAUDE' ? 'Claude' : 'Gemini'}</span>
                    <button
                        onClick={openModelSelector}
                        className={`ml-auto px-3 py-1 font-mono text-xs border rounded-md transition-colors ${s.primaryButton}`}
                    >
                        CAMBIA AI
                    </button>
                </div>

                {PROVIDERS.map(p => (
                    <ProviderKey
                        key={p.id}
                        provider={p.id}
                        url={p.url}
                        inUse={p.id === aiProvider}
                        isOpen={isApiKeyModalOpen}
                    />
                ))}

                <UsagePanel isOpen={isApiKeyModalOpen} />

                <button
                    onClick={() => setIsApiKeyModalOpen(false)}
                    className={`mt-3 w-full p-2 rounded-md font-mono tracking-widest text-sm transition-colors ${s.closeButton}`}
                >
                    CHIUDI
                </button>
            </div>
        </div>
    );
};

export default SettingsModal;
