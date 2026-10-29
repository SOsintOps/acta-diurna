import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { getApiKey } from '../apiKey';
import type { PhaseRequest, PhaseResult, SourceRef } from './types';

// Il client si costruisce alla prima chiamata e non al caricamento del modulo:
// altrimenti l'applicazione non parte quando la chiave manca, e senza avviarsi
// non c'e' modo di inserirla.
let client: GoogleGenAI | null = null;
let clientKey: string | null = null;

const getClient = async (): Promise<GoogleGenAI> => {
    const key = await getApiKey('gemini');
    if (!key) {
        throw new Error('Chiave API Gemini non configurata. Inseriscila dal pannello di amministrazione.');
    }
    if (!client || clientKey !== key) {
        client = new GoogleGenAI({ apiKey: key });
        clientKey = key;
    }
    return client;
};

const groundingSources = (response: GenerateContentResponse): SourceRef[] => {
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (!chunks || !Array.isArray(chunks)) return [];
    return chunks
        .map(chunk => (chunk.web?.uri && chunk.web?.title) ? { uri: chunk.web.uri, title: chunk.web.title } : null)
        .filter((s): s is SourceRef => s !== null);
};

/**
 * Gemini usa un solo modello per tutte le fasi: quello scelto nella finestra
 * del modello.
 */
export const runGemini = async (model: string, request: PhaseRequest): Promise<PhaseResult> => {
    const response = await (await getClient()).models.generateContent({
        model,
        contents: request.prompt,
        config: {
            ...(request.system ? { systemInstruction: request.system } : {}),
            ...(request.webSearch ? { tools: [{ googleSearch: {} }] } : {}),
            ...(request.schema ? { responseMimeType: 'application/json', responseJsonSchema: request.schema } : {}),
        },
    });
    return { text: response.text ?? '', sources: groundingSources(response) };
};
