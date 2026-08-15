
import Dexie, { type Table } from 'dexie';
import type { CaseData, Settings, PromptHistoryEntry } from './types';

export class PoliceChronicleDB extends Dexie {
    cases!: Table<CaseData, string>;
    settings!: Table<Settings, string>;

    constructor() {
        super('PoliceChronicleDB');
        
        (this as Dexie).version(8).stores({
            cases: '&caseID, lastUpdateTimestamp, hasReport, isImportant, userFeedback, isRead, summary.dateOfOperation, status',
            settings: '&key'
        });

        // Increment version to 9 and add the sourceMethod index
        (this as Dexie).version(9).stores({
            cases: '&caseID, lastUpdateTimestamp, hasReport, isImportant, userFeedback, isRead, summary.dateOfOperation, status, sourceMethod',
            settings: '&key'
        });
    }
}

export const db = new PoliceChronicleDB();

// --- Settings Service Functions ---

/**
 * Retrieves a setting value from the database by its key.
 * @param key - The key of the setting to retrieve.
 */
export const getSettings = async (key: string): Promise<any> => {
    const setting = await db.settings.get(key);
    return setting ? setting.value : null;
};

/**
 * Saves or updates a setting in the database.
 * @param key - The key of the setting.
 * @param value - The value to save.
 */
export const setSettings = async (key: string, value: any): Promise<void> => {
    await db.settings.put({ key, value });
};

/**
 * Retrieves all settings from the database.
 */
export const getAllSettings = async (): Promise<Settings[]> => {
    return await db.settings.toArray();
};

/**
 * Bulk saves or updates settings in the database.
 * @param settings - The settings to save.
 */
export const bulkPutSettings = async (settings: Settings[]): Promise<void> => {
    await db.settings.bulkPut(settings);
};

/**
 * Retrieves the entire prompt history, sorted by version descending.
 */
export const getPromptHistory = async (): Promise<PromptHistoryEntry[]> => {
    const history: PromptHistoryEntry[] | null = await getSettings('promptHistory');
    if (history && Array.isArray(history) && history.length > 0) {
        return history.sort((a, b) => b.version - a.version);
    }
    return [];
};

/**
 * Retrieves the most recent prompt from the history.
 */
export const getActivePrompt = async (): Promise<PromptHistoryEntry | null> => {
    const history: PromptHistoryEntry[] | null = await getSettings('promptHistory');
    if (history && Array.isArray(history) && history.length > 0) {
        // Return the latest version, sorted descending by version number
        return history.sort((a, b) => b.version - a.version)[0];
    }
    return null;
};


// --- Database Case Service Functions ---

/**
 * Retrieves all cases from the database.
 */
export const getAllCases = async (): Promise<CaseData[]> => {
    return await db.cases.toArray();
};

/**
 * Retrieves a single case by its ID.
 * @param caseID - The ID of the case to retrieve.
 */
export const getCase = async (caseID: string): Promise<CaseData | undefined> => {
    return await db.cases.get(caseID);
};

/**
 * Retrieves a sample of cases marked as 'important' by the analyst.
 * @param limit - The maximum number of examples to retrieve.
 */
export const getImportantExamples = async (limit: number = 5): Promise<CaseData[]> => {
    // Dexie uses 0 for false and 1 for true when indexing booleans
    return await db.cases.where('isImportant').equals(1).reverse().limit(limit).toArray();
};

/**
 * Retrieves examples of cases that had a report generated but were not marked as important.
 * This indicates medium priority.
 * @param limit - The maximum number of examples to retrieve.
 */
export const getMediumPriorityExamples = async (limit: number = 10): Promise<CaseData[]> => {
    // Dexie uses 0 for false and 1 for true when indexing booleans
    return await db.cases
        .where('hasReport').equals(1)
        .and(c => c.isImportant !== true && c.status !== 'Archived')
        .reverse()
        .limit(limit)
        .toArray();
};

/**
 * Retrieves a sample of recent, "normal" cases the user has interacted with (read).
 * This forms the baseline of user interest.
 * @param limit - The maximum number of examples to retrieve.
 */
export const getStandardPriorityExamples = async (limit: number = 20): Promise<CaseData[]> => {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    return await db.cases
        .where('lastUpdateTimestamp').above(threeMonthsAgo.toISOString())
        .and(c => c.isRead === true && c.isImportant !== true && c.status !== 'Archived')
        .reverse()
        .limit(limit)
        .toArray();
};


/**
 * Retrieves a sample of cases marked as 'irrelevant' (Archived) to be used as learning examples.
 * @param limit - The maximum number of examples to retrieve.
 */
export const getIrrelevantExamples = async (limit: number = 5): Promise<CaseData[]> => {
    return await db.cases.where('status').equals('Archived').reverse().limit(limit).toArray();
};

