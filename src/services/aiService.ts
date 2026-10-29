import { runPhase, LlmError, type SourceRef } from './llm';
import { extractJson } from '../utils/extractJson';
import { CrimeCategory, type CaseData, type DeepDiveReport, type EntitaEstratte } from '../types';
import { costruisciEntita, entitaDelCaso, unisciEntita } from './entita';
import { crimeCategoryShortCodes, normalizeRegionName } from "../utils/crimeCategorizer";
import { getActivePrompt, incrementAndGetCaseCounter, getSettings, setSettings } from '../db';


// Prompt e post-elaborazione dei casi. Quale fornitore e quale modello
// rispondono lo decide services/llm: qui non compare nessun SDK.


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
    console.error(`AI call failed in ${context}:`, error);
    if (error instanceof LlmError) {
        throw error;
    }
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

const geocodeSchema = {
    type: 'object',
    properties: {
        lat: { type: 'number', description: 'Latitude' },
        lng: { type: 'number', description: 'Longitude' },
        correctedName: { type: 'string', description: 'Official city name' },
    },
    required: ['lat', 'lng', 'correctedName'],
    additionalProperties: false,
};

const fetchCoordinatesForCity = async (cityName: string, context?: string): Promise<{ lat: number; lng: number; correctedName: string } | null> => {
    // La forma dell'uscita la vincola lo schema: il prompt dice solo che cosa cercare.
    const system = `Dai le coordinate del comune italiano indicato, con il suo nome ufficiale in correctedName. Il nome può essere una frazione, un nome storico o una grafia errata: in quel caso scegli il comune a cui appartiene, aiutandoti con il titolo della notizia se c'è.`;
    const prompt = context ? `Località: ${cityName}\nTitolo della notizia: ${context}` : `Località: ${cityName}`;
    console.log(`Geocoding "${cityName}"${context ? ' with context' : ''}`);

    try {
        const response = await runPhase('geocode', { system, prompt, schema: geocodeSchema });

        if (!response.text) {
            console.warn(`Geocoding for "${cityName}" returned no text.`);
            return null;
        }

        const data: any = extractJson(response.text);

        if (data && typeof data.lat === 'number' && typeof data.lng === 'number' && typeof data.correctedName === 'string') {
            console.log(`Successfully geocoded "${cityName}":`, data);
            return data;
        }
        console.warn(`Geocoding for "${cityName}" returned an invalid format:`, response.text);
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

// --- Fonti -------------------------------------------------------------------

/** URL confrontabile: senza protocollo, www, barra finale e parametri di tracciamento. */
const normalizzaUrl = (url: string | undefined | null): string => {
    if (!url) return '';
    try {
        const u = new URL(url);
        [...u.searchParams.keys()].filter(k => /^utm_|^fbclid$|^gclid$/i.test(k)).forEach(k => u.searchParams.delete(k));
        const query = u.searchParams.toString();
        return `${u.hostname.replace(/^www\./, '').toLowerCase()}${u.pathname.replace(/\/+$/, '')}${query ? `?${query}` : ''}`;
    } catch {
        return url.trim().toLowerCase();
    }
};

/**
 * Tiene solo le fonti che il modello ha davvero consultato. Con Claude il
 * confronto e' per URL: le pagine consultate sono gli URL reali delle testate.
 * Con Gemini le pagine arrivano come rinvii vertexaisearch, e resta il
 * confronto tra i titoli. Nei test reali il confronto tra titoli aveva dato a un
 * caso la pagina di Wikipedia e a un altro l'articolo di un'altra vicenda.
 */
export const processProvenance = (cases: (Partial<CaseData> | CaseData)[], sources: SourceRef[]): (Partial<CaseData> | CaseData | null)[] => {
    if (sources.length === 0) {
        console.warn("[Provenance] No consulted sources reported. Allowing cases to pass but quality may be affected.");
        return cases.map(c => c ? { ...c, provenanceWarning: true } : null);
    }
    const perRinvio = sources.some(s => s.uri.includes('vertexaisearch'));
    const perUrl = new Map(sources.map(s => [normalizzaUrl(s.uri), s]));
    const perTitolo = sources.map(s => ({ ...s, tokens: getTokens(s.title) }));

    return cases.map(c => {
        if (!c?.provenance || !Array.isArray(c.provenance) || c.provenance.length === 0) {
            console.warn(`[Provenance] Case rejected due to missing provenance:`, c?.summary?.title);
            return null;
        }
        const verifiedProvenance: CaseData['provenance'] = [];
        for (const source of c.provenance) {
            let trovata: SourceRef | undefined;
            if (!perRinvio) {
                trovata = perUrl.get(normalizzaUrl(source.url));
            } else if (source.sourceName) {
                const tokens = getTokens(source.sourceName);
                let migliore = 0.3;
                for (const gs of perTitolo) {
                    const s = jaccardSimilarity(tokens, gs.tokens);
                    if (s > migliore) { migliore = s; trovata = gs; }
                }
            }
            if (trovata && !verifiedProvenance.some(p => normalizzaUrl(p.url) === normalizzaUrl(trovata!.uri))) {
                verifiedProvenance.push({
                    sourceType: source.sourceType === 'Secondary' || source.sourceType === 'Tertiary' ? source.sourceType : 'Primary',
                    sourceName: source.sourceName || trovata.title,
                    url: trovata.uri,
                });
            } else if (!trovata) {
                console.warn(`[Provenance] Fonte non tra le pagine consultate, esclusa: ${source.url || source.sourceName}`);
            }
        }
        if (verifiedProvenance.length === 0) {
            console.warn(`[Provenance REJECTED] No verifiable sources found for case "${c.summary?.title}".`);
            return null;
        }
        return { ...c, provenance: verifiedProvenance, provenanceWarning: false };
    });
};

// --- Categorie, luoghi, identificativo del caso ----------------------------

const CATEGORIE = Object.values(CrimeCategory) as string[];

/** Solo i nove codici: un valore fuori elenco si scarta, e senza codici resta OTHER. */
export const categorieValide = (tipi: unknown): CrimeCategory[] => {
    const valide = (Array.isArray(tipi) ? tipi : [])
        .map(t => (typeof t === 'string' ? t.trim().toUpperCase() : ''))
        .filter(t => CATEGORIE.includes(t)) as CrimeCategory[];
    const uniche = Array.from(new Set(valide));
    return uniche.length > 0 ? uniche : [CrimeCategory.OTHER];
};

type Localita = CaseData['summary']['location'];

/** Citta' senza doppioni, geocodificate; null se nessuna ha coordinate. */
const geolocalizza = async (location: any, titolo: string): Promise<Localita | null> => {
    let grezze: any[] = [];
    if (Array.isArray(location?.cities)) grezze = location.cities;
    else if (typeof location?.city === 'string') grezze = [{ name: location.city, region: location.region || '', province: location.province || '' }];

    const viste = new Set<string>();
    const uniche = grezze
        .map(c => (typeof c === 'string' ? { name: c, province: '', region: '' } : c))
        .filter(c => {
            const chiave = (c?.name ?? '').trim().toLowerCase();
            if (!chiave || viste.has(chiave)) return false;
            viste.add(chiave);
            return true;
        });

    const conCoordinate = (await Promise.all(uniche.map(async c => {
        const geo = await getCoordsForCity(c.name, titolo);
        return geo ? { ...c, name: geo.name, coords: { lat: geo.lat, lng: geo.lng }, region: normalizeRegionName(c.region || '') } : null;
    }))).filter((c): c is NonNullable<typeof c> => c !== null);

    // Due nomi diversi possono essere lo stesso comune dopo la correzione.
    const finali = conCoordinate.filter((c, i) => conCoordinate.findIndex(x => x.name.toLowerCase() === c.name.toLowerCase()) === i);
    if (finali.length === 0) return null;
    const regioni = new Set([...finali.map(c => c.region).filter(Boolean), ...((location?.regions ?? []) as string[]).map(normalizeRegionName)]);
    return { cities: finali, regions: Array.from(regioni).filter(Boolean) };
};

/** L'ID lo assegna sempre il contatore locale: quello proposto dal modello non e' unico. */
const nuovoCaseID = async (categorie: CrimeCategory[], manuale = false): Promise<string> => {
    const data = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const codice = crimeCategoryShortCodes[categorie[0]] || 'OTH';
    const progressivo = String(await incrementAndGetCaseCounter()).padStart(3, '0');
    return `${data}-${codice}-${manuale ? 'MANUAL-' : ''}${progressivo}`;
};

// --- Profilo e casi esistenti nel messaggio --------------------------------

// Il motivo con cui l'analista ha archiviato un caso, come lo deve capire il modello.
const MOTIVI_IRRILEVANZA: Record<string, string> = {
    irrelevant_duplicate: "duplicato di un caso già in archivio",
    irrelevant_too_old: "notizia troppo vecchia",
    irrelevant_not_crime: "non interessa all'analista: il tipo di reato o l'impatto",
    irrelevant_out_of_scope: "fuori perimetro: non è un'operazione già eseguita",
};

const summarizeCasesForPrompt = (cases: CaseData[], showFeedback: boolean = false): string => {
    if (cases.length === 0) return "nessuno";
    return cases.map(c => {
        let summary = `- ${c.summary.title} (${c.summary.crimeTypes.join(', ')}, ${c.summary.location.cities[0]?.name ?? 'luogo non indicato'})`;
        if (showFeedback && c.userFeedback?.startsWith('irrelevant_')) {
            const motivo = MOTIVI_IRRILEVANZA[c.userFeedback as string];
            if (motivo) summary += ` [motivo: ${motivo}]`;
        }
        return summary;
    }).join('\n');
};

// Per il controllo dei duplicati bastano i casi recenti: la rassegna cerca
// notizie degli ultimi giorni. Passarli tutti faceva crescere il prompt, e il
// costo, a ogni caso raccolto.
const DEDUP_WINDOW_DAYS = 60;
const recentCasesForDedup = (cases: CaseData[]): CaseData[] => {
    const since = Date.now() - DEDUP_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    return cases.filter(c => new Date(c.lastUpdateTimestamp || c.initialReportTimestamp).getTime() >= since);
};

const casiEsistenti = (cases: CaseData[]): string =>
    JSON.stringify(recentCasesForDedup(cases).map(c => ({ title: c.summary.title, city: c.summary.location.cities[0]?.name ?? null, date: c.summary.dateOfOperation })));

const oggi = () => new Date().toISOString().slice(0, 10);

// --- Istruzioni fisse ------------------------------------------------------
// Prosa normale, una regola una volta sola, con il motivo quando non e'
// ovvio. Vanno nel system: con Claude stanno in cache tra una chiamata e
// l'altra.

const REGOLE_COMUNI = `Lavori per Acta Diurna, un'applicazione civile di OSINT che legge la stampa italiana e struttura in casi le operazioni delle forze dell'ordine già eseguite. Lavori solo su notizie pubblicate. I casi li leggono analisti, giornalisti e ricercatori, e ogni dato viene verificato da una persona prima di essere usato: per questo un campo vuoto vale più di un valore dedotto.

Perimetro: operazioni già eseguite in Italia da Polizia di Stato, Carabinieri o Guardia di Finanza, o disposte da una Procura: arresti, misure cautelari, perquisizioni, sequestri, confische. Restano fuori i processi, le sentenze e le indagini annunciate senza un'operazione.

Categorie. In summary.crimeTypes metti uno o più di questi codici, il principale per primo, e nient'altro; il reato come lo descrive l'articolo va in details.investigationReason.
- ORGANIZED_CRIME: mafia, 'ndrangheta, camorra, associazioni per delinquere
- FINANCIAL_CRIME: riciclaggio, autoriciclaggio, bancarotta, reati societari e finanziari
- ASSET_SEIZURE: operazioni il cui fatto principale è un sequestro o una confisca di beni
- FRAUD: frodi fiscali, false fatturazioni, crediti fittizi, truffe, enti di facciata come false ONLUS o ASD
- CORRUPTION: corruzione, concussione, turbativa d'asta, appalti pilotati
- DRUG_TRAFFICKING: traffico e spaccio di stupefacenti
- CYBER_CRIME: reati informatici
- EXTORTION: estorsione e usura
- OTHER: il resto dentro il perimetro

Persone. Per ogni persona coinvolta riporta nome_completo come lo scrive l'articolo. Nome e cognome vanno separati con ordine_certo true solo quando l'articolo li distingue senza dubbio, per esempio con il cognome in maiuscolo; altrimenti lasciali null. ruolo è che cosa fa la persona (imprenditore, sindaco, funzionario); posizione è la sua situazione nel procedimento come la scrive l'articolo (indagato, arrestato, ai domiciliari, obbligo di firma). Data di nascita solo se scritta per intero, in AAAA-MM-GG; età se l'articolo la dà; codice fiscale solo se compare nel testo. Il sesso solo se l'articolo scrive «nato» o «nata» (sesso_fonte "nascita") o usa una qualifica al maschile o al femminile riferita a quella persona, come «l'indagata» (sesso_fonte "qualifica"): dal solo nome proprio non si deduce, perché nomi come Andrea valgono per entrambi.

Società ed enti. ragione_sociale senza la forma giuridica, forma a parte (s.r.l., s.p.a., s.a.s.), tipo tra societa, ente_pubblico e organizzazione. Partita IVA, codice fiscale e numero REA solo se scritti nel testo. Poi sede, stato (sotto sequestro, fallita, in liquidazione), attività e settore, valore dei beni riconducibili se l'articolo lo dà, e ruolo: che cosa c'entra con l'operazione (società cartiera, beneficiaria dei fondi, appaltatrice).

Legami. Quando l'articolo lega una persona a una società (amministratore, socio, titolare, dipendente, prestanome) riportalo in legami, con il ruolo come scritto, il tipo tra amministrazione, proprieta, dipendenza, rappresentanza e appartenenza, e qualifica "di fatto" per prestanome e amministratori di fatto.

Le ipotesi di reato sono contestazioni dell'accusa, non fatti accertati: scrivile come tali.

Luoghi: tutte le località coinvolte, la principale per prima, con provincia e regione nella forma ufficiale.

Fonti. In provenance metti solo pagine che hai aperto o trovato con la ricerca, con l'URL esatto restituito dallo strumento: il codice scarta ogni fonte il cui URL non è tra le pagine consultate. Preferisci il comunicato ufficiale o l'articolo originale alle riprese: sourceType "Primary" per loro, "Secondary" per le riprese.`;

const FORMA_CASO = `{
  "summary": {
    "title": "titolo informativo del caso",
    "crimeTypes": ["FRAUD"],
    "location": { "cities": [{ "name": "comune", "province": "sigla o nome", "region": "regione" }], "regions": ["regione"] },
    "dateOfOperation": "AAAA-MM-GG"
  },
  "details": { "involvedForces": ["Guardia di Finanza"], "operationName": null, "investigationReason": "il reato come lo descrive l'articolo", "seizedAssetsValue": null, "seizedAssetsDescription": null },
  "entita": {
    "persone": [{ "nome_completo": "", "nome": null, "cognome": null, "ordine_certo": false, "sesso": null, "sesso_fonte": null, "data_nascita": null, "luogo_nascita": null, "cf": null, "eta": null, "ruolo": null, "posizione": null, "fonte_url": null }],
    "societa": [{ "ragione_sociale": "", "forma": null, "tipo": "societa", "cf": null, "piva": null, "rea": null, "sede": null, "stato": null, "attivita": null, "settore": null, "valore_beni": null, "ruolo": null, "fonte_url": null }],
    "legami": [{ "persona": "nome completo come in persone", "societa": "ragione sociale come in societa", "ruolo": "", "tipo": null, "qualifica": null }]
  },
  "provenance": [{ "sourceType": "Primary", "sourceName": "titolo - testata", "url": "" }]
}`;

const SISTEMA_RASSEGNA = `${REGOLE_COMUNI}

Compito: cercare sul web italiano le operazioni dentro il perimetro pubblicate negli ultimi 3 giorni rispetto alla data odierna indicata nel messaggio. Conta la data di pubblicazione scritta nell'articolo, non quella di aggiornamento della pagina; una notizia di più di 7 giorni resta fuori anche se ripresa oggi. Una notizia su un'operazione già presente tra i casi in archivio non diventa un nuovo caso. Nel messaggio trovi anche i criteri di interesse dell'analista e il profilo appreso dalle sue scelte: usali per decidere che cosa cercare e che cosa tenere.

Risposta: dopo le ricerche, un array JSON di casi in questa forma, vuoto se non trovi nulla di nuovo, senza testo dopo l'array.

${FORMA_CASO}`;

const SISTEMA_ANALISI_URL = `${REGOLE_COMUNI}

Compito: leggere l'articolo all'URL indicato nel messaggio e restituirne il caso. Se l'articolo non riguarda un'operazione dentro il perimetro restituisci {"error": "L'articolo non riguarda un'operazione delle forze dell'ordine."}; se è un caso già in archivio, {"error": "Questa notizia è un duplicato di un caso esistente."}.

Risposta: un solo oggetto JSON in questa forma, senza testo dopo.

${FORMA_CASO}`;

const SISTEMA_AGGIORNAMENTO = `${REGOLE_COMUNI}

Compito: aggiornare un caso esistente cercando sul web sviluppi e dati mancanti, prima di tutto persone e società non ancora estratte. Restituisci un oggetto JSON con i soli campi che cambiano, nella forma qui sotto. In entita metti le persone, le società e i legami nuovi o con dati in più: il codice li unisce a quelli già presenti per identità e non cancella nulla. In provenance metti le fonti nuove. Se trovi uno sviluppo rilevante aggiungi "updates": [{ "timestamp": "AAAA-MM-GG", "summary": "che cosa è cambiato" }]. Se non trovi nulla di nuovo, restituisci {}.

${FORMA_CASO}`;

/**
 * Criteri di interesse dell'analista: la sola parte che la revisione del
 * profilo puo' riscrivere. Regole di estrazione e forma dell'uscita stanno nel
 * system e non si toccano.
 */
export const defaultPrompt = `Criteri di interesse dell'analista

Cerca soprattutto criminalità organizzata (mafia, 'ndrangheta, camorra), riciclaggio e autoriciclaggio, corruzione, bancarotta fraudolenta, frodi fiscali strutturate come le frodi carosello e i crediti fittizi, reati economico-finanziari di grande impatto. Interessano in particolare le frodi scoperte dalla Guardia di Finanza che usano enti di facciata, come false ONLUS o finte associazioni sportive dilettantistiche (ASD), per mascherare attività commerciali ed evadere il fisco.

Contano di più le operazioni con molti indagati, sequestri sopra il milione di euro, tecniche innovative o collegamenti internazionali. Le frodi con ASD e ONLUS interessano anche sotto quella soglia, se lo schema è degno di nota.`;

/**
 * I prompt salvati fino alla 0.3 contengono tutto, regole e forma vecchia
 * dell'uscita compresa: se arrivassero al modello accanto al system nuovo, gli
 * chiederebbero due forme diverse. Si riconoscono e si sostituiscono con i
 * criteri predefiniti.
 */
const criteriDaUsare = (salvato: string | undefined | null): string => {
    if (!salvato) return defaultPrompt;
    if (/SCHEMA JSON|"entities"|CaseData|"individuals"/.test(salvato)) {
        console.warn('[rassegna] Prompt salvato nel formato precedente alla 0.4: si usano i criteri predefiniti.');
        return defaultPrompt;
    }
    return salvato;
};

// --- Costruzione dei casi --------------------------------------------------

/** Da un caso proposto dal modello al caso completo, o null se non regge. */
const costruisciCaso = async (c: any, opzioni: { manuale?: boolean; stato?: CaseData['status'] } = {}): Promise<CaseData | null> => {
    const titolo = typeof c?.summary?.title === 'string' ? c.summary.title.trim() : '';
    if (!titolo) {
        console.warn('[rassegna] Caso senza titolo, scartato.');
        return null;
    }
    const location = await geolocalizza(c.summary.location, titolo);
    if (!location) {
        console.warn(`[rassegna] "${titolo}" scartato: nessuna località con coordinate.`);
        return null;
    }
    const crimeTypes = categorieValide(c.summary.crimeTypes);
    const caseID = await nuovoCaseID(crimeTypes, opzioni.manuale);
    const dateOfOperation = dataCompletaOggi(c.summary.dateOfOperation);
    const adesso = new Date().toISOString();
    const details = c.details ?? {};

    return {
        caseID,
        initialReportTimestamp: adesso,
        lastUpdateTimestamp: adesso,
        status: opzioni.stato ?? 'Active',
        summary: { title: titolo, crimeTypes, location, dateOfOperation },
        details: {
            involvedForces: Array.isArray(details.involvedForces) ? details.involvedForces : [],
            operationName: details.operationName ?? null,
            investigationReason: details.investigationReason ?? '',
            seizedAssetsValue: typeof details.seizedAssetsValue === 'number' ? details.seizedAssetsValue : null,
            seizedAssetsDescription: details.seizedAssetsDescription ?? null,
        },
        entita: await costruisciEntita(c.entita, { caseID, dataArticolo: dateOfOperation }),
        provenance: c.provenance ?? [],
        updates: Array.isArray(c.updates) ? c.updates : [],
        // La sintesi vocale e' uscita dal prodotto; il campo resta per gli archivi.
        audio: { ttsScript: titolo, ttsScriptEn: '' },
        isImportant: false, hasReport: false, isRead: false,
        provenanceWarning: c.provenanceWarning,
    };
};

const dataCompletaOggi = (data: unknown): string =>
    typeof data === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data) ? data : oggi();

const leggiJson = (testo: string, contesto: string): any => {
    try {
        return extractJson(testo);
    } catch (errore) {
        console.warn(`[${contesto}] JSON non valido nella risposta:`, testo.slice(0, 2000));
        throw new Error(`Failed to parse ${contesto} data from AI model: ${(errore as Error).message}`);
    }
};

// --- Fasi ------------------------------------------------------------------

export const generateCaseData = async (
    existingCases: CaseData[],
    analystReportedExamples: CaseData[],
    highPriorityExamples: CaseData[],
    mediumPriorityExamples: CaseData[],
    standardExamples: CaseData[],
    irrelevantExamples: CaseData[]
): Promise<CaseData[]> => {
  try {
    const criteri = criteriDaUsare((await getActivePrompt())?.prompt);
    const prompt = `Data odierna: ${oggi()}.

${criteri}

Profilo appreso dalle scelte dell'analista, dal più al meno importante:
- segnalati dall'analista:
${summarizeCasesForPrompt(analystReportedExamples)}
- marcati come importanti:
${summarizeCasesForPrompt(highPriorityExamples)}
- con report di approfondimento:
${summarizeCasesForPrompt(mediumPriorityExamples)}
- letti:
${summarizeCasesForPrompt(standardExamples)}
- archiviati come irrilevanti, da evitare (con il motivo: quelli che non interessano all'analista indicano temi da non cercare):
${summarizeCasesForPrompt(irrelevantExamples, true)}

Casi già in archivio negli ultimi ${DEDUP_WINDOW_DAYS} giorni, da non ripetere: ${casiEsistenti(existingCases)}`;

    const response = await runPhase('search', { system: SISTEMA_RASSEGNA, prompt, webSearch: true });
    if (!response.text) {
        throw new Error("The AI model returned an empty response during case generation.");
    }

    const parsed = leggiJson(response.text, 'rassegna');
    if (parsed === undefined) {
        // Nessun JSON: e' lecito che il modello non trovi nulla.
        console.log('[rassegna] nessun JSON nella risposta:', response.text.slice(0, 500));
        return [];
    }
    const rawCases: any[] = Array.isArray(parsed) ? parsed : parsed?.cases;
    if (!Array.isArray(rawCases)) {
        throw new Error("Failed to parse intelligence data from AI model: unexpected format.");
    }
    console.log(`[rassegna] ${rawCases.length} casi proposti, ${response.sources.length} pagine consultate`);

    const verificati = processProvenance(rawCases, response.sources).filter(c => c !== null);
    const casi = await Promise.all(verificati.map(c => costruisciCaso(c)));
    return casi.filter((c): c is CaseData => c !== null);
  } catch (e: any) {
    if (e.message?.includes("Failed to parse")) {
        console.error("Failed to parse AI response:", e);
        throw new Error("Failed to parse intelligence data from AI model.");
    }
    handleApiError(e, 'case generation');
  }
};

/** Caso completo da un URL segnalato dall'analista; l'ID e' di tipo MANUAL. */
export const analyzeSingleUrl = async (url: string, existingCases: CaseData[]): Promise<CaseData> => {
  try {
    const prompt = `URL da analizzare: ${url}

Casi già in archivio negli ultimi ${DEDUP_WINDOW_DAYS} giorni: ${casiEsistenti(existingCases)}`;

    const response = await runPhase('analyzeUrl', { system: SISTEMA_ANALISI_URL, prompt, webSearch: true });
    if (!response.text) {
        throw new Error("L'analisi dell'URL non ha prodotto alcun risultato.");
    }
    const result = leggiJson(response.text, 'analisi URL') ?? {};
    if (result.error) {
        throw new LlmError(result.error);
    }

    const [verificato] = processProvenance([result], response.sources);
    if (!verificato) {
        throw new LlmError("L'analisi dell'URL non ha prodotto un caso con una fonte di origine verificabile.");
    }
    const caso = await costruisciCaso(verificato, { manuale: true, stato: 'Updated' });
    if (!caso) {
        throw new LlmError("Analisi fallita: nessuna località valida con coordinate trovata nell'articolo.");
    }
    return { ...caso, sourceMethod: 'AnalystReported', isRead: true };
  } catch (e: any) {
    if (e.message?.includes("parse")) {
        throw new Error("Formato di risposta non valido dall'analisi dell'URL.");
    }
    handleApiError(e, 'URL analysis');
  }
};

/** Campi compatti del caso da mandare al modello: niente report, niente coordinate. */
const casoPerIlModello = (c: CaseData) => ({
    summary: { title: c.summary.title, crimeTypes: c.summary.crimeTypes, cities: c.summary.location.cities.map(x => x.name), dateOfOperation: c.summary.dateOfOperation },
    details: c.details,
    persone: entitaDelCaso(c).persone.map(p => p.nome_come_scritto),
    societa: entitaDelCaso(c).societa.map(s => [s.ragione_sociale, s.forma].filter(Boolean).join(' ')),
    provenance: c.provenance.map(p => p.url),
});

/**
 * Aggiornamento di un caso. Restituisce i campi cambiati; entita' e fonti
 * tornano gia' unite a quelle esistenti, cosi' chi le salva puo' sostituirle.
 */
export const updateCaseDetails = async (caseData: CaseData): Promise<Partial<CaseData>> => {
  try {
    const prompt = `Data odierna: ${oggi()}.

Caso da aggiornare: ${JSON.stringify(casoPerIlModello(caseData))}`;

    const response = await runPhase('updateCase', { system: SISTEMA_AGGIORNAMENTO, prompt, webSearch: true });
    const parsed: any = response.text ? leggiJson(response.text, 'aggiornamento') : undefined;
    if (!parsed || Object.keys(parsed).length === 0) {
        console.log(`No new updates found for case ${caseData.caseID}.`);
        return {};
    }

    const changes: Partial<CaseData> = {};
    if (Array.isArray(parsed.provenance) && parsed.provenance.length > 0) {
        const [verificato] = processProvenance([{ provenance: parsed.provenance }], response.sources);
        const nuove = (verificato?.provenance ?? []).filter(p => !caseData.provenance.some(v => normalizzaUrl(v.url) === normalizzaUrl(p.url)));
        if (nuove.length > 0) changes.provenance = [...caseData.provenance, ...nuove];
    }
    if (parsed.entita) {
        const nuove = await costruisciEntita(parsed.entita, { caseID: caseData.caseID, dataArticolo: caseData.summary.dateOfOperation });
        changes.entita = unisciEntita(entitaDelCaso(caseData), nuove);
    }
    if (parsed.summary) {
        const summary: any = { ...parsed.summary };
        if (summary.location) {
            const location = await geolocalizza(summary.location, caseData.summary.title);
            summary.location = location ?? caseData.summary.location;
        }
        if (summary.crimeTypes) summary.crimeTypes = categorieValide(summary.crimeTypes);
        changes.summary = summary;
    }
    if (parsed.details) changes.details = parsed.details;
    if (Array.isArray(parsed.updates) && parsed.updates.length > 0) {
        changes.updates = [...caseData.updates, ...parsed.updates];
    }
    return changes;
  } catch (e: any) {
     if (e.message?.includes("parse")) {
        throw new Error(`Failed to parse update data from AI model for case ${caseData.caseID}.`);
    }
    handleApiError(e, `updating case ${caseData.caseID}`);
  }
};

const SISTEMA_REPORT = `Sei un analista di intelligence senior specializzato in cronaca giudiziaria e attività delle forze dell'ordine in Italia, e scrivi per Acta Diurna, un'applicazione civile che lavora solo su fonti aperte. Il tuo compito è scrivere un report di approfondimento sul caso nel messaggio. I dati del caso sono un punto di partenza e possono essere incompleti: cerca sul web le fonti originali (comunicato stampa, provvedimento, articolo) e quelle nuove, e risali sempre all'origine di ogni informazione.

Il report risponde a una domanda: che cosa è accaduto in questo caso, chi è coinvolto e che cosa significa. Chi lo legge deve poter agire leggendo soltanto la prima sezione. Scrivi la sintesi per ultima, dopo i fatti e i giudizi.

Linguaggio della probabilità. Per dire quanto è probabile un evento usa solo questi sette termini, tratti dalla prima riga della scala della direttiva ICD 203, sempre nella stessa forma, con l'intervallo tra parentesi alla prima occorrenza di ciascuno:
| Termine | Intervallo |
|---|---|
| quasi nessuna possibilità | 01-05% |
| molto improbabile | 05-20% |
| improbabile | 20-45% |
| probabilità pressoché pari | 45-55% |
| probabile | 55-80% |
| molto probabile | 80-95% |
| quasi certo | 95-99% |
Niente sinonimi né altre scale ('remoto', 'altamente probabile', 'verosimile', 'plausibile', 'possibile', 'praticamente certo'). La fiducia (fiducia alta, moderata, bassa) dice quanto è solida la base del giudizio: numero, qualità e indipendenza delle fonti, solidità del ragionamento. Va in una frase separata da quella del termine di probabilità, con ciò che la determina (fonte unica, informazioni datate, lacuna, assunzione chiave). I fatti si scrivono senza qualificatori, con il riferimento alla fonte. Fuori dalla scala non si usano 'potrebbe', 'sembrerebbe', 'si ritiene', 'pare', 'forse', 'non è escluso', 'resta da vedere', 'fonti riferiscono'; 'può' e 'potrebbe' solo con una condizione esplicita ('il gruppo può spostare l'attività su un'altra provincia se...'). Al posto del condizionale giornalistico ('avrebbe ricevuto') attribuisci l'affermazione a chi la fa ('secondo la Procura di Milano, X ha ricevuto...'). Le ipotesi di reato sono contestazioni dell'accusa ('la Procura contesta a X il reato di...'); usa indagato, imputato, arrestato, condannato secondo la fase effettiva del procedimento.

Valutazione delle fonti con il sistema 4x4 dell'UNODC. Ogni fonte riceve due voti, affidabilità della fonte (A, B, C, X) e validità dell'informazione (1, 2, 3, 4), scritti insieme (A1, B2, X4). La fonte è chi ha prodotto l'informazione, non il sito che la ospita.
- Fonte A: ente che produce l'informazione per funzione istituzionale, cioè comunicato di Questura, Carabinieri, Guardia di Finanza, Polizia di Stato o Procura, oppure provvedimento giudiziario pubblicato o citato testualmente. Informazione 1: il contenuto dell'atto o un dato che l'ente attesta in prima persona (arresti eseguiti, beni sequestrati, data e luogo). Informazione 2: la ricostruzione dell'accusa nel comunicato (ruoli, schema, ipotesi di reato), nota all'ente ma non ancora verificata in giudizio.
- Fonte B: testata registrata, con firma o redazione identificabile e una storia di affidabilità, che riprende un comunicato o un atto. Informazione 2: il giornalista ha visto l'atto, lo cita testualmente o era presente. Informazione 3: di seconda mano, ma corroborata da una fonte indipendente.
- Fonte C: testata o sito con una storia nota di inesattezze.
- Fonte X: testata sconosciuta, aggregatore senza firma, blog, profilo social anonimo, voce non attribuita. Non corroborata è X4; corroborata da una fonte indipendente, X3.
Le dichiarazioni di indagati, difensori o vittime sono la versione di quella parte. La corroborazione vale solo se indipendente: dieci articoli che riprendono lo stesso comunicato sono una fonte sola, e l'origine comune va detta. Un'informazione è confermata solo con A1, A2, B1 o B2; con ogni altro voto è non confermata, e va scritto. I risultati di ricerca e le sintesi generate da IA non sono fonti: si cita l'articolo o l'atto a cui rimandano.

Scrittura. La prima frase di ogni paragrafo lo riassume, le altre lo sostengono dalla più importante. Non si apre con una data o con la storia del caso, ma con ciò che il lettore deve sapere. Una frase, un'affermazione: circa venti parole, mai oltre trentacinque, in forma attiva con chi agisce come soggetto. Niente 'vari', 'diversi', 'numerosi', 'ecc.': senza il dettaglio, l'espressione si toglie. Si scrive del caso, non delle fonti. Ogni nome di persona, società e luogo ha sempre la stessa grafia. Date senza ambiguità: 14 settembre 2026.

Struttura. Il report usa solo titoli di livello ### in quest'ordine; dentro le sezioni paragrafi, elenchi, grassetto e tabelle.
1. ### 1. Sintesi (bottom line): 3-5 frasi su che cosa è accaduto, che cosa significa e quanto sei sicuro (un termine della scala o un livello di fiducia, mai nella stessa frase). Basta da sola per agire.
2. ### 2. Giudizi chiave: elenco numerato; ogni giudizio è una frase con un termine della scala e i riferimenti alle fonti (F1, F3), seguita da una frase con il livello di fiducia e il motivo. Per esempio: 1. È probabile (55-80%) che il gruppo operasse anche in Campania, perché due ordinanze citano depositi a Caserta (F1, F2). Fiducia moderata: entrambe le ordinanze derivano dalla stessa indagine.
3. ### 3. Fatti accertati: elenco numerato dei soli fatti, ciascuno con riferimento e voto della fonte (F1, A1). Le contestazioni dell'accusa riportate come tali.
4. ### 4. Analisi: come i fatti sostengono i giudizi, con le etichette in grassetto **Modus operandi** (schema descritto dall'accusa, ruoli, flussi di denaro o di merce), **Ipotesi alternative** (considerate, e perché scartate o mantenute), **Assunzioni chiave**.
5. ### 5. Lacune e prossimi passi: che cosa non è stato possibile accertare, che cosa colmerebbe ciascuna lacuna (l'ordinanza integrale, l'esito del riesame, la data dell'udienza) e gli indicatori che cambierebbero i giudizi.
6. ### 6. Fonti: una frase sulla base delle fonti (quante indipendenti, di che tipo, da quali dipendono i giudizi), poi la tabella | Rif. | Fonte | Chi è la fonte | Data di pubblicazione | Data di consultazione | Voto | con tutte le fonti, la colonna Fonte come link Markdown [Titolo - Testata](URL) e i riferimenti F1, F2... nell'ordine.
7. ### 7. Metodo e limiti: due o tre frasi: report generato da un modello di IA con ricerca web su fonti aperte, periodo coperto dalle fonti, che cosa non è stato consultato (atti non pubblicati, banche dati riservate).
8. ### Allegato A. Entità coinvolte: persone (nome, ruolo, data di nascita se nota, posizione nel procedimento) e società (denominazione con forma, partita IVA se nota, ruolo, provvedimento), con i riferimenti alle fonti.
9. ### Allegato B. Dati geografici riepilogativi: città, province e regioni, con il ruolo di ciascun luogo nel caso.
10. ### Allegato C. Verifiche con sistemi interni, con questo solo testo: Le verifiche con i sistemi interni non sono ancora state effettuate.
Non c'è una sezione di raccomandazioni. Alla fine, dopo tutte le sezioni, in corsivo: *Questo report è stato sviluppato da ACTA DIURNA. Le informazioni devono essere validate da un analista prima di poter essere considerate valide.*

Se le fonti non bastano per una sezione, scrivilo nella sezione stessa e in Lacune.

Risposta: il solo report in Markdown, dalla sezione 1 all'avvertenza finale.`;

const SISTEMA_ENTITA = `Estrai persone, società e legami da un report di analisi su un'operazione delle forze dell'ordine italiane, per Acta Diurna, un'applicazione civile che lavora su fonti aperte. Un campo che il report non riporta resta null: un valore dedotto è peggio di un campo vuoto, perché ogni dato viene confrontato con altre banche dati.

Persone: nome_completo come scritto; nome e cognome separati, con ordine_certo true, solo se il testo li distingue senza dubbio. ruolo è che cosa fa la persona, posizione la sua situazione nel procedimento (indagato, arrestato, ai domiciliari). Data di nascita solo se completa, in AAAA-MM-GG; età se scritta; codice fiscale solo se scritto. Il sesso solo da «nato/nata» (sesso_fonte "nascita") o da una qualifica riferita alla persona come «l'indagata» (sesso_fonte "qualifica"), mai dal nome proprio.

Società ed enti: ragione_sociale senza la forma giuridica, forma a parte, tipo tra societa, ente_pubblico e organizzazione; partita IVA, codice fiscale e REA solo se scritti; sede, stato, attività, settore, valore dei beni, ruolo nell'operazione.

Legami persona-società con il ruolo come scritto, il tipo tra amministrazione, proprieta, dipendenza, rappresentanza e appartenenza, e la qualifica "di fatto" per prestanome e amministratori di fatto.`;

const stringaONull = { type: ['string', 'null'] };
const numeroONull = { type: ['number', 'null'] };

/** Schema dell'uscita della fase extractEntities: la forma di EntitaEstratte. */
const entitaSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['persone', 'societa', 'legami'],
    properties: {
        persone: {
            type: 'array',
            items: {
                type: 'object',
                additionalProperties: false,
                required: ['nome_completo', 'nome', 'cognome', 'ordine_certo', 'sesso', 'sesso_fonte', 'data_nascita', 'luogo_nascita', 'cf', 'eta', 'ruolo', 'posizione'],
                properties: {
                    nome_completo: { type: 'string' },
                    nome: stringaONull, cognome: stringaONull,
                    ordine_certo: { type: 'boolean' },
                    sesso: { type: ['string', 'null'], enum: ['M', 'F', null] },
                    sesso_fonte: { type: ['string', 'null'], enum: ['nascita', 'qualifica', null] },
                    data_nascita: stringaONull, luogo_nascita: stringaONull, cf: stringaONull,
                    eta: numeroONull, ruolo: stringaONull, posizione: stringaONull,
                },
            },
        },
        societa: {
            type: 'array',
            items: {
                type: 'object',
                additionalProperties: false,
                required: ['ragione_sociale', 'forma', 'tipo', 'cf', 'piva', 'rea', 'sede', 'stato', 'attivita', 'settore', 'valore_beni', 'ruolo'],
                properties: {
                    ragione_sociale: { type: 'string' },
                    forma: stringaONull,
                    tipo: { type: 'string', enum: ['societa', 'ente_pubblico', 'organizzazione'] },
                    cf: stringaONull, piva: stringaONull, rea: stringaONull, sede: stringaONull, stato: stringaONull,
                    attivita: stringaONull, settore: stringaONull, valore_beni: numeroONull, ruolo: stringaONull,
                },
            },
        },
        legami: {
            type: 'array',
            items: {
                type: 'object',
                additionalProperties: false,
                required: ['persona', 'societa', 'ruolo', 'tipo', 'qualifica'],
                properties: {
                    persona: { type: 'string' }, societa: { type: 'string' }, ruolo: { type: 'string' },
                    tipo: { type: ['string', 'null'], enum: ['amministrazione', 'proprieta', 'dipendenza', 'rappresentanza', 'appartenenza', null] },
                    qualifica: { type: ['string', 'null'], enum: ['di diritto', 'di fatto', null] },
                },
            },
        },
    },
};

