

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

export type UserFeedback = 'important' | 'irrelevant' | 'irrelevant_duplicate' | 'irrelevant_too_old' | 'irrelevant_not_crime';

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
  entities: {
    individuals: {
      name:string;
      age: number | null;
      legalAction: string;
      role: string | null;
      dateOfBirth: string | null;
    }[];
    companies: {
      name: string;
      legalAction: string;
    }[];
  };
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
  updatedEntities: {
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
  };
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
  aiModel: string;
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
  setAiModel: (model: string) => void;
}