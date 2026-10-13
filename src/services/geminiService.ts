import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import type { CaseData, DeepDiveReport, CrimeCategory } from '../types';
import { crimeCategoryShortCodes, normalizeRegionName } from "../utils/crimeCategorizer";
import { getActivePrompt, incrementAndGetCaseCounter, getSettings, setSettings } from '../db';
import { getApiKey } from './apiKey';
import { useCaseStore } from '../store/caseStore';


// --- ATTENZIONE: SICUREZZA API KEY ---
// NON INSERIRE LA CHIAVE DIRETTAMENTE NEL CODICE.
// La chiave la inserisce l'admin dall'interfaccia e vive nella tabella
// `settings` del database; una chiave da ambiente, se fornita a chi compila,
// vince su quella salvata. Vedi services/apiKey.ts.
//
// Il client si costruisce alla prima chiamata e non al caricamento del modulo:
// altrimenti l'applicazione non parte quando la chiave manca, e senza avviarsi
// non c'e' modo di inserirla.
let client: GoogleGenAI | null = null;
let clientKey: string | null = null;

const getClient = async (): Promise<GoogleGenAI> => {
    const key = await getApiKey();
    if (!key) {
        throw new Error('Chiave API non configurata. Inseriscila dal pannello di amministrazione.');
    }
    if (!client || clientKey !== key) {
        client = new GoogleGenAI({ apiKey: key });
        clientKey = key;
    }
    return client;
};


// The initial hardcoded list remains as a fallback/bootstrap
const initialCityCoordinates: { [key: string]: { lat: number; lng: number } } = {
  "Agrigento": { lat: 37.3111, lng: 13.5766 }, "Alessandria": { lat: 44.9134, lng: 8.6141 },
  "Ancona": { lat: 43.6158, lng: 13.5189 }, "Aosta": { lat: 45.7376, lng: 7.3201 },
  "Arezzo": { lat: 43.4636, lng: 11.8797 }, "Ascoli Piceno": { lat: 42.8539, lng: 13.5758 },
  "Asti": { lat: 44.9001, lng: 8.2065 }, "Avellino": { lat: 40.9143, lng: 14.7906 },
  "Bari": { lat: 41.1171, lng: 16.8719 }, "Barletta": { lat: 41.3193, lng: 16.2818 },
  "Belluno": { lat: 46.1408, lng: 12.2155 }, "Benevento": { lat: 41.1296, lng: 14.7750 },
  "Bergamo": { lat: 45.6983, lng: 9.6773 }, "Biella": { lat: 45.5663, lng: 8.0553 },
  "Bologna": { lat: 44.4949, lng: 11.3426 }, "Bolzano": { lat: 46.4983, lng: 11.3548 },
  "Brescia": { lat: 45.5388, lng: 10.2205 }, "Brindisi": { lat: 40.6321, lng: 17.9419 },
  "Cagliari": { lat: 39.2238, lng: 9.1217 }, "Caltanissetta": { lat: 37.4903, lng: 14.0628 },
  "Campobasso": { lat: 41.5606, lng: 14.6625 }, "Carbonia": { lat: 39.1678, lng: 8.5204 },
  "Caserta": { lat: 41.0769, lng: 14.3316 }, "Catania": { lat: 37.5079, lng: 15.0830 },
  "Catanzaro": { lat: 38.9099, lng: 16.5872 }, "Chieti": { lat: 42.3510, lng: 14.1687 },
  "Chiavari": { lat: 44.3159, lng: 9.3238 }, "Como": { lat: 45.8081, lng: 9.0852 }, 
  "Cosenza": { lat: 39.2995, lng: 16.2514 }, "Cremona": { lat: 45.1332, lng: 10.0249 }, 
  "Crotone": { lat: 39.0805, lng: 17.1259 }, "Cuneo": { lat: 44.3907, lng: 7.5492 }, 
  "Enna": { lat: 37.5666, lng: 14.2750 }, "Fermo": { lat: 43.1610, lng: 13.7181 }, 
  "Ferrara": { lat: 44.8354, lng: 11.6198 }, "Firenze": { lat: 43.7696, lng: 11.2558 }, 
  "Foggia": { lat: 41.4624, lng: 15.5580 }, "Forlì": { lat: 44.2225, lng: 12.0407 }, 
  "Frosinone": { lat: 41.6400, lng: 13.3400 }, "Gallarate": { lat: 45.6583, lng: 8.7928 }, 
  "Genova": { lat: 44.4056, lng: 8.9463 }, "Gorizia": { lat: 45.9419, lng: 13.6214 }, 
  "Grosseto": { lat: 42.7628, lng: 11.1129 }, "Imperia": { lat: 43.8906, lng: 8.0275 }, 
  "Isernia": { lat: 41.6033, lng: 14.2275 }, "L'Aquila": { lat: 42.3512, lng: 13.3989 }, 
  "La Spezia": { lat: 44.1025, lng: 9.8241 }, "Latina": { lat: 41.4676, lng: 12.9038 }, 
  "Lecce": { lat: 40.3533, lng: 18.1725 }, "Lecco": { lat: 45.8554, lng: 9.3932 }, 
  "Livorno": { lat: 43.5435, lng: 10.3107 }, "Lodi": { lat: 45.3146, lng: 9.5029 }, 
  "Lucca": { lat: 43.8376, lng: 10.4950 }, "Macerata": { lat: 43.3006, lng: 13.4533 }, 
  "Mantova": { lat: 45.1564, lng: 10.7913 }, "Massa": { lat: 44.0333, lng: 10.1333 }, 
  "Matera": { lat: 40.6667, lng: 16.6000 }, "Messina": { lat: 38.1938, lng: 15.5540 }, 
  "Milano": { lat: 45.4642, lng: 9.1900 }, "Modena": { lat: 44.6471, lng: 10.9252 }, 
  "Monza": { lat: 45.5843, lng: 9.2736 }, "Napoli": { lat: 40.8518, lng: 14.2681 }, 
  "Novara": { lat: 45.4484, lng: 8.6196 }, "Nuoro": { lat: 40.3228, lng: 9.3297 }, 
  "Oristano": { lat: 39.9042, lng: 8.5917 }, "Padova": { lat: 45.4064, lng: 11.8768 }, 
  "Palermo": { lat: 38.1157, lng: 13.3615 }, "Parma": { lat: 44.8015, lng: 10.3280 }, 
  "Pavia": { lat: 45.1847, lng: 9.1582 }, "Perugia": { lat: 43.1122, lng: 12.3888 }, 
  "Pesaro": { lat: 43.9103, lng: 12.9142 }, "Pescara": { lat: 42.4643, lng: 14.2142 }, 
  "Piacenza": { lat: 45.0526, lng: 9.6975 }, "Pisa": { lat: 43.7228, lng: 10.4017 }, 
  "Pistoia": { lat: 43.9317, lng: 10.9168 }, "Platì": { lat: 38.2208, lng: 16.0463 }, 
  "Pordenone": { lat: 45.9642, lng: 12.6592 }, "Potenza": { lat: 40.6393, lng: 15.8053 }, 
  "Prato": { lat: 43.8808, lng: 11.0970 }, "Ragusa": { lat: 36.9250, lng: 14.7307 }, 
  "Ravenna": { lat: 44.4184, lng: 12.2036 }, "Reggio Calabria": { lat: 38.1147, lng: 15.6503 }, 
  "Reggio Emilia": { lat: 44.7000, lng: 10.6333 }, "Rieti": { lat: 42.4046, lng: 12.8623 }, 
  "Rimini": { lat: 44.0594, lng: 12.5683 }, "Roma": { lat: 41.9028, lng: 12.4964 }, 
  "Rovigo": { lat: 45.0717, lng: 11.7915 }, "Salerno": { lat: 40.6824, lng: 14.7681 }, 
  "Sannicola": { lat: 40.1066, lng: 18.0673 }, "Sassari": { lat: 40.7267, lng: 8.5592 }, 
  "Savona": { lat: 44.3090, lng: 8.4815 }, "Siderno": { lat: 38.2721, lng: 16.2995 }, 
  "Siena": { lat: 43.3188, lng: 11.3308 }, "Siracusa": { lat: 37.0694, lng: 15.2871 }, 
  "Sondrio": { lat: 46.1708, lng: 9.8703 }, "Spoleto": { lat: 42.7352, lng: 12.7388 }, 
  "Taranto": { lat: 40.4173, lng: 17.2835 }, "Teramo": { lat: 42.6588, lng: 13.7027 }, 
  "Terni": { lat: 42.5654, lng: 12.6450 }, "Torino": { lat: 45.0703, lng: 7.6869 }, 
  "Trani": { lat: 41.2758, lng: 16.4170 }, "Trapani": { lat: 38.0185, lng: 12.5126 }, 
  "Trento": { lat: 46.0667, lng: 11.1167 }, "Treviso": { lat: 45.6667, lng: 12.2422 }, 
  "Trieste": { lat: 45.6495, lng: 13.7768 }, "Udine": { lat: 46.0649, lng: 13.2351 }, 
  "Varese": { lat: 45.8205, lng: 8.8265 }, "Venezia": { lat: 45.4408, lng: 12.3155 }, 
  "Verbania": { lat: 45.9220, lng: 8.5495 }, "Vercelli": { lat: 45.3240, lng: 8.4234 }, 
  "Verona": { lat: 45.4384, lng: 10.9916 }, "Vibo Valentia": { lat: 38.6756, lng: 16.0999 }, 
  "Vicenza": { lat: 45.5455, lng: 11.5354 }, "Viterbo": { lat: 42.4192, lng: 12.1065 }, 
  "Voghera": { lat: 44.9922, lng: 9.0084 },
};

