
import React, { useState, useEffect, useRef, useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';

const HelpIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.79 4 4 0 2.21-1.79 4-4 4-1.742 0-3.223-.835-3.772-2M12 18v-2M12 6V4" />
    </svg>
);

interface HelpMenuProps {
    onSelectDoc: (doc: string, title: string) => void;
}

const docLinks = [
    { doc: 'help', title: 'Guida Operativa' },
    { doc: 'FAQ', title: 'Domande Frequenti (FAQ)' },
    { doc: 'versions', title: 'Cronologia Versioni' },
    { doc: 'todo', title: 'Roadmap e Idee Future' },
];

const HelpMenu: React.FC<HelpMenuProps> = ({ onSelectDoc }) => {
    const { theme } = useContext(ThemeContext);
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSelect = (doc: string, title: string) => {
        onSelectDoc(doc, title);
        setIsOpen(false);
    };

    const buttonColor = theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-zinc-500 hover:text-black';
    const menuBg = theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-zinc-200';
    const menuItemClass = theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-zinc-100';

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Apri menu aiuto"
                aria-haspopup="true"
                aria-expanded={isOpen}
                className={`p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-red-500 transition-colors ${buttonColor}`}
            >
                <HelpIcon />
            </button>
            {isOpen && (
                <div 
                    className={`absolute right-0 mt-2 w-56 origin-top-right rounded-md shadow-lg z-50 border ${menuBg}`}
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="menu-button"
                >
                    <div className="py-1" role="none">
                        {docLinks.map(link => (
                            <button
                                key={link.doc}
                                onClick={() => handleSelect(link.doc, link.title)}
                                className={`font-mono w-full text-left block px-4 py-2 text-sm ${menuItemClass}`}
                                role="menuitem"
                            >
                                {link.title}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default HelpMenu;
