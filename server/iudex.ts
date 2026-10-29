import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import {
    IUDEX_CERCA_PATH, IUDEX_STATO_PATH,
    type DoveIudex, type RisultatiIudex, type SentenzaTrovata, type StatoIudex,
} from '../src/services/iudexPath';

// Ponte con Iudex, lato server.
//
// Iudex accetta solo richieste con il suo header e il suo token, e non risponde
// al browser (niente CORS): la ricerca passa quindi dal server di Vite. Il token
// si legge qui, dal file della cartella dei dati di Iudex, e non arriva mai al
// browser. Per la Corte si usa la ricerca normale di Iudex, che ne regola il
// ritmo; qui si aggiunge solo una coda, cosi' parte una richiesta alla volta.

const PORTE = Array.from({ length: 20 }, (_, i) => 8765 + i);
const HOST = '127.0.0.1';

interface Istanza { base: string; token: string; versione: string }

const conTimeout = (ms: number) => AbortSignal.timeout(ms);

/** Cartelle in cui Iudex tiene il token: variabile, sorgenti, installazione. */
export const cartelleToken = (env: Record<string, string | undefined>): string[] => [
    env.IUDEX_DATI,
    'C:\\scripts\\Iudex\\dati',
    env.APPDATA ? join(env.APPDATA, 'Iudex') : undefined,
].filter((c): c is string => Boolean(c));

const leggiToken = async (cartella: string): Promise<string | null> => {
    try {
        return (await readFile(join(cartella, 'token'), 'utf8')).trim() || null;
    } catch {
        return null;
    }
};

/** Testo semplice da un frammento evidenziato di Iudex: <em> diventa «», il resto si toglie. */
export const ripulisciFrammento = (html: string): string =>
    html.replace(/<em[^>]*>/gi, '«').replace(/<\/em>/gi, '»').replace(/<[^>]+>/g, '')
        .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ').trim();

const daLocale = (r: any): SentenzaTrovata => ({
    id_sentenza: r.id_sentenza,
    tipo: r.estremi?.tipo ?? null, numero: r.estremi?.numero ?? null, anno: r.estremi?.anno ?? null,
    sezione: r.estremi?.sezione ?? null, archivio: r.estremi?.archivio ?? null,
    data_deposito: r.estremi?.data_deposito ?? null, ecli: r.estremi?.ecli ?? null,
    estratto: r.estratto ? String(r.estratto).replace(/\s+/g, ' ').trim() : null,
    pdf: null,
});

const daCorte = (d: any): SentenzaTrovata => ({
    id_sentenza: d.id,
    tipo: d.tipo ?? null, numero: d.numero ?? null, anno: d.anno ?? null,
    sezione: d.sezione ?? null, archivio: d.archivio ?? null,
    data_deposito: d.data_deposito ?? null, ecli: d.ecli ?? null,
    estratto: Array.isArray(d.frammenti) && d.frammenti.length > 0 ? ripulisciFrammento(d.frammenti.join(' … ')) : null,
    pdf: typeof d.pdf === 'string' ? d.pdf : null,
});

export interface OpzioniPonte {
    env: Record<string, string | undefined>;
    /** Per le prove: porte e fetch diversi da quelli veri. */
    porte?: number[];
    fetch?: typeof fetch;
}

