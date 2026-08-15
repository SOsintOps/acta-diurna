


import { CrimeCategory } from '../types';

const categoryKeywords: Record<CrimeCategory, string[]> = {
    [CrimeCategory.ORGANIZED_CRIME]: ['mafia', 'ndrangheta', 'camorra', 'associazione per delinquere'],
    [CrimeCategory.FINANCIAL_CRIME]: ['riciclaggio', 'antiriciclaggio', 'bancarotta fraudolenta', 'reati societari', 'falso in bilancio', 'fatture false', 'insider trading', 'manipolazione del mercato', 'paradisi fiscali'],
    [CrimeCategory.FRAUD]: ['frode fiscale', 'evasione fiscale', 'truffa aggravata'],
    [CrimeCategory.CORRUPTION]: ['corruzione'],
    [CrimeCategory.ASSET_SEIZURE]: ['sequestro beni'],
    [CrimeCategory.EXTORTION]: ['estorsione', 'usura'],
    [CrimeCategory.DRUG_TRAFFICKING]: ['droga', 'stupefacenti', 'narcotraffico'],
    [CrimeCategory.CYBER_CRIME]: ['cybercrime', 'hacking', 'phishing', 'frode informatica'],
    [CrimeCategory.OTHER]: ['arresto'], // Generic fallback
};

export const iconDetails: Record<CrimeCategory, { path: string, colors: { dark: string, light: string } }> = {
    [CrimeCategory.ORGANIZED_CRIME]: { path: "M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0M3 8a5 5 0 0 1 2.582-4.472.5.5 0 0 1 .434.704A4 4 0 0 0 6 8a4 4 0 0 0-.016 1.768.5.5 0 0 1-.434.704A5 5 0 0 1 3 8m4-4.765A5 5 0 0 1 12.582 8.5a.5.5 0 0 1-.75.433A4 4 0 0 0 10 8a4 4 0 0 0-2.33-3.765.5.5 0 0 1 .55-.868", colors: { dark: '#ef4444', light: '#dc2626' } },
    [CrimeCategory.FINANCIAL_CRIME]: { path: "M8 13.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11M8 15a7 7 0 1 1 0-14 7 7 0 0 1 0 14M8 4.05h-.114C6.64 4.05 6 4.694 6 5.572 6 6.474 6.782 7.03 7.886 7.03 8.58 7.03 9 6.866 9 6.468c0-.387-.235-.634-.733-.634-.41 0-.64.21-.735.312a.5.5 0 0 1-.708.058l-.295-.295.707-.707a.5.5 0 0 1 .708 0zM8 8.1c-1.076 0-1.752.6-1.752 1.482 0 .898.676 1.503 1.752 1.503 1.068 0 1.752-.6 1.752-1.488 0-.893-.684-1.5-1.752-1.5", colors: { dark: '#f97316', light: '#ea580c' } },
    [CrimeCategory.ASSET_SEIZURE]: { path: "M4 3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zm2 1.5a.5.5 0 0 0 0 1h4a.5.5 0 0 0 0-1zM2 7a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1zm2 1.5a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 0-1h-7a.5.5 0 0 0-.5.5", colors: { dark: '#eab308', light: '#ca8a04' } },
    [CrimeCategory.FRAUD]: { path: "M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0M4.5 1a.5.5 0 0 0-.5.5v13a.5.5 0 0 0 1 0v-13a.5.5 0 0 0-.5-.5", colors: { dark: '#84cc16', light: '#65a30d' } },
    [CrimeCategory.CORRUPTION]: { path: "M8 1a2.5 2.5 0 0 1 2.5 2.5V4h-5v-.5A2.5 2.5 0 0 1 8 1m3.5 3v-.5a3.5 3.5 0 1 0-7 0V4H1v10h14V4zM2 5h12v9H2z", colors: { dark: '#22c55e', light: '#16a34a' } },
    [CrimeCategory.DRUG_TRAFFICKING]: { path: "M8.5 2.155A.5.5 0 0 0 8 1.5a.5.5 0 0 0-.5.655L4.56 6H3.5a.5.5 0 0 0 0 1h1.06l-2.26 4.698A.5.5 0 0 0 2.5 12a.5.5 0 0 0 .44.242h10.12a.5.5 0 0 0 .44-.742L10.94 7h1.06a.5.5 0 0 0 0-1h-1.06zM9 4.5a.5.5 0 0 1 .5.5v1.207l-1 2.09-.5-.248V5a.5.5 0 0 1 .5-.5", colors: { dark: '#06b6d4', light: '#0891b2' } },
    [CrimeCategory.CYBER_CRIME]: { path: "M6 12.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5m-2 0a.5.5 0 0 1 .5-.5h.5a.5.5 0 0 1 0 1h-.5a.5.5 0 0 1-.5-.5m4 0a.5.5 0 0 1 .5-.5h.5a.5.5 0 0 1 0 1h-.5a.5.5 0 0 1-.5-.5M2 5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zM3 5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z", colors: { dark: '#3b82f6', light: '#2563eb' } },
    [CrimeCategory.EXTORTION]: { path: "M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4M0 4s3 2.5 4 3.5C4.5 6.833 6 6 6 6s1.5 2 3 2 3-2 3-2s-1.5-1.167-2-1.5C8.5 4.5 7 6 7 6s-1.5-2-3-2-3 2-3 2M0 8s3 2.5 4 3.5C4.5 10.833 6 10 6 10s1.5 2 3 2 3-2 3-2s-1.5-1.167-2-1.5c-1.133-.833-2.5-1.5-2.5-1.5S6.5 6 5 6s-3 2-3 2", colors: { dark: '#8b5cf6', light: '#7c3aed' } },
    [CrimeCategory.OTHER]: { path: "M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16M4.5 7.5a.5.5 0 0 1 0-1h7a.5.5 0 0 1 0 1z", colors: { dark: '#a8a29e', light: '#78716c' } },
};

