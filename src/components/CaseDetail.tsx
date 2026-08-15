import React, { useEffect, useState, useContext } from 'react';
import type { CaseData } from '../types';
import AnimatedText from './AnimatedText';
import PulsingTriangle from './icons/PulsingTriangle';
import { ThemeContext } from '../contexts/ThemeContext';
import StarIcon from './icons/StarIcon';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { translateReport } from '../services/geminiService';
import WarningIcon from './icons/WarningIcon';

interface CaseDetailProps {
  appVersion: string;
  caseData: CaseData | null;
  onUpdateCase: (caseID: string) => void;
  onGenerateReport: (caseID:string) => void;
  onArchiveCase: (caseID: string) => void;
  onMarkAsImportant: (caseID: string) => void;
  activeAction: { caseID: string; action: 'updating' | 'reporting' | 'analyzingUrl' } | null;
  report: { caseID: string; content: string } | null;
  onClearReport: () => void;
  onShowReport: (caseID: string, content: string | null | undefined) => void;
}

const DetailSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
    const { theme } = useContext(ThemeContext);
    const borderClass = theme === 'dark' ? 'border-gray-800' : 'border-zinc-300';
    const headerBgClass = theme === 'dark' ? 'bg-gray-900' : 'bg-zinc-200';
    const headerTextClass = theme === 'dark' ? 'text-gray-400' : 'text-zinc-500';

    return (
        <div className={`border ${borderClass} mb-2`}>
            <h3 className={`font-mono text-sm p-1 px-2 ${headerBgClass} border-b ${borderClass} ${headerTextClass} tracking-widest`}>{title}</h3>
            <div className="p-2 text-base">{children}</div>
        </div>
    );
};

const ActionButton: React.FC<{ onClick: () => void; disabled: boolean; children: React.ReactNode; className?: string }> = ({ onClick, disabled, children, className = '' }) => {
    const { theme } = useContext(ThemeContext);
    const baseClass = 'w-full text-left p-2 text-sm font-mono tracking-widest transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center';
    const themeClass = theme === 'dark'
        ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 disabled:hover:bg-gray-800'
        : 'bg-zinc-200 hover:bg-zinc-300 text-zinc-700 disabled:hover:bg-zinc-200';
    return <button onClick={onClick} disabled={disabled} className={`${baseClass} ${themeClass} ${className}`}>{children}</button>;
};


