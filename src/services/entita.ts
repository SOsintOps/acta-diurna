import type {
    Citazione, EntitaCaso, EntitaEstratte, EntitaLegacy, Legame, Persona, PersonaEstratta,
    Societa, SocietaEstratta, TipoLegame, TipoSocieta,
} from '../types';
import { chiaveCaso, uidPersona, uidSocieta } from '../utils/entitaUid';
import { N, O, cfDaSalvare, cfPersonaValido, dataCompleta, normRea, numericoValido } from '../utils/identificativi';

// Dalle entita' come le restituisce il modello al formato comune con Iudex
// (formato comune delle entita'). Il modello propone, il
// codice decide: codici fiscali e P.IVA solo se validi, date solo se complete,
// sesso solo dalle fonti ammesse, mai dal nome proprio.

export const MIETITORE = 'acta-diurna';

const TIPI_SOCIETA: TipoSocieta[] = ['societa', 'ente_pubblico', 'organizzazione'];
const TIPI_LEGAME: TipoLegame[] = ['amministrazione', 'proprieta', 'dipendenza', 'rappresentanza', 'appartenenza'];

const testo = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);

/** Sesso dal codice fiscale: giorno di nascita oltre 40 = donna. */
const sessoDaCf = (cf: string): 'M' | 'F' => {
    const giorno = cf.slice(9, 11).replace(/[LMNPQRSTUV]/g, c => String('LMNPQRSTUV'.indexOf(c)));
    return Number(giorno) > 40 ? 'F' : 'M';
};

/** Nome e cognome: dal modello se li separa, altrimenti l'ultima parola e' il cognome, senza certezza. */
const separaNome = (p: PersonaEstratta): { nome: string; cognome: string; ordine_certo: boolean } => {
    const nome = testo(p.nome);
    const cognome = testo(p.cognome);
    if (nome && cognome) {
        return { nome, cognome, ordine_certo: Boolean(p.ordine_certo) };
    }
    const parole = p.nome_completo.trim().split(/\s+/);
    if (parole.length < 2) return { nome: '', cognome: parole[0] ?? '', ordine_certo: false };
    return { nome: parole.slice(0, -1).join(' '), cognome: parole[parole.length - 1], ordine_certo: false };
};

const anniStimati = (eta: number | null, dataArticolo: string | null): [number, number] | null => {
    if (eta === null || !Number.isFinite(eta) || eta <= 0 || eta > 120) return null;
    const anno = new Date(dataArticolo ?? Date.now()).getFullYear();
    if (!Number.isFinite(anno)) return null;
    // Chi ha N anni alla data dell'articolo e' nato nell'anno meno N, o in quello prima
    // se il compleanno non e' ancora arrivato.
    return [anno - eta - 1, anno - eta];
};

interface Contesto {
    caseID: string;
    /** Data dell'articolo o dell'operazione, per stimare l'anno di nascita. */
    dataArticolo: string | null;
    fonte: Citazione['fonte'];
    adesso: string;
}

const costruisciPersona = async (p: PersonaEstratta, ctx: Contesto): Promise<{ persona: Persona; citazione: Citazione } | null> => {
    const nomeCompleto = testo(p.nome_completo);
    if (!nomeCompleto || !N(nomeCompleto)) return null;
    const cf = cfPersonaValido(p.cf) ? cfDaSalvare(p.cf) : null;
    const data_nascita = dataCompleta(p.data_nascita);
    const luogo_nascita = testo(p.luogo_nascita);
    const { nome, cognome, ordine_certo } = separaNome({ ...p, nome_completo: nomeCompleto });

    let sesso: Persona['sesso'] = null;
    let sesso_fonte: Persona['sesso_fonte'] = null;
    if (cf) {
        sesso = sessoDaCf(cf);
        sesso_fonte = 'cf';
    } else if ((p.sesso === 'M' || p.sesso === 'F') && (p.sesso_fonte === 'nascita' || p.sesso_fonte === 'qualifica')) {
        sesso = p.sesso;
        sesso_fonte = p.sesso_fonte;
    }

    const eta = typeof p.eta === 'number' ? Math.round(p.eta) : null;
    const provvedimento = chiaveCaso(ctx.caseID);
    const uid = await uidPersona({ nome: nomeCompleto, data_nascita, luogo_nascita, cf, provvedimento });

    return {
        persona: {
            uid, nome, cognome, ordine_certo, sesso, sesso_fonte, data_nascita, luogo_nascita, cf,
            creato_il: ctx.adesso, mietitore: MIETITORE,
            nome_come_scritto: nomeCompleto, eta, anni_nascita_stimati: data_nascita ? null : anniStimati(eta, ctx.dataArticolo),
        },
        citazione: {
            uid_entita: uid, tipo_entita: 'persona', id_provvedimento: provvedimento,
            ruolo: testo(p.ruolo), fonte: ctx.fonte, mietitore: MIETITORE, creato_il: ctx.adesso,
            posizione: testo(p.posizione), fonte_url: testo(p.fonte_url),
        },
    };
};

