import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ancoraDi } from '../src/utils/ancora';

const faq = readFileSync(new URL('../public/docs/FAQ.md', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const titoli = [...faq.matchAll(/^#{2,4} (.+)$/gm)].map(m => m[1]);
const ancore = new Set(titoli.map(ancoraDi));

describe('FAQ nel formato di Exploratores', () => {
    it('ancore come su GitHub', () => {
        expect(ancoraDi("Cos'è Acta Diurna?")).toBe('cosè-acta-diurna');
        expect(ancoraDi('Ho ricevuto un errore di "quota superata". Cosa faccio?')).toBe('ho-ricevuto-un-errore-di-quota-superata-cosa-faccio');
    });

    it("ogni link interno porta a un titolo che c'è", () => {
        const link = [...faq.matchAll(/\]\(#([^)]+)\)/g)].map(m => m[1]);
        expect(link.length).toBeGreaterThan(0);
        expect(link.filter(a => !ancore.has(a))).toEqual([]);
    });

    it("l'indice elenca tutte le domande, in ordine, e nessuna è numerata", () => {
        const indice = faq.split('## Indice\n')[1].split('\n## ')[0];
        const voci = [...indice.matchAll(/^\* \[(.+)\]\(#/gm)].map(m => m[1]);
        const domande = [...faq.matchAll(/^### (.+)$/gm)].map(m => m[1]);
        expect(voci).toEqual(domande);
        expect(domande.filter(d => /^\d/.test(d))).toEqual([]);
    });
});
