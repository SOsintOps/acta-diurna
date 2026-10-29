
import React, { useMemo } from 'react';
import type { CaseData } from '../types';
import ItalyMap from './ItalyMap';
import CaseFeed from './CaseFeed';
import CaseDetail from './CaseDetail';
import PulsingTriangle from './icons/PulsingTriangle';
import ThemeToggleButton from './icons/ThemeToggleButton';
import ImportProgressModal from './ImportProgressModal';
import { useCaseStore } from '../store/caseStore';
import ErrorBanner from './ErrorBanner';
import HelpMenu from './HelpMenu';

interface DashboardProps {
  appVersion: string;
  onSelectCase: (caseData: CaseData) => void;
  onCheckNewsNow: () => void;
  onUpdateCase: (caseID: string) => void;
  onGenerateReport: (caseID: string) => void;
  onArchiveCase: (caseID: string) => void;
  onClearReport: () => void;
  onShowReport: (caseID: string, content: string | null | undefined) => void;
  onMarkAsImportant: (caseID: string) => void;
  onExportData: () => void;
  onImportData: () => void;
  onToggleOverride: () => void;
  onReportUrl: () => void;
  onClearDatabase: () => void;
  onOpenModelSelector: () => void;
  onOpenApiKey: () => void;
  onOpenPromptHistory: () => void;
  onOpenDocs: (doc: string, title: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ appVersion, onSelectCase, onCheckNewsNow, onUpdateCase, onGenerateReport, onArchiveCase, onClearReport, onShowReport, onMarkAsImportant, onExportData, onImportData, onToggleOverride, onReportUrl, onClearDatabase, onOpenModelSelector, onOpenApiKey, onOpenPromptHistory, onOpenDocs }) => {
  const { cases, selectedCase, isFetching, activeAction, report, isOverrideActive, isImporting, error, clearError } = useCaseStore();

  // I colori arrivano dai gettoni in index.css: qui restano solo i nomi delle
  // classi, uguali nel tema scuro e nella sua inversione.
  const borderClass = 'sam-edge';
  const textMutedClass = 'sam-muted';
  const buttonThemeClass = 'sam-action sam-action-threat';
  const dbButtonThemeClass = 'sam-action';
  const destructiveDbButtonThemeClass = 'sam-action sam-action-threat';
  const secondaryButtonThemeClass = 'sam-action sam-action-second';


  const activeCasesForMap = useMemo(() => cases.filter(c => c.status === 'Active' || c.status === 'Updated'), [cases]);
  const activeCaseCount = useMemo(() => activeCasesForMap.length, [activeCasesForMap]);
  const isUrlAnalyzing = activeAction?.action === 'analyzingUrl';

  return (
    <div className="w-full h-full flex flex-col">
      {isImporting && <ImportProgressModal />}
      <header className={`flex-shrink-0 flex flex-wrap items-center justify-between gap-y-2 ${borderClass} border-t-0 border-l-0 border-r-0 pb-2 mb-2`}>
        <div className="flex items-center">
           <PulsingTriangle className="w-5 h-5 sam-threat mr-3" staticPulse={true} />
           <h1 className="font-mono text-xl md:text-2xl" style={{ letterSpacing: '8px' }}>ACTA DIURNA</h1>
           <span className={`font-mono text-xs ml-3 pt-1 ${textMutedClass}`}>v.{appVersion}</span>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              onClick={onReportUrl}
              disabled={isFetching || isUrlAnalyzing}
              className={`sam-action-compact font-mono text-sm px-3 py-1 flex-shrink-0 disabled:opacity-50 disabled:cursor-wait ${buttonThemeClass}`}
            >
              {isUrlAnalyzing ? 'ANALISI URL...' : 'SEGNALA URL'}
            </button>
            <button
              onClick={onCheckNewsNow}
              disabled={isFetching || isUrlAnalyzing}
              className={`sam-action-compact font-mono text-sm px-3 py-1 flex-shrink-0 disabled:opacity-50 disabled:cursor-wait ${buttonThemeClass}`}
            >
              {isFetching ? 'ANALISI...' : 'CERCA ORA'}
            </button>
            <div className="font-mono text-sm hidden xl:flex items-center">
              <span className="sam-status text-xs">ATTIVI</span>
              <span className="sam-status-value text-xs">{activeCaseCount}</span>
            </div>
            <div className="flex items-center space-x-2">
                <label htmlFor="override-toggle" className={`font-mono text-xs select-none cursor-pointer ${textMutedClass}`}>
                    24H
                </label>
                {/* Interruttore a due stati, squadrato: la pillola arrotondata
                    e' esattamente il tratto che la direzione Samaritan esclude. */}
                <button
                    id="override-toggle"
                    role="switch"
                    aria-checked={isOverrideActive}
                    onClick={onToggleOverride}
                    className="sam-edge relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer items-center transition-colors duration-200 focus:outline-none"
                    style={isOverrideActive
                        ? { backgroundColor: 'var(--sam-threat)', borderColor: 'var(--sam-threat)', boxShadow: '0 0 5px var(--sam-threat)' }
                        : undefined}
                >
                    <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-3 w-3 transform transition duration-200 ease-in-out ${isOverrideActive ? 'translate-x-5' : 'translate-x-1'}`}
                        style={{ backgroundColor: isOverrideActive ? 'var(--sam-bg)' : 'var(--sam-line)' }}
                    />
                </button>
            </div>
            <div className="h-6 w-px hidden md:block" style={{ backgroundColor: 'var(--sam-line)' }} />

            <button
              onClick={onOpenPromptHistory}
              className={`sam-action-compact font-mono text-sm px-3 py-1 flex-shrink-0 ${secondaryButtonThemeClass}`}
            >
              GESTIONE PROMPT
            </button>
            <button
              onClick={onOpenModelSelector}
              className={`sam-action-compact font-mono text-sm px-3 py-1 flex-shrink-0 ${secondaryButtonThemeClass}`}
            >
              CAMBIA AI
            </button>
            <button
              onClick={onOpenApiKey}
              className={`sam-action-compact font-mono text-sm px-3 py-1 flex-shrink-0 ${secondaryButtonThemeClass}`}
            >
              IMPOSTAZIONI
            </button>
            <HelpMenu onSelectDoc={onOpenDocs} />
            <ThemeToggleButton />
        </div>
      </header>

      {error && <ErrorBanner message={error} onDismiss={clearError} />}

      <div className="flex-grow flex flex-col md:flex-row gap-4 overflow-hidden">
        {/* Left Panel: Case Details */}
        <div className="w-full md:w-1/3 h-1/2 md:h-full order-2 md:order-1">
          <CaseDetail 
            appVersion={appVersion}
            caseData={selectedCase}
            onUpdateCase={onUpdateCase}
            onGenerateReport={onGenerateReport}
            onArchiveCase={onArchiveCase}
            onMarkAsImportant={onMarkAsImportant}
            activeAction={activeAction}
            report={report}
            onClearReport={onClearReport}
            onShowReport={onShowReport}
          />
        </div>
        
        {/* Center Panel: Map */}
        <div className={`w-full md:w-1/3 h-1/2 md:h-full order-1 md:order-2 flex items-center justify-center ${borderClass} p-2`}>
           <ItalyMap cases={activeCasesForMap} onSelectCase={onSelectCase} selectedCaseId={selectedCase?.caseID ?? null} />
        </div>

        {/* Right Panel: Case Feed */}
        <div className="w-full md:w-1/3 h-1/2 md:h-full order-3 md:order-3">
          <CaseFeed 
            cases={cases} 
            onSelectCase={onSelectCase} 
            selectedCaseId={selectedCase?.caseID ?? null}
          />
        </div>
      </div>

      <div className="fixed bottom-4 right-4 z-[1100] flex flex-row space-x-2">
        <button
          onClick={onImportData}
          className={`sam-action-compact font-mono text-sm px-3 py-1 flex-shrink-0 ${dbButtonThemeClass}`}
        >
          IMPORTA DB
        </button>
        <button
          onClick={onExportData}
          className={`sam-action-compact font-mono text-sm px-3 py-1 flex-shrink-0 ${dbButtonThemeClass}`}
        >
          ESPORTA DB
        </button>
        <button
          onClick={onClearDatabase}
          className={`sam-action-compact font-mono text-sm px-3 py-1 flex-shrink-0 ${destructiveDbButtonThemeClass}`}
        >
          SVUOTA DB
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