/**
 * Report di approfondimento in Markdown semplice. Le entita' si estraggono dal
 * report con una seconda chiamata breve, a schema: chiedere il report dentro un
 * JSON obbligava a regole sulle virgolette che peggioravano il testo.
 */
export const generateDeepDiveReport = async (caseData: CaseData): Promise<DeepDiveReport> => {
  try {
    const prompt = `Data odierna: ${oggi()}.

Caso da analizzare: ${JSON.stringify({ ...casoPerIlModello(caseData), provenance: caseData.provenance })}`;

    const response = await runPhase('deepDive', { system: SISTEMA_REPORT, prompt, webSearch: true });
    const inizio = response.text.indexOf('### 1');
    const reportContent = (inizio >= 0 ? response.text.slice(inizio) : response.text).trim();
    if (!reportContent) {
        throw new Error("The AI model returned an empty response while generating the report.");
    }

    let updatedEntities: EntitaEstratte = {};
    try {
        const estrazione = await runPhase('extractEntities', { system: SISTEMA_ENTITA, prompt: reportContent, schema: entitaSchema });
        updatedEntities = (extractJson(estrazione.text) as EntitaEstratte) ?? {};
    } catch (errore) {
        // Il report resta valido anche se l'estrazione delle entita' non riesce.
        console.warn('[report] Estrazione delle entità dal report non riuscita:', errore);
    }
    return { reportContent, updatedEntities };
  } catch (e: any) {
    if (e.message?.includes("parse")) {
        throw new Error("Failed to parse report data from AI model.");
    }
    handleApiError(e, `generating report for case ${caseData.caseID}`);
  }
};

