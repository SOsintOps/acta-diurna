import { readFile } from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import { oidcFederationProvider } from '@anthropic-ai/sdk/lib/credentials/oidc-federation';
import { CLAUDE_TOKEN_PATH, type FederationTokenResponse } from '../src/services/llm/federationPath';

// Workload Identity Federation per Claude, lato server.
//
// L'endpoint di scambio di Anthropic (/v1/oauth/token) non accetta chiamate dal
// browser: niente CORS. Lo scambio lo fa quindi il server di Vite, in Node, con
// le variabili standard della federazione; al browser arriva solo il token
// breve, mai il JWT dell'identity provider.
//
// Le variabili si leggono da .env o dall'ambiente e restano sul server: non
// passano dal `define` di vite.config.ts, quindi non finiscono nel bundle.

// Il token si rinnova quando gli mancano meno di questi secondi.
const REFRESH_MARGIN_SECONDS = 120;

export const claudeFederation = (env: Record<string, string>): Plugin => {
    const ruleId = env.ANTHROPIC_FEDERATION_RULE_ID;
    const organizationId = env.ANTHROPIC_ORGANIZATION_ID;
    const serviceAccountId = env.ANTHROPIC_SERVICE_ACCOUNT_ID;
    const tokenFile = env.ANTHROPIC_IDENTITY_TOKEN_FILE;
    const tokenValue = env.ANTHROPIC_IDENTITY_TOKEN;
    const configured = Boolean(ruleId && organizationId && serviceAccountId && (tokenFile || tokenValue));

    const provider = configured
        ? oidcFederationProvider({
            // Il file si rilegge a ogni scambio: gli identity provider che
            // proiettano il token su disco lo ruotano.
            identityTokenProvider: async () => tokenFile ? (await readFile(tokenFile, 'utf8')).trim() : tokenValue,
            federationRuleId: ruleId,
            organizationId,
            serviceAccountId,
            workspaceId: env.ANTHROPIC_WORKSPACE_ID || undefined,
            baseURL: env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com',
            fetch: globalThis.fetch,
        })
        : null;

    let cached: { token: string; expiresAt: number | null } | null = null;

    const send = (res: ServerResponse, status: number, body: FederationTokenResponse) => {
        res.statusCode = status;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        res.end(JSON.stringify(body));
    };

    const handler = async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const url = new URL(req.url ?? '/', 'http://localhost');
        if (url.pathname !== CLAUDE_TOKEN_PATH) {
            return next();
        }
        // Il token serve solo alla pagina dell'applicazione stessa.
        if (req.headers['sec-fetch-site'] === 'cross-site') {
            return send(res, 403, { configured, error: 'Richiesta da un\'altra origine.' });
        }
        if (!provider) {
            return send(res, 200, { configured: false });
        }
        const now = Date.now() / 1000;
        const fresh = cached && (cached.expiresAt === null || cached.expiresAt - now > REFRESH_MARGIN_SECONDS);
        if (!fresh || url.searchParams.has('refresh')) {
            try {
                cached = await provider({ forceRefresh: true });
            } catch (error: any) {
                cached = null;
                return send(res, 502, { configured: true, error: error?.message ?? 'Scambio del token non riuscito.' });
            }
        }
        return send(res, 200, { configured: true, token: cached!.token, expiresAt: cached!.expiresAt });
    };

    return {
        name: 'acta-claude-federation',
        configureServer(server) {
            server.middlewares.use(handler);
        },
        configurePreviewServer(server) {
            server.middlewares.use(handler);
        },
    };
};
