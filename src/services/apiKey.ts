import { getSettings, setSettings } from '../db';
import type { AiProvider } from './llm/types';

// Righe della tabella `settings` del database applicativo, una per fornitore.
// `apiKey` e' la riga storica di Gemini: rinominarla renderebbe irraggiungibili
// le chiavi gia' salvate.
// Quando arrivera' il backend, le chiavi si sposteranno sul database del server:
// questa collocazione e' gia' quella giusta, cambia solo dove vive la tabella.
const API_KEY_SETTING: Record<AiProvider, string> = {
    gemini: 'apiKey',
    claude: 'anthropicApiKey',
};

export const PROVIDER_LABEL: Record<AiProvider, string> = {
    gemini: 'GEMINI',
    claude: 'CLAUDE',
};

/**
 * Chiave fornita a build-time da vite (vedi vite.config.ts).
 * Vuota o assente quando chi compila non ne ha fornita una.
 */
const envApiKey = (provider: AiProvider): string | null => {
    const value = provider === 'claude' ? process.env.ANTHROPIC_API_KEY : process.env.API_KEY;
    return typeof value === 'string' && value.trim() ? value.trim() : null;
};

/**
 * L'override da ambiente vince sempre sul valore salvato dall'admin.
 * Quando e' attivo, l'interfaccia non deve permettere di cambiare la chiave.
 */
export const isEnvOverrideActive = (provider: AiProvider): boolean => envApiKey(provider) !== null;

/**
 * Chiave in uso: prima l'ambiente, poi quella inserita dall'admin.
 * Restituisce null quando non ce n'e' alcuna, senza sollevare: chi chiama
 * decide se e' un errore o solo un motivo per chiedere la chiave all'utente.
 */
export const getApiKey = async (provider: AiProvider): Promise<string | null> => {
    const fromEnv = envApiKey(provider);
    if (fromEnv) {
        return fromEnv;
    }
    const stored = await getSettings(API_KEY_SETTING[provider]);
    return typeof stored === 'string' && stored.trim() ? stored.trim() : null;
};

/**
 * L'interfaccia espone solo la presenza della chiave, mai il valore.
 */
export const hasApiKey = async (provider: AiProvider): Promise<boolean> => (await getApiKey(provider)) !== null;

export const setApiKey = async (provider: AiProvider, value: string): Promise<void> => {
    if (isEnvOverrideActive(provider)) {
        throw new Error('La chiave e\' imposta dall\'ambiente e non puo\' essere cambiata dall\'interfaccia.');
    }
    const trimmed = value.trim();
    if (!trimmed) {
        throw new Error('La chiave non puo\' essere vuota.');
    }
    await setSettings(API_KEY_SETTING[provider], trimmed);
};

export const clearApiKey = async (provider: AiProvider): Promise<void> => {
    await setSettings(API_KEY_SETTING[provider], '');
};
