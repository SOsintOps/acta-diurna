// Percorsi e forme di risposta del ponte con Iudex, condivisi tra il plugin del
// server (server/iudex.ts) e il browser. Questo file non deve importare nulla.

export const IUDEX_STATO_PATH = '/__acta/iudex/stato';
export const IUDEX_CERCA_PATH = '/__acta/iudex/cerca';

export type DoveIudex = 'locale' | 'corte';

export interface StatoIudex {
    attivo: boolean;
    versione?: string;
    errore?: string;
}

/** Una sentenza trovata, nella stessa forma per l'archivio locale e per la Corte. */
export interface SentenzaTrovata {
    id_sentenza: string;
    tipo: string | null;
    numero: string | null;
    anno: string | null;
    sezione: string | null;
    archivio: string | null;
    data_deposito: string | null;
    ecli: string | null;
    /** Brano con la frase cercata fra «», testo semplice. */
    estratto: string | null;
    /** PDF pubblico sul sito della Corte, quando c'e' e non e' in oscuramento. */
    pdf: string | null;
}

export interface RisultatiIudex {
    dove: DoveIudex;
    frase: string;
    trovati: number;
    sentenze: SentenzaTrovata[];
    errore?: string;
}
