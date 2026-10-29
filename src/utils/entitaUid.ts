import { F, L, N, O, cfPersonaValido, dataCompleta, normRea, numericoValido } from './identificativi';

// uid di persone e societa' secondo il formato comune con Iudex e Praeco: la
// stessa entita' ha lo stesso uid in ogni app, e l'uid e' anche il suo id
// FollowTheMoney.

/** H: primi 16 caratteri esadecimali dello sha256 del testo UTF-8. */
export const H = async (testo: string): Promise<string> => {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(testo));
    return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
};

/** Chiave del provvedimento di un caso di Acta Diurna, distinta dagli id delle sentenze. */
export const chiaveCaso = (caseID: string): string => `acta:${caseID}`;

export interface IdentitaPersona {
    nome: string;
    data_nascita?: string | null;
    luogo_nascita?: string | null;
    cf?: string | null;
    /** Chiave del provvedimento: serve quando la persona non si puo' fondere con altre. */
    provvedimento: string;
}

export const uidPersona = async (p: IdentitaPersona): Promise<string> => {
    if (cfPersonaValido(p.cf)) {
        return H(`persona|cf|${p.cf!.toUpperCase().replace(/ /g, '')}`);
    }
    const data = dataCompleta(p.data_nascita);
    if (data) {
        return H(`persona|${O(p.nome)}|${data}|${L(p.luogo_nascita)}`);
    }
    return H(`persona|${O(p.nome)}|${p.provvedimento}`);
};

export interface IdentitaSocieta {
    ragione_sociale: string;
    forma?: string | null;
    paese?: string | null;
    cf?: string | null;
    piva?: string | null;
    rea?: string | null;
    provvedimento: string;
}

export const uidSocieta = async (s: IdentitaSocieta): Promise<string> => {
    if (s.cf && (numericoValido(s.cf) || cfPersonaValido(s.cf))) {
        return H(`societa|cf|${s.cf.toUpperCase().replace(/ /g, '')}`);
    }
    if (numericoValido(s.piva)) {
        return H(`societa|piva|${s.piva!.replace(/ /g, '')}`);
    }
    const rea = normRea(s.rea);
    if (rea) {
        return H(`societa|rea|${rea}`);
    }
    if (s.forma) {
        return H(`societa|${N(s.ragione_sociale)}|${F(s.forma)}|${(s.paese ?? 'it').toLowerCase()}`);
    }
    return H(`societa|${N(s.ragione_sociale)}|${s.provvedimento}`);
};