export const creaPonteIudex = ({ env, porte = PORTE, fetch: f = globalThis.fetch }: OpzioniPonte) => {
    let istanza: Istanza | null = null;
    let coda: Promise<unknown> = Promise.resolve();

    const scopri = async (): Promise<Istanza | null> => {
        const vive = (await Promise.all(porte.map(async porta => {
            try {
                const r = await f(`http://${HOST}:${porta}/health`, { signal: conTimeout(400) });
                const corpo: any = await r.json();
                return corpo?.app === 'iudex' ? { base: `http://${HOST}:${porta}`, versione: String(corpo.versione ?? '') } : null;
            } catch {
                return null;
            }
        }))).filter((x): x is { base: string; versione: string } => x !== null);
        const tokens = (await Promise.all(cartelleToken(env).map(leggiToken))).filter((t): t is string => t !== null);
        for (const candidata of vive) {
            for (const token of tokens) {
                try {
                    const r = await f(`${candidata.base}/api/stato`, {
                        headers: { 'X-Iudex': '1', 'X-Iudex-Token': token }, signal: conTimeout(2000),
                    });
                    if (r.ok) return { ...candidata, token };
                } catch { /* prossimo */ }
            }
        }
        return null;
    };

    /** Chiamata autenticata; dopo un 401 si ricerca l'istanza una volta. */
    const chiama = async (percorso: string, parametri: Record<string, string>): Promise<any> => {
        for (let tentativo = 0; tentativo < 2; tentativo++) {
            istanza ??= await scopri();
            if (!istanza) throw new Error('Iudex non è in esecuzione su questo computer.');
            const url = `${istanza.base}${percorso}?${new URLSearchParams(parametri)}`;
            const r = await f(url, { headers: { 'X-Iudex': '1', 'X-Iudex-Token': istanza.token }, signal: conTimeout(60000) });
            if (r.status === 401 || r.status === 403) { istanza = null; continue; }
            if (!r.ok) throw new Error(`Iudex ha risposto ${r.status}: ${(await r.text()).slice(0, 200)}`);
            return r.json();
        }
        throw new Error('Iudex rifiuta il token: riavvialo o controlla la sua cartella dei dati.');
    };

    const stato = async (): Promise<StatoIudex> => {
        istanza = await scopri();
        return istanza ? { attivo: true, versione: istanza.versione } : { attivo: false };
    };

    const cerca = async (frase: string, dove: DoveIudex, pagina: number): Promise<RisultatiIudex> => {
        if (dove === 'locale') {
            const d = await chiama('/api/locale/cerca', { testo: frase, limite: '20' });
            return { dove, frase, trovati: d.trovati ?? 0, sentenze: (d.risultati ?? []).map(daLocale) };
        }
        // Verso la Corte, una richiesta alla volta anche se ne arrivano due insieme.
        const turno = coda.then(() => chiama('/api/cerca', { testo: frase, pagina: String(pagina), righe: '20' }));
        coda = turno.catch(() => undefined);
        const d = await turno;
        return { dove, frase, trovati: d.trovati ?? 0, sentenze: (d.documenti ?? []).map(daCorte) };
    };

    return { stato, cerca };
};

const invia = (res: ServerResponse, status: number, corpo: unknown) => {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify(corpo));
};

export const gestoreIudex = (ponte: ReturnType<typeof creaPonteIudex>) =>
    async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const url = new URL(req.url ?? '/', 'http://localhost');
        if (url.pathname !== IUDEX_STATO_PATH && url.pathname !== IUDEX_CERCA_PATH) return next();
        // Il ponte serve solo alla pagina dell'applicazione stessa.
        if (req.headers['sec-fetch-site'] === 'cross-site') {
            return invia(res, 403, { errore: "Richiesta da un'altra origine." });
        }
        try {
            if (url.pathname === IUDEX_STATO_PATH) {
                return invia(res, 200, await ponte.stato());
            }
            const frase = (url.searchParams.get('q') ?? '').trim();
            const dove = url.searchParams.get('dove') === 'corte' ? 'corte' : 'locale';
            const pagina = Math.max(1, Number(url.searchParams.get('pagina')) || 1);
            if (!frase || frase.length > 500) {
                return invia(res, 422, { dove, frase, trovati: 0, sentenze: [], errore: 'Frase di ricerca vuota o troppo lunga.' });
            }
            return invia(res, 200, await ponte.cerca(frase, dove, pagina));
        } catch (errore: any) {
            return invia(res, 502, { errore: errore?.message ?? 'Iudex non raggiungibile.' });
        }
    };

export const iudexPonte = (env: Record<string, string>): Plugin => {
    const gestore = gestoreIudex(creaPonteIudex({ env: { ...process.env, ...env } }));
    return {
        name: 'acta-iudex',
        configureServer(server) { server.middlewares.use(gestore); },
        configurePreviewServer(server) { server.middlewares.use(gestore); },
    };
};
