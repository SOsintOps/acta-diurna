import { getSettings, setSettings } from '../db';
import type { Phase } from './llm/types';

// Registro dei consumi delle chiamate a Claude: una riga per fase eseguita,
// con i token, le ricerche web e il costo stimato. Serve a sapere quanto costa
// l'applicazione senza aprire la Console di Anthropic, che resta la fonte del
// costo vero.

const USAGE_SETTING = 'usageLog';
const MAX_ENTRIES = 500;

export interface UsageEntry {
    /** ISO 8601. */
    at: string;
    phase: Phase;
    /** Il modello che ha risposto: con un fallback puo' non essere quello chiesto. */
    model: string;
    inputTokens: number;
    outputTokens: number;
    cacheWriteTokens: number;
    cacheReadTokens: number;
    webSearches: number;
    webFetches: number;
    costUsd: number;
}

// Dollari per milione di token. Listino Anthropic al 2026-10; i fallback
// (Opus 5, Opus 4.8) sono qui perche' una risposta puo' arrivare da loro.
const PRICES: Record<string, { input: number; output: number; cacheRead: number }> = {
    'claude-opus-5-5':   { input: 4,   output: 20,  cacheRead: 0.20 },
    'claude-opus-5':     { input: 5,   output: 25,  cacheRead: 0.50 },
    'claude-opus-4-8':   { input: 5,   output: 25,  cacheRead: 0.50 },
    'claude-sonnet-5-5': { input: 2,   output: 10,  cacheRead: 0.20 },
    'claude-sonnet-5':   { input: 2,   output: 10,  cacheRead: 0.20 },
    'claude-haiku-5-5':  { input: 0.1, output: 0.5, cacheRead: 0.01 },
};
const CACHE_WRITE_FACTOR = 1.25;
const USD_PER_WEB_SEARCH = 10 / 1000;

const priceFor = (model: string) =>
    PRICES[model] ?? PRICES[Object.keys(PRICES).find(id => model.startsWith(id)) ?? ''] ?? PRICES['claude-opus-5'];

export const estimateCost = (e: Omit<UsageEntry, 'at' | 'phase' | 'costUsd'>): number => {
    const p = priceFor(e.model);
    return (
        e.inputTokens * p.input +
        e.outputTokens * p.output +
        e.cacheWriteTokens * p.input * CACHE_WRITE_FACTOR +
        e.cacheReadTokens * p.cacheRead
    ) / 1_000_000 + e.webSearches * USD_PER_WEB_SEARCH;
};

// Le geocodifiche partono in parallelo: le scritture si mettono in fila, cosi'
// nessuna riga sovrascrive quella di un'altra chiamata.
let queue: Promise<void> = Promise.resolve();

export const recordUsage = (entry: UsageEntry): Promise<void> => {
    console.log(`[consumi] ${entry.phase} ${entry.model}: ${entry.inputTokens} in, ${entry.outputTokens} out, ` +
        `${entry.cacheReadTokens} cache, ${entry.webSearches} ricerche, ${entry.webFetches} letture → $${entry.costUsd.toFixed(4)}`);
    queue = queue.then(async () => {
        const log: UsageEntry[] = (await getSettings(USAGE_SETTING)) ?? [];
        log.push(entry);
        await setSettings(USAGE_SETTING, log.slice(-MAX_ENTRIES));
    }).catch(error => console.error('[consumi] registrazione non riuscita:', error));
    return queue;
};

export interface UsageTotals {
    calls: number;
    costUsd: number;
    webSearches: number;
}

export interface UsageSummary {
    today: UsageTotals;
    last30Days: UsageTotals;
    total: UsageTotals;
    /** Ultimi 30 giorni, per fase. */
    byPhase: Partial<Record<Phase, UsageTotals>>;
}

const empty = (): UsageTotals => ({ calls: 0, costUsd: 0, webSearches: 0 });
const add = (t: UsageTotals, e: UsageEntry) => {
    t.calls += 1;
    t.costUsd += e.costUsd;
    t.webSearches += e.webSearches;
};

export const getUsageSummary = async (): Promise<UsageSummary> => {
    const log: UsageEntry[] = (await getSettings(USAGE_SETTING)) ?? [];
    const todayKey = new Date().toDateString();
    const since30 = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const summary: UsageSummary = { today: empty(), last30Days: empty(), total: empty(), byPhase: {} };
    for (const e of log) {
        const at = new Date(e.at);
        add(summary.total, e);
        if (at.getTime() >= since30) {
            add(summary.last30Days, e);
            add(summary.byPhase[e.phase] ??= empty(), e);
        }
        if (at.toDateString() === todayKey) add(summary.today, e);
    }
    return summary;
};

export const clearUsage = (): Promise<void> => setSettings(USAGE_SETTING, []);

// Tetto di spesa giornaliero: raggiunto il tetto, nessuna nuova chiamata parte
// fino a domani. Esiste perche' una rassegna puo' costare piu' di un dollaro e
// le chiamate partono anche da sole (aggiornamenti, ricerca periodica).
const BUDGET_SETTING = 'dailyBudgetUsd';
export const DEFAULT_DAILY_BUDGET_USD = 1;

export const getDailyBudget = async (): Promise<number> => {
    const value = await getSettings(BUDGET_SETTING);
    return typeof value === 'number' && value >= 0 ? value : DEFAULT_DAILY_BUDGET_USD;
};

export const setDailyBudget = async (usd: number): Promise<void> => {
    if (!Number.isFinite(usd) || usd < 0) {
        throw new Error('Il tetto deve essere un numero maggiore o uguale a zero.');
    }
    await setSettings(BUDGET_SETTING, usd);
};

/** Spesa di oggi e tetto, per decidere se una chiamata puo' partire. */
export const getBudgetStatus = async (): Promise<{ spentToday: number; budget: number; exhausted: boolean }> => {
    const [summary, budget] = await Promise.all([getUsageSummary(), getDailyBudget()]);
    const spentToday = summary.today.costUsd;
    return { spentToday, budget, exhausted: spentToday >= budget };
};