let cityCoordinatesCache: { [key: string]: { lat: number; lng: number } } = {};

// L'annotazione di tipo sulla const, non solo sul valore di ritorno, e' cio'
// che fa capire a TypeScript che ogni chiamata interrompe il flusso: senza,
// le funzioni che terminano con handleApiError risultano "prive di return".
const handleApiError: (error: any, context: string) => never = (error, context) => {
    console.error(`Gemini API call failed in ${context}:`, error);
    if (error.message && error.message.toLowerCase().includes('quota')) {
        throw new Error('API quota exceeded. Please select a different model and retry.');
    }
    throw new Error(`AI service failed during ${context}.`);
};

export const loadCoordinatesCache = async () => {
    const storedCoords = await getSettings('cityCoordinates');
    cityCoordinatesCache = { ...initialCityCoordinates, ...storedCoords };
    console.log(`Loaded ${Object.keys(cityCoordinatesCache).length} city coordinates into cache.`);
};

const saveCoordinatesCache = async () => {
    await setSettings('cityCoordinates', cityCoordinatesCache);
};

const fetchCoordinatesForCity = async (cityName: string, context?: string): Promise<{ lat: number; lng: number; correctedName: string } | null> => {
    const aiModel = useCaseStore.getState().aiModel;
    let prompt;

    if (context) {
        console.log(`Geocoding with context: "${cityName}" (Context: "${context}")`);
        prompt = `
            Un'operazione di polizia ha avuto luogo in una località chiamata "${cityName}". Questo nome potrebbe essere una frazione, un nome obsoleto o errato.
            Il titolo della notizia è: "${context}".
            Basandoti sul contesto, identifica il nome ufficiale del comune italiano e fornisci le sue coordinate.
            Restituisci ESCLUSIVAMENTE un oggetto JSON con chiavi "lat", "lng", e "correctedName".
            Esempio per "Platì" nel contesto di un'operazione in Calabria: {"lat": 38.2208, "lng": 16.0463, "correctedName": "Platì"}.
        `;
    } else {
        console.log(`Geocoding without context: "${cityName}"`);
        prompt = `Fornisci le coordinate geografiche (latitudine e longitudine) e il nome ufficiale del comune italiano per "${cityName}". Restituisci ESCLUSIVAMENTE un oggetto JSON con chiavi "lat", "lng" e "correctedName". Esempio per Milano: {"lat": 45.4642, "lng": 9.1900, "correctedName": "Milano"}`;
    }

    try {
        const response = await (await getClient()).models.generateContent({
            model: aiModel,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        lat: { type: Type.NUMBER, description: "Latitude" },
                        lng: { type: Type.NUMBER, description: "Longitude" },
                        correctedName: { type: Type.STRING, description: "Official city name" },
                    },
                    required: ["lat", "lng", "correctedName"],
                },
            },
        });

        if (!response.text) {
            console.warn(`Geocoding for "${cityName}" returned no text.`);
            return null;
        }

        const jsonString = response.text.trim().replace(/```json\s*|```/g, '');
        const data = JSON.parse(jsonString);

        if (data && typeof data.lat === 'number' && typeof data.lng === 'number' && typeof data.correctedName === 'string') {
            console.log(`Successfully geocoded "${cityName}":`, data);
            return data;
        }
        console.warn(`Geocoding for "${cityName}" returned an invalid format:`, jsonString);
        return null;
    } catch (error) {
        console.error(`Error fetching coordinates for "${cityName}":`, error);
        return null; // Do not throw here, as it's a recoverable error.
    }
};

const getCoordsForCity = async (city: string, context?: string): Promise<{ lat: number; lng: number; name: string } | null> => {
    if (!city) return null;
    const normalizedCity = city.trim();

    const checkCache = (name: string): { lat: number, lng: number } | null => {
        if (cityCoordinatesCache[name]) return cityCoordinatesCache[name];
        const lowerCaseName = name.toLowerCase();
        const cachedCityName = Object.keys(cityCoordinatesCache).find(k => k.toLowerCase() === lowerCaseName);
        return cachedCityName ? cityCoordinatesCache[cachedCityName] : null;
    };

    let coords = checkCache(normalizedCity);
    if (coords) {
        return { ...coords, name: normalizedCity };
    }

    let geocodingResult = await fetchCoordinatesForCity(normalizedCity);
    
    // If the first attempt fails and there's context, try again with context.
    if (!geocodingResult && context) {
        console.log(`Initial geocoding for "${normalizedCity}" failed. Retrying with context.`);
        geocodingResult = await fetchCoordinatesForCity(normalizedCity, context);
    }
    
    if (geocodingResult) {
        const { lat, lng, correctedName } = geocodingResult;
        cityCoordinatesCache[correctedName] = { lat, lng };
        if (normalizedCity.toLowerCase() !== correctedName.toLowerCase()) {
            cityCoordinatesCache[normalizedCity] = { lat, lng }; // Cache original name too
        }
        await saveCoordinatesCache();
        return { lat, lng, name: correctedName };
    }

    console.warn(`Coordinates not found for city: "${city}". This city will not be mapped.`);
    return null;
};

