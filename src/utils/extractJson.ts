/**
 * Estrae il primo valore JSON completo (oggetto o array) da un testo che puo'
 * contenerne altro intorno: recinti ```json, una frase prima o un commento
 * dopo. Con la ricerca web l'uscita non e' vincolata a uno schema, e Claude
 * spesso aggiunge una riga di spiegazione dopo il JSON.
 *
 * Restituisce undefined se nel testo non c'e' alcun JSON; solleva un
 * SyntaxError se ce n'e' uno ma non e' valido.
 */
export const extractJson = (text: string): unknown => {
    const start = text.search(/[[{]/);
    if (start === -1) return undefined;

    // Si cerca la parentesi che chiude quella di apertura, ignorando quelle
    // dentro le stringhe.
    const stack: string[] = [];
    let inString = false;
    let escaped = false;
    for (let i = start; i < text.length; i++) {
        const ch = text[i];
        if (inString) {
            if (escaped) escaped = false;
            else if (ch === '\\') escaped = true;
            else if (ch === '"') inString = false;
            continue;
        }
        if (ch === '"') inString = true;
        else if (ch === '[' || ch === '{') stack.push(ch === '[' ? ']' : '}');
        else if (ch === ']' || ch === '}') {
            if (stack.pop() !== ch) break;
            if (stack.length === 0) return JSON.parse(text.slice(start, i + 1));
        }
    }
    // JSON non chiuso: lo si passa intero al parser, che dira' dove si rompe.
    return JSON.parse(text.slice(start));
};
