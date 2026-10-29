import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/db', () => ({ getSettings: vi.fn(), setSettings: vi.fn() }));

import { frasePersona, fraseSocieta } from '../src/services/iudex';
import { creaPonteIudex, gestoreIudex, ripulisciFrammento } from '../server/iudex';

describe('frasi di ricerca', () => {
    it('persona: le due forme del nome e il codice fiscale', () => {
        expect(frasePersona({ nome: null, cognome: null, nome_come_scritto: 'Carlo Bianchi', cf: null }))
            .toBe('"Carlo Bianchi" OR "Bianchi Carlo"');
        expect(frasePersona({ nome: 'Gian Luca', cognome: 'De Rossi', nome_come_scritto: 'Gian Luca De Rossi', cf: 'RSSMRA85T10A562S' }))
            .toBe('"Gian Luca De Rossi" OR "De Rossi Gian Luca" OR "RSSMRA85T10A562S"');
        expect(frasePersona({ nome: null, cognome: null, nome_come_scritto: 'Totò "il Corto"', cf: null }))
            .toBe('"Totò il Corto"');
    });
    it('società: ragione sociale senza forma, poi P.IVA', () => {
        expect(fraseSocieta({ ragione_sociale: 'Edil Sud', piva: '08973230967', cf: '08973230967' })).toBe('"Edil Sud" OR "08973230967"');
    });
    it('frammenti evidenziati di Iudex in testo semplice', () => {
        expect(ripulisciFrammento('ricorso di <em class="hit">Carlo</em> <em class="hit">Bianchi</em> &amp; altri')).toBe('ricorso di «Carlo» «Bianchi» & altri');
    });
});

// --- ponte contro un finto Iudex --------------------------------------------------------

const TOKEN = 'token-di-prova';
let server: Server | null = null;

const fintoIudex = async (gestisci: (req: IncomingMessage, res: ServerResponse) => void) => {
    server = createServer(gestisci);
    await new Promise<void>(r => server!.listen(0, '127.0.0.1', r));
    return (server.address() as AddressInfo).port;
};

afterEach(() => { server?.close(); server = null; });

const cartellaConToken = (token: string) => {
    const cartella = mkdtempSync(join(tmpdir(), 'iudex-'));
    writeFileSync(join(cartella, 'token'), token);
    return cartella;
};

const json = (res: ServerResponse, status: number, corpo: unknown) => { res.statusCode = status; res.end(JSON.stringify(corpo)); };

const iudexStandard = (registro: string[]) => (req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url!, 'http://x');
    registro.push(url.pathname + url.search);
    if (url.pathname === '/health') return json(res, 200, { app: 'iudex', versione: '0.8.2' });
    if (req.headers['x-iudex'] !== '1' || req.headers['x-iudex-token'] !== TOKEN) return json(res, 401, {});
    if (url.pathname === '/api/stato') return json(res, 200, {});
    if (url.pathname === '/api/locale/cerca') return json(res, 200, { trovati: 1, risultati: [
        { id_sentenza: 'snpen1', estremi: { tipo: 'Sentenza', numero: '1', anno: '2026', sezione: 'Seconda', ecli: 'ECLI:IT:CASS:2026:1PEN' }, estratto: 'di «Carlo» «Bianchi»' },
    ] });
    if (url.pathname === '/api/cerca') return json(res, 200, { trovati: 40, documenti: [
        { id: 'snpen2', tipo: 'Ordinanza', numero: '2', anno: '2025', sezione: 'Sesta', ecli: 'ECLI:IT:CASS:2025:2PEN', frammenti: ['<em class="hit">Bianchi</em> Carlo'], pdf: 'https://www.italgiure.giustizia.it/x.pdf' },
    ] });
    json(res, 404, {});
};

describe('ponte con Iudex', () => {
    it('trova Iudex, legge il token dalla cartella dei dati e uniforma i risultati', async () => {
        const registro: string[] = [];
        const porta = await fintoIudex(iudexStandard(registro));
        const ponte = creaPonteIudex({ env: { IUDEX_DATI: cartellaConToken(TOKEN) }, porte: [porta] });

        expect(await ponte.stato()).toEqual({ attivo: true, versione: '0.8.2' });
        const locale = await ponte.cerca('"Carlo Bianchi"', 'locale', 1);
        expect(locale.sentenze[0]).toMatchObject({ id_sentenza: 'snpen1', numero: '1', ecli: 'ECLI:IT:CASS:2026:1PEN', pdf: null });
        const corte = await ponte.cerca('"Carlo Bianchi"', 'corte', 1);
        expect(corte.trovati).toBe(40);
        expect(corte.sentenze[0]).toMatchObject({ id_sentenza: 'snpen2', estratto: '«Bianchi» Carlo', pdf: 'https://www.italgiure.giustizia.it/x.pdf' });
        expect(registro.some(r => r.startsWith('/api/cerca?testo=%22Carlo+Bianchi%22'))).toBe(true);
    });

    it('senza un token valido Iudex risulta spento', async () => {
        const porta = await fintoIudex(iudexStandard([]));
        const ponte = creaPonteIudex({ env: { IUDEX_DATI: cartellaConToken('sbagliato') }, porte: [porta] });
        expect(await ponte.stato()).toEqual({ attivo: false });
        await expect(ponte.cerca('x', 'locale', 1)).rejects.toThrow(/non è in esecuzione/);
    });

    it('sulla Corte una richiesta alla volta, anche se ne arrivano due insieme', async () => {
        let inVolo = 0;
        let massimo = 0;
        const porta = await fintoIudex((req, res) => {
            const url = new URL(req.url!, 'http://x');
            if (url.pathname !== '/api/cerca') return iudexStandard([])(req, res);
            inVolo++; massimo = Math.max(massimo, inVolo);
            setTimeout(() => { inVolo--; json(res, 200, { trovati: 0, documenti: [] }); }, 50);
        });
        const ponte = creaPonteIudex({ env: { IUDEX_DATI: cartellaConToken(TOKEN) }, porte: [porta] });
        await Promise.all([ponte.cerca('"A"', 'corte', 1), ponte.cerca('"B"', 'corte', 1)]);
        expect(massimo).toBe(1);
    });

    it('il gestore rifiuta le altre origini e non restituisce mai il token', async () => {
        const porta = await fintoIudex(iudexStandard([]));
        const gestore = gestoreIudex(creaPonteIudex({ env: { IUDEX_DATI: cartellaConToken(TOKEN) }, porte: [porta] }));
        const chiama = (url: string, headers: Record<string, string> = {}) => new Promise<{ status: number; corpo: string }>(risolvi => {
            const res: any = { statusCode: 0, setHeader() {}, end(corpo: string) { risolvi({ status: res.statusCode, corpo }); } };
            gestore({ url, headers } as any, res, () => risolvi({ status: -1, corpo: '' }));
        });
        expect((await chiama('/__acta/iudex/stato', { 'sec-fetch-site': 'cross-site' })).status).toBe(403);
        const stato = await chiama('/__acta/iudex/stato');
        expect(stato.status).toBe(200);
        const cerca = await chiama('/__acta/iudex/cerca?q=%22Carlo%20Bianchi%22&dove=locale');
        expect(cerca.status).toBe(200);
        for (const r of [stato, cerca]) expect(r.corpo).not.toContain(TOKEN);
        expect((await chiama('/__acta/iudex/cerca?q=')).status).toBe(422);
        expect((await chiama('/altro')).status).toBe(-1);
    });
});
