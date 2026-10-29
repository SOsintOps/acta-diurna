import type { CaseData, Citazione, EntitaCaso, Legame, Persona, Societa } from '../types';
import { H, chiaveCaso } from '../utils/entitaUid';
import { MIETITORE, entitaDelCaso, nomeSocieta } from './entita';

// Esportazioni nel formato comune con Iudex e Praeco
// (italgiure-work/comune/entita-formato.md): FollowTheMoney NDJSON, che si
// apre in Aleph e con la libreria ftm, e il pacchetto JSONL di scambio.
// L'id FtM di persone e societa' e' il loro uid: la stessa entita' ha lo
// stesso id negli export di tutte le app.

interface EntitaFtm {
    id: string;
    schema: string;
    properties: Record<string, string[]>;
}

const prop = (valori: Record<string, (string | number | null | undefined)[] | string | number | null | undefined>) => {
    const fuori: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(valori)) {
        const lista = (Array.isArray(v) ? v : [v]).filter(x => x !== null && x !== undefined && x !== '').map(String);
        if (lista.length > 0) fuori[k] = lista;
    }
    return fuori;
};

const personaFtm = (p: Persona): EntitaFtm => ({
    id: p.uid,
    schema: 'Person',
    properties: prop({
        name: p.nome_come_scritto,
        firstName: p.ordine_certo ? p.nome : null,
        lastName: p.ordine_certo ? p.cognome : null,
        gender: p.sesso === 'M' ? 'male' : p.sesso === 'F' ? 'female' : null,
        birthDate: p.data_nascita,
        birthPlace: p.luogo_nascita,
        taxNumber: p.cf,
    }),
});

const SCHEMA_SOCIETA = { societa: 'Company', ente_pubblico: 'PublicBody', organizzazione: 'Organization' } as const;

const societaFtm = (s: Societa): EntitaFtm => ({
    id: s.uid,
    schema: SCHEMA_SOCIETA[s.tipo],
    properties: prop({
        name: nomeSocieta(s),
        legalForm: s.forma,
        taxNumber: s.cf,
        vatCode: s.piva,
        registrationNumber: [s.cf, s.rea],
        jurisdiction: s.paese,
        address: s.sede,
        status: s.stato,
        sector: s.settore,
        summary: s.attivita,
    }),
});

const idEvento = (c: CaseData) => H(`caso|${chiaveCaso(c.caseID)}`);

const eventoFtm = async (c: CaseData): Promise<EntitaFtm> => ({
    id: await idEvento(c),
    schema: 'Event',
    properties: prop({
        name: c.summary.title,
        date: c.summary.dateOfOperation,
        country: 'it',
        location: c.summary.location.cities.map(x => x.name),
        summary: c.details.investigationReason,
        sourceUrl: c.provenance.map(p => p.url),
        keywords: c.summary.crimeTypes,
    }),
});

const citazioneFtm = async (ci: Citazione, evento: string): Promise<EntitaFtm> => ({
    id: await H(`citazione|${ci.uid_entita}|${ci.id_provvedimento}|${ci.ruolo ?? ''}`),
    schema: 'UnknownLink',
    properties: prop({
        subject: ci.uid_entita,
        object: evento,
        role: [ci.ruolo, ci.posizione].filter(Boolean).join(', ') || null,
        sourceUrl: ci.fonte_url,
    }),
});

// Il ruolo resta in italiano nella proprieta' role, come in Iudex e Praeco.
const SCHEMA_LEGAME: Record<string, [string, string, string]> = {
    amministrazione: ['Directorship', 'director', 'organization'],
    proprieta: ['Ownership', 'owner', 'asset'],
    dipendenza: ['Employment', 'employee', 'employer'],
    rappresentanza: ['Representation', 'agent', 'client'],
    appartenenza: ['Membership', 'member', 'organization'],
};