const costruisciSocieta = async (s: SocietaEstratta, ctx: Contesto): Promise<{ societa: Societa; citazione: Citazione } | null> => {
    const ragione_sociale = testo(s.ragione_sociale);
    if (!ragione_sociale || !N(ragione_sociale)) return null;
    const cf = cfDaSalvare(s.cf);
    const piva = numericoValido(s.piva) ? s.piva!.replace(/ /g, '') : null;
    const rea = normRea(s.rea);
    const forma = testo(s.forma);
    const paese = (testo(s.paese) ?? (forma ? 'it' : null))?.toLowerCase() ?? null;
    const provvedimento = chiaveCaso(ctx.caseID);
    const uid = await uidSocieta({ ragione_sociale, forma, paese, cf, piva, rea, provvedimento });

    return {
        societa: {
            uid, ragione_sociale, forma, cf, piva, rea, paese,
            tipo: TIPI_SOCIETA.includes(s.tipo as TipoSocieta) ? s.tipo as TipoSocieta : 'societa',
            sede: testo(s.sede), stato: testo(s.stato), creato_il: ctx.adesso, mietitore: MIETITORE,
            attivita: testo(s.attivita), settore: testo(s.settore),
            valore_beni: typeof s.valore_beni === 'number' && Number.isFinite(s.valore_beni) ? s.valore_beni : null,
        },
        citazione: {
            uid_entita: uid, tipo_entita: 'societa', id_provvedimento: provvedimento,
            ruolo: testo(s.ruolo), fonte: ctx.fonte, mietitore: MIETITORE, creato_il: ctx.adesso,
            posizione: null, fonte_url: testo(s.fonte_url),
        },
    };
};

const chiaveCitazione = (c: Citazione) => `${c.uid_entita}|${c.id_provvedimento}|${c.ruolo ?? ''}`;
const chiaveLegame = (l: Legame) => `${l.uid_persona}|${l.uid_societa}|${N(l.ruolo)}`;

/** Unisce per uid: un campo gia' noto non si cancella, uno nuovo si aggiunge. */
const unisci = <T extends { uid: string }>(a: T[], b: T[]): T[] => {
    const mappa = new Map(a.map(x => [x.uid, x]));
    for (const x of b) {
        const vecchio = mappa.get(x.uid);
        if (!vecchio) {
            mappa.set(x.uid, x);
            continue;
        }
        const fuso: any = { ...vecchio };
        for (const [k, v] of Object.entries(x)) {
            if (fuso[k] === null || fuso[k] === undefined || fuso[k] === '') fuso[k] = v;
        }
        mappa.set(x.uid, fuso);
    }
    return Array.from(mappa.values());
};

const unisciPer = <T>(a: T[], b: T[], chiave: (x: T) => string): T[] => {
    const mappa = new Map(a.map(x => [chiave(x), x]));
    for (const x of b) if (!mappa.has(chiave(x))) mappa.set(chiave(x), x);
    return Array.from(mappa.values());
};

export const entitaVuote = (): EntitaCaso => ({ persone: [], societa: [], citazioni: [], legami: [] });

export const unisciEntita = (a: EntitaCaso, b: EntitaCaso): EntitaCaso => ({
    persone: unisci(a.persone, b.persone),
    societa: unisci(a.societa, b.societa),
    citazioni: unisciPer(a.citazioni, b.citazioni, chiaveCitazione),
    legami: unisciPer(a.legami, b.legami, chiaveLegame),
});

