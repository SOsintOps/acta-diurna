// Confine tra l'applicazione e i fornitori di modelli. I prompt e la
// post-elaborazione dei casi stanno in services/aiService.ts e non sanno quale
// fornitore risponde; qui sta solo la forma della domanda e della risposta.

export type AiProvider = 'gemini' | 'claude';

/**
 * Le fasi in cui l'applicazione interroga un modello. Ogni fornitore puo'
 * usare un modello diverso per ciascuna: vedi la tabella in claude.ts.
 */
export type Phase =
    | 'search'
    | 'analyzeUrl'
    | 'updateCase'
    | 'deepDive'
    | 'revisePrompt'
    | 'translate'
    | 'geocode'
    | 'extractEntities';

export interface PhaseRequest {
    /**
     * Istruzioni fisse della fase: identita', regole, forma dell'uscita. Con
     * Claude vanno in cache, cosi' le chiamate successive le pagano un decimo.
     */
    system?: string;
    /** Dati della singola chiamata: data, caso, articolo, profilo. */
    prompt: string;
    /** La fase ha bisogno di cercare e leggere sul web. */
    webSearch?: boolean;
    /**
     * Schema JSON dell'uscita. Vincola la risposta dove il fornitore lo
     * permette; altrimenti la forma e' chiesta dal prompt e verificata da chi
     * chiama.
     */
    schema?: Record<string, unknown>;
}

/**
 * Errore gia' scritto per l'utente: chi lo riceve lo mostra cosi' com'e'
 * invece di sostituirlo con un messaggio generico.
 */
export class LlmError extends Error {}

export interface SourceRef {
    uri: string;
    title: string;
}

export interface PhaseResult {
    text: string;
    /**
     * Pagine che il modello ha effettivamente consultato. Vuoto quando la fase
     * non usa il web o il fornitore non le riporta.
     */
    sources: SourceRef[];
}
