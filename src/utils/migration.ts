
import type { CaseData, Settings, PromptHistoryEntry } from '../types';
import { normalizeRegionName } from './crimeCategorizer';
import { costruisciEntita, daLegacy } from '../services/entita';
import { getAllCases, updateCase } from '../db';

/**
 * Entita' del formato fino alla 0.3 (entities.individuals / companies) nel
 * formato comune con Iudex. Restituisce null se il caso e' gia'
 * migrato. Non si fa in un upgrade di Dexie perche' gli uid si calcolano con
 * crypto.subtle, asincrono: dentro la transazione la chiuderebbe a meta'.
 */
export const migraEntita = async (c: CaseData): Promise<CaseData | null> => {
    if (c.entita) return null;
    const entita = await costruisciEntita(daLegacy(c.entities), {
        caseID: c.caseID, dataArticolo: c.summary?.dateOfOperation ?? null,
    }, 'migrazione');
    const { entities: _vecchie, ...resto } = c;
    return { ...resto, entita };
};

/** All'avvio: migra le entita' dei casi gia' in archivio. Restituisce quanti ne ha migrati. */
export const migraEntitaArchivio = async (): Promise<number> => {
    let migrati = 0;
    for (const c of await getAllCases()) {
        const nuovo = await migraEntita(c);
        if (!nuovo) continue;
        // entities a undefined: Dexie toglie il campo dal record.
        await updateCase(c.caseID, { entita: nuovo.entita, entities: undefined });
        migrati++;
    }
    if (migrati > 0) console.log(`[migrazione] Entità migrate al formato comune in ${migrati} casi.`);
    return migrati;
};

/**
 * Checks if a location object uses the old format (e.g., `{ city: 'Milan' }`)
 * instead of the new one (`{ cities: [{...}], regions: [...] }`).
 * @param location - The location object from a case summary.
 */
const isOldLocationFormat = (location: any): location is { city: string; province?: string; region?: string } => {
    return location && typeof location.city === 'string' && !Array.isArray(location.cities);
};

/**
 * Migrates data from an imported backup file to the latest database schema.
 * This ensures backward compatibility with older backup versions.
 * @param data - The raw data object parsed from a JSON backup file.
 * @returns An object containing the migrated data and a flag indicating if migration occurred.
 */
export const migrateImportedData = async (data: any): Promise<{ migratedData: { cases: CaseData[]; settings: Settings[] }; wasMigrated: boolean }> => {
    if (!data || !Array.isArray(data.cases) || !Array.isArray(data.settings)) {
        throw new Error("Invalid data structure for migration.");
    }
    
    let wasMigrated = false;
    
    const cityCoordinatesFromSettings = data.settings.find((s: any) => s.key === 'cityCoordinates')?.value || {};
    const findCoords = (name: string): { lat: number, lng: number } | null => {
        if (!name) return null;
        const lowerCaseName = name.toLowerCase();
        const cachedCityName = Object.keys(cityCoordinatesFromSettings).find(k => k.toLowerCase() === lowerCaseName);
        return cachedCityName ? cityCoordinatesFromSettings[cachedCityName] : null;
    };


    // 1. Migrate all cases to the latest CaseData schema.
    const migratedCases = data.cases.map((c: any): CaseData => {
        let isMigratedNow = false;
        
        const defaultValues: Partial<CaseData> = {};
        
        if (c.isRead === undefined) { defaultValues.isRead = true; isMigratedNow = true; }
        if (c.isImportant === undefined) { defaultValues.isImportant = false; isMigratedNow = true; }
        if (c.hasReport === undefined) { defaultValues.hasReport = false; isMigratedNow = true; }
        if (c.reportContent === undefined) { defaultValues.reportContent = null; isMigratedNow = true; }
        if (c.sourceMethod === undefined) { defaultValues.sourceMethod = 'AutoDiscovered'; isMigratedNow = true; }
        if (c.audio === undefined) { defaultValues.audio = { ttsScript: c.summary?.title || "No title", ttsScriptEn: 'Summary not available.' }; isMigratedNow = true; }

        const migratedCase: CaseData = { ...c, ...defaultValues };

        if (isOldLocationFormat(migratedCase.summary.location)) {
            isMigratedNow = true;
            const oldLocation = migratedCase.summary.location;
            const coords = findCoords(oldLocation.city) || { lat: 0, lng: 0 };
            const region = normalizeRegionName(oldLocation.region || '');
            
            migratedCase.summary.location = {
                cities: [{
                    name: oldLocation.city,
                    province: oldLocation.province || '',
                    region: region,
                    coords: coords,
                }],
                regions: region ? [region] : [],
            };
        }

        if (isMigratedNow) wasMigrated = true;
        return migratedCase;
    });

    // 1b. Entita' nel formato comune con Iudex.
    for (let i = 0; i < migratedCases.length; i++) {
        const nuovo = await migraEntita(migratedCases[i]);
        if (nuovo) {
            migratedCases[i] = nuovo;
            wasMigrated = true;
        }
    }

    // 2. Migrate settings, specifically the prompt history.
    const promptHistorySetting = data.settings.find((s: any) => s.key === 'promptHistory');
    if (promptHistorySetting && Array.isArray(promptHistorySetting.value)) {
        promptHistorySetting.value = promptHistorySetting.value.map((entry: any): PromptHistoryEntry => {
            if (!entry.basedOn) {
                wasMigrated = true;
                return {
                    ...entry,
                    basedOn: { highPriority: 0, mediumPriority: 0, standard: 0 },
                };
            }
            return entry;
        });
    }

    return {
        migratedData: {
            cases: migratedCases,
            settings: data.settings,
        },
        wasMigrated,
    };
};
