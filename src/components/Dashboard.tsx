
import React, { useContext, useMemo } from 'react';
import type { CaseData } from '../types';
import ItalyMap from './ItalyMap';
import CaseFeed from './CaseFeed';
import CaseDetail from './CaseDetail';
import PulsingTriangle from './icons/PulsingTriangle';
import { ThemeContext } from '../contexts/ThemeContext';
import ThemeToggleButton from './icons/ThemeToggleButton';
import ImportProgressModal from './ImportProgressModal';
import { useCaseStore } from '../store/caseStore';
import ErrorBanner from './ErrorBanner';
import HelpMenu from './HelpMenu';
import { esportaFtm, esportaPacchetto, scarica } from '../services/esportaEntita';

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
  const { theme } = useContext(ThemeContext);
  const { cases, selectedCase, isFetching, activeAction, report, isOverrideActive, isImporting, error, clearError } = useCaseStore();

  const borderClass = theme === 'dark' ? 'border-gray-800' : 'border-zinc-300';
  const textMutedClass = theme === 'dark' ? 'text-gray-400' : 'text-zinc-500';
  const buttonThemeClass = theme === 'dark' 
    ? 'border-red-600/50 text-red-500 hover:bg-red-600 hover:text-black disabled:border-gray-600 disabled:text-gray-600 disabled:hover:bg-transparent'
    : 'border-red-500 text-red-600 hover:bg-red-500 hover:text-white disabled:border-zinc-400 disabled:text-zinc-400 disabled:hover:bg-transparent';
  
  const dbButtonThemeClass = theme === 'dark'
    ? 'border-gray-600/50 text-gray-400 hover:bg-gray-700 hover:text-white bg-gray-900/80 backdrop-blur-sm'
    : 'border-zinc-400 text-zinc-600 hover:bg-zinc-200 hover:text-black bg-white/80 backdrop-blur-sm';
  
  const destructiveDbButtonThemeClass = theme === 'dark'
    ? 'border-red-600/50 text-red-500 hover:bg-red-600 hover:text-black bg-gray-900/80 backdrop-blur-sm'
    : 'border-red-500/80 text-red-600 hover:bg-red-500 hover:text-white bg-white/80 backdrop-blur-sm';
  
  const secondaryButtonThemeClass = theme === 'dark'
    ? 'border-blue-600/50 text-blue-400 hover:bg-blue-500 hover:text-black'
    : 'border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white';


  const activeCasesForMap = useMemo(() => cases.filter(c => c.status === 'Active' || c.status === 'Updated'), [cases]);
  const activeCaseCount = useMemo(() => activeCasesForMap.length, [activeCasesForMap]);
  const isUrlAnalyzing = activeAction?.action === 'analyzingUrl';

  return (
    <div className="w-full h-full flex flex-col">
      {isImporting && <ImportProgressModal />}
      <header className={`flex-shrink-0 flex items-center justify-between border-b ${borderClass} pb-2 mb-2`}>
        <div className="flex items-center">
           <PulsingTriangle className="w-5 h-5 text-red-600 mr-3" staticPulse={true} />
           <h1 className="font-mono text-xl md:text-2xl tracking-widest">ACTA DIURNA</h1>
           <span className={`font-mono text-xs ml-3 pt-1 ${textMutedClass}`}>v.{appVersion}</span>
        </div>
        <div className="flex items-center space-x-2 md:space-x-3">
            <button
              onClick={onReportUrl}
              disabled={isFetching || isUrlAnalyzing}
              className={`font-mono text-sm px-3 py-1 border transition-colors duration-200 rounded-md disabled:opacity-50 disabled:cursor-wait ${buttonThemeClass}`}
            >
              {isUrlAnalyzing ? 'ANALISI URL...' : 'SEGNALA URL'}
            </button>
            <button
              onClick={onCheckNewsNow}
              disabled={isFetching || isUrlAnalyzing}
              className={`font-mono text-sm px-3 py-1 border transition-colors duration-200 rounded-md disabled:opacity-50 disabled:cursor-wait ${buttonThemeClass}`}
            >
              {isFetching ? 'ANALISI...' : 'CERCA ORA'}
            </button>
            <div className={`font-mono text-sm ${textMutedClass} hidden xl:block`}>
            {`${activeCaseCount} CASI ATTIVI`}
            </div>
            <div className="flex items-center space-x-2">
                <label htmlFor="override-toggle" className={`font-mono text-xs select-none cursor-pointer ${textMutedClass}`}>
                    24H
                </label>
                <button
                    id="override-toggle"
                    role="switch"
                    aria-checked={isOverrideActive}
                    onClick={onToggleOverride}
                    className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${isOverrideActive ? 'bg-red-600' : (theme === 'dark' ? 'bg-gray-700' : 'bg-zinc-300')}`}
                >
                    <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isOverrideActive ? 'translate-x-4' : 'translate-x-0'}`}
                    />
                </button>
            </div>
            <div className="h-6 w-px bg-gray-700 hidden md:block" />

            <button
              onClick={onOpenPromptHistory}
              className={`font-mono text-sm px-3 py-1 border transition-colors duration-200 rounded-md ${secondaryButtonThemeClass}`}
            >
              GESTIONE PROMPT
            </button>
            <button
              onClick={onOpenModelSelector}
              className={`font-mono text-sm px-3 py-1 border transition-colors duration-200 rounded-md ${secondaryButtonThemeClass}`}
            >
              CAMBIA AI
            </button>
            <button
              onClick={onOpenApiKey}
              className={`font-mono text-sm px-3 py-1 border transition-colors duration-200 rounded-md ${secondaryButtonThemeClass}`}
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
        <div className={`w-full md:w-1/3 h-1/2 md:h-full order-1 md:order-2 flex items-center justify-center border ${borderClass} p-2`}>
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

      <div className="fixed bottom-4 right-4 z-[2000] flex flex-row space-x-2">
        <button
          onClick={onImportData}
          className={`font-mono text-sm px-3 py-1 border transition-colors duration-200 ${dbButtonThemeClass}`}
        >
          IMPORTA DB
        </button>
        <button
          onClick={onExportData}
          className={`font-mono text-sm px-3 py-1 border transition-colors duration-200 ${dbButtonThemeClass}`}
        >
          ESPORTA DB
        </button>
        <button
          onClick={async () => scarica(await esportaFtm(cases), `acta-diurna-entita-${new Date().toISOString().slice(0, 10)}.ftm`)}
          title="Persone, società e casi in FollowTheMoney, nel formato comune con Iudex"
          className={`font-mono text-sm px-3 py-1 border transition-colors duration-200 ${dbButtonThemeClass}`}
        >
          ESPORTA FTM
        </button>
        <button
          onClick={async () => scarica(await esportaPacchetto(cases), `acta-diurna-pacchetto-${new Date().toISOString().slice(0, 10)}.jsonl`)}
          title="Pacchetto JSONL di scambio con Iudex"
          className={`font-mono text-sm px-3 py-1 border transition-colors duration-200 ${dbButtonThemeClass}`}
        >
          ESPORTA JSONL
        </button>
        <button
          onClick={onClearDatabase}
          className={`font-mono text-sm px-3 py-1 border transition-colors duration-200 ${destructiveDbButtonThemeClass}`}
        >
          SVUOTA DB
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
