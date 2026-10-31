import type { AiProvider } from './services/llm/types';

export enum CrimeCategory {
  ORGANIZED_CRIME = 'ORGANIZED_CRIME',
  FINANCIAL_CRIME = 'FINANCIAL_CRIME',
  ASSET_SEIZURE = 'ASSET_SEIZURE',
  FRAUD = 'FRAUD',
  CORRUPTION = 'CORRUPTION',
  DRUG_TRAFFICKING = 'DRUG_TRAFFICKING',
  CYBER_CRIME = 'CYBER_CRIME',
  EXTORTION = 'EXTORTION',
  OTHER = 'OTHER',
}

// irrelevant_not_crime e' «Non mi interessa» (tema o impatto): il nome del codice
// resta quello storico perche' gli archivi lo usano.
export type UserFeedback = 'important' | 'irrelevant' | 'irrelevant_duplicate' | 'irrelevant_too_old' | 'irrelevant_not_crime' | 'irrelevant_out_of_scope';

export interface CaseData {
  caseID: string;
  initialReportTimestamp: string;
  lastUpdateTimestamp: string;
  status: 'Active' | 'Updated' | 'Archived';
  summary: {
    title: string;
    crimeTypes: string[];
    location: {
      cities: {
        name: string;
        province: string;
        region: string;
        coords: { lat: number; lng: number };
      }[];
      regions: string[];
    };
    dateOfOperation: string;
  };
  details: {
    involvedForces: string[];
    operationName: string | null;
    investigationReason: string;
    seizedAssetsValue: number | null;
    seizedAssetsDescription: string | null;
  };
  /**
   * Persone, societa', citazioni e legami nel formato comune con Iudex
   * (formato comune delle entita'). Assente solo negli
   * archivi non ancora migrati.
   */
  entita?: EntitaCaso;
  /** Formato delle entita' fino alla 0.3: si legge solo per migrarlo. */
  entities?: EntitaLegacy;
  /** Sentenze di Iudex collegate a persone o societa' del caso dall'analista. */
  riscontri_iudex?: Riscontro[];
  provenance: {
    sourceType: 'Primary' | 'Secondary' | 'Tertiary';
    sourceName: string;
    url: string;
  }[];
  updates: {
    timestamp: string;
    summary: string;
  }[];
  audio: {
    ttsScript: string;
    ttsScriptEn: string;
  };
  hasReport?: boolean;
  reportContent?: string | null;
  isImportant?: boolean;
  isRead?: boolean;
  importantUntil?: string;
  userFeedback?: UserFeedback;
  sourceMethod?: 'AnalystReported' | 'AutoDiscovered';
  provenanceWarning?: boolean;
}

export interface DeepDiveReport {
  reportContent: string;
  updatedEntities: EntitaEstratte;
}

// --- Entita' -----------------------------------------------------------------
// Formato comune con Iudex: nomi italiani, stessi campi e stessi uid
// (formato comune delle entita'). Le estensioni di Acta Diurna sono
// campi in piu' che le altre app ignorano.

export type Sesso = 'M' | 'F';
export type SessoFonte = 'nascita' | 'cf' | 'qualifica';

export interface Persona {
  uid: string;
  nome: string;
  cognome: string;
  /** true se nome e cognome sono distinti con certezza, false se l'ordine e' dedotto. */
  ordine_certo: boolean;
  sesso: Sesso | null;
  sesso_fonte: SessoFonte | null;
  /** AAAA-MM-GG, solo se completa. */
  data_nascita: string | null;
  luogo_nascita: string | null;
  /** Solo se scritto nel testo e convalidato, mai calcolato. */
  cf: string | null;
  creato_il: string;
  mietitore: string;
  // Estensioni di Acta Diurna.
  nome_come_scritto: string;
  eta: number | null;
  /** I due anni di nascita possibili, dall'eta' e dalla data dell'articolo. */
  anni_nascita_stimati: [number, number] | null;
}

export type TipoSocieta = 'societa' | 'ente_pubblico' | 'organizzazione';

export interface Societa {
  uid: string;
  ragione_sociale: string;
  forma: string | null;
  tipo: TipoSocieta;
  cf: string | null;
  piva: string | null;
  rea: string | null;
  paese: string | null;
  sede: string | null;
  stato: string | null;
  creato_il: string;
  mietitore: string;
  // Estensioni di Acta Diurna.
  attivita: string | null;
  settore: string | null;
  valore_beni: number | null;
}

export interface Citazione {
  uid_entita: string;
  tipo_entita: 'persona' | 'societa';
  /** Chiave del provvedimento: acta:<caseID>. */
  id_provvedimento: string;
  ruolo: string | null;
  fonte: 'motore' | 'migrazione';
  mietitore: string;
  creato_il: string;
  // Estensioni di Acta Diurna.
  /** Posizione nel procedimento come scritta: indagato, arrestato, ai domiciliari... */
  posizione: string | null;
  fonte_url: string | null;
}

