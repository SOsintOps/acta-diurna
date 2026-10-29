// Normalizzazione e convalida degli identificativi, secondo il formato comune
// delle entita' condiviso con Iudex e Praeco. Ogni funzione ha lo stesso nome e
// lo stesso comportamento dell'implementazione di riferimento in Python: i casi
// di prova in tests/fixtures/entita-casi-prova.jsonl lo verificano.

/** N: senza accenti, solo lettere, maiuscolo, apostrofi e spazi ridotti a uno. */
export const N = (testo: string | null | undefined): string =>
    (testo ?? '')
        .normalize('NFKD')
        .replace(/\p{M}/gu, '')
        .replace(/[^A-Za-z' ]+/g, ' ')
        .toUpperCase()
        .replace(/'/g, ' ')
        .split(' ')
        .filter(Boolean)
        .join(' ');

/** O: le parole del nome in ordine, cosi' «FIORE ANDREA» e «Andrea Fiore» coincidono. */
export const O = (nome: string | null | undefined): string =>
    N(nome).split(' ').filter(Boolean).sort().join(' ');

/** L: luogo senza la sigla di provincia finale fra parentesi. */
export const L = (luogo: string | null | undefined): string =>
    N((luogo ?? '').replace(/\s*\([A-Za-z]{2}\)\s*$/, ''));

/** F: forma giuridica senza spazi: S.r.l., s.r.l. e srl danno SRL. */
export const F = (forma: string | null | undefined): string => N(forma).replace(/ /g, '');

const compatto = (codice: string | null | undefined) => (codice ?? '').toUpperCase().replace(/ /g, '');

const DISPARI: Record<string, number> = {};
'0123456789'.split('').forEach((c, i) => { DISPARI[c] = [1, 0, 5, 7, 9, 13, 15, 17, 19, 21][i]; });
'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach((c, i) => {
    DISPARI[c] = [1, 0, 5, 7, 9, 13, 15, 17, 19, 21, 2, 4, 18, 20, 11, 3, 6, 8, 12, 14, 16, 10, 22, 25, 24, 23][i];
});

/** Codice fiscale di persona con il carattere di controllo giusto (omocodia ammessa). */
export const cfPersonaValido = (codice: string | null | undefined): boolean => {
    const cf = compatto(codice);
    if (!/^[A-Z]{6}[0-9LMNPQRSTUV]{2}[A-EHLMPRST][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$/.test(cf)) {
        return false;
    }
    let somma = 0;
    for (let i = 0; i < 15; i++) {
        const c = cf[i];
        // Posizioni dispari contando da 1, cioe' indici pari.
        somma += i % 2 === 0 ? DISPARI[c] : /\d/.test(c) ? Number(c) : c.charCodeAt(0) - 65;
    }
    return cf[15] === String.fromCharCode(65 + (somma % 26));
};

/** P.IVA o codice fiscale numerico di 11 cifre con la cifra di controllo giusta. */
export const numericoValido = (codice: string | null | undefined): boolean => {
    const c = (codice ?? '').replace(/ /g, '');
    if (!/^\d{11}$/.test(c)) return false;
    let somma = 0;
    for (let i = 0; i < 10; i++) {
        let d = Number(c[i]);
        if (i % 2 === 1) {
            d *= 2;
            if (d > 9) d -= 9;
        }
        somma += d;
    }
    return (10 - (somma % 10)) % 10 === Number(c[10]);
};

/** REA come SIGLA-NUMERO, numero senza zeri iniziali; null se non riconoscibile. */
export const normRea = (valore: string | null | undefined): string | null => {
    const m = /^\s*([A-Za-z]{2})\s*[- ]?\s*0*(\d+)\s*$/.exec(valore ?? '');
    return m ? `${m[1].toUpperCase()}-${m[2]}` : null;
};

/** Codice fiscale da salvare: solo se valido, nella forma compatta. */
export const cfDaSalvare = (codice: string | null | undefined): string | null =>
    cfPersonaValido(codice) || numericoValido(codice) ? compatto(codice) : null;

/** Data completa AAAA-MM-GG, altrimenti null: le date parziali non si salvano. */
export const dataCompleta = (data: string | null | undefined): string | null => {
    if (!data || !/^\d{4}-\d{2}-\d{2}$/.test(data)) return null;
    const d = new Date(`${data}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === data ? data : null;
};
