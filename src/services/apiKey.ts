import { getSettings, setSettings } from '../db';

// Chiave della riga nella tabella `settings` del database applicativo.
// Quando arrivera' il backend, la chiave si spostera' sul database del server:
// questa collocazione e' gia' quella giusta, cambia solo dove vive la tabella.
const API_KEY_SETTING = 'apiKey';

/**
 * Chiave fornita a build-time da vite (vedi vite.config.ts).
 * Vuota o assente quando chi compila non ne ha fornita una.
 */
const envApiKey = (): string | null => {
    const value = process.env.API_KEY;
    return typeof value === 'string' && value.trim() ? value.trim() : null;
};

/**
 * L'override da ambiente vince sempre sul valore salvato dall'admin.
 * Quando e' attivo, l'interfaccia non deve permettere di cambiare la chiave.
 */
export const isEnvOverrideActive = (): boolean => envApiKey() !== null;

/**
 * Chiave in uso: prima l'ambiente, poi quella inserita dall'admin.
 * Restituisce null quando non ce n'e' alcuna, senza sollevare: chi chiama
 * decide se e' un errore o solo un motivo per chiedere la chiave all'utente.
 */
export const getApiKey = async (): Promise<string | null> => {
    const fromEnv = envApiKey();
    if (fromEnv) {
        return fromEnv;
    }
    const stored = await getSettings(API_KEY_SETTING);
    return typeof stored === 'string' && stored.trim() ? stored.trim() : null;
};

/**
 * L'interfaccia espone solo la presenza della chiave, mai il valore.
 */
export const hasApiKey = async (): Promise<boolean> => (await getApiKey()) !== null;

export const setApiKey = async (value: string): Promise<void> => {
    if (isEnvOverrideActive()) {
        throw new Error('La chiave e\' imposta dall\'ambiente e non puo\' essere cambiata dall\'interfaccia.');
    }
    const trimmed = value.trim();
    if (!trimmed) {
        throw new Error('La chiave non puo\' essere vuota.');
    }
    await setSettings(API_KEY_SETTING, trimmed);
};

export const clearApiKey = async (): Promise<void> => {
    await setSettings(API_KEY_SETTING, '');
};