const SISTEMA_REVISIONE = `Rivedi i criteri di interesse di una rassegna stampa OSINT sulle operazioni delle forze dell'ordine in Italia, per Acta Diurna, in base alle scelte dell'analista che la usa. I criteri dicono che cosa interessa: tipi di reato, soglie, aree, schemi. Le regole di estrazione, il perimetro e la forma dell'uscita stanno altrove e non vanno scritti qui.

Guarda che cosa hanno in comune i casi che l'analista ha segnato come importanti o approfondito, e che cosa li distingue da quelli letti e da quelli archiviati come irrilevanti, con il motivo quando c'è (duplicato, troppo vecchio, non interessa all'analista, fuori perimetro). I casi che non interessano all'analista sono il segnale più diretto di che cosa togliere o restringere. Rendi più espliciti i criteri che spiegano le sue scelte e togli o restringi quelli che portano a notizie scartate. Se il feedback è poco, cambia poco.

Risposta: solo il testo dei nuovi criteri, in italiano, in prosa, senza preambolo e senza commenti.`;

/** Un testo che non sembra dei criteri si rifiuta, e restano quelli attuali. */
const criteriAccettabili = (testo: string): boolean =>
    testo.length >= 100 && testo.length <= 6000 && !/```|"summary"|"entita"|"provenance"/.test(testo);

export const reviseSearchPrompt = async (
  highPriority: CaseData[],
  mediumPriority: CaseData[],
  standard: CaseData[],
  irrelevant: CaseData[],
  currentPrompt: string
): Promise<string> => {
  try {
    const attuali = criteriDaUsare(currentPrompt);
    const prompt = `Criteri attuali:
${attuali}

Casi segnati come importanti:
${summarizeCasesForPrompt(highPriority)}

Casi con report di approfondimento:
${summarizeCasesForPrompt(mediumPriority)}

Casi letti:
${summarizeCasesForPrompt(standard)}

Casi archiviati come irrilevanti:
${summarizeCasesForPrompt(irrelevant, true)}`;

    const response = await runPhase('revisePrompt', { system: SISTEMA_REVISIONE, prompt });
    const nuovi = response.text.trim();
    if (!criteriAccettabili(nuovi)) {
        console.warn("Prompt revision rejected: the result does not look like search criteria. Keeping the current ones.");
        return attuali;
    }
    return nuovi;
  } catch (e: any) {
    handleApiError(e, 'prompt revision');
  }
};

const SISTEMA_TRADUZIONE = `Traduci in inglese professionale un report di analisi su un'operazione delle forze dell'ordine italiane, scritto da Acta Diurna, un'applicazione civile di OSINT, per analisti, giornalisti e ricercatori.

Conserva esattamente il Markdown: titoli, elenchi, tabelle, link, grassetto e corsivo. I riferimenti alle fonti (F1, A1, B2) e gli URL restano come sono. I sette termini di probabilità diventano quelli della direttiva ICD 203: almost no chance, very unlikely, unlikely, roughly even chance, likely, very likely, almost certain; i livelli di fiducia, high, moderate e low confidence. Le qualifiche del procedimento vanno rese con il termine inglese corretto (indagato: suspect; imputato: defendant; arrestato: arrested). Traduci anche l'avvertenza finale, in corsivo.

Risposta: il solo testo tradotto.`;

export const translateReport = async (reportContent: string): Promise<string> => {
  try {
    const response = await runPhase('translate', { system: SISTEMA_TRADUZIONE, prompt: reportContent });
    if (!response.text) {
        throw new Error("Translation failed: The AI model returned an empty response.");
    }
    return response.text.trim();
  } catch (e: any) {
    handleApiError(e, 'report translation');
  }
};
