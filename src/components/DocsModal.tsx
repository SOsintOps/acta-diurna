
import React, { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import PulsingTriangle from './icons/PulsingTriangle';

interface DocsModalProps {
    docInfo: { doc: string; title: string };
    onClose: () => void;
}

const DocsModal: React.FC<DocsModalProps> = ({ docInfo, onClose }) => {
    const { theme } = useContext(ThemeContext);
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

    const modalBg = theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-zinc-200';
    const textColor = theme === 'dark' ? 'text-white' : 'text-black';
    const closeButtonBg = theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-zinc-200 hover:bg-zinc-300';
    const contentBg = theme === 'dark' ? 'bg-black/20' : 'bg-zinc-100/50';
    const contentBorder = theme === 'dark' ? 'border-gray-700' : 'border-zinc-300';

    return (
        <div 
            className="fixed inset-0 bg-black/60 z-[2000] flex items-center justify-center backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className={`w-full max-w-3xl h-[85vh] m-4 p-4 rounded-lg border shadow-lg ${modalBg} ${textColor} flex flex-col font-sans`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                    <h2 className="text-xl font-mono tracking-wider">{docInfo.title}</h2>
                    <button onClick={onClose} className={`px-3 py-1 rounded-md text-sm font-mono ${closeButtonBg}`}>CHIUDI</button>
                </div>
                
                <div className={`flex-grow overflow-y-auto feed-scrollbar p-4 border rounded-md ${contentBg} ${contentBorder}`}>
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                           <PulsingTriangle className="w-8 h-8 text-red-500 mb-4" />
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