const getTokens = (str: string): Set<string> => {
    if (!str) return new Set();
    return new Set(str.toLowerCase().replace(/[.,:;]/g, '').split(/\s+/).filter(w => w.length > 2));
};

const jaccardSimilarity = (set1: Set<string>, set2: Set<string>): number => {
    if (set1.size === 0 && set2.size === 0) return 1;
    if (set1.size === 0 || set2.size === 0) return 0;
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return intersection.size / union.size;
};

const processProvenance = (cases: (Partial<CaseData> | CaseData)[], response: GenerateContentResponse): (Partial<CaseData> | CaseData | null)[] => {
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (!chunks || !Array.isArray(chunks) || chunks.length === 0) {
        console.warn("[Provenance] No grounding chunks found. Allowing cases to pass but quality may be affected.");
        return cases.map(c => c ? { ...c, provenanceWarning: true } : null);
    }
    const groundingSources = chunks
        .map(chunk => {
            try {
                const web = chunk.web;
                if (web && web.uri && web.title) {
                    return { uri: web.uri as string, title: web.title as string, tokens: getTokens(web.title as string) };
                }
            } catch (e) { /* Ignore parsing errors */ }
            return null;
        }).filter((source): source is NonNullable<typeof source> => source !== null);

    if (groundingSources.length === 0) {
        console.warn("[Provenance] Grounding chunks were present but empty. Allowing cases to pass but quality may be affected.");
        return cases.map(c => c ? { ...c, provenanceWarning: true } : null);
    }

    return cases.map(c => {
        if (!c?.provenance || !Array.isArray(c.provenance) || c.provenance.length === 0) {
            console.warn(`[Provenance] Case rejected due to missing provenance:`, c);
            return null;
        }
        const verifiedProvenance: CaseData['provenance'] = [];
        for (const source of c.provenance) {
            if (!source.sourceName) continue;
            const sourceTitleTokens = getTokens(source.sourceName);
            let bestMatch = null;
            let highestSimilarity = 0.3;
            for (const gs of groundingSources) {
                const similarity = jaccardSimilarity(sourceTitleTokens, gs.tokens);
                if (similarity > highestSimilarity) {
                    highestSimilarity = similarity;
                    bestMatch = gs;
                }
            }
            if (bestMatch) {
                verifiedProvenance.push({
                    sourceType: source.sourceType,
                    sourceName: bestMatch.title,
                    url: bestMatch.uri,
                });
            } else {
                console.warn(`[Provenance] Could not verify source "${source.sourceName}". It will be excluded.`);
            }
        }
        if (verifiedProvenance.length === 0) {
            console.warn(`[Provenance REJECTED] No verifiable sources found for case "${c.summary?.title}".`);
            return null;
        }
        return { ...c, provenance: verifiedProvenance, provenanceWarning: false };
    });
};

const summarizeCasesForPrompt = (cases: CaseData[], showFeedback: boolean = false): string => {
    if (cases.length === 0) return "Nessuno.";
    return cases.map(c => {
        let summary = `- ${c.summary.title} (ID: ${c.caseID}, Tipi: ${c.summary.crimeTypes.join(', ')}, Luogo: ${c.summary.location.cities.length > 0 ? c.summary.location.cities[0].name : 'N/A'})`;
        if (showFeedback && c.userFeedback?.startsWith('irrelevant_')) {
            let reason = '';
            switch(c.userFeedback) {
                case 'irrelevant_duplicate': reason = 'Duplicato'; break;
                case 'irrelevant_too_old': reason = 'Troppo vecchio'; break;
                case 'irrelevant_not_crime': reason = 'Non rilevante'; break;
            }
            if (reason) summary += ` [Motivo Irrilevanza: ${reason}]`;
        }
        return summary;
    }).join('\n');
};

export const defaultPrompt = `
Sei "Chronicle", un'intelligenza artificiale analista per forze dell'ordine, specializzata in criminalità italiana. Il tuo compito è monitorare fonti giornalistiche per identificare operazioni di polizia di rilievo e trasformarle in report strutturati.

**OBIETTIVO:**
Analizza il web italiano alla ricerca di notizie recenti (ultimi 3 giorni) relative a operazioni di polizia, Guardia di Finanza, e Procure. Estrai i dati e formattali in un array JSON di oggetti "CaseData", seguendo lo schema definito.

**PARAMETRI DI RICERCA:**
1.  **Criteri di Inclusione:**
    *   **Crimini:** Mafia, 'ndrangheta, camorra, criminalità organizzata, riciclaggio, autoriciclaggio, corruzione, bancarotta fraudolenta, frodi fiscali strutturate (es. carosello, crediti fittizi), reati economico-finanziari di grande impatto. Includi specificamente notizie su frodi scoperte dalla Guardia di Finanza che utilizzano entità di facciata, come false ONLUS o finte Associazioni Sportive Dilettantistiche (ASD), per mascherare attività commerciali e evadere il fisco.
    *   **Rilevanza:** Operazioni con molti indagati, importi sequestrati elevati (superiori a 1 milione di Euro), tecniche innovative o collegamenti internazionali. Concentrati su operazioni che hanno un impatto significativo, ma non escludere le frodi basate su ASD/ONLUS anche se gli importi sono inferiori, se rappresentano uno schema fraudolento degno di nota.
    *   **Intervallo Temporale:** SOLO notizie pubblicate negli ultimi 3 giorni.

2.  **Regole Critiche di Estrazione (DA SEGUIRE SEMPRE):**
    *   **DATA (CRITICO):** La data di pubblicazione dell'articolo DEVE essere negli ultimi 3 giorni. La data dell'operazione riportata DEVE essere plausibile e recente. **Rifiuta categoricamente qualsiasi notizia la cui data di pubblicazione originale sia più vecchia di 7 giorni.** Devi trovare la data di pubblicazione effettiva nel testo, non basarti su metadati come "ultimo aggiornamento". Date future sono sempre un errore e invalidano la notizia.
    *   **PERSONE:** Estrai sempre **Nome e Cognome**, **Ruolo** (es. "imprenditore", "sindaco") e, se disponibile, la **Data di Nascita**. Se il ruolo non è specificato nel testo, lascia il valore \`null\`. **NON usare MAI la parola "sconosciuto" come ruolo se il nome della persona è noto.**
    *   **LOCALITÀ:** Se un'operazione coinvolge più luoghi, elenca TUTTI, usando i nomi ufficiali delle regioni italiane. Metti la città principale come primo elemento nell'array \`cities\`. Includi anche le regioni nell'array \`regions\`.
    *   **URL:** Fornisci sempre l'URL pubblico e diretto della fonte, mai URL di reindirizzamento come quelli di \`vertexaisearch.cloud.google.com\`.

3.  **FILTRO ANTI-DUPLICAZIONE (CRITICO):**
    *   Prima di creare un nuovo caso, confronta i fatti principali (luogo, tipo di reato, nomi chiave) con i casi già esistenti forniti.
    *   Se la notizia riguarda un'operazione GIÀ PRESENTE, **NON CREARE UN NUOVO CASO**. Ignora la notizia.

**PROCESSO OPERATIVO:**
1.  Esegui una ricerca approfondita.
2.  Per ogni notizia RILEVANTE, RECENTE e NON DUPLICATA, estrai le informazioni.
3.  Costruisci un oggetto JSON per ogni notizia, rispettando rigorosamente lo schema.
4.  Genera un ID univoco per ogni nuovo caso nel formato 'YYYYMMDD-[CODICE_REATO]-XXX'.
5.  Fornisci un output finale contenente SOLO l'array JSON.

**SCHEMA JSON \`CaseData\` (DA POPOLARE OBBLIGATORIAMENTE):**
\`\`\`json
{
  "caseID": "string", "initialReportTimestamp": "string", "lastUpdateTimestamp": "string", "status": "Active",
  "summary": {
    "title": "string", "crimeTypes": ["string"], 
    "location": { 
        "cities": [{ "name": "string", "province": "string", "region": "string" }],
        "regions": ["string"]
    },
    "dateOfOperation": "string"
  },
  "details": { "involvedForces": ["string"], "operationName": "string | null", "investigationReason": "string", "seizedAssetsValue": "number | null", "seizedAssetsDescription": "string | null" },
  "entities": {
    "individuals": [{ "name": "string", "age": "number | null", "legalAction": "string (es: 'arrestato')", "role": "string (es: 'sindaco') | null", "dateOfBirth": "string (YYYY-MM-DD) | null" }],
    "companies": [{ "name": "string", "legalAction": "string (es: 'società cartiera')" }]
  },
  "provenance": [{ "sourceType": "Primary", "sourceName": "string", "url": "string" }],
  "updates": [],
  "audio": { "ttsScript": "string", "ttsScriptEn": "string" }
}
\`\`\`
`;

