import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Il modello non si chiama mai: si cattura soltanto che cosa gli verrebbe mandato.
const chiamate: { system?: string; prompt: string }[] = [];
vi.mock('../src/services/llm', () => ({
    runPhase: vi.fn(async (_fase: string, richiesta: { system?: string; prompt: string }) => {
        chiamate.push(richiesta);
        return { text: '[]', sources: [] };
    }),
    LlmError: class extends Error {},
}));

import * as archivio from '../src/db';
import { generateCaseData } from '../src/services/aiService';
import type { CaseData } from '../src/types';

const caso = (id: string, campi: Partial<CaseData>): CaseData => ({
    caseID: id,
    initialReportTimestamp: '2026-10-29T08:00:00Z',
    lastUpdateTimestamp: campi.lastUpdateTimestamp ?? '2026-10-29T08:00:00Z',
    status: 'Active',
    summary: { title: `Caso ${id}`, crimeTypes: ['FRAUD'], location: { cities: [{ name: 'Roma', province: 'RM', region: 'Lazio', coords: { lat: 0, lng: 0 } }], regions: ['Lazio'] }, dateOfOperation: '2026-10-28' },
    details: { involvedForces: [], operationName: null, investigationReason: '', seizedAssetsValue: null, seizedAssetsDescription: null },
    provenance: [], updates: [], audio: { ttsScript: '', ttsScriptEn: '' },
    isImportant: false, hasReport: false, isRead: false,
    ...campi,
});

beforeEach(async () => {
    await archivio.db.cases.clear();
    await archivio.db.settings.clear();
    chiamate.length = 0;
});

describe('esempi del profilo', () => {
    it('la vecchia query sull\'indice non trovava i casi salvati con true', async () => {
        await archivio.addCases([caso('A', { isImportant: true })]);
        expect(await archivio.db.cases.where('isImportant').equals(1).count()).toBe(0);
    });

    it('importanti e con report si trovano, dal più recente', async () => {
        await archivio.addCases([
            caso('A', { isImportant: true, lastUpdateTimestamp: '2026-10-01T00:00:00Z' }),
            caso('B', { isImportant: true, lastUpdateTimestamp: '2026-10-20T00:00:00Z' }),
            caso('C', { hasReport: true }),
            caso('D', { hasReport: true, isImportant: true }),
            caso('E', { hasReport: true, status: 'Archived' }),
        ]);
        expect((await archivio.getImportantExamples()).map(c => c.caseID)).toEqual(['D', 'B', 'A']);
        expect((await archivio.getMediumPriorityExamples()).map(c => c.caseID)).toEqual(['C']);
    });
});

describe('che cosa arriva al modello nella rassegna', () => {
    it('il profilo contiene gli importanti e i motivi con il significato giusto', async () => {
        const importante = caso('IMP', { isImportant: true, summary: { ...caso('x', {}).summary, title: 'Frode con false ONLUS' } });
        const nonInteressa = caso('NO', { status: 'Archived', userFeedback: 'irrelevant_not_crime', summary: { ...caso('x', {}).summary, title: 'Furto in un supermercato' } });
        const fuori = caso('FP', { status: 'Archived', userFeedback: 'irrelevant_out_of_scope', summary: { ...caso('x', {}).summary, title: 'Sentenza di appello' } });
        await archivio.addCases([importante, nonInteressa, fuori]);

        await generateCaseData([], [], await archivio.getImportantExamples(), [], [], await archivio.getIrrelevantExamples());
        const prompt = chiamate[0].prompt;
        expect(prompt).toContain('Frode con false ONLUS');
        expect(prompt).toMatch(/Furto in un supermercato.*non interessa all'analista/);
        expect(prompt).toMatch(/Sentenza di appello.*fuori perimetro/);
    });
});
