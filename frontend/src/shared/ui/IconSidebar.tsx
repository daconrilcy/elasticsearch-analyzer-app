import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUIStore } from '@shared/lib';
import styles from './IconSidebar.module.scss';

// --- Icônes ---
const AnalyzerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const DatasetIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7c0 1.7 4 3 9 3s9-1.3 9-3" />
    <path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3" />
    <path d="M3 17c0 1.7 4 3 9 3s9-1.3 9-3V7" />
    <ellipse cx="12" cy="7" rx="9" ry="3" />
  </svg>
);
const PreviewIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const MappingIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <path d="M10 7h4M7 10v4M17 10v4M10 17h4" />
  </svg>
);
const DemoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

const NodesIcon   = () => <svg viewBox="0 0 24 24"><path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm-5 14H4v-4h11v4zm0-5H4V9h11v4zm5 5h-4V9h4v10z"/></svg>;
const ConfigIcon  = () => <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>;
const ResultsIcon = () => <svg viewBox="0 0 24 24"><path d="M21 3.01H3a2 2 0 0 0-2 2V9h2V4.99h18v14.03H3V15H1v4.01A2 2 0 0 0 3 21h18a2 2 0 0 0 2-1.98v-14a2 2 0 0 0-2-2zM11 16l4-4-4-4v3H1v2h10v3z"/></svg>;

export const IconSidebar: React.FC = () => {
  // Conserve les panneaux (nodes/config/results) pour la page Analyzer
  const { activePanel, togglePanel } = useUIStore();
  const location = useLocation();
  const pathname = location.pathname;

  const isAnalyzer   = pathname.startsWith('/analyzer');
  const isDatasets   = pathname.startsWith('/datasets');
  const isPreview    = pathname === '/preview';
  const isWorkbench  = pathname.startsWith('/mappings/workbench');
  const isDemo       = pathname.startsWith('/demo');

  return (
    <nav className={styles.iconSidebar}>
      <ul>
        <li>
          <Link to="/analyzer" title="Éditeur d'analyseur" aria-label="Éditeur d'analyseur">
            <button className={`${styles.navButton} ${isAnalyzer ? styles.active : ''}`}>
              <AnalyzerIcon />
            </button>
          </Link>
        </li>

        <li>
          <Link to="/datasets" title="Datasets" aria-label="Datasets">
            <button className={`${styles.navButton} ${isDatasets ? styles.active : ''}`}>
              <DatasetIcon />
            </button>
          </Link>
        </li>

        <li>
          <Link to="/preview" title="Prévisualisation de fichiers" aria-label="Prévisualisation">
            <button className={`${styles.navButton} ${isPreview ? styles.active : ''}`}>
              <PreviewIcon />
            </button>
          </Link>
        </li>

        <li>
          {/* Bouton “Mapping” -> version de travail */}
          <Link to="/mappings/workbench" title="Workbench Mapping" aria-label="Workbench Mapping">
            <button className={`${styles.navButton} ${isWorkbench ? styles.active : ''}`}>
              <MappingIcon />
            </button>
          </Link>
        </li>

        {/* Menu Démonstrations avec sous-menu */}
        <li className={styles.hasSubmenu}>
          <button
            className={`${styles.navButton} ${isDemo ? styles.active : ''}`}
            title="Démonstrations"
            aria-haspopup="true"
            aria-expanded={isDemo ? 'true' : 'false'}
          >
            <DemoIcon />
          </button>

          <ul className={styles.submenu}>
            <li>
              <Link to="/demo/studio" title="Studio V2.2">
                <button className={styles.submenuItem}>Studio V2.2</button>
              </Link>
            </li>
            <li>
              <Link to="/demo/workbench" title="Workbench V2 – Démo">
                <button className={styles.submenuItem}>Workbench Demo</button>
              </Link>
            </li>
            <li>
              <Link to="/demo/micro-iterations" title="Micro-iterations">
                <button className={styles.submenuItem}>Micro-iterations</button>
              </Link>
            </li>
            <li>
              <Link to="/demo/unified-diff" title="UnifiedDiffView – Comparaison Unifiée">
                <button className={styles.submenuItem}>🔍 Diff Unifié</button>
              </Link>
            </li>
          </ul>
        </li>
      </ul>

      {/* Panneaux contextuels pour l'Analyzer */}
      {isAnalyzer && (
        <ul>
          <li><hr className={styles.navSeparator} /></li>
          <li>
            <button
              className={`${styles.navButton} ${activePanel === 'nodes' ? styles.active : ''}`}
              onClick={() => togglePanel('nodes')}
              title="Ajouter un nœud"
            >
              <NodesIcon />
            </button>
          </li>
          <li>
            <button
              className={`${styles.navButton} ${activePanel === 'config' ? styles.active : ''}`}
              onClick={() => togglePanel('config')}
              title="Configuration"
            >
              <ConfigIcon />
            </button>
          </li>
          <li>
            <button
              className={`${styles.navButton} ${activePanel === 'results' ? styles.active : ''}`}
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