export const getCrimeCategory = (crimeTypes: string[]): CrimeCategory => {
    if (!crimeTypes || crimeTypes.length === 0) {
        return CrimeCategory.OTHER;
    }

    const lowerCaseCrimeTypes = crimeTypes.map(t => t.toLowerCase());

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
        for (const keyword of keywords) {
            if (lowerCaseCrimeTypes.some(crimeType => crimeType.includes(keyword))) {
                return category as CrimeCategory;
            }
        }
    }

    return CrimeCategory.OTHER;
};

export const crimeCategoryShortCodes: Record<CrimeCategory, string> = {
    [CrimeCategory.ORGANIZED_CRIME]: 'OC',
    [CrimeCategory.FINANCIAL_CRIME]: 'FC',
    [CrimeCategory.ASSET_SEIZURE]: 'AS',
    [CrimeCategory.FRAUD]: 'FR',
    [CrimeCategory.CORRUPTION]: 'CO',
    [CrimeCategory.DRUG_TRAFFICKING]: 'DT',
    [CrimeCategory.CYBER_CRIME]: 'CC',
    [CrimeCategory.EXTORTION]: 'EX',
    [CrimeCategory.OTHER]: 'OTH',
};

/**
 * Generates raw SVG HTML for use in Leaflet DivIcons.
 * This avoids using ReactDOMServer on the client side.
 * @param category The crime category.
 * @param theme The current theme ('dark' or 'light').
 * @returns An HTML string for the SVG icon.
 */
export const getCrimeIconHTML = (category: CrimeCategory, theme: 'dark' | 'light'): string => {
    const details = iconDetails[category] || iconDetails[CrimeCategory.OTHER];
    const color = details.colors[theme];
    
    return `<svg width="24" height="24" viewBox="0 0 16 16" fill="${color}" style="filter: drop-shadow(0 0 2px ${color});"><path d="${details.path}" /></svg>`;
};

const regionNameMap: { [key: string]: string } = {
    "trentino-alto adige": "Trentino-Alto Adige/Südtirol",
    "trentino alto adige": "Trentino-Alto Adige/Südtirol",
    "trentino": "Trentino-Alto Adige/Südtirol",
    "alto adige": "Trentino-Alto Adige/Südtirol",
    "sudtirol": "Trentino-Alto Adige/Südtirol",
    "südtirol": "Trentino-Alto Adige/Südtirol",
    "bolzano": "Trentino-Alto Adige/Südtirol",
    "trento": "Trentino-Alto Adige/Südtirol",
    "valle d'aosta": "Valle d'Aosta/Vallée d'Aoste",
    "valle daosta": "Valle d'Aosta/Vallée d'Aoste",
    "aosta": "Valle d'Aosta/Vallée d'Aoste",
    "friuli venezia giulia": "Friuli-Venezia Giulia",
    "friuli": "Friuli-Venezia Giulia",
    "emilia romagna": "Emilia-Romagna",
};

/**
 * Normalizes Italian region names to match the GeoJSON data for map highlighting.
 * @param name - The region name extracted by the AI.
 * @returns The standardized region name.
 */
export const normalizeRegionName = (name: string): string => {
    if (!name || typeof name !== 'string') return '';
    const lowerName = name.trim().toLowerCase();
    
    // Check for direct mapping first
    const mappedName = regionNameMap[lowerName];
    if (mappedName) return mappedName;
    
    // Handle simple capitalization for single-word regions like 'lombardia' -> 'Lombardia'
    if (!lowerName.includes(' ') && !lowerName.includes('-') && !lowerName.includes("'")) {
        const capitalized = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
        // This is a list of single-word regions.
        const singleWordRegions = ['abruzzo', 'basilicata', 'calabria', 'campania', 'lazio', 'liguria', 'lombardia', 'marche', 'molise', 'piemonte', 'puglia', 'sardegna', 'sicilia', 'toscana', 'umbria', 'veneto'];
        if (singleWordRegions.includes(lowerName)) {
            return capitalized;
        }
    }
    
    // Return the name as is if no mapping is found, hoping it's already correct.
    return name;
};