import { describe, expect, it, vi } from 'vitest';

// I moduli che toccano IndexedDB o le chiavi non servono a queste prove.
vi.mock('../src/db', () => ({ getActivePrompt: vi.fn(), incrementAndGetCaseCounter: vi.fn(), getSettings: vi.fn(), setSettings: vi.fn() }));
vi.mock('../src/services/llm', () => ({ runPhase: vi.fn(), LlmError: class extends Error {} }));

import { costruisciEntita, daLegacy, unisciEntita } from '../src/services/entita';
import { categorieValide, processProvenance } from '../src/services/aiService';
import { esportaFtm, esportaPacchetto } from '../src/services/esportaEntita';
import { uidPersona } from '../src/utils/entitaUid';
import type { CaseData } from '../src/types';

const caso = { caseID: '20261029-ORG-002', dataArticolo: '2026-10-28' };

describe('regole delle entità', () => {
    it('scarta codice fiscale e P.IVA non validi, tiene quelli validi', async () => {
        const e = await costruisciEntita({
            persone: [{ nome_completo: 'Mario Rossi', cf: 'RSSMRA85T10A562T' }, { nome_completo: 'Mario Rossi', cf: 'RSSMRA85T10A562S' }],
            societa: [{ ragione_sociale: 'Alfa', forma: 'srl', piva: '00488410011' }],
        }, caso);
        expect(e.persone.map(p => p.cf)).toEqual([null, 'RSSMRA85T10A562S']);
        expect(e.societa[0].piva).toBeNull();
    });

    it('il sesso non si deduce dal nome: si legge dal codice fiscale o da «nata»', async () => {
        const e = await costruisciEntita({ persone: [
            { nome_completo: 'Andrea Fiore', sesso: 'M', sesso_fonte: null },
            { nome_completo: 'Maria Bianchi', sesso: 'F', sesso_fonte: 'nascita' },
            { nome_completo: 'Mario Rossi', cf: 'RSSMRA85T10A562S' },
        ] }, caso);
        expect(e.persone.map(p => [p.sesso, p.sesso_fonte])).toEqual([[null, null], ['F', 'nascita'], ['M', 'cf']]);
    });

    it('data incompleta scartata; dall\'età due anni di nascita candidati', async () => {
        const e = await costruisciEntita({ persone: [{ nome_completo: 'Carlo Bianchi', data_nascita: '1980-02', eta: 46 }] }, caso);
        expect(e.persone[0].data_nascita).toBeNull();
        expect(e.persone[0].anni_nascita_stimati).toEqual([1979, 1980]);
    });

    it('stessa persona a parole invertite: un solo uid, citazioni unite', async () => {
        const e = await costruisciEntita({ persone: [
            { nome_completo: 'FIORE ANDREA', data_nascita: '1975-06-30', luogo_nascita: 'Reggio Calabria (RC)', posizione: 'arrestato' },
            { nome_completo: 'Andrea Fiore', data_nascita: '1975-06-30', luogo_nascita: 'Reggio Calabria', ruolo: 'imprenditore' },
        ] }, caso);
        expect(e.persone).toHaveLength(1);
        expect(e.citazioni).toHaveLength(2);
    });

    it('legame agganciato alla persona e alla società del caso', async () => {
        const e = await costruisciEntita({
            persone: [{ nome_completo: 'Carlo Bianchi' }],
            societa: [{ ragione_sociale: 'Edil Sud', forma: 's.r.l.' }],
            legami: [{ persona: 'Carlo Bianchi', societa: 'Edil Sud s.r.l.', ruolo: 'amministratore di fatto', tipo: 'amministrazione', qualifica: 'di fatto' }],
        }, caso);
        expect(e.legami).toHaveLength(1);
        expect(e.legami[0].uid_societa).toBe(e.societa[0].uid);
    });

    it('migrazione dal formato 0.3 e unione senza perdere dati', async () => {
        const vecchie = await costruisciEntita(daLegacy({
            individuals: [{ name: 'Carlo Bianchi', age: 46, legalAction: 'ai domiciliari', role: 'sindaco', dateOfBirth: null }],
            companies: [{ name: 'Edil Sud', legalAction: 'sotto sequestro' }],
        }), caso, 'migrazione');
        expect(vecchie.citazioni.map(c => [c.ruolo, c.posizione])).toEqual([['sindaco', 'ai domiciliari'], ['sotto sequestro', null]]);
        const nuove = await costruisciEntita({ persone: [{ nome_completo: 'Carlo Bianchi', luogo_nascita: 'Cosenza' }] }, caso);
        const unite = unisciEntita(vecchie, nuove);
        expect(unite.persone).toHaveLength(1);
        expect(unite.persone[0].luogo_nascita).toBe('Cosenza');
        expect(unite.persone[0].eta).toBe(46);
        expect(unite.persone[0].uid).toBe(await uidPersona({ nome: 'Carlo Bianchi', provvedimento: 'acta:20261029-ORG-002' }));
    });
});