/** Dalle entita' estratte dal modello a quelle del formato comune, per un caso. */
export const costruisciEntita = async (
    estratte: EntitaEstratte | null | undefined,
    caso: { caseID: string; dataArticolo?: string | null },
    fonte: Citazione['fonte'] = 'motore',
): Promise<EntitaCaso> => {
    const ctx: Contesto = { caseID: caso.caseID, dataArticolo: caso.dataArticolo ?? null, fonte, adesso: new Date().toISOString() };
    const persone = (await Promise.all((estratte?.persone ?? []).map(p => costruisciPersona(p, ctx)))).filter(x => x !== null);
    const societa = (await Promise.all((estratte?.societa ?? []).map(s => costruisciSocieta(s, ctx)))).filter(x => x !== null);

    const risultato: EntitaCaso = {
        persone: unisci([], persone.map(x => x.persona)),
        societa: unisci([], societa.map(x => x.societa)),
        citazioni: unisciPer([], [...persone.map(x => x.citazione), ...societa.map(x => x.citazione)], chiaveCitazione),
        legami: [],
    };

    // I legami si agganciano a persone e societa' del caso per nome.
    const perNome = new Map(persone.map(x => [O(x.persona.nome_come_scritto), x.persona.uid]));
    const perRagione = new Map(societa.map(x => [N(x.societa.ragione_sociale), x.societa.uid]));
    for (const l of estratte?.legami ?? []) {
        const uid_persona = perNome.get(O(l.persona));
        const uid_societa = perRagione.get(N(l.societa)) ?? perRagione.get(N(l.societa.replace(/\s+(s\.?r\.?l\.?|s\.?p\.?a\.?|s\.?a\.?s\.?|s\.?n\.?c\.?)\s*$/i, '')));
        const ruolo = testo(l.ruolo);
        if (!uid_persona || !uid_societa || !ruolo) continue;
        risultato.legami = unisciPer(risultato.legami, [{
            uid_persona, uid_societa, ruolo,
            tipo: TIPI_LEGAME.includes(l.tipo as TipoLegame) ? l.tipo as TipoLegame : null,
            qualifica: l.qualifica === 'di diritto' || l.qualifica === 'di fatto' ? l.qualifica : null,
            id_provvedimento: chiaveCaso(caso.caseID), fonte, mietitore: MIETITORE, creato_il: ctx.adesso,
        }], chiaveLegame);
    }
    return risultato;
};

/** Le entita' del formato fino alla 0.3, come se le avesse estratte il modello. */
export const daLegacy = (legacy: EntitaLegacy | null | undefined): EntitaEstratte => ({
    persone: (legacy?.individuals ?? []).map(p => ({
        nome_completo: p.name,
        data_nascita: p.dateOfBirth,
        eta: p.age,
        ruolo: p.role,
        posizione: p.legalAction,
    })),
    societa: (legacy?.companies ?? []).map(c => ({
        ragione_sociale: c.name,
        ruolo: c.legalAction,
    })),
});

/** Le entita' di un caso, anche se l'archivio non e' ancora migrato. */
export const entitaDelCaso = (c: { entita?: EntitaCaso }): EntitaCaso => c.entita ?? entitaVuote();

/** Citazioni di un'entita' nel caso, per mostrare ruolo e posizione accanto al nome. */
export const citazioniDi = (e: EntitaCaso, uid: string): Citazione[] => e.citazioni.filter(c => c.uid_entita === uid);

// --- Presentazione -----------------------------------------------------------

const unico = (valori: (string | null | undefined)[]) => Array.from(new Set(valori.filter((v): v is string => Boolean(v))));

export const nomePersona = (p: Persona): string =>
    p.ordine_certo && p.nome && p.cognome ? `${p.nome} ${p.cognome}` : p.nome_come_scritto;

export const nomeSocieta = (s: Societa): string => [s.ragione_sociale, s.forma].filter(Boolean).join(' ');

/** Ruoli e posizioni di un'entita' nel caso, per esempio «sindaco, ai domiciliari». */
export const ruoliDi = (e: EntitaCaso, uid: string): string =>
    unico(citazioniDi(e, uid).flatMap(c => [c.ruolo, c.posizione])).join(', ');

/** Nascita: data e luogo se noti, altrimenti eta' e anni stimati. */
export const nascitaPersona = (p: Persona): string => {
    const nato = p.sesso === 'F' ? 'nata' : p.sesso === 'M' ? 'nato' : 'nato/a';
    if (p.data_nascita) return `${nato} il ${p.data_nascita}${p.luogo_nascita ? ` a ${p.luogo_nascita}` : ''}`;
    const parti: string[] = [];
    if (p.luogo_nascita) parti.push(`${nato} a ${p.luogo_nascita}`);
    if (p.eta !== null) parti.push(`${p.eta} anni`);
    if (p.anni_nascita_stimati) parti.push(`nascita stimata ${p.anni_nascita_stimati[0]}-${p.anni_nascita_stimati[1]}`);
    return parti.join(', ');
};

/** Dettagli di una societa': identificativi, sede, stato, valore dei beni. */
export const dettagliSocieta = (s: Societa): string => unico([
    s.tipo !== 'societa' ? s.tipo.replace('_', ' ') : null,
    s.piva ? `P.IVA ${s.piva}` : null,
    s.cf && s.cf !== s.piva ? `CF ${s.cf}` : null,
    s.rea ? `REA ${s.rea}` : null,
    s.sede, s.stato,
    s.attivita, s.settore,
    s.valore_beni !== null ? `beni per ${s.valore_beni.toLocaleString('it-IT')} €` : null,
]).join(' · ');

/** Testo in cui cercare un caso per nome di persona o societa'. */
export const testoRicercabile = (e: EntitaCaso): string =>
    [...e.persone.map(p => `${p.nome_come_scritto} ${p.cf ?? ''}`), ...e.societa.map(s => `${nomeSocieta(s)} ${s.piva ?? ''} ${s.cf ?? ''}`)].join(' ').toLowerCase();
