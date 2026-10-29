import { CLAUDE_TOKEN_PATH, type FederationTokenResponse } from './federationPath';

// Workload Identity Federation per Claude, lato browser. Lo scambio del JWT lo
// fa il server di Vite (server/claudeFederation.ts); qui si chiede solo il
// token breve gia' pronto.

export type FederationState =
    | { state: 'off' }
    | { state: 'on' }
    | { state: 'error'; message: string };

const request = async (refresh = false): Promise<FederationTokenResponse | null> => {
    try {
        const response = await fetch(refresh ? `${CLAUDE_TOKEN_PATH}?refresh=1` : CLAUDE_TOKEN_PATH, { cache: 'no-store' });
        // Servita da un server che non e' Vite, la pagina riceve un 404 o
        // l'HTML dell'applicazione: la federazione semplicemente non c'e'.
        const body = await response.json();
        return typeof body?.configured === 'boolean' ? body as FederationTokenResponse : null;
    } catch {
        return null;
    }
};

/**
 * Stato della federazione, per le impostazioni e per scegliere come
 * autenticarsi. Uno stato "on" ha appena ottenuto un token valido.
 */
export const getFederationState = async (): Promise<FederationState> => {
    const body = await request();
    if (!body?.configured) return { state: 'off' };
    if (body.token) return { state: 'on' };
    return { state: 'error', message: body.error ?? 'Scambio del token non riuscito.' };
};

/**
 * Fornitore di token per l'opzione `credentials` dell'SDK. L'SDK lo richiama
 * alla scadenza e, dopo un 401, con `forceRefresh`.
 */
export const federatedAccessToken = async (opts?: { forceRefresh?: boolean }) => {
    const body = await request(Boolean(opts?.forceRefresh));
    if (!body?.token) {
        throw new Error(body?.error ?? 'Federazione Claude non disponibile.');
    }
    return { token: body.token, expiresAt: body.expiresAt ?? null };
};