describe('fonti e categorie', () => {
    const consultate = [{ uri: 'https://www.ansa.it/calabria/notizie/2026/10/28/ndrangheta_123.html', title: "'Ndrangheta, 41 misure - ANSA" }];

    it('fonte accettata per URL, anche senza www, con barra finale e utm', () => {
        const [c] = processProvenance([{ summary: { title: 'x' } as any, provenance: [
            { sourceType: 'Primary', sourceName: 'ANSA', url: 'https://ansa.it/calabria/notizie/2026/10/28/ndrangheta_123.html/?utm_source=x' },
        ] }], consultate);
        expect(c?.provenance).toHaveLength(1);
    });

    it('fonte non consultata scartata anche con il titolo simile: il caso Wikipedia', () => {
        const [c] = processProvenance([{ summary: { title: 'x' } as any, provenance: [
            { sourceType: 'Primary', sourceName: "'Ndrangheta, 41 misure - ANSA", url: 'https://en.wikipedia.org/wiki/Antimafia_Pool' },
        ] }], consultate);
        expect(c).toBeNull();
    });

    it('solo i nove codici: fuori elenco si scarta, vuoto diventa OTHER', () => {
        expect(categorieValide(['organized_crime', 'Associazione di tipo mafioso', 'EXTORTION'])).toEqual(['ORGANIZED_CRIME', 'EXTORTION']);
        expect(categorieValide(['Bancarotta fraudolenta'])).toEqual(['OTHER']);
        expect(categorieValide(undefined)).toEqual(['OTHER']);
    });
});

describe('esportazione', () => {
    it('FtM con id = uid e pacchetto con intestazione', async () => {
        const entita = await costruisciEntita({
            persone: [{ nome_completo: 'Carlo Bianchi', posizione: 'arrestato' }],
            societa: [{ ragione_sociale: 'Edil Sud', forma: 's.r.l.', piva: '08973230967' }],
            legami: [{ persona: 'Carlo Bianchi', societa: 'Edil Sud', ruolo: 'amministratore unico', tipo: 'amministrazione' }],
        }, caso);
        const c = {
            caseID: caso.caseID,
            summary: { title: 'Operazione di prova', crimeTypes: ['ORGANIZED_CRIME'], dateOfOperation: '2026-10-28', location: { cities: [{ name: 'Cosenza' }], regions: ['Calabria'] } },
            details: { investigationReason: 'associazione mafiosa' },
            provenance: [{ url: 'https://www.ansa.it/x' }],
            entita,
        } as unknown as CaseData;

        const testo = await esportaFtm([c]);
        const ftm = testo.trim().split('\n').map(r => JSON.parse(r));
        expect(ftm.map(r => r.schema).sort()).toEqual(['Company', 'Directorship', 'Event', 'Person', 'UnknownLink', 'UnknownLink']);
        expect(ftm.find(r => r.schema === 'Person').id).toBe(entita.persone[0].uid);
        expect(ftm.find(r => r.schema === 'Company').properties.vatCode).toEqual(['08973230967']);

        const pacchetto = (await esportaPacchetto([c])).trim().split('\n').map(r => JSON.parse(r));
        expect(pacchetto[0]).toMatchObject({ record: 'pacchetto', app: 'acta-diurna', formato: 1 });

        // Con FTM_OUT impostata, il file si scrive per validarlo con la libreria ftm.
        if (process.env.FTM_OUT) (await import('node:fs')).writeFileSync(process.env.FTM_OUT, testo);
    });
});
