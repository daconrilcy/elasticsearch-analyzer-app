import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUIStore } from '../store/uiStore';

// --- CORRECTION : La syntaxe des viewBox a été nettoyée ---
const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);
const AnalyzerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);
const NodesIcon = () => <svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 14H4v-4h11v4zm0-5H4V9h11v4zm5 5h-4V9h4v10z"/></svg>;
const ConfigIcon = () => <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>;
const ResultsIcon = () => <svg viewBox="0 0 24 24"><path d="M21 3.01H3c-1.1 0-2 .9-2 2V9h2V4.99h18v14.03H3V15H1v4.01c0 1.1.9 1.98 2 1.98h18c1.1 0 2-.88 2-1.98v-14c0-1.11-.9-2-2-2zM11 16l4-4-4-4v3H1v2h10v3z"/></svg>;


export const IconSidebar: React.FC = () => {
    const { activePanel, togglePanel } = useUIStore();
    const location = useLocation();

    const isAnalyzerPage = location.pathname.startsWith('/analyzer');

    return (
        <nav className="icon-sidebar">
            <ul>
                <li>
                    <Link to="/analyzer" title="Éditeur d'analyseur">
                        <button 
                            className={`nav-button ${isAnalyzerPage ? 'active' : ''}`}
                        >
                            <AnalyzerIcon />
                        </button>
                    </Link>
                </li>
                <li>
                    <Link to="/datasets" title="Importer des données">
                        <button 
                            className={`nav-button ${!isAnalyzerPage ? 'active' : ''}`}
                        >
                            <UploadIcon />
                        </button>
                    </Link>
                </li>
            </ul>

            {isAnalyzerPage && (
                <ul>
                    <li><hr className="nav-separator" /></li>
                    <li>
                        <button
                            className={activePanel === 'nodes' ? 'active' : ''}
                            onClick={() => togglePanel('nodes')}
                            title="Ajouter un nœud"
                        >
                            <NodesIcon />
                        </button>
                    </li>
                    <li>
                        <button
                            className={activePanel === 'config' ? 'active' : ''}
                            onClick={() => togglePanel('config')}
                            title="Configuration"
                        >
                            <ConfigIcon />
                        </button>
                    </li>
                    <li>
                        <button
                            className={activePanel === 'results' ? 'active' : ''}
                            onClick={() => togglePanel('results')}
                            title="Résultats"
                        >
                            <ResultsIcon />
                        </button>
                    </li>
                </ul>
            )}
        </nav>
    );
};