const CaseDetail: React.FC<CaseDetailProps> = ({ appVersion, caseData, onUpdateCase, onGenerateReport, onArchiveCase, onMarkAsImportant, activeAction, report, onClearReport, onShowReport }) => {
    const { theme } = useContext(ThemeContext);
    const [title, setTitle] = useState('');
    const [showContent, setShowContent] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);
    
    useEffect(() => {
        if (caseData) {
            setTitle('');
            setShowContent(false);
            setTimeout(() => {
                setTitle(caseData.summary.title);
            }, 50);
        }
        return () => {
            window.speechSynthesis.cancel();
        };
    }, [caseData]);

    const handleTitleAnimationComplete = () => {
        setShowContent(true);
    };

    const handlePlayAudio = (lang: 'it' | 'en') => {
        if (!caseData) return;
        window.speechSynthesis.cancel();
        const script = lang === 'it' ? caseData.audio.ttsScript : caseData.audio.ttsScriptEn;
        const utterance = new SpeechSynthesisUtterance(script);
        utterance.lang = lang === 'it' ? 'it-IT' : 'en-US';
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
    };

    const formatCaseDataForRtf = (data: CaseData): string => {
        let output = `{\\rtf1\\ansi\\deff0 {\\fonttbl{\\f0 Arial;}}\\fs24
{\\b ID CASO: ${data.caseID}}\\par
{\\b TITOLO:} ${data.summary.title}\\par
\\par
{\\b RIEPILOGO}\\par
${data.details?.investigationReason || 'Nessun riepilogo disponibile.'}\\par
\\par
{\\b PERSONE COINVOLTE}\\par
\\trowd \\trgaph108\\trleft-108
\\clbrdrb\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\clbrdrt\\brdrs\\brdrw10 \\cellx4000
\\clbrdrb\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\clbrdrt\\brdrs\\brdrw10 \\cellx6000
\\clbrdrb\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\clbrdrt\\brdrs\\brdrw10 \\cellx8000
\\b NOME\\b0\\intbl \\b RUOLO\\b0\\intbl \\b DATA DI NASCITA\\b0\\intbl \\cell
${(data.entities.individuals || []).map(p => `\\trowd \\trgaph108\\trleft-108\\clbrdrb\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\clbrdrt\\brdrs\\brdrw10 \\cellx4000\\clbrdrb\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\clbrdrt\\brdrs\\brdrw10 \\cellx6000\\clbrdrb\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\clbrdrt\\brdrs\\brdrw10 \\cellx8000 ${p.name || ''}\\intbl ${p.role || ''}\\intbl ${p.dateOfBirth || ''}\\intbl \\cell`).join('\\row ')}\\row
\\par
{\\b AZIENDE COINVOLTE}\\par
\\trowd \\trgaph108\\trleft-108\\clbrdrb\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\clbrdrt\\brdrs\\brdrw10 \\cellx4000\\clbrdrb\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\clbrdrt\\brdrs\\brdrw10 \\cellx8000\\b NOME\\b0\\intbl \\b PROVVEDIMENTO\\b0\\intbl \\cell
${(data.entities.companies || []).map(c => `\\trowd \\trgaph108\\trleft-108\\clbrdrb\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\clbrdrt\\brdrs\\brdrw10 \\cellx4000\\clbrdrb\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\clbrdrt\\brdrs\\brdrw10 \\cellx8000 ${c.name || ''}\\intbl ${c.legalAction || ''}\\intbl \\cell`).join('\\row ')}\\row
\\par
{\\b FONTI}\\par
${(data.provenance || []).map((p, i) => `${i + 1}. {\\field{\\*\\fldinst{HYPERLINK "${p.url}"}}{\\fldrslt{\\ul ${p.sourceName}}}}\\par`).join('')}
\\par
}`;
        return output.replace(/\n/g, '').replace(/’/g, "'"); // Sanitize apostrophes
    };

    const handleDownload = (content: string, isReport: boolean, lang: 'IT' | 'EN' = 'IT') => {
        if (!caseData) return;
        
        let rtfContent: string;

        if (isReport) {
            const markdownToRtf = (markdown: string): string => {
                if (!markdown) return '';
                // Convert Markdown to a simplified RTF format
                return markdown
                    .replace(/^###\s(.*?)$/gm, '{\\b \\par $1}\\par ')
                    .replace(/\*\*(.*?)\*\*/g, '{\\b $1}')
                    .replace(/\*(.*?)\*/g, '{\\i $1}')
                    .replace(/_(.*?)_/g, '{\\i $1}')
                    // Correctly convert Markdown links to RTF hyperlinks
                    .replace(/\[(.*?)\]\((.*?)\)/g, '{\\field{\\*\\fldinst HYPERLINK "$2"}{\\fldrslt{\\ul $1}}}')
                    .replace(/\n/g, ' \\par ');
            };
            const title = lang === 'EN' ? 'DEEP DIVE REPORT' : 'APPROFONDIMENTO';
            rtfContent = `{\\rtf1\\ansi\\deff0 {\\fonttbl{\\f0 Arial;}}\\fs24 {\\b ${title} - CASE ID: ${caseData.caseID}}\\par\\par ${markdownToRtf(content)}}`;
        } else {
             rtfContent = formatCaseDataForRtf(caseData);
             
             let disclaimer;
             if (lang === 'EN') {
                disclaimer = `\\par\\par{\\i This document was generated by POLICE CHRONICLE (v.${appVersion}). It is necessary to verify the indicated sources to validate the content of this document.}`;
             } else {
                disclaimer = `\\par\\par{\\i Questo documento è stato generato da POLICE CHRONICLE (v.${appVersion}). È necessario verificare le fonti indicate per validare il contenuto di questo documento.}`;
             }

             rtfContent = rtfContent.slice(0, -1) + disclaimer + '}';
        }

        const blob = new Blob([rtfContent], { type: 'application/rtf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const filename = `${isReport ? 'Report' : 'Caso'}_${lang}_${caseData.caseID.replace(/[^a-zA-Z0-9]/g, '_')}.rtf`;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleDownloadEnglish = async () => {
        if (!report?.content) return;
        setIsTranslating(true);
        try {
            const translatedContent = await translateReport(report.content);
            handleDownload(translatedContent, true, 'EN');
        } catch (error) {
            console.error("Failed to translate report:", error);
            // In a real app, you'd want to show an error to the user here.
        } finally {
            setIsTranslating(false);
        }
    };

    const borderClass = theme === 'dark' ? 'border-gray-800' : 'border-zinc-300';
    const mutedTextClass = theme === 'dark' ? 'text-gray-600' : 'text-zinc-400';
    const strongMutedTextClass = theme === 'dark' ? 'text-gray-400' : 'text-zinc-500';
    const redTextClass = theme === 'dark' ? 'text-red-400' : 'text-red-600';
    const reportBgClass = theme === 'dark' ? 'bg-black/20' : 'bg-zinc-100/50';
    const reportBorderClass = theme === 'dark' ? 'border-gray-700' : 'border-zinc-300';
    const warningBannerBg = theme === 'dark' ? 'bg-yellow-900/40 border-yellow-700/60' : 'bg-yellow-50 border-yellow-300';
    const warningBannerText = theme === 'dark' ? 'text-yellow-300' : 'text-yellow-800';


    if (!caseData) {
        return (
            <div className={`w-full h-full flex items-center justify-center border ${borderClass} ${mutedTextClass} font-mono text-lg`}>
                SELEZIONA UN CASO PER L'ANALISI
            </div>
        );
    }
    
    if (report && report.caseID === caseData.caseID) {
        const isReporting = activeAction?.caseID === caseData.caseID && activeAction.action === 'reporting';
        return (
            <div className={`w-full h-full flex flex-col border ${borderClass} p-2`}>
                <h2 className="text-2xl font-medium mb-2 flex-shrink-0 font-mono tracking-wider">APPROFONDIMENTO</h2>
                <div className={`flex-grow overflow-y-auto feed-scrollbar ${reportBgClass} p-4 border ${reportBorderClass} rounded mb-2 report-content`}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{report.content}</ReactMarkdown>
                </div>
                <div className="flex-shrink-0 grid grid-cols-2 gap-2">
                    <ActionButton
                        onClick={() => handleDownload(report.content, true, 'IT')}
                        disabled={isReporting || isTranslating}
                        className={theme === 'dark' ? 'bg-red-700 hover:bg-red-600 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}
                    >
                        SCARICA REPORT IT
                    </ActionButton>
                    <ActionButton
                        onClick={handleDownloadEnglish}
                        disabled={isReporting || isTranslating}
                    >
                        {isTranslating ? (
                            <><PulsingTriangle className="w-3 h-3 mr-2" /><span>TRADUZIONE...</span></>
                        ) : (
                            'SCARICA REPORT EN'
                        )}
                    </ActionButton>
                    <ActionButton
                        onClick={() => onGenerateReport(caseData.caseID)}
                        disabled={isReporting || isTranslating}
                    >
                        {isReporting ? (
                            <>
                                <PulsingTriangle className="w-3 h-3 mr-2" />
                                <span>AGGIORNAMENTO...</span>
                            </>
                        ) : (
                            'AGGIORNA REPORT'
                        )}
                    </ActionButton>
                    <ActionButton onClick={onClearReport} disabled={isReporting || isTranslating}>
                        CHIUDI
                    </ActionButton>
                </div>
            </div>
        )
    }

    const isArchived = caseData.status === 'Archived';
    const isUpdating = activeAction?.caseID === caseData.caseID && activeAction.action === 'updating';
    const isReporting = activeAction?.caseID === caseData.caseID && activeAction.action === 'reporting';
    const hasExistingReport = caseData.hasReport && !!caseData.reportContent;

    const { cities = [], regions = [] } = caseData.summary.location || {};
    const primaryCity = cities.length > 0 ? cities[0] : null;
    const secondaryCities = cities.length > 1 ? cities.slice(1) : [];

    return (
        <div className={`w-full h-full flex flex-col border ${borderClass} p-2 overflow-y-auto feed-scrollbar`}>
            <div className="flex-grow">
                <div className="flex items-center mb-4">
                    <PulsingTriangle className="w-6 h-6 text-red-600 mr-4" />
                    <div className="text-2xl font-medium flex-1 h-12 flex items-center">
                        {title && <AnimatedText text={title} mode="word" speed={100} onComplete={handleTitleAnimationComplete} />}
                         {caseData.isImportant && <StarIcon className="w-5 h-5 text-yellow-400 ml-3 flex-shrink-0" />}
                    </div>
                </div>

                {showContent && (
                    <div className="animate-fadeInUp">
                        {caseData.provenanceWarning && (
                            <div className={`p-3 mb-2 border rounded-md flex items-start text-sm ${warningBannerBg} ${warningBannerText}`}>
                                <WarningIcon className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                                <div>
                                    <strong className="font-bold">Attenzione: Fonti Non Verificate</strong>
                                    <p className="text-xs mt-1">Le fonti di questo caso non hanno superato la verifica automatica. La qualità potrebbe essere inferiore. Si consiglia di usare le azioni "AGGIORNA" o "APPROFONDIMENTO" per tentare di validare le informazioni.</p>
                                </div>
                            </div>
                        )}

                        <DetailSection title="IDENTIFICATIVO CASO">
                            <p className={`font-mono text-sm ${redTextClass}`}>{caseData.caseID}</p>
                        </DetailSection>

                        <div className="grid grid-cols-3 gap-2 mb-2">
                            <DetailSection title="STATO">
                                <p className="font-bold">{caseData.status}</p>
                            </DetailSection>
                            <DetailSection title="DATA OPERAZIONE">
                                <p>{caseData.summary.dateOfOperation}</p>
                            </DetailSection>
                             <DetailSection title="ULTIMO AGGIORNAMENTO">
                                <p className="text-sm">{new Date(caseData.lastUpdateTimestamp).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', '')}</p>
                            </DetailSection>
                        </div>

                        <DetailSection title="RIEPILOGO">
                             <p className="mb-2">{caseData.details?.investigationReason || 'Nessun riepilogo disponibile.'}</p>
                             <div>
                                <strong className={strongMutedTextClass}>Tipi di Reato:</strong>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {caseData.summary.crimeTypes.map((type, index) => (
                                       <span
                                            key={index}
                                            className={`px-2 py-1 text-xs font-mono rounded ${
                                            theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-zinc-200 text-zinc-700'
                                            }`}
                                        >
                                            {type.replace(/_/g, ' ')}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </DetailSection>

                        <DetailSection title="DATI GEOGRAFICI">
                            {cities.length > 0 || regions.length > 0 ? (
                                <div className="space-y-2">
                                    {primaryCity && <p><strong className={strongMutedTextClass}>Luogo Principale:</strong> {primaryCity.name}{primaryCity.province && ` (${primaryCity.province})`}, {primaryCity.region}</p>}
                                    {secondaryCities.length > 0 && <p><strong className={strongMutedTextClass}>Altre Località:</strong> {secondaryCities.map(c => c.name).join(', ')}</p>}
                                    {regions.length > 0 && <p><strong className={strongMutedTextClass}>Regioni Coinvolte:</strong> {regions.join(', ')}</p>}
                                </div>
                            ) : (
                                <p className={strongMutedTextClass}>Nessun dato geografico specifico disponibile.</p>
                            )}
                        </DetailSection>

                        <DetailSection title="PERSONE COINVOLTE">
                            {(caseData.entities.individuals || []).length > 0 ? (
                                <ol className="list-decimal list-inside space-y-2">
                                    {(caseData.entities.individuals || []).map((ind, i) => (
                                        <li key={i}>
                                            <span>
                                                {ind.name}
                                                {ind.role && ind.role.toLowerCase() !== 'sconosciuto' && <span className="italic"> ({ind.role})</span>}
                                                {ind.dateOfBirth ? `, nato il ${ind.dateOfBirth}` : (ind.age ? `, ${ind.age} anni` : '')}
                                                {ind.legalAction && ` - `}
                                                {ind.legalAction && <span className="font-semibold">{ind.legalAction}</span>}
                                            </span>
                                        </li>
                                    ))}
                                </ol>
                            ) : <p className={strongMutedTextClass}>Nessun individuo identificato.</p>}
                        </DetailSection>
                        
                        <DetailSection title="AZIENDE COINVOLTE">
                            {(caseData.entities.companies || []).length > 0 ? (
                                <ol className="list-decimal list-inside space-y-2">
                                    {(caseData.entities.companies || []).map((comp, i) => (
                                        <li key={i}>
                                            <span>{comp.name} - <span className="font-semibold">{comp.legalAction}</span></span>
                                        </li>
                                    ))}
                                </ol>
                            ) : <p className={strongMutedTextClass}>Nessuna azienda identificata.</p>}
                        </DetailSection>

                        <DetailSection title="FONTI">
                            <ol className="list-decimal list-inside font-mono text-sm space-y-1">
                                {(caseData.provenance || []).map((p, i) => (
                                    <li key={i}>
                                        <span className={strongMutedTextClass}>{p.sourceType.toUpperCase()}:</span> 
                                        <a href={p.url} target="_blank" rel="noopener noreferrer" className={`hover:underline ml-1 ${theme === 'dark' ? 'text-white hover:text-red-400' : 'text-zinc-900 hover:text-red-600'}`}>
                                            {p.sourceName}
                                        </a>
                                    </li>
                                ))}
                            </ol>
                        </DetailSection>
                    </div>
                )}
            </div>
            
            {showContent && (
                <div className="flex-shrink-0 pt-2 mt-auto">
                    <DetailSection title="AUDIO">
                        <div className="grid grid-cols-2 gap-2">
                            <ActionButton onClick={() => handlePlayAudio('it')} disabled={isReporting || isUpdating}>ASCOLTA (IT)</ActionButton>
                            <ActionButton onClick={() => handlePlayAudio('en')} disabled={isReporting || isUpdating}>ASCOLTA (EN)</ActionButton>
                        </div>
                    </DetailSection>

                    <DetailSection title="AZIONI">
                         <div className="grid grid-cols-2 gap-2">
                            <ActionButton
                                onClick={() => hasExistingReport ? onShowReport(caseData.caseID, caseData.reportContent) : onGenerateReport(caseData.caseID)}
                                disabled={isArchived || isUpdating || isReporting}
                            >
                                {isReporting ? (
                                    <><PulsingTriangle className="w-3 h-3 mr-2" /><span>APPROFONDIMENTO...</span></>
                                ) : (
                                    hasExistingReport ? 'MOSTRA REPORT' : 'APPROFONDIMENTO'
                                )}
                            </ActionButton>
                            
                            <ActionButton onClick={() => onUpdateCase(caseData.caseID)} disabled={isArchived || isUpdating || isReporting}>
                                {isUpdating ? 'AGGIORNAMENTO...' : 'AGGIORNA'}
                            </ActionButton>

                             <ActionButton
                                onClick={() => onMarkAsImportant(caseData.caseID)}
                                disabled={isArchived || isUpdating || isReporting}
                                className={caseData.isImportant ? (theme === 'dark' ? 'bg-yellow-900/70 text-yellow-300 hover:bg-yellow-800/70' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200') : ''}
                            >
                                {caseData.isImportant ? 'IMPORTANTE ✓' : 'IMPORTANTE'}
                            </ActionButton>

                            <ActionButton onClick={() => onArchiveCase(caseData.caseID)} disabled={isArchived || isUpdating || isReporting}>
                                {isArchived ? 'ARCHIVIATO' : 'IRRILEVANTE'}
                            </ActionButton>

                             <ActionButton onClick={() => handleDownload("", false)} disabled={isReporting || isUpdating}>ESPORTA NOTIZIA</ActionButton>
                        </div>
                    </DetailSection>
                </div>
            )}
        </div>
    );
};

export default CaseDetail;