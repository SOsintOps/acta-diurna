import React, { useContext, useEffect, useState } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';
import { useCaseStore } from '../store/caseStore';
import * as db from '../db';
import type { CaseData } from '../types';
import { cercaIudex, estremiSentenza, nuovoRiscontro, type DoveIudex, type RisultatiIudex } from '../services/iudex';
import PulsingTriangle from './icons/PulsingTriangle';

export interface EntitaDaCercare {
    uid: string;
    etichetta: string;
    frase: string;
}

/**
 * Ricerca di una persona o societa' del caso nelle sentenze di Iudex: prima
 * nell'archivio locale (nessuna richiesta alla Corte), poi, solo se l'analista
 * lo chiede, sulla Corte, una ricerca per clic.
 */
const IudexSearchModal: React.FC<{ caso: CaseData; entita: EntitaDaCercare; onClose: () => void }> = ({ caso, entita, onClose }) => {
    const { theme } = useContext(ThemeContext);
    const dark = theme === 'dark';
    const [frase, setFrase] = useState(entita.frase);
    const [risultati, setRisultati] = useState<Partial<Record<DoveIudex, RisultatiIudex>>>({});
    const [inCorso, setInCorso] = useState<DoveIudex | null>(null);
    const [errore, setErrore] = useState<string | null>(null);

    const cerca = async (dove: DoveIudex) => {
        setInCorso(dove);
        setErrore(null);
        try {
            const r = await cercaIudex(frase, dove);
            setRisultati(prima => ({ ...prima, [dove]: r }));
        } catch (e: any) {
            setErrore(e?.message ?? 'Ricerca non riuscita.');
        } finally {
            setInCorso(null);
        }
    };

    // All'apertura si cerca solo in locale: la Corte la sceglie l'analista.
    useEffect(() => { cerca('locale'); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const giaCollegate = new Set((caso.riscontri_iudex ?? []).filter(r => r.uid_entita === entita.uid).map(r => r.id_sentenza));

    const collega = async (dove: DoveIudex, indice: number) => {
        const s = risultati[dove]!.sentenze[indice];
        const riscontri = [...(caso.riscontri_iudex ?? []), nuovoRiscontro(entita.uid, s, dove, risultati[dove]!.frase)];
        await db.updateCase(caso.caseID, { riscontri_iudex: riscontri });
        const aggiornato = await db.getCase(caso.caseID);
        const store = useCaseStore.getState();
        store.setCases(store.cases.map(c => (c.caseID === caso.caseID && aggiornato ? aggiornato : c)));
        if (aggiornato) store.setSelectedCase(aggiornato);
    };

    const pannello = dark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-zinc-300 text-black';
    const muted = dark ? 'text-gray-400' : 'text-zinc-500';
    const riga = dark ? 'border-gray-800' : 'border-zinc-200';
    const campo = dark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-zinc-300 text-black';
    const blu = dark ? 'border-blue-600/50 text-blue-400 hover:bg-blue-500 hover:text-black' : 'border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white';
    const rosso = dark ? 'border-red-600/50 text-red-500 hover:bg-red-600 hover:text-black' : 'border-red-500 text-red-600 hover:bg-red-500 hover:text-white';
    const chiudi = dark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-zinc-200 hover:bg-zinc-300';

    const elenco = (dove: DoveIudex) => {
        const r = risultati[dove];
        if (!r) return null;
        return (
            <div className="mt-3">
                <p className={`text-xs ${muted}`}>
                    {dove === 'locale' ? 'Archivio locale di Iudex' : 'Corte di Cassazione'}: {r.trovati} {r.trovati === 1 ? 'sentenza' : 'sentenze'}
                    {dove === 'corte' && r.trovati > r.sentenze.length ? `, mostrate le prime ${r.sentenze.length}` : ''}
                </p>
                <ul className="mt-1 space-y-2">
                    {r.sentenze.map((s, i) => (
                        <li key={s.id_sentenza} className={`border-b pb-2 text-sm ${riga}`}>
                            <div className="flex items-start gap-2">
                                <div className="flex-1">
                                    <p className="font-bold">{estremiSentenza(s) || s.id_sentenza}</p>
                                    <p className={`font-mono text-xs ${muted}`}>{s.ecli ?? ''} · {s.id_sentenza}</p>
                                    {s.estratto && <p className="text-xs mt-1">{s.estratto}</p>}
                                    {s.pdf && <a href={s.pdf} target="_blank" rel="noreferrer" className="text-xs underline">PDF sul sito della Corte</a>}
                                </div>
                                {giaCollegate.has(s.id_sentenza) ? (
                                    <span className={`text-xs ${muted}`}>collegata</span>
                                ) : (
                                    <button onClick={() => collega(dove, i)} className={`px-2 py-1 font-mono text-xs border rounded-md transition-colors ${blu}`}>
                                        COLLEGA
                                    </button>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-[2000] flex items-center justify-center backdrop-blur-sm" onClick={onClose}>
            <div className={`w-full max-w-2xl m-4 p-4 rounded-lg border shadow-lg flex flex-col font-mono max-h-[90vh] overflow-y-auto ${pannello}`} onClick={e => e.stopPropagation()}>
                <div className="flex items-center mb-3">
                    <PulsingTriangle className="w-5 h-5 text-red-500 mr-3" staticPulse />
                    <h2 className="text-xl tracking-wider">IUDEX: {entita.etichetta}</h2>
                </div>

                <label className={`text-xs ${muted}`} htmlFor="frase-iudex">Frase cercata nel testo delle sentenze</label>
                <div className="flex gap-2 mt-1">
                    <input
                        id="frase-iudex"
                        value={frase}
                        onChange={e => setFrase(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && frase.trim()) cerca('locale'); }}
                        className={`flex-1 p-2 text-sm border rounded-md ${campo}`}
                    />
                    <button onClick={() => cerca('locale')} disabled={inCorso !== null || !frase.trim()} className={`px-3 font-mono text-xs border rounded-md transition-colors disabled:opacity-40 ${blu}`}>
                        {inCorso === 'locale' ? 'CERCO...' : 'LOCALE'}
                    </button>
                    <button onClick={() => cerca('corte')} disabled={inCorso !== null || !frase.trim()} className={`px-3 font-mono text-xs border rounded-md transition-colors disabled:opacity-40 ${rosso}`}>
                        {inCorso === 'corte' ? 'CERCO...' : 'CERCA SULLA CORTE'}
                    </button>
                </div>

                <p className={`text-xs mt-2 ${muted}`}>
                    Un risultato è un candidato da verificare: molti nomi nelle sentenze sono oscurati e lo stesso nome può
                    essere di persone diverse; nessun risultato non prova nulla. Ogni ricerca sulla Corte è una richiesta al
                    server di Italgiure; non usa Claude.
                </p>

                {errore && <p className="text-sm text-red-500 mt-2">{errore}</p>}
                {elenco('locale')}
                {elenco('corte')}

                <button onClick={onClose} className={`mt-4 w-full p-2 rounded-md font-mono tracking-widest text-sm transition-colors ${chiudi}`}>
                    CHIUDI
                </button>
            </div>
        </div>
    );
};

export default IudexSearchModal;
