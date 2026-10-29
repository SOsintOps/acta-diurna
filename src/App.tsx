
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { generateCaseData, updateCaseDetails, generateDeepDiveReport, analyzeSingleUrl, reviseSearchPrompt, defaultPrompt, loadCoordinatesCache } from './services/aiService';
import type { CaseData, PromptHistoryEntry, UserFeedback } from './types';
import * as db from './db';
import LoadingScreen from './components/LoadingScreen';
import Dashboard from './components/Dashboard';
import { ThemeProvider } from './contexts/ThemeContext';
import { useCaseStore } from './store/caseStore';
import { costruisciEntita, entitaDelCaso, unisciEntita } from './services/entita';
import { ricercaIudexAttiva } from './services/iudex';
import RevisionProgressModal from './components/RevisionProgressModal';
import ArchiveOptionsModal from './components/ArchiveOptionsModal';
import ModelSelectorModal from './components/ModelSelectorModal';
import SettingsModal from './components/SettingsModal';
import { hasCredentials } from './services/apiKey';
import PromptHistoryModal from './components/PromptHistoryModal';
import DocsModal from './components/DocsModal';
import ImportOptionsModal from './components/ImportOptionsModal';
import { migrateImportedData, migraEntitaArchivio } from './utils/migration';

const App: React.FC = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  // Iniettata da vite a partire da package.json (vedi vite.config.ts).
  const appVersion = process.env.APP_VERSION ?? '0.0.0';
  const [caseToArchive, setCaseToArchive] = useState<string | null>(null);
  const [docInfo, setDocInfo] = useState<{ doc: string; title: string } | null>(null);
  const [importFileData, setImportFileData] = useState<string | null>(null);

  // Zustand store selectors
  const {
    selectedCase,
    isRevisingPrompt,
    isPromptHistoryOpen,
    setCases,
    setSelectedCase,
    setIsFetching,
    setError,
    setActiveAction,
    setReport,
    setIsImporting,
    toggleOverride,
    setIsRevisingPrompt,
    setIsModelSelectorOpen,
    setIsPromptHistoryOpen,
    setIsApiKeyModalOpen,
  } = useCaseStore();

  // Un solo lavoro con il modello alla volta: rassegna, aggiornamenti e analisi
  // di un URL non partono insieme. Un ref, non lo stato, perche' due chiamate
  // ravvicinate leggerebbero lo stesso valore vecchio.
  const busyRef = useRef(false);

  const loadAndSetCases = useCallback(async () => {
    const allCases = await db.getAllCases();
    const sortedCases = allCases.sort((a, b) => new Date(b.lastUpdateTimestamp).getTime() - new Date(a.lastUpdateTimestamp).getTime());
    setCases(sortedCases);
    return sortedCases;
  }, [setCases]);

  const fetchCases = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setIsFetching(true);
    setError(null);
    try {
      const existingCases = await db.getAllCases();
      const analystReportedExamples = await db.getAnalystReportedExamples();
      const importantExamples = await db.getImportantExamples();
      const mediumPriorityExamples = await db.getMediumPriorityExamples();
      const standardExamples = await db.getStandardPriorityExamples();
      const irrelevantExamples = await db.getIrrelevantExamples();

      const newPotentialCases = await generateCaseData(
        existingCases, 
        analystReportedExamples,
        importantExamples, 
        mediumPriorityExamples,
        standardExamples,
        irrelevantExamples
      );
      
      if (newPotentialCases.length > 0) {
        await db.addCases(newPotentialCases.map(c => ({...c, sourceMethod: 'AutoDiscovered'})));
        const sortedCases = await loadAndSetCases();
        if (!selectedCase && sortedCases.length > 0) {
             const activeCases = sortedCases.filter(c => c.status !== 'Archived');
             if(activeCases.length > 0) {
                setSelectedCase(activeCases[0]);
             }
        }
      }
    } catch (err: any) {
      console.error("Failed to fetch case data:", err);
      let errorMessage = "Failed to retrieve intelligence data. Source connection may be compromised.";
      if (err.message && err.message.includes('RESOURCE_EXHAUSTED')) {
          errorMessage = "API quota exceeded. Please wait before retrying.";
      } else if (err.message) {
          errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      busyRef.current = false;
      setIsFetching(false);
    }
  }, [selectedCase, loadAndSetCases, setIsFetching, setError, setSelectedCase]);
  
  const handleUpdateCase = useCallback(async (caseID: string, isSilent: boolean = false) => {
      if (busyRef.current) {
          if (!isSilent) setError("Un'altra operazione con il modello è in corso: riprova tra poco.");
          return;
      }
      const caseToUpdate = await db.getCase(caseID);
      if (!caseToUpdate) return;
      busyRef.current = true;

      if (!isSilent) setActiveAction({ caseID, action: 'updating' });
      if (!isSilent) setError(null);

      try {
          const updatedDetails = await updateCaseDetails(caseToUpdate);

          if (Object.keys(updatedDetails).length === 0) {
              if (!isSilent) {
                  alert(`Nessuna nuova informazione trovata per il caso ${caseID}.`);
              }
              if (!isSilent) setActiveAction(null); // Ensure spinner stops
              return;
          }

          // Merge nested objects to prevent data loss from partial updates.
          const changes: Partial<CaseData> = {
              ...updatedDetails, // Carries over arrays (entities, provenance) which are meant to be replaced entirely.
              status: 'Updated' as const,
              lastUpdateTimestamp: new Date().toISOString()
          };
          
          // If summary was partially updated, merge it with the existing summary to preserve all fields.
          if (updatedDetails.summary) {
              changes.summary = { ...caseToUpdate.summary, ...updatedDetails.summary };
          }
          
          // Do the same for other nested objects.
          if (updatedDetails.details) {
              changes.details = { ...caseToUpdate.details, ...updatedDetails.details };
          }
           if (updatedDetails.audio) {
              changes.audio = { ...caseToUpdate.audio, ...updatedDetails.audio };
          }

          await db.updateCase(caseID, changes);
          const updatedCases = await loadAndSetCases();
          
          if (!isSilent && selectedCase?.caseID === caseID) {
            const newlyUpdatedCase = updatedCases.find(c => c.caseID === caseID);
            setSelectedCase(newlyUpdatedCase || null);
          }

      } catch (err) {
          console.error(`Failed to update case ${caseID}:`, err);
          if (!isSilent) setError("Failed to update case details. Source connection may be compromised.");
      } finally {
          busyRef.current = false;
          if (!isSilent) setActiveAction(null);
      }
  }, [loadAndSetCases, selectedCase, setActiveAction, setError, setSelectedCase]);

  // Nessun aggiornamento automatico dei casi importanti: veniva da Police
  // Chronicle 1.6 e l'utente non l'ha mai chiesto (2026-10-29). Un caso si
  // aggiorna solo con AGGIORNA.

  useEffect(() => {
    async function loadInitialData() {
        await loadCoordinatesCache();
        // Prima di mostrare l'archivio, le entita' dei casi vecchi passano al formato comune.
        await migraEntitaArchivio().catch(err => console.error('Entity migration failed:', err));
        useCaseStore.getState().setIudexRicerca(await ricercaIudexAttiva());

        // Senza chiave non si chiama il modello: si chiede la chiave e basta.
        // L'archivio gia' raccolto resta consultabile in ogni caso.
        const keyConfigured = await hasCredentials(useCaseStore.getState().aiProvider);
        if (!keyConfigured) {
            setIsApiKeyModalOpen(true);
        }

        const dbCases = await db.getAllCases();
        if (dbCases.length > 0) {
            const sortedCases = await loadAndSetCases();
            const activeCases = sortedCases.filter(c => c.status !== 'Archived');
            if (activeCases.length > 0) {
                setSelectedCase(activeCases[0]);
            }
        }
        // A database vuoto non parte nessuna rassegna da sola: ogni ricarica
        // della pagina ne lanciava una, e ognuna costa. La prima si avvia con
        // «CERCA ORA».
        
        const timer = setTimeout(() => {
            setIsInitializing(false);
        }, 1500);

        return () => clearTimeout(timer);
    }
    loadInitialData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Il timer si monta una volta sola e chiama sempre la versione piu' recente
  // di fetchCases. Prima dipendeva da fetchCases, che cambia a ogni clic su un
  // caso: la ricerca ogni 4 ore ripartiva da zero e non arrivava mai.
  const fetchCasesRef = useRef(fetchCases);
  fetchCasesRef.current = fetchCases;

  useEffect(() => {
    const checkNews = () => {
        const hour = new Date().getHours();
        if (useCaseStore.getState().isOverrideActive || (hour >= 9 && hour <= 17)) {
            console.log("Scheduled check: Fetching new data...");
            fetchCasesRef.current();
        }
    };
    const interval = setInterval(checkNews, 4 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectCase = async (caseData: CaseData) => {
    setReport(null);

    let caseToSelect = caseData;

    if (!caseData.isRead && caseData.status !== 'Archived') {
        const changes: Partial<CaseData> = { isRead: true };
        
        if (caseData.status === 'Active') {
            changes.status = 'Updated';
        }

        await db.updateCase(caseData.caseID, changes);
        
        const updatedCases = await loadAndSetCases();
        const newlySelectedCase = updatedCases.find(c => c.caseID === caseData.caseID);
        caseToSelect = newlySelectedCase || caseData;
    }
    
    setSelectedCase(caseToSelect);
  };
  
  const handleGenerateReport = async (caseID: string) => {
    const caseToReport = await db.getCase(caseID);
    if (!caseToReport) return;

    setActiveAction({ caseID, action: 'reporting' });
    setError(null);
    try {
        const deepDiveResult = await generateDeepDiveReport(caseToReport);
        
        setReport({ caseID, content: deepDiveResult.reportContent });

        // Le entita' del report si uniscono a quelle del caso per identita' (uid):
        // nessuna si perde, e una persona gia' nota riceve i dati che le mancavano.
        const entitaDalReport = await costruisciEntita(deepDiveResult.updatedEntities, {
            caseID, dataArticolo: caseToReport.summary.dateOfOperation,
        });
        const updatedCaseData: Partial<CaseData> = {
            hasReport: true,
            reportContent: deepDiveResult.reportContent,
            entita: unisciEntita(entitaDelCaso(caseToReport), entitaDalReport),
            lastUpdateTimestamp: new Date().toISOString()
        };

        await db.updateCase(caseID, updatedCaseData);
        const updatedCases = await loadAndSetCases();
        const newlyUpdatedCase = updatedCases.find(c => c.caseID === caseID);
        if (newlyUpdatedCase && selectedCase?.caseID === caseID) {
            setSelectedCase(newlyUpdatedCase);
        }
        
    } catch (err: any) {
        console.error(`Failed to generate report for case ${caseID}:`, err);
        let errorMessage;
        if (err.message && err.message.includes('AI reported an error:')) {
            errorMessage = "Il report non è stato generato perché i dati ricevuti non sono sufficienti. Appena ci saranno ulteriori informazioni, verrà fornito il report.";
        } else if (err.message && err.message.includes('RESOURCE_EXHAUSTED')) {
            errorMessage = "API quota exceeded. Please wait before retrying.";
        } else {
            errorMessage = "Failed to generate report. AI service may be unavailable.";
        }
        setError(errorMessage);
    } finally {
        setActiveAction(null);
    }
  };

  const handleReportUrl = async () => {
    const url = window.prompt("Inserisci l'URL della notizia da analizzare:");
    if (!url || !url.startsWith('http')) {
        if(url) alert("URL non valido. Assicurati che inizi con http o https.");
        return;
    }
    
    if (busyRef.current) {
        setError("Un'altra operazione con il modello è in corso: riprova tra poco.");
        return;
    }
    busyRef.current = true;
    setActiveAction({ caseID: 'url-analysis', action: 'analyzingUrl' });
    setError(null);

    try {
        const allCases = await db.getAllCases();
        // analyzeSingleUrl restituisce il caso gia' completo: ID, luoghi
        // geocodificati, categorie convalidate, entita' nel formato comune.
        const caso = await analyzeSingleUrl(url, allCases);
        const caseID = caso.caseID;

        const newCase: CaseData = {
            ...caso,
            isImportant: true,
            userFeedback: 'important',
        };

        await db.addCases([newCase]);
        await loadAndSetCases();
        setSelectedCase(newCase);
        
        await handleGenerateReport(caseID);

    } catch (err: any) {
        console.error("Failed to process reported URL:", err);
        setError(err.message || "Analisi dell'URL fallita. Riprova.");
    } finally {
        busyRef.current = false;
        setActiveAction(null);
    }
  };

  const handleClearReport = () => setReport(null);

  const handleShowReport = (caseID: string, content: string | null | undefined) => {
    if (content) setReport({ caseID, content });
  };
  
  const handlePromptRevision = async () => {
      setIsRevisingPrompt(true);
      try {
          const high = await db.getImportantExamples(15);
          const medium = await db.getMediumPriorityExamples(15);
          const standard = await db.getStandardPriorityExamples(15);
          const irrelevant = await db.getIrrelevantExamples(15);
          const activePromptEntry = await db.getActivePrompt();
          const currentPrompt = activePromptEntry ? activePromptEntry.prompt : defaultPrompt;
          
          const newPrompt = await reviseSearchPrompt(high, medium, standard, irrelevant, currentPrompt);
          
          const history: PromptHistoryEntry[] = (await db.getSettings('promptHistory')) || [];
          const newVersion = history.length > 0 ? Math.max(...history.map(h => h.version)) + 1 : 1;
          
          const newEntry: PromptHistoryEntry = {
              version: newVersion,
              timestamp: new Date().toISOString(),
              prompt: newPrompt,
              basedOn: {
                  highPriority: high.length,
                  mediumPriority: medium.length,
                  standard: standard.length,
              }
          };
          
          history.push(newEntry);
          await db.setSettings('promptHistory', history);
          
          await db.setSettings('importantCaseCounter', 0);
          
          console.log(`Prompt revision complete. New version: ${newVersion}.`);
          alert(`Profilo di ricerca dell'IA aggiornato alla versione ${newVersion}.`);
          
      } catch (e) {
          console.error("Failed to revise search prompt:", e);
          setError("Failed to update AI learning profile.");
      } finally {
          setIsRevisingPrompt(false);
      }
  };

  const handleMarkAsImportant = async (caseID: string) => {
    const caseToUpdate = await db.getCase(caseID);
    if (!caseToUpdate) return;

    const newStatus = !caseToUpdate.isImportant;
    const changes: Partial<CaseData> = { isImportant: newStatus };

    // «Importante» e' un segnale per il profilo di ricerca: non scade e non fa
    // partire aggiornamenti. importantUntil si azzera per gli archivi vecchi.
    changes.importantUntil = undefined;
    if (newStatus) {
        changes.userFeedback = 'important';

        const counter = (await db.getSettings('importantCaseCounter') || 0) + 1;
        await db.setSettings('importantCaseCounter', counter);
        if (counter >= 15) {
            await handlePromptRevision();
        }

    }

    await db.updateCase(caseID, changes);
    const updatedCases = await loadAndSetCases();
    const newlyUpdatedCase = updatedCases.find(c => c.caseID === caseID);
    if (newlyUpdatedCase) setSelectedCase(newlyUpdatedCase);
  };


  const handleArchiveCase = (caseID: string) => {
    setCaseToArchive(caseID);
  };
  
  const executeArchive = async (reason: UserFeedback) => {
    if (!caseToArchive) return;
    const caseID = caseToArchive;
    setCaseToArchive(null);

    await db.updateCase(caseID, { 
      status: 'Archived', 
      isImportant: false, 
      importantUntil: undefined,
      userFeedback: reason
    });
    
    const sortedCases = await loadAndSetCases();
    if (selectedCase?.caseID === caseID) {
        const nextCase = sortedCases.find(c => c.status !== 'Archived');
        setSelectedCase(nextCase || null);
    }
  };
  
  const handleExportData = async () => {
    try {
        const allData = {
          cases: await db.getAllCases(),
          settings: await db.getAllSettings(),
        }
        const dataStr = JSON.stringify(allData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        a.download = `police_chronicle_backup_${timestamp}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (err) {
        console.error("Failed to export database:", err);
        setError("Could not export the database.");
    }
  };
  
  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (e) => {
          const text = e.target?.result;
          if (typeof text === 'string') {
            setImportFileData(text); // Trigger the options modal
          }
        };
        reader.readAsText(file);
    };
    input.click();
  };

  const processImport = async (mode: 'overwrite' | 'integrate') => {
    if (!importFileData) return;
    
    try {
        const rawData = JSON.parse(importFileData);
        const { migratedData, wasMigrated } = await migrateImportedData(rawData);
        
        if (wasMigrated) {
            console.log("Imported data was migrated to a new version.");
            alert("Il file di backup è stato migrato a una versione più recente dello schema.");
        }

        setIsImporting(true);
        if (mode === 'overwrite') {
            await db.clearDatabase();
            await db.addCases(migratedData.cases as CaseData[]);
            await db.bulkPutSettings(migratedData.settings);
        } else { // integrate
            await db.integrateDatabase(migratedData);
        }
        
        const newlyLoadedCases = await loadAndSetCases();
        setSelectedCase(newlyLoadedCases.find(c => c.status !== 'Archived') || null);
        alert(`Operazione completata con successo.`);

    } catch (err) {
        const message = err instanceof Error ? err.message : "An unknown error occurred.";
        setError(`Importazione fallita: ${message}`);
        alert(`Errore durante l'importazione del database: ${message}`);
    } finally {
        setIsImporting(false);
        setImportFileData(null);
    }
};


  const handleClearDatabase = async () => {
    const confirmed = window.confirm(
        "ATTENZIONE: Questa azione cancellerà in modo permanente tutti i dati, inclusi i casi, i report e la cronologia di apprendimento dell'IA. L'operazione è irreversibile.\n\nSei sicuro di voler procedere?"
    );
    if (confirmed) {
        try {
            await db.clearDatabase();
            await loadAndSetCases();
            setSelectedCase(null);
            setReport(null);
            alert("Database svuotato con successo.");
        } catch (err) {
            console.error("Failed to clear database:", err);
            setError("Impossibile svuotare il database.");
        }
    }
  };

  const handleOpenModelSelector = () => setIsModelSelectorOpen(true);
  const handleOpenApiKey = () => setIsApiKeyModalOpen(true);
  const handleOpenPromptHistory = () => setIsPromptHistoryOpen(true);
  const handleClosePromptHistory = () => setIsPromptHistoryOpen(false);
  const handleOpenDocs = (doc: string, title: string) => setDocInfo({ doc, title });
  const handleCloseDocs = () => setDocInfo(null);
  
  const handleSetNewActivePrompt = async (promptText: string, baseEntry?: PromptHistoryEntry) => {
      setIsRevisingPrompt(true); // Re-use this loading state
      try {
          const history: PromptHistoryEntry[] = (await db.getSettings('promptHistory')) || [];
          const newVersion = history.length > 0 ? Math.max(...history.map(h => h.version)) + 1 : 1;
          
          const newEntry: PromptHistoryEntry = {
              version: newVersion,
              timestamp: new Date().toISOString(),
              prompt: promptText,
              basedOn: baseEntry?.basedOn || {
                  highPriority: 0,
                  mediumPriority: 0,
                  standard: 0,
              }
          };
          
          history.push(newEntry);
          await db.setSettings('promptHistory', history);
          
          console.log(`New prompt version ${newVersion} set as active.`);
          alert(`Prompt versione ${newVersion} impostato come attivo.`);
      } catch (e) {
          console.error("Failed to set new active prompt:", e);
          setError("Impossibile impostare il nuovo prompt attivo.");
      } finally {
          setIsRevisingPrompt(false);
          setIsPromptHistoryOpen(false);
      }
  };

  if (isInitializing) {
    return <LoadingScreen />;
  }

  return (
    <ThemeProvider>
       <ModelSelectorModal />
       <SettingsModal />
       {isRevisingPrompt && <RevisionProgressModal />}
       {caseToArchive && (
        <ArchiveOptionsModal 
          onCancel={() => setCaseToArchive(null)}
          onArchive={executeArchive}
        />
       )}
       {isPromptHistoryOpen && (
           <PromptHistoryModal 
            onClose={handleClosePromptHistory}
            onSetActive={handleSetNewActivePrompt}
           />
       )}
       {docInfo && <DocsModal docInfo={docInfo} onClose={handleCloseDocs} />}
       {importFileData && (
          <ImportOptionsModal
              onCancel={() => setImportFileData(null)}
              onOverwrite={() => processImport('overwrite')}
              onIntegrate={() => processImport('integrate')}
          />
        )}
      <main className="w-screen h-screen p-2 box-border">
        <Dashboard
          appVersion={appVersion}
          onSelectCase={handleSelectCase}
          onCheckNewsNow={fetchCases}
          onUpdateCase={handleUpdateCase}
          onGenerateReport={handleGenerateReport}
          onArchiveCase={handleArchiveCase}
          onClearReport={handleClearReport}
          onShowReport={handleShowReport}
          onMarkAsImportant={handleMarkAsImportant}
          onExportData={handleExportData}
          onImportData={handleImportData}
          onToggleOverride={toggleOverride}
          onReportUrl={handleReportUrl}
          onClearDatabase={handleClearDatabase}
          onOpenModelSelector={handleOpenModelSelector}
          onOpenApiKey={handleOpenApiKey}
          onOpenPromptHistory={handleOpenPromptHistory}
          onOpenDocs={handleOpenDocs}
        />
      </main>
    </ThemeProvider>
  );
};

export default App;
