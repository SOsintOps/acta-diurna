// Ancora di un titolo come la calcola GitHub (github-slugger): minuscole, via la
// punteggiatura, spazi in trattini; le lettere accentate restano. Serve perché
// l'indice delle FAQ funzioni sia su GitHub sia nella finestra della documentazione.
export const ancoraDi = (titolo: string): string =>
    titolo
        .trim()
        .toLowerCase()
        .replace(/[^\p{L}\p{M}\p{N}\p{Pc} -]/gu, '')
        .replace(/ /g, '-');

// Testo semplice dei figli di un elemento React (i titoli possono contenere grassetti).
export const testoDi = (nodo: unknown): string => {
    if (nodo == null || typeof nodo === 'boolean') return '';
    if (typeof nodo === 'string' || typeof nodo === 'number') return String(nodo);
    if (Array.isArray(nodo)) return nodo.map(testoDi).join('');
    if (typeof nodo === 'object' && 'props' in nodo) {
        return testoDi((nodo as { props: { children?: unknown } }).props.children);
    }
    return '';
};
