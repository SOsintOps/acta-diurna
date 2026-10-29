import { getSettings, setSettings } from '../db';
import type { Persona, Riscontro, Societa } from '../types';
import { MIETITORE } from './entita';
import {
    IUDEX_CERCA_PATH, IUDEX_STATO_PATH,
    type DoveIudex, type RisultatiIudex, type SentenzaTrovata, type StatoIudex,
} from './iudexPath';

// Ricerca di persone e societa' nelle sentenze di Iudex, dal browser, tramite il
// ponte sul server di Vite (server/iudex.ts). Facoltativa: la attiva l'utente
// nelle impostazioni. Non usa token di Claude, ma ogni ricerca sulla Corte e'
// una richiesta al server di Italgiure.

export type { DoveIudex, RisultatiIudex, SentenzaTrovata, StatoIudex };

const IMPOSTAZIONE = 'iudexRicerca';

export const ricercaIudexAttiva = async (): Promise<boolean> => (await getSettings(IMPOSTAZIONE)) === true;
export const impostaRicercaIudex = (attiva: boolean): Promise<void> => setSettings(IMPOSTAZIONE, attiva);

const frase = (testo: string) => `"${testo.replace(/"/g, ' ').replace(/\s+/g, ' ').trim()}"`;

/** Le due forme del nome, «Nome Cognome» e «Cognome Nome», piu' il codice fiscale se noto. */
export const frasePersona = (p: Pick<Persona, 'nome' | 'cognome' | 'nome_come_scritto' | 'cf'>): string => {
    const parole = (p.nome && p.cognome ? `${p.nome} ${p.cognome}` : p.nome_come_scritto).trim().split(/\s+/).filter(Boolean);
    const varianti = new Set<string>();
    if (parole.length > 0) varianti.add(frase(parole.join(' ')));
    if (parole.length === 2) varianti.add(frase(`${parole[1]} ${parole[0]}`));
    else if (p.nome && p.cognome) varianti.add(frase(`${p.cognome} ${p.nome}`));
    if (p.cf) varianti.add(frase(p.cf));
    return [...varianti].join(' OR ');
};

/** La ragione sociale senza la forma giuridica (le sentenze la scrivono in modi diversi), piu' P.IVA e CF. */
export const fraseSocieta = (s: Pick<Societa, 'ragione_sociale' | 'piva' | 'cf'>): string =>
    [...new Set([frase(s.ragione_sociale), s.piva ? frase(s.piva) : null, s.cf && s.cf !== s.piva ? frase(s.cf) : null].filter(Boolean))].join(' OR ');

export const statoIudex = async (): Promise<StatoIudex> => {
    try {
        const r = await fetch(IUDEX_STATO_PATH, { cache: 'no-store' });
        const corpo = await r.json();
        return typeof corpo?.attivo === 'boolean' ? corpo : { attivo: false };
    } catch {
        // Servita da un server che non e' Vite, l'app non ha il ponte.
        return { attivo: false };
    }
};

export const cercaIudex = async (q: string, dove: DoveIudex, pagina = 1): Promise<RisultatiIudex> => {
    const r = await fetch(`${IUDEX_CERCA_PATH}?${new URLSearchParams({ q, dove, pagina: String(pagina) })}`, { cache: 'no-store' });
    const corpo = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(corpo?.errore ?? `Ricerca in Iudex non riuscita (${r.status}).`);
    return corpo as RisultatiIudex;
};

export const nuovoRiscontro = (uid_entita: string, s: SentenzaTrovata, dove: DoveIudex, fraseUsata: string): Riscontro => ({
    uid_entita, id_sentenza: s.id_sentenza, ecli: s.ecli, dove, frase: fraseUsata,
    quando: new Date().toISOString(), mietitore: MIETITORE,
    estremi: [s.tipo, s.numero && s.anno ? `n. ${s.numero}/${s.anno}` : null, s.sezione ? `sez. ${s.sezione}` : null].filter(Boolean).join(' '),
});

/** Estremi leggibili di una sentenza trovata. */
export const estremiSentenza = (s: SentenzaTrovata): string =>
    [s.archivio, s.tipo, s.numero && s.anno ? `n. ${s.numero}/${s.anno}` : null, s.sezione ? `sez. ${s.sezione}` : null,
        s.data_deposito ? `depositata il ${s.data_deposito}` : null].filter(Boolean).join(' · ');
