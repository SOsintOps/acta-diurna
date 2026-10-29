// Percorso su cui il server di Vite consegna il token Claude ottenuto con la
// Workload Identity Federation. Condiviso tra il plugin (server/) e il browser:
// questo file non deve importare nulla.
export const CLAUDE_TOKEN_PATH = '/__acta/claude-token';

/** Risposta di CLAUDE_TOKEN_PATH. */
export interface FederationTokenResponse {
    configured: boolean;
    token?: string;
    /** Secondi Unix. */
    expiresAt?: number | null;
    error?: string;
}