const legameFtm = async (l: Legame): Promise<EntitaFtm> => {
    const [schema, daPersona, aSocieta] = SCHEMA_LEGAME[l.tipo ?? ''] ?? ['UnknownLink', 'subject', 'object'];
    return {
        id: await H(`legame|${l.uid_persona}|${l.uid_societa}|${l.ruolo}`),
        schema,
        properties: prop({ [daPersona]: l.uid_persona, [aSocieta]: l.uid_societa, role: l.ruolo }),
    };
};

/** Tutte le entita' dell'archivio unite per uid: una persona in tre casi esce una volta. */
const raccogli = (casi: CaseData[]): EntitaCaso => {
    const persone = new Map<string, Persona>();
    const societa = new Map<string, Societa>();
    const citazioni: Citazione[] = [];
    const legami: Legame[] = [];
    for (const c of casi) {
        const e = entitaDelCaso(c);
        e.persone.forEach(p => persone.set(p.uid, { ...p, ...Object.fromEntries(Object.entries(persone.get(p.uid) ?? {}).filter(([, v]) => v !== null)) }));
        e.societa.forEach(s => societa.set(s.uid, { ...s, ...Object.fromEntries(Object.entries(societa.get(s.uid) ?? {}).filter(([, v]) => v !== null)) }));
        citazioni.push(...e.citazioni);
        legami.push(...e.legami);
    }
    return { persone: [...persone.values()], societa: [...societa.values()], citazioni, legami };
};

/** FollowTheMoney NDJSON: una entita' per riga. */
export const esportaFtm = async (casi: CaseData[]): Promise<string> => {
    const tutte = raccogli(casi);
    const righe: EntitaFtm[] = [...tutte.persone.map(personaFtm), ...tutte.societa.map(societaFtm)];
    for (const c of casi) {
        const evento = await eventoFtm(c);
        righe.push(evento);
        for (const ci of entitaDelCaso(c).citazioni) righe.push(await citazioneFtm(ci, evento.id));
    }
    for (const l of tutte.legami) righe.push(await legameFtm(l));
    return righe.map(r => JSON.stringify(r)).join('\n') + '\n';
};

/** Pacchetto JSONL di scambio: intestazione, poi un record per riga. */
export const esportaPacchetto = async (casi: CaseData[]): Promise<string> => {
    const quando = new Date().toISOString();
    const tutte = raccogli(casi);
    const righe: object[] = [{ record: 'pacchetto', app: 'acta-diurna', formato: 1, mietitore: MIETITORE, quando }];
    for (const c of casi) {
        righe.push({
            record: 'caso', uid: await idEvento(c), id_provvedimento: chiaveCaso(c.caseID), mietitore: MIETITORE, quando,
            titolo: c.summary.title, data: c.summary.dateOfOperation, categorie: c.summary.crimeTypes,
            luoghi: c.summary.location.cities.map(x => x.name), fonti: c.provenance.map(p => p.url),
        });
        // Sentenze di Iudex collegate dall'analista: candidati, non fusioni di identita'.
        for (const r of c.riscontri_iudex ?? []) {
            righe.push({ record: 'riscontro', uid: r.uid_entita, id_provvedimento: chiaveCaso(c.caseID), ...r });
        }
    }
    tutte.persone.forEach(p => righe.push({ record: 'persona', ...p, quando }));
    tutte.societa.forEach(s => righe.push({ record: 'societa', ...s, quando }));
    tutte.citazioni.forEach(ci => righe.push({ record: 'citazione', uid: ci.uid_entita, ...ci, quando }));
    tutte.legami.forEach(l => righe.push({ record: 'legame', uid: `${l.uid_persona}|${l.uid_societa}`, ...l, quando }));
    return righe.map(r => JSON.stringify(r)).join('\n') + '\n';
};

/** Scarica un testo come file, dal browser. */
export const scarica = (contenuto: string, nome: string, tipo = 'application/x-ndjson') => {
    const url = URL.createObjectURL(new Blob([contenuto], { type: `${tipo};charset=utf-8` }));
    const a = document.createElement('a');
    a.href = url;
    a.download = nome;
    a.click();
    URL.revokeObjectURL(url);
};