export const generateCaseData = async (
    existingCases: CaseData[],
    analystReportedExamples: CaseData[],
    highPriorityExamples: CaseData[],
    mediumPriorityExamples: CaseData[],
    standardExamples: CaseData[],
    irrelevantExamples: CaseData[]
): Promise<CaseData[]> => {
  try {
    const { aiModel } = useCaseStore.getState();
    const activePromptEntry = await getActivePrompt();
    let promptToUse = activePromptEntry ? activePromptEntry.prompt : defaultPrompt;

    const profileSection = `
**PROFILO DI RILEVANZA (Appreso dal feedback dell'analista):**
*   **MASSIMA PRIORITÀ (Segnalato dall'analista - Peso 4):**
${summarizeCasesForPrompt(analystReportedExamples)}
*   **Esempi di casi ad ALTA PRIORITÀ (dai massima priorità a notizie simili - Peso 3):**
${summarizeCasesForPrompt(highPriorityExamples)}
*   **Esempi di casi a MEDIA PRIORITÀ (casi di forte interesse - Peso 2):**
${summarizeCasesForPrompt(mediumPriorityExamples)}
*   **Esempi di casi STANDARD (linea di base dell'interesse - Peso 1):**
${summarizeCasesForPrompt(standardExamples)}
*   **Esempi di casi IRRILEVANTI (evita notizie simili, presta attenzione al motivo):**
${summarizeCasesForPrompt(irrelevantExamples, true)}

**CASI ESISTENTI (da usare per il filtro anti-duplicazione):**
${JSON.stringify(existingCases.map(c => ({ caseID: c.caseID, title: c.summary.title, location: c.summary.location.cities.length > 0 ? c.summary.location.cities[0].name : 'N/A', date: c.summary.dateOfOperation })), null, 2)}
`;
    
    promptToUse += profileSection;

    const response = await (await getClient()).models.generateContent({
        model: aiModel,
        contents: promptToUse,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });

    if (!response.text) {
        throw new Error("The AI model returned an empty response during case generation.");
    }

    let jsonString = response.text.trim();
    const jsonStartIndex = jsonString.indexOf('[');
    const jsonStartIndexObj = jsonString.indexOf('{');

    if (jsonStartIndex !== -1 && (jsonStartIndexObj === -1 || jsonStartIndex < jsonStartIndexObj)) {
        jsonString = jsonString.substring(jsonStartIndex);
    } else if (jsonStartIndexObj !== -1) {
        jsonString = jsonString.substring(jsonStartIndexObj);
    } else {
        return []; // It's valid for the AI to find nothing, so we don't throw an error.
    }
    
    jsonString = jsonString.replace(/```json\s*|```$/g, '');
    
    if (jsonString.length === 0) {
        return [];
    }
        const parsedResponse = JSON.parse(jsonString);
        let rawCases: any[] = Array.isArray(parsedResponse) ? parsedResponse : parsedResponse.cases;
        if (!Array.isArray(rawCases)) {
            throw new Error("Failed to parse intelligence data from AI model: unexpected format.");
        }
        
        const verifiedCasesWithNulls = processProvenance(rawCases, response);
        const newCases = verifiedCasesWithNulls.filter((c): c is Partial<CaseData> => c !== null);

        const processedCasesPromises = newCases
          .filter(c => c.summary && c.summary.title)
          .map(async (c: any): Promise<Partial<CaseData> | null> => {
            const locationData: any = c.summary?.location;
            let rawCities: any[] = [];
        
            if (locationData?.cities && Array.isArray(locationData.cities)) {
              rawCities = locationData.cities;
            } else if (locationData?.city && typeof locationData.city === 'string') {
              rawCities = [{ name: locationData.city, region: locationData.region || '', province: locationData.province || '' }];
            }
        
            const citiesWithCoordsPromises = rawCities.map(async (city: any) => {
                const cityName = typeof city === 'string' ? city : city?.name;
                if (!cityName) return null;
                const geoResult = await getCoordsForCity(cityName, c.summary.title);
                if (!geoResult) return null;
                
                const baseCityObject = typeof city === 'string' ? { name: cityName, province: '', region: '' } : city;
                return {
                  ...baseCityObject,
                  name: geoResult.name, // Use the corrected name
                  coords: { lat: geoResult.lat, lng: geoResult.lng },
                  region: normalizeRegionName(baseCityObject.region || ''),
                };
            });

            const citiesWithCoords = (await Promise.all(citiesWithCoordsPromises))
              .filter((city): city is NonNullable<typeof city> => city !== null);
        
            if (citiesWithCoords.length === 0) {
              console.warn(`Case "${c.summary.title}" skipped: no valid coordinates found.`);
              return null;
            }
            
            const cityRegions = new Set(citiesWithCoords.map(city => city.region).filter(Boolean));
            const providedRegions = new Set((locationData?.regions || []).map(normalizeRegionName));
            const locationWithCoords = {
              cities: citiesWithCoords,
              regions: Array.from(new Set([...cityRegions, ...providedRegions])),
            };
        
            const crimeCode = (c.summary.crimeTypes && c.summary.crimeTypes.length > 0) ? crimeCategoryShortCodes[c.summary.crimeTypes[0] as CrimeCategory] || 'OTH' : 'OTH';
            const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const counter = await incrementAndGetCaseCounter();
            const progressiveId = String(counter).padStart(3, '0');
        
            return {
              ...c,
              caseID: c.caseID || `${dateStr}-${crimeCode}-${progressiveId}`,
              initialReportTimestamp: c.initialReportTimestamp || new Date().toISOString(),
              lastUpdateTimestamp: c.lastUpdateTimestamp || new Date().toISOString(),
              status: c.status || 'Active',
              summary: { ...c.summary, location: locationWithCoords, dateOfOperation: c.summary.dateOfOperation || new Date().toISOString().split('T')[0] },
              details: c.details || {},
              entities: c.entities || { individuals: [], companies: [] },
              provenance: c.provenance || [],
              updates: c.updates || [],
              audio: c.audio || { ttsScript: c.summary.title, ttsScriptEn: 'Summary not available.' },
              isImportant: false, hasReport: false, isRead: false,
            };
          });
          
        const resolvedCases = await Promise.all(processedCasesPromises);
        return resolvedCases.filter((c): c is CaseData => c !== null);

    } catch (e: any) {
        if (e.message?.includes("Failed to parse")) {
            console.error("Failed to parse Gemini response:", e);
            throw new Error("Failed to parse intelligence data from AI model.");
        }
        handleApiError(e, 'case generation');
    }
};