/**
 * Retrieves examples of cases that were manually reported by the analyst.
 * These are the highest priority examples for learning.
 * @param limit - The maximum number of examples to retrieve.
 */
export const getAnalystReportedExamples = async (limit: number = 5): Promise<CaseData[]> => {
    return await db.cases.where('sourceMethod').equals('AnalystReported').reverse().limit(limit).toArray();
};


/**
 * Adds an array of new cases to the database.
 * @param cases - The cases to add.
 */
export const addCases = async (cases: CaseData[]): Promise<void> => {
    await db.cases.bulkAdd(cases);
};

/**
 * Updates an existing case in the database.
 * @param caseID - The ID of the case to update.
 * @param changes - An object with the fields to update.
 */
export const updateCase = async (caseID: string, changes: Partial<CaseData>): Promise<void> => {
    await db.cases.update(caseID, changes);
};

/**
 * Clears all data from the database, including cases and settings.
 * This is an irreversible operation.
 */
export const clearDatabase = async (): Promise<void> => {
    // Using a transaction ensures both operations succeed or fail together.
    return (db as Dexie).transaction('rw', db.cases, db.settings, async () => {
        await db.settings.clear();
        await db.cases.clear();
    });
};

/**
 * Atomically increments and retrieves the global case counter.
 * This ensures a unique, sequential number for each new case.
 */
export const incrementAndGetCaseCounter = async (): Promise<number> => {
    return (db as Dexie).transaction('rw', db.settings, async () => {
        const setting = await db.settings.get('caseCounter');
        const currentCounter = (setting?.value as number) || 0;
        const newCounter = currentCounter + 1;
        await db.settings.put({ key: 'caseCounter', value: newCounter });
        return newCounter;
    });
};

/**
 * Merges an imported database with the local one, enabling collaborative intelligence.
 * @param importedData - The data object from the backup file.
 */
export const integrateDatabase = async (importedData: { cases: CaseData[]; settings: Settings[] }): Promise<void> => {
    return db.transaction('rw', db.cases, db.settings, async () => {
        console.log("Starting database integration...");

        // 1. Merge Cases
        const localCases = await db.cases.toArray();
        const localCaseMap = new Map(localCases.map(c => [c.caseID, c]));
        const casesToPut: CaseData[] = [];

        for (const importedCase of importedData.cases) {
            const localCase = localCaseMap.get(importedCase.caseID);
            // If case is new, or imported case is newer, add it to be updated/inserted.
            if (!localCase || new Date(importedCase.lastUpdateTimestamp) > new Date(localCase.lastUpdateTimestamp)) {
                casesToPut.push(importedCase);
            }
        }
        if (casesToPut.length > 0) {
            await db.cases.bulkPut(casesToPut);
            console.log(`Integrated ${casesToPut.length} cases (new or updated).`);
        }

        // 2. Merge Settings
        // a. Case Counter
        const localCounter = await getSettings('caseCounter') || 0;
        const importedCounter = importedData.settings.find(s => s.key === 'caseCounter')?.value || 0;
        await setSettings('caseCounter', Math.max(localCounter, importedCounter));
        console.log(`Set case counter to ${Math.max(localCounter, importedCounter)}.`);

        // b. City Coordinates Cache
        const localCoords = await getSettings('cityCoordinates') || {};
        const importedCoords = importedData.settings.find(s => s.key === 'cityCoordinates')?.value || {};
        const mergedCoords = { ...localCoords, ...importedCoords };
        await setSettings('cityCoordinates', mergedCoords);
        console.log(`Merged city coordinates cache.`);

        // c. Prompt History
        const localHistory: PromptHistoryEntry[] = await getSettings('promptHistory') || [];
        const importedHistory: PromptHistoryEntry[] = importedData.settings.find(s => s.key === 'promptHistory')?.value || [];
        
        const promptMap = new Map<string, PromptHistoryEntry>();
        const combinedRawHistory = [...localHistory, ...importedHistory];

        // Deduplicate by prompt text, keeping the one with the newest timestamp
        for(const entry of combinedRawHistory) {
            if (!entry || typeof entry.prompt !== 'string' || typeof entry.timestamp !== 'string') continue;
            
            const existing = promptMap.get(entry.prompt);
            if (!existing || new Date(entry.timestamp) > new Date(existing.timestamp)) {
                promptMap.set(entry.prompt, entry);
            }
        }

        const combinedHistory = Array.from(promptMap.values());
        combinedHistory.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        
        // Re-assign versions to ensure uniqueness and chronological order
        const finalHistory = combinedHistory.map((entry, index) => ({
             ...entry,
             version: index + 1
        }));

        await setSettings('promptHistory', finalHistory);
        console.log(`Integrated prompt history. New history has ${finalHistory.length} unique, versioned entries.`);
        
        console.log("Database integration complete.");
    });
};