export type TipoLegame = 'amministrazione' | 'proprieta' | 'dipendenza' | 'rappresentanza' | 'appartenenza';

export interface Legame {
  uid_persona: string;
  uid_societa: string;
  tipo: TipoLegame | null;
  /** Come scritto: «amministratore unico», «socio al 34 %». */
  ruolo: string;
  qualifica: 'di diritto' | 'di fatto' | null;
  id_provvedimento: string;
  fonte: 'motore' | 'migrazione';
  mietitore: string;
  creato_il: string;
}

export interface EntitaCaso {
  persone: Persona[];
  societa: Societa[];
  citazioni: Citazione[];
  legami: Legame[];
}

/** Come le entita' arrivano dal modello, prima di normalizzazione, convalida e uid. */
export interface PersonaEstratta {
  nome_completo: string;
  nome?: string | null;
  cognome?: string | null;
  ordine_certo?: boolean | null;
  sesso?: Sesso | null;
  sesso_fonte?: SessoFonte | null;
  data_nascita?: string | null;
  luogo_nascita?: string | null;
  cf?: string | null;
  eta?: number | null;
  ruolo?: string | null;
  posizione?: string | null;
  fonte_url?: string | null;
}

export interface SocietaEstratta {
  ragione_sociale: string;
  forma?: string | null;
  tipo?: TipoSocieta | null;
  cf?: string | null;
  piva?: string | null;
  rea?: string | null;
  paese?: string | null;
  sede?: string | null;
  stato?: string | null;
  attivita?: string | null;
  settore?: string | null;
  valore_beni?: number | null;
  ruolo?: string | null;
  fonte_url?: string | null;
}

export interface LegameEstratto {
  persona: string;
  societa: string;
  ruolo: string;
  tipo?: TipoLegame | null;
  qualifica?: 'di diritto' | 'di fatto' | null;
}

export interface EntitaEstratte {
  persone?: PersonaEstratta[];
  societa?: SocietaEstratta[];
  legami?: LegameEstratto[];
}

/**
 * Un'entita' del caso trovata in una sentenza di Iudex e collegata dall'analista.
 * E' un candidato da verificare (nomi oscurati, omonimi), non una fusione di identita'.
 * Record `riscontro` del formato comune (formato comune delle entita').
 */
export interface Riscontro {
  uid_entita: string;
  /** Id SentenzeWeb, la chiave comune con Iudex. */
  id_sentenza: string;
  ecli: string | null;
  dove: 'locale' | 'corte';
  frase: string;
  quando: string;
  mietitore: string;
  estremi: string;
}

export interface EntitaLegacy {
  individuals: {
    name: string;
    age: number | null;
    legalAction: string;
    role: string | null;
    dateOfBirth: string | null;
  }[];
  companies: {
    name: string;
    legalAction: string;
  }[];
}

export interface PromptHistoryEntry {
  version: number;
  timestamp: string;
  prompt: string;
  basedOn: {
      highPriority: number;
      mediumPriority: number;
      standard: number;
  };
}


export interface Settings {
  key: string;
  value: any;
}

export interface CaseStore {
  cases: CaseData[];
  selectedCase: CaseData | null;
  isFetching: boolean;
  isImporting: boolean;
  isOverrideActive: boolean;
  isRevisingPrompt: boolean;
  isModelSelectorOpen: boolean;
  isPromptHistoryOpen: boolean;
  isApiKeyModalOpen: boolean;
  iudexRicerca: boolean;
  aiModel: string;
  aiProvider: AiProvider;
  error: string | null;
  activeAction: { caseID: string; action: 'updating' | 'reporting' | 'analyzingUrl' } | null;
  report: { caseID: string; content: string } | null;
  setCases: (cases: CaseData[]) => void;
  setSelectedCase: (caseData: CaseData | null) => void;
  setIsFetching: (isFetching: boolean) => void;
  setIsImporting: (isImporting: boolean) => void;
  toggleOverride: () => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setActiveAction: (action: { caseID: string; action: 'updating' | 'reporting' | 'analyzingUrl' } | null) => void;
  setReport: (report: { caseID: string; content: string } | null) => void;
  setIsRevisingPrompt: (isRevising: boolean) => void;
  setIsModelSelectorOpen: (isOpen: boolean) => void;
  setIsPromptHistoryOpen: (isOpen: boolean) => void;
  setIsApiKeyModalOpen: (isOpen: boolean) => void;
  setIudexRicerca: (attiva: boolean) => void;
  setAiModel: (model: string) => void;
  setAiProvider: (provider: AiProvider) => void;
}