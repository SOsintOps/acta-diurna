import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { uidPersona, uidSocieta } from '../src/utils/entitaUid';
import { N, cfPersonaValido, numericoValido, dataCompleta, normRea } from '../src/utils/identificativi';

// Casi di prova del formato comune delle entita' (Iudex, Praeco, Acta Diurna).
// La copia di riferimento e il generatore stanno nel repository di lavoro
// condiviso; qui c'e' una copia: se cambia la specifica, si aggiorna anche questa.
const casi = readFileSync(new URL('./fixtures/entita-casi-prova.jsonl', import.meta.url), 'utf8')
    .split('\n')
    .filter(Boolean)
    .map(riga => JSON.parse(riga));

describe('uid comuni con Iudex e Praeco', () => {
    it.each(casi)('$tipo: $nota', async ({ tipo, ingresso, uid }) => {
        const { provvedimento = '', ...resto } = ingresso;
        const calcolato = tipo === 'persona'
            ? await uidPersona({ provvedimento, ...resto })
            : await uidSocieta({ provvedimento, ...resto });
        expect(calcolato).toBe(uid);
    });
});

describe('convalida degli identificativi', () => {
    it('normalizza come Praeco', () => {
        expect(N("D'Angelo")).toBe('D ANGELO');
        expect(N('Niccolò  Gallo-Rossi')).toBe('NICCOLO GALLO ROSSI');
    });
    it('codice fiscale di persona', () => {
        expect(cfPersonaValido('RSSMRA85T10A562S')).toBe(true);
        expect(cfPersonaValido('rssmra85t10a562s')).toBe(true);
        expect(cfPersonaValido('RSSMRA85T10A562T')).toBe(false);
        expect(cfPersonaValido('RSSMRA85T10A562')).toBe(false);
    });
    it('P.IVA', () => {
        expect(numericoValido('08973230967')).toBe(true);
        expect(numericoValido('00488410011')).toBe(false);
        expect(numericoValido('1234567890')).toBe(false);
    });
    it('date solo complete e valide', () => {
        expect(dataCompleta('1980-01-01')).toBe('1980-01-01');
        expect(dataCompleta('1980-02-30')).toBeNull();
        expect(dataCompleta('1980-01')).toBeNull();
    });
    it('REA', () => {
        expect(normRea('mi-0123456')).toBe('MI-123456');
        expect(normRea('MI 123456')).toBe('MI-123456');
        expect(normRea('123456')).toBeNull();
    });
});
