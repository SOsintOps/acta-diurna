

import React, { useState, useMemo, useEffect } from 'react';
import type { CaseData } from '../types';
import StarIcon from './icons/StarIcon';
import WarningIcon from './icons/WarningIcon';

interface CaseRowProps {
  caseItem: CaseData;
  onSelectCase: (caseData: CaseData) => void;
  isSelected: boolean;
}

const CaseRow: React.FC<CaseRowProps> = ({ caseItem, onSelectCase, isSelected }) => {
    const isImportant = caseItem.isImportant;
    const isIrrelevant = caseItem.status === 'Archived';

    const getRowClass = () => {
        if (isSelected) {
            return 'sam-row-selected';
        }
        return 'sam-row';
    };

    // Define base text colors
    const baseCaseIdColor = 'sam-muted';
    const baseTitleColor = 'sam-fg';
    const baseLocationColor = 'sam-muted';
    const selectedColor = 'sam-threat';
    const irrelevantColor = 'sam-muted';

    // Determine final classes, applying styles for irrelevant state unless selected
    const caseIdClass = isSelected ? selectedColor : (isIrrelevant ? irrelevantColor : baseCaseIdColor);
    const titleClass = isIrrelevant && !isSelected ? irrelevantColor : baseTitleColor;
    const locationClass = isIrrelevant && !isSelected ? irrelevantColor : baseLocationColor;
    
    const getLocationText = () => {
        const locations = caseItem.summary.location?.cities;
        if (!locations || locations.length === 0) {
            // Fallback for old data structure
            // @ts-ignore
            const oldCity = caseItem.summary.location?.city;
            return oldCity ? `${oldCity}` : 'Località non disponibile';
        }
        const primaryCity = locations[0].name;
        const otherCitiesCount = locations.length - 1;
        if (otherCitiesCount > 0) {
            return `${primaryCity}, +${otherCitiesCount} altre località`;
        }
        return primaryCity;
    };
    
    const lastUpdateDate = new Date(caseItem.lastUpdateTimestamp).toLocaleString('it-IT', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).replace(',', '');


    return (
        <div
            onClick={() => onSelectCase(caseItem)}
            className={`
 p-3 sam-divider cursor-pointer transition-colors duration-200
 flex items-start
 ${getRowClass()}
 `}
        >
            <div className="w-4 h-4 mr-3 mt-1 flex-shrink-0">
                {isSelected && <div className="sam-rec sam-blink" style={{ width: 8, height: 8 }} />}
            </div>
            <div className="flex-grow overflow-hidden">
                <div className="flex justify-between items-baseline">
                    <span className={`font-mono text-sm ${caseIdClass} truncate`}>
                        {caseItem.caseID} {caseItem.status !== 'Active' ? `[${caseItem.status.toUpperCase()}]` : ''}
                    </span>
                    <span className={`font-mono text-xs ml-2 flex-shrink-0 ${caseIdClass} opacity-70`}>
                        {lastUpdateDate}
                    </span>
                </div>

                <p className={`text-base leading-tight mt-1 flex items-center ${titleClass} ${isImportant ? 'font-bold' : ''}`}>
                    {caseItem.isImportant && <StarIcon className="w-4 h-4 sam-warn mr-2 flex-shrink-0" />}
                    {caseItem.provenanceWarning && (
                        <span title="Fonti non verificate automaticamente">
                            <WarningIcon className="w-4 h-4 sam-warn mr-2 flex-shrink-0" />
                        </span>
                    )}
                    <span className="flex-grow">{caseItem.summary.title}</span>
                     {caseItem.hasReport && (
                        <svg aria-label="Report generato" xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ml-2 flex-shrink-0 ${isSelected ? selectedColor : caseIdClass}`} viewBox="0 0 20 20" fill="currentColor">
                           <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                    )}
                </p>
                <p className={`text-sm mt-1 ${locationClass}`}>{getLocationText()}</p>
            </div>
        </div>
    );
};

interface CaseFeedProps {
  cases: CaseData[];
  onSelectCase: (caseData: CaseData) => void;
  selectedCaseId: string | null;
}

type FeedTab = 'unread' | 'important' | 'irrelevant' | 'all';

const CaseFeed: React.FC<CaseFeedProps> = ({ cases, onSelectCase, selectedCaseId }) => {
  const [activeTab, setActiveTab] = useState<FeedTab>('unread');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const borderClass = 'sam-edge';
  const headerTextClass = 'sam-muted';
  const tabBaseClass = `px-3 py-1.5 text-xs font-mono tracking-wider transition-colors duration-200 w-full text-center`;
  const tabActiveClass = 'sam-tab-active';
  const tabInactiveClass = 'sam-tab';
  const inputClass = 'sam-field';

  const filteredCases = useMemo(() => {
    return cases.filter(c => {
      const lowerSearchTerm = searchTerm.toLowerCase();
      
      const locationMatch = c.summary.location?.cities?.some(city => city.name.toLowerCase().includes(lowerSearchTerm)) ||
                            c.summary.location?.regions?.some(region => region.toLowerCase().includes(lowerSearchTerm)) ||
                            // Fallback for old data
                            // @ts-ignore
                            (c.summary.location?.city && c.summary.location.city.toLowerCase().includes(lowerSearchTerm));


      const searchMatch = !searchTerm || (
          c.caseID.toLowerCase().includes(lowerSearchTerm) ||
          c.summary.title.toLowerCase().includes(lowerSearchTerm) ||
          locationMatch ||
          c.summary.crimeTypes.some(ct => ct.toLowerCase().includes(lowerSearchTerm)) ||
          (c.details.operationName && c.details.operationName.toLowerCase().includes(lowerSearchTerm)) ||
          c.entities.individuals.some(ind => ind.name && ind.name.toLowerCase().includes(lowerSearchTerm)) ||
          c.entities.companies.some(com => com.name && com.name.toLowerCase().includes(lowerSearchTerm))
      );

      const dateMatch = !filterDate || c.summary.dateOfOperation === filterDate;
      
      return searchMatch && dateMatch;
    });
  }, [cases, searchTerm, filterDate]);

  const unreadCases = useMemo(() => filteredCases.filter(c => !c.isRead && c.status !== 'Archived'), [filteredCases]);
  const importantCases = useMemo(() => filteredCases.filter(c => c.isImportant && c.status !== 'Archived'), [filteredCases]);
  const irrelevantCases = useMemo(() => filteredCases.filter(c => c.status === 'Archived'), [filteredCases]);
  const allCases = useMemo(() => filteredCases, [filteredCases]);

  // Automatically switch to 'all' if 'unread' is empty to provide a better UX
  useEffect(() => {
    if (activeTab === 'unread' && unreadCases.length === 0 && allCases.length > 0) {
      setActiveTab('all');
    }
  }, [activeTab, unreadCases.length, allCases.length]);

  const displayedCases = useMemo(() => {
    switch(activeTab) {
      case 'unread': return unreadCases;
      case 'important': return importantCases;
      case 'irrelevant': return irrelevantCases;
      case 'all': return allCases;
      default: return [];
    }
  }, [activeTab, unreadCases, importantCases, irrelevantCases, allCases]);

  return (
    <div className={`w-full h-full flex flex-col border ${borderClass}`}>
      <header className={`flex-shrink-0 p-2 border-b ${borderClass} font-mono text-base ${headerTextClass} tracking-wider`}>
        CASE FEED
      </header>
      
      {/* Filter & Search Section */}
      <div className={`p-2 border-b ${borderClass}`}>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Cerca in tutti i campi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`flex-grow p-1 px-2 text-sm font-mono border ${inputClass}`}
          />
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className={`p-1 px-2 text-sm font-mono border ${inputClass}`}
          />
          <button
            onClick={() => { setFilterDate(''); setSearchTerm(''); }}
            className="flex-shrink-0 px-3 py-1 text-sm font-mono sam-action sam-action-threat transition-colors"
          >
            RESET
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className={`grid grid-cols-4 flex-shrink-0 border-b ${borderClass} bg-black/20`}>
        <button 
            className={`${tabBaseClass} ${activeTab === 'unread' ? tabActiveClass : tabInactiveClass}`}
            onClick={() => setActiveTab('unread')}
        >
            NON LETTI ({unreadCases.length})
        </button>
        <button 
            className={`${tabBaseClass} ${activeTab === 'important' ? tabActiveClass : tabInactiveClass}`}
            onClick={() => setActiveTab('important')}
        >
            IMPORTANTI ({importantCases.length})
        </button>
         <button 
            className={`${tabBaseClass} ${activeTab === 'irrelevant' ? tabActiveClass : tabInactiveClass}`}
            onClick={() => setActiveTab('irrelevant')}
        >
            IRRILEVANTI ({irrelevantCases.length})
        </button>
        <button 
            className={`${tabBaseClass} ${activeTab === 'all' ? tabActiveClass : tabInactiveClass}`}
            onClick={() => setActiveTab('all')}
        >
            TUTTI ({allCases.length})
        </button>
      </div>

      {/* Case List */}
      <div className="flex-grow overflow-y-auto feed-scrollbar">
        {displayedCases.map((c) => (
          <CaseRow 
            key={c.caseID}
            caseItem={c}
            onSelectCase={onSelectCase}
            isSelected={selectedCaseId === c.caseID}
          />
        ))}
      </div>
    </div>
  );
};

export default CaseFeed;