
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import PulsingTriangle from './icons/PulsingTriangle';

interface DocsModalProps {
    docInfo: { doc: string; title: string };
    onClose: () => void;
}

const DocsModal: React.FC<DocsModalProps> = ({ docInfo, onClose }) => {
        const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        fetch(`/docs/${docInfo.doc}.md`)
            .then(res => {
                if (!res.ok) {
                    throw new Error(`Failed to fetch document: ${res.statusText}`);
                }
                return res.text();
            })
            .then(text => {
                setContent(text);
                setIsLoading(false);
            })
            .catch(err => {
                console.error(`Error loading doc ${docInfo.doc}.md:`, err);
                setContent(`### Errore\n\nImpossibile caricare il documento di aiuto. Controlla la console per i dettagli.`);
                setIsLoading(false);
            });
    }, [docInfo.doc]);

    const modalBg = 'sam-panel';
    const textColor = 'sam-fg';
    const closeButtonBg = 'sam-action sam-action-ghost';
    const contentBg = '';
    const contentBorder = 'sam-edge';

    return (
        <div 
            className="sam-scrim fixed inset-0 z-[1900] flex items-center justify-center"
            onClick={onClose}
        >
            <div
                className={`w-full max-w-3xl h-[85vh] m-4 p-4 border ${modalBg} ${textColor} flex flex-col font-sans`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                    <h2 className="text-xl font-mono tracking-wider">{docInfo.title}</h2>
                    <button onClick={onClose} className={`px-3 py-1 text-sm font-mono ${closeButtonBg}`}>CHIUDI</button>
                </div>
                
                <div className={`flex-grow overflow-y-auto feed-scrollbar p-4 border ${contentBg} ${contentBorder}`}>
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full sam-muted">
                           <PulsingTriangle className="w-8 h-8 sam-threat mb-4" />
                           <p>Caricamento del documento...</p>
                        </div>
                    ) : (
                        <div className="report-content">
                             <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DocsModal;