export const analyzeSingleUrl = async (url: string, existingCases: CaseData[]): Promise<Partial<CaseData>> => {
  try {
    const { aiModel } = useCaseStore.getState();
    const prompt = `
        Sei un analista di intelligence. Il tuo compito è analizzare il contenuto di un singolo URL fornito e estrarre le informazioni in un oggetto JSON strutturato.

        **URL DA ANALIZZARE:** ${url}

        **ISTRUZIONI:**
        1.  Accedi al contenuto dell'URL.
        2.  Leggi l'articolo e identifica se si tratta di una notizia relativa a un'operazione di polizia in Italia.
        3.  Se la notizia è pertinente, estrai TUTTE le informazioni disponibili e formattale in un singolo oggetto JSON che segua lo schema \`CaseData\`.
        4.  **REGOLE CRITICHE:** Segui le stesse regole di estrazione del tuo compito principale (date non future, nomi/ruoli/date di nascita completi, località multiple, URL diretti). Se il ruolo non è specificato, lascia il valore \`null\` e NON usare la parola "sconosciuto". Usa nomi di regione ufficiali.
        5.  **CONTROLLO DUPLICATI:** Confronta la notizia con l'elenco di casi esistenti fornito. Se è un duplicato evidente, restituisci un oggetto JSON di errore: \`{"error": "Questa notizia è un duplicato di un caso esistente."}\`.
        6.  Se l'URL non è valido o la notizia non è pertinente, restituisci un oggetto JSON di errore: \`{"error": "L'URL non contiene una notizia di intelligence rilevante."}\`.
        7.  Il tuo output deve essere ESCLUSIVAMENTE l'oggetto JSON, senza markdown o altri commenti.

        **CASI ESISTENTI PER CONTROLLO DUPLICATI:**
        ${JSON.stringify(existingCases.map(c => ({ caseID: c.caseID, title: c.summary.title, date: c.summary.dateOfOperation })), null, 2)}
        
        **SCHEMA JSON DI OUTPUT (parziale, compila più campi possibili):**
        \`\`\`json
        {
          "summary": {
            "title": "string", "crimeTypes": ["string"], 
            "location": { "cities": [{ "name": "string", "province": "string", "region": "string" }], "regions": ["string"] },
            "dateOfOperation": "string"
          },
          "details": { "involvedForces": ["string"], "operationName": "string | null", "investigationReason": "string", "seizedAssetsValue": "number | null", "seizedAssetsDescription": "string | null" },
          "entities": {
            "individuals": [{ "name": "string", "age": "number | null", "legalAction": "string", "role": "string | null", "dateOfBirth": "string | null" }],
            "companies": [{ "name": "string", "legalAction": "string" }]
          },
          "provenance": [{ "sourceType": "Primary", "sourceName": "string", "url": "string" }],
          "audio": { "ttsScript": "string", "ttsScriptEn": "string" }
        }
        \`\`\`
    `;

    const response = await (await getClient()).models.generateContent({
        model: aiModel,
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });

    if (!response.text) {
        throw new Error("L'analisi dell'URL non ha prodotto alcun risultato.");
    }

    const cleanedJsonText = response.text.trim().replace(/^```(?:json\s*)?|```$/g, '');
    const result = JSON.parse(cleanedJsonText);
    if (result.error) {
        throw new Error(result.error);
    }
    
    const [fixedResult] = processProvenance([result], response);
    if (!fixedResult) {
        throw new Error("L'analisi dell'URL non ha prodotto un caso con una fonte di origine verificabile.");
    }

    if (fixedResult.summary?.location) {
        const locationData: any = fixedResult.summary.location;
        let rawCities: any[] = [];

        if (locationData.cities && Array.isArray(locationData.cities)) {
            rawCities = locationData.cities;
        } else if (locationData.city && typeof locationData.city === 'string') {
             rawCities = [{ name: locationData.city, region: locationData.region || '', province: locationData.province || '' }];
        }

        const citiesWithCoordsPromises = rawCities.map(async (city: any) => {
             const cityName = (typeof city === 'string') ? city : city?.name;
             if (!cityName) return null;

             const geoResult = await getCoordsForCity(cityName, fixedResult.summary?.title);
             if (!geoResult) return null;

             const baseCityObject = (typeof city === 'string') ? { name: cityName, province: '', region: '' } : city;
             return {
                 ...baseCityObject,
                 name: geoResult.name,
                 coords: { lat: geoResult.lat, lng: geoResult.lng },
                 region: normalizeRegionName(baseCityObject.region || '')
             };
        });
        const citiesWithCoords = (await Promise.all(citiesWithCoordsPromises))
          .filter((city): city is NonNullable<typeof city> => city !== null);

        if (citiesWithCoords.length === 0) {
             throw new Error("Analisi fallita: nessuna località valida con coordinate trovata nell'articolo.");
        }

        const cityRegions = new Set(citiesWithCoords.map(c => c.region).filter(Boolean));
        const providedRegions = new Set((locationData.regions || []).map(normalizeRegionName));

        fixedResult.summary.location = {
            cities: citiesWithCoords,
            regions: Array.from(new Set([...cityRegions, ...providedRegions]))
        };
    }
    return fixedResult as Partial<CaseData>;
  } catch (e: any) {
    if (e.message?.includes("parse")) {
        throw new Error("Formato di risposta non valido dall'analisi dell'URL.");
    }
    handleApiError(e, 'URL analysis');
  }
};


export const updateCaseDetails = async (caseData: CaseData): Promise<Partial<CaseData>> => {
  try {
    const { aiModel } = useCaseStore.getState();
    const prompt = `
        Sei un analista di intelligence. Ti fornisco i dati di un caso esistente che potrebbe essere incompleto.
        Il tuo compito è eseguire una ricerca web per AGGIORNARE e COMPLETARE questo caso.

        **OBIETTIVO PRIMARIO: COMPLETEZZA DELLE ENTITÀ**
        La tua priorità massima è assicurarti che OGNI persona e azienda menzionata nelle fonti sia stata estratta. Rianalizza le fonti esistenti e cercane di nuove per trovare:
        - **TUTTE le persone indagate o arrestate:** Estrai nome completo, ruolo (es: 'imprenditore', se non specificato usa 'null', NON usare 'sconosciuto'), e data di nascita se disponibile.
        - **TUTTE le aziende coinvolte.**
        - **Dettagli aggiuntivi:** Nuove località (con nomi di regione ufficiali), aggiornamenti sul valore dei beni sequestrati, sviluppi investigativi, e nuove fonti giornalistiche.

        **DATI DEL CASO ESISTENTE (da completare e aggiornare):**
        ${JSON.stringify(caseData, null, 2)}

        **ISTRUZIONI DI OUTPUT:**
        1.  Analizza le informazioni nuove e quelle precedentemente omesse.
        2.  Prepara un oggetto JSON contenente SOLO i campi aggiornati.
        3.  **Regola URL (CRITICA):** Usa sempre URL diretti e pubblici per le fonti, MAI URL di reindirizzamento come \`vertexaisearch.cloud.google.com\`.
        4.  **IMPORTANTE per gli array (\`entities\`, \`provenance\`, \`location.cities\`, ecc.):** L'array che restituisci deve essere la versione FINALE e COMPLETA. Deve contenere TUTTI gli elementi (quelli vecchi, quelli nuovi, e quelli mancanti), uniti senza duplicati.
        5.  Se trovi uno sviluppo significativo, aggiungi un oggetto all'array "updates" con un timestamp e un riepilogo.
        6.  Se non trovi assolutamente nessuna informazione nuova o mancante, restituisci un oggetto JSON vuoto: \`{}\`.
        7.  L'output DEVE essere solo l'oggetto JSON, senza commenti o markdown.

        Esempio di output JSON valido:
        \`\`\`json
        {
          "entities": { "individuals": [/* lista COMPLETA e aggiornata */], "companies": [/* lista COMPLETA e aggiornata */] },
          "details": { "seizedAssetsValue": 5000000 },
          "provenance": [ /* lista COMPLETA e aggiornata */ ]
        }
        \`\`\`
    `;

    const response = await (await getClient()).models.generateContent({
        model: aiModel,
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });

    if (!response.text) {
        console.warn(`Update check for ${caseData.caseID} returned no new information.`);
        return {};
    }
    
    const cleanedJsonText = response.text.trim().replace(/^```(?:json\s*)?|```$/g, '');
    if (!cleanedJsonText || cleanedJsonText === '{}') {
        console.log(`No new updates found for case ${caseData.caseID}.`);
        return {};
    }
    
    const parsedChanges = JSON.parse(cleanedJsonText);
    const [fixedChanges] = processProvenance([parsedChanges], response);

    if (!fixedChanges) {
        console.warn(`Update for case ${caseData.caseID} discarded because provenance could not be verified.`);
        return {};
    }

    if (fixedChanges.summary?.location) {
        const newLocationData = fixedChanges.summary.location;
        const oldLocationData = caseData.summary.location;
    
        if ((!newLocationData.cities || newLocationData.cities.length === 0) && oldLocationData.cities.length > 0) {
            fixedChanges.summary.location = oldLocationData;
        } else {
            const citiesWithCoordsPromises = (newLocationData.cities || [])
                .map(async (city: any) => {
                    const cityName = typeof city === 'string' ? city : city?.name;
                    if (!cityName) return null;
            
                    const geoResult = await getCoordsForCity(cityName, fixedChanges.summary?.title);
                    if (!geoResult) return null;
            
                    const baseCityObject = typeof city === 'string' ? { name: cityName, province: '', region: '' } : city;
                    return {
                      ...baseCityObject,
                      name: geoResult.name,
                      coords: { lat: geoResult.lat, lng: geoResult.lng },
                      region: normalizeRegionName(baseCityObject.region || ''),
                    };
                });
            
            const citiesWithCoords = (await Promise.all(citiesWithCoordsPromises))
              .filter((city): city is NonNullable<typeof city> => city !== null);

            if (citiesWithCoords.length === 0 && oldLocationData.cities.length > 0) {
                fixedChanges.summary.location = oldLocationData;
            } else {
                const cityRegions = new Set(citiesWithCoords.map(c => c.region).filter(Boolean));
                const providedRegions = new Set((newLocationData.regions || []).map(normalizeRegionName));
                
                fixedChanges.summary.location = {
                    cities: citiesWithCoords,
                    regions: Array.from(new Set([...cityRegions, ...providedRegions]))
                };
            }
        }
    }
    return fixedChanges as Partial<CaseData>;
  } catch (e: any) {
     if (e.message?.includes("parse")) {
        throw new Error(`Failed to parse update data from AI model for case ${caseData.caseID}.`);
    }
    handleApiError(e, `updating case ${caseData.caseID}`);
  }
};

const deepDiveReportPrompt = `
Sei un analista di intelligence senior specializzato in cronaca giudiziaria e attività delle forze dell'ordine in Italia. Il tuo compito è scrivere un report di approfondimento sul caso fornito, secondo le regole di scrittura analitica descritte qui sotto. I dati di partenza sono un punto di partenza e possono essere incompleti.

**OBIETTIVO:**
Rispondi a una domanda precisa: che cosa è accaduto in questo caso, chi è coinvolto e che cosa significa. Il report è il prodotto: chi lo legge deve poter agire leggendo soltanto la prima sezione. Allo stesso tempo, estrai e struttura un elenco **aggiornato e completo** di tutte le persone e aziende coinvolte.

**PROCESSO:**
1.  Analizza i dati del caso fornito, considerandoli un punto di partenza.
2.  Esegui una ricerca web approfondita per trovare dettagli aggiuntivi o mancanti nelle fonti originali e in nuove fonti. Risali sempre all'origine di ogni informazione: comunicato stampa, provvedimento, articolo.
3.  Sintetizza TUTTE le informazioni (quelle iniziali e quelle nuove) nel campo \`reportContent\`, formattando il testo esclusivamente in **Markdown**.
4.  Nell'allegato sulle entità, includi un elenco chiaro e **COMPLETO** di tutte le persone coinvolte (con nome, ruolo, data di nascita se disponibile) e di tutte le aziende.
5.  Estrai **TUTTE** le persone e le aziende menzionate da **TUTTE** le fonti (vecchie e nuove), e formattale nell'oggetto \`updatedEntities\`. Se il ruolo non è specificato, lascia il valore \`null\` e **NON usare "sconosciuto"**.
6.  Scrivi la sintesi per ultima: prima i fatti e i giudizi, poi la sintesi che li copre tutti.

**LINGUAGGIO DELLA PROBABILITÀ (OBBLIGATORIO):**
Per esprimere quanto è probabile un evento o una circostanza usa SOLO questi sette termini, tratti dalla prima riga della scala di probabilità della direttiva ICD 203, sempre nella stessa forma. Alla prima occorrenza di ciascun termine indica l'intervallo tra parentesi.
| Termine | Intervallo |
|---|---|
| quasi nessuna possibilità | 01-05% |
| molto improbabile | 05-20% |
| improbabile | 20-45% |
| probabilità pressoché pari | 45-55% |
| probabile | 55-80% |
| molto probabile | 80-95% |
| quasi certo | 95-99% |
- Non usare sinonimi o altre scale ('remoto', 'altamente probabile', 'verosimile', 'plausibile', 'possibile', 'praticamente certo').
- La **fiducia** (\`fiducia alta\`, \`fiducia moderata\`, \`fiducia bassa\`) dice quanto è solida la base del giudizio: numero, qualità e indipendenza delle fonti, solidità del ragionamento. Va dichiarata in una frase separata, **mai nella stessa frase di un termine di probabilità**. Spiega che cosa la determina (fonte unica, informazioni datate, lacuna, assunzione chiave).
- I **fatti** si scrivono senza qualificatori, con il riferimento alla fonte. La certezza appartiene ai fatti osservati, non è un grado di probabilità.
- **Vietati** fuori dalla scala: 'potrebbe', 'sembrerebbe', 'si ritiene', 'pare', 'forse', 'non è escluso', 'resta da vedere', 'fonti riferiscono'. 'Potrebbe' e 'può' sono ammessi solo con una condizione esplicita ('il gruppo può spostare l'attività su un'altra provincia se...'). Non usare il condizionale giornalistico ('avrebbe ricevuto'): attribuisci l'affermazione a chi la fa ('secondo la Procura di Milano, X ha ricevuto...').
- **Presunzione di innocenza:** le ipotesi di reato sono contestazioni dell'accusa, non fatti accertati. Il fatto è che l'accusa le contesta ('la Procura contesta a X il reato di...'); usa 'indagato', 'imputato', 'arrestato', 'condannato' secondo la fase effettiva del procedimento.

**VALUTAZIONE DELLE FONTI (sistema 4x4 UNODC):**
Ogni fonte riceve due voti separati: affidabilità della fonte (A, B, C, X) e validità dell'informazione (1, 2, 3, 4), scritti insieme come codice (es. \`A1\`, \`B2\`, \`X4\`). La fonte non è il sito che ospita il testo, ma chi ha prodotto l'informazione.
- **Fonte A**: ente che produce l'informazione per funzione istituzionale. Comunicato ufficiale di Questura, Carabinieri, Guardia di Finanza, Polizia di Stato, Procura; provvedimento giudiziario (ordinanza, decreto, sentenza) pubblicato o citato testualmente.
  - Informazione **1**: il contenuto dell'atto, o un dato che l'ente attesta in prima persona (arresti eseguiti, beni sequestrati, data e luogo dell'operazione).
  - Informazione **2**: la ricostruzione dell'accusa contenuta nel comunicato (ruoli, schema, ipotesi di reato): l'ente la conosce direttamente, ma non è ancora verificata in giudizio.
- **Fonte B**: testata giornalistica registrata, con firma o redazione identificabile e una storia di affidabilità, che riprende un comunicato o un atto.
  - Informazione **2**: il giornalista ha visto l'atto, cita testualmente o era presente.
  - Informazione **3**: l'informazione è di seconda mano ma corroborata da un'altra fonte indipendente (es. il comunicato ufficiale).
- **Fonte C**: testata o sito con una storia nota di inesattezze.
- **Fonte X**: testata sconosciuta, aggregatore senza firma, blog, profilo social anonimo, voce non attribuita ('secondo indiscrezioni', 'fonti investigative' senza nome). Una voce non attribuita e non corroborata è \`X4\`; se corroborata da una fonte indipendente diventa \`X3\`.
- Le dichiarazioni di indagati, difensori o vittime sono la versione di quella parte: valutale come ciò che la parte afferma, non come un fatto sul caso.
- **La corroborazione deve essere indipendente:** dieci articoli che riprendono lo stesso comunicato sono una sola fonte. Indica sempre l'origine comune.
- Un'informazione è **confermata** solo con voto A1, A2, B1 o B2; con ogni altro voto è **non confermata** e va detto.
- I risultati di ricerca e le sintesi generate da IA non sono fonti: cita l'articolo o l'atto a cui rimandano.

**REGOLE DI SCRITTURA:**
- La prima frase di ogni paragrafo riassume l'intero paragrafo; le frasi successive la sostengono, dalla più importante alla meno importante.
- Non aprire mai con una data o con la storia del caso: apri con ciò che il lettore deve sapere.
- Una frase, un'affermazione; circa venti parole, mai oltre trentacinque. Forma attiva, con chi agisce come soggetto.
- Concretezza: niente 'vari', 'diversi', 'numerosi', 'ecc.'. Se non hai il dettaglio, togli l'espressione.
- Scrivi del caso, non delle fonti ('l'articolo fornisce dettagli' non dice nulla: scrivi quali sono i dettagli).
- Usa sempre la stessa grafia per ogni nome di persona, società e luogo.
- Date senza ambiguità: \`14 settembre 2026\`.

**REGOLE CRITICHE DI STRUTTURA DEL REPORT:**
- Il \`reportContent\` DEVE seguire esattamente questa struttura di sezioni Markdown, nell'ordine indicato. Usa solo titoli di livello \`###\`; all'interno delle sezioni usa paragrafi, elenchi, grassetto e tabelle, ma non altri titoli.
  1.  \`### 1. Sintesi (bottom line)\`: risponde alla domanda in 3-5 frasi: che cosa è accaduto, che cosa significa, quanto sei sicuro (con un termine della scala o un livello di fiducia, mai entrambi nella stessa frase). Basta da sola per agire.
  2.  \`### 2. Giudizi chiave\`: elenco numerato. Ogni giudizio è una frase con un termine della scala di probabilità e i riferimenti alle fonti su cui poggia (es. \`(F1, F3)\`), seguita da una frase separata con il livello di fiducia e il motivo. Esempio: '1. È probabile (55-80%) che il gruppo operasse anche in Campania, perché due ordinanze citano depositi a Caserta (F1, F2). Fiducia moderata: entrambe le ordinanze derivano dalla stessa indagine.'
  3.  \`### 3. Fatti accertati\`: elenco numerato dei fatti, senza qualificatori, ciascuno con riferimento e voto 4x4 della fonte (es. \`(F1, A1)\`). Solo fatti: nessun giudizio, nessun livello di fiducia. Le contestazioni dell'accusa sono riportate come tali.
  4.  \`### 4. Analisi\`: come i fatti sostengono i giudizi. Usa queste etichette in grassetto, nell'ordine: **Modus operandi** (lo schema criminale descritto dall'accusa, i ruoli, i flussi di denaro o di merce), **Ipotesi alternative** (le spiegazioni alternative considerate e perché sono state scartate o mantenute), **Assunzioni chiave** (le assunzioni da cui dipende il ragionamento).
  5.  \`### 5. Lacune e prossimi passi\`: che cosa non è stato possibile accertare, che cosa colmerebbe ciascuna lacuna (es. l'ordinanza integrale, l'esito del riesame, la data dell'udienza) e gli indicatori che cambierebbero i giudizi.
  6.  \`### 6. Fonti\`: una frase di sintesi sulla base delle fonti (quante fonti indipendenti, di che tipo, da quali dipendono i giudizi chiave), seguita da una tabella con TUTTE le fonti: \`| Rif. | Fonte | Chi è la fonte | Data di pubblicazione | Data di consultazione | Voto |\`. Nella colonna Fonte formatta ogni fonte come link Markdown cliccabile: \`[Titolo Articolo - Nome Giornale](URL)\`. Riferimenti \`F1\`, \`F2\`... nell'ordine.
  7.  \`### 7. Metodo e limiti\`: due o tre frasi: report generato da un modello di IA con ricerca web su fonti giornalistiche aperte, periodo coperto dalle fonti, che cosa non è stato consultato (atti non pubblicati, banche dati riservate).
  8.  \`### Allegato A. Entità coinvolte\`: persone (nome, ruolo, data di nascita se disponibile, posizione processuale) e aziende (denominazione, ruolo, provvedimento), con i riferimenti alle fonti.
  9.  \`### Allegato B. Dati geografici riepilogativi\`: città, province e regioni coinvolte, con il ruolo di ciascun luogo nel caso.
  10. \`### Allegato C. Verifiche con sistemi interni\` (Usa ESATTAMENTE e SOLO il testo: "Le verifiche con i sistemi interni non sono ancora state effettuate").
- **NON DEVI includere** una sezione "Raccomandazioni".
- **DISCLAIMER OBBLIGATORIO:** Alla fine del report, dopo tutte le altre sezioni, DEVI includere il seguente testo esatto in corsivo: *Questo report è stato sviluppato da ACTA DIURNA. Le informazioni devono essere validate da un analista prima di poter essere considerate valide.*
- Se non trovi informazioni sufficienti, restituisci un oggetto JSON di errore: \`{"error": "Motivazione..."}\`.
- **Formato del testo:** All'interno del \`reportContent\`, usa solo virgolette singole (') e non doppie (") per evitare errori di parsing JSON.
- L'output finale DEVE essere un singolo oggetto JSON che rispetta lo schema, senza testo o commenti esterni.

**DATI DEL CASO DA ANALIZZARE:**
\`\`\`json
CASE_DATA_PLACEHOLDER
\`\`\`

**SCHEMA DI OUTPUT JSON (OBBLIGATORIO):**
\`\`\`json
{
  "reportContent": "string (CONTENUTO IN MARKDOWN)",
  "updatedEntities": {
    "individuals": [{ "name": "string", "age": "number | null", "legalAction": "string", "role": "string | null", "dateOfBirth": "string | null" }],
    "companies": [{ "name": "string", "legalAction": "string" }]
  }
}
\`\`\`
`;

export const generateDeepDiveReport = async (caseData: CaseData): Promise<DeepDiveReport> => {
  try {
    const { aiModel } = useCaseStore.getState();
    const filledPrompt = deepDiveReportPrompt.replace('CASE_DATA_PLACEHOLDER', JSON.stringify(caseData, null, 2));

    const response = await (await getClient()).models.generateContent({
        model: aiModel,
        contents: filledPrompt,
        config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    reportContent: { 
                        type: Type.STRING, 
                        description: "The full intelligence report formatted in Markdown." 
                    },
                    updatedEntities: {
                        type: Type.OBJECT,
                        properties: {
                            individuals: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        name: { type: Type.STRING },
                                        age: { type: Type.NUMBER },
                                        legalAction: { type: Type.STRING },
                                        role: { type: Type.STRING },
                                        dateOfBirth: { type: Type.STRING }
                                    },
                                    required: ['name', 'legalAction']
                                }
                            },
                            companies: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        name: { type: Type.STRING },
                                        legalAction: { type: Type.STRING }
                                    },
                                    required: ['name', 'legalAction']
                                }
                            }
                        },
                        required: ['individuals', 'companies']
                    }
                },
                required: ['reportContent', 'updatedEntities']
            }
        },
    });

    if (!response.text) {
        throw new Error("The AI model returned an empty response while generating the report.");
    }
    
    const cleanedJsonText = response.text.trim().replace(/^```(?:json\s*)?|```$/g, '');
    const result = JSON.parse(cleanedJsonText);

    if (result.error) {
        throw new Error(`AI reported an error: ${result.error}`);
    }
    return result as DeepDiveReport;
  } catch (e: any) {
    if (e.message?.includes("parse")) {
        throw new Error("Failed to parse report data from AI model.");
    }
    handleApiError(e, `generating report for case ${caseData.caseID}`);
  }
};

export const reviseSearchPrompt = async (
  highPriority: CaseData[],
  mediumPriority: CaseData[],
  standard: CaseData[],
  irrelevant: CaseData[],
  currentPrompt: string
): Promise<string> => {
  try {
    const { aiModel } = useCaseStore.getState();
    const prompt = `
      Sei un'IA stratega specializzata in OSINT. Il tuo compito è ottimizzare un prompt di ricerca per un altro modello IA (Chronicle), basandoti sul feedback di un analista umano.

      **CONTESTO:**
      L'analista ha classificato una serie di casi. La tua missione è analizzare questa classificazione per capire le sue priorità investigative e affinare le direttive di ricerca future di Chronicle.

      **DATI FORNITI:**
      1.  **PROMPT ATTUALE:** Il prompt che Chronicle sta usando ora.
          \`\`\`
          ${currentPrompt}
          \`\`\`
      2.  **FEEDBACK DELL'ANALISTA (PONDERATO):**
          *   **ALTA PRIORITÀ (Peso 3):** Casi marcati come "Importanti". Questi sono i più critici.
              ${summarizeCasesForPrompt(highPriority)}
          *   **MEDIA PRIORITÀ (Peso 2):** Casi per cui è stato richiesto un report di approfondimento. Forte segnale di interesse.
              ${summarizeCasesForPrompt(mediumPriority)}
          *   **RILEVANZA STANDARD (Peso 1):** Un campione di casi letti e analizzati. Rappresentano la baseline.
              ${summarizeCasesForPrompt(standard)}
          *   **IRRILEVANTI (Peso Negativo):** Casi archiviati. Esempi di cosa evitare. Analizza il motivo se specificato.
              ${summarizeCasesForPrompt(irrelevant, true)}

      **COMPITO:**
      1.  **ANALIZZA:** Esamina i casi in tutte le categorie. Identifica i pattern, le parole chiave, i tipi di reato, le aree geografiche e le caratteristiche comuni nei casi ad alta e media priorità. Contrasta questi elementi con i casi standard e quelli irrilevanti. Presta particolare attenzione ai motivi di irrilevanza forniti per capire cosa escludere (es. notizie troppo vecchie).
      2.  **STRATEGIZZA:** Formula una strategia per migliorare il prompt. Ad esempio: "L'analista sembra molto interessato a frodi fiscali che usano ASD nel Nord Italia. Devo rendere questo criterio più esplicito e prioritario nel prompt." oppure "L'analista sta scartando molte notizie perché vecchie, devo rafforzare la regola sulla data di pubblicazione."
      3.  **RISCRIVI IL PROMPT:** Modifica la sezione "PARAMETRI DI RICERCA" del prompt attuale per riflettere la tua nuova strategia. Sii specifico. Aggiungi o rafforza parole chiave, modifica i criteri di rilevanza (es. importi sequestrati), o dai priorità a certe aree geografiche. **Mantieni intatte le regole critiche fondamentali (DATA, PERSONE, URL, etc.)** a meno che la strategia non richieda un loro specifico affinamento.
      4.  **OUTPUT:** Restituisci **SOLO ED ESCLUSIVAMENTE** il testo completo del nuovo prompt ottimizzato, senza alcun commento o testo aggiuntivo.
    `;

    const response = await (await getClient()).models.generateContent({
        model: aiModel,
        contents: prompt,
    });
    
    if (!response.text) {
        console.warn("Prompt revision returned no result. Keeping the current prompt.");
        return currentPrompt;
    }

    return response.text.trim();
  } catch (e: any) {
    handleApiError(e, 'prompt revision');
  }
};

export const translateReport = async (reportContent: string): Promise<string> => {
  try {
    const { aiModel } = useCaseStore.getState();
    const prompt = `
        Translate the following intelligence report into professional, formal English suitable for law enforcement agencies.
        It is critical that you preserve the exact Markdown formatting of the original text (headings, lists, bold text, etc.).
        Pay special attention to the final italicized disclaimer and translate it accurately, keeping it in italics.

        REPORT TO TRANSLATE:
        ---
        ${reportContent}
        ---
    `;

    const response = await (await getClient()).models.generateContent({
        model: aiModel,
        contents: prompt,
    });

    if (!response.text) {
        throw new Error("Translation failed: The AI model returned an empty response.");
    }

    return response.text.trim();
  } catch (e: any) {
    handleApiError(e, 'report translation');
  }
};