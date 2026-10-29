import Anthropic from '@anthropic-ai/sdk';
import { getApiKey } from '../apiKey';
import { LlmError, type Phase, type PhaseRequest, type PhaseResult, type SourceRef } from './types';

type Effort = 'low' | 'medium' | 'high';

interface PhaseModel {
    model: string;
    effort: Effort;
    /** Tetto alle ricerche web della fase, quando la fase usa il web. */
    maxSearches: number;
    label: string;
    reason: string;
}

/**
 * Il modello piu' adatto per ogni fase. Unico punto da cambiare; la finestra
 * del modello mostra questa tabella. Motivazioni estese in
 * acta-diurna-lab/.planning/PLAN-CLAUDE.md.
 */
export const CLAUDE_PHASES: Record<Phase, PhaseModel> = {
    search:       { model: 'claude-sonnet-5-5', effort: 'high',   maxSearches: 10, label: 'Rassegna',          reason: 'Ricerca a piu\' passi ed estrazione' },
    analyzeUrl:   { model: 'claude-sonnet-5-5', effort: 'medium', maxSearches: 3,  label: 'Analisi URL',       reason: 'Lettura ed estrazione di un articolo' },
    updateCase:   { model: 'claude-sonnet-5-5', effort: 'medium', maxSearches: 5,  label: 'Aggiornamento',     reason: 'Completamento delle entita\'' },
    deepDive:     { model: 'claude-opus-5-5',   effort: 'high',   maxSearches: 10, label: 'Report',            reason: 'Ragionamento analitico, scala ICD 203' },
    revisePrompt: { model: 'claude-opus-5-5',   effort: 'high',   maxSearches: 0,  label: 'Revisione prompt',  reason: 'Rara, riscrive le regole di ricerca' },
    translate:    { model: 'claude-sonnet-5-5', effort: 'low',    maxSearches: 0,  label: 'Traduzione',        reason: 'Registro giuridico, Markdown intatto' },
    geocode:      { model: 'claude-haiku-5-5',  effort: 'low',    maxSearches: 0,  label: 'Geocodifica',       reason: 'Domanda chiusa, molte chiamate' },
};

// Ripresa di un turno sospeso dal server (stop_reason "pause_turn"): oltre
// questo numero la fase si considera bloccata.
const MAX_CONTINUATIONS = 5;

// Haiku non ha un fallback lato server: con il parametro un rifiuto resta
// rifiuto, quindi lo si manda solo a Opus e Sonnet.
const supportsServerFallback = (model: string) => !model.startsWith('claude-haiku');

let client: Anthropic | null = null;
let clientKey: string | null = null;

const getClient = async (): Promise<Anthropic> => {
    const key = await getApiKey('claude');
    if (!key) {
        throw new LlmError('Chiave API Claude non configurata. Inseriscila dal pannello di amministrazione.');
    }
    if (!client || clientKey !== key) {
        // L'applicazione non ha ancora un backend: la chiamata parte dal
        // browser, con la chiave nel browser. E' il rischio S-1 di
        // RETROFIT_AUDIT, e il motivo per cui l'applicazione non va esposta
        // in rete.
        client = new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true });
        clientKey = key;
    }
    return client;
};

const webTools = (maxSearches: number) => [
    { type: 'web_search_20260209' as const, name: 'web_search' as const, max_uses: maxSearches, user_location: { type: 'approximate' as const, country: 'IT' } },
    { type: 'web_fetch_20260209' as const, name: 'web_fetch' as const, max_uses: maxSearches },
];

/**
 * Le pagine consultate, lette dai risultati degli strumenti server: sono gli
 * URL reali delle testate, non rinvii.
 */
const collectSources = (blocks: Anthropic.Beta.BetaContentBlock[]): SourceRef[] => {
    const seen = new Map<string, SourceRef>();
    const add = (uri: string | null | undefined, title: string | null | undefined) => {
        if (uri && !seen.has(uri)) seen.set(uri, { uri, title: title || uri });
    };
    for (const block of blocks) {
        if (block.type === 'web_search_tool_result' && Array.isArray(block.content)) {
            for (const result of block.content) add(result.url, result.title);
        } else if (block.type === 'web_fetch_tool_result' && block.content.type === 'web_fetch_result') {
            add(block.content.url, block.content.content.title);
        }
    }
    return Array.from(seen.values());
};

/**
 * Il testo della risposta finale: quello che segue l'ultimo risultato di uno
 * strumento. Il testo scritto tra una ricerca e l'altra e' lavoro intermedio e
 * non deve finire nel JSON.
 */
const finalText = (blocks: Anthropic.Beta.BetaContentBlock[]): string => {
    let lastTool = -1;
    blocks.forEach((b, i) => {
        if (b.type === 'web_search_tool_result' || b.type === 'web_fetch_tool_result') lastTool = i;
    });
    return blocks
        .slice(lastTool + 1)
        .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
        .map(b => b.text)
        .join('');
};

export const runClaude = async (phase: Phase, request: PhaseRequest): Promise<PhaseResult> => {
    const { model, effort, maxSearches } = CLAUDE_PHASES[phase];
    const anthropic = await getClient();
    const useWeb = Boolean(request.webSearch) && maxSearches > 0;

    const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: 'user', content: request.prompt }];
    const blocks: Anthropic.Beta.BetaContentBlock[] = [];

    try {
        for (let turn = 0; turn <= MAX_CONTINUATIONS; turn++) {
            const response = await anthropic.beta.messages.stream({
                model,
                max_tokens: phase === 'geocode' ? 1024 : 64000,
                messages,
                output_config: {
                    effort,
                    // Lo schema vincola l'uscita solo senza strumenti web: con la
                    // ricerca la forma la chiede il prompt e la verifica chi chiama.
                    ...(request.schema && !useWeb ? { format: { type: 'json_schema' as const, schema: request.schema } } : {}),
                },
                ...(useWeb ? { tools: webTools(maxSearches) } : {}),
                ...(supportsServerFallback(model)
                    ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const }
                    : {}),
            }).finalMessage();

            blocks.push(...response.content);

            if (response.stop_reason === 'pause_turn') {
                // Il server riprende da dove si era fermato: si rimanda il turno
                // dell'assistente cosi' com'e', senza aggiungere messaggi.
                messages.push({ role: 'assistant', content: response.content });
                continue;
            }
            if (response.stop_reason === 'refusal') {
                const category = response.stop_details?.category;
                throw new LlmError(`Il modello ha rifiutato la richiesta${category ? ` (categoria: ${category})` : ''}.`);
            }
            if (response.stop_reason === 'max_tokens') {
                throw new LlmError('La risposta del modello e\' stata troncata: limite di lunghezza raggiunto.');
            }
            return { text: finalText(blocks), sources: collectSources(blocks) };
        }
        throw new LlmError('La ricerca non si e\' conclusa entro il numero massimo di riprese.');
    } catch (error) {
        if (error instanceof LlmError) throw error;
        if (error instanceof Anthropic.AuthenticationError) {
            throw new LlmError('Chiave API Claude non valida.');
        }
        if (error instanceof Anthropic.RateLimitError) {
            throw new LlmError('Limite di richieste Claude raggiunto (quota). Riprova tra poco.');
        }
        throw error;
    }
};
