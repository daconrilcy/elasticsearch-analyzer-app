import './IconSidebar.scss';

// Icônes SVG simples pour l'exemple
const InputIcon = () => <svg viewBox="0 0 24 24"><path d="M21 3.01H3c-1.1 0-2 .9-2 2V9h2V4.99h18v14.03H3V15H1v4.01c0 1.1.9 1.98 2 1.98h18c1.1 0 2-.88 2-1.98v-14c0-1.11-.9-2-2-2zM11 16l4-4-4-4v3H1v2h10v3z"/></svg>;
const CharFilterIcon = () => <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>;
const TokenizerIcon = () => <svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 14H4v-4h11v4zm0-5H4V9h11v4zm5 5h-4V9h4v10z"/></svg>;

// Le composant accepte un `activePanel` et une fonction pour le changer
interface IconSidebarProps {
  activePanel: string;
  setActivePanel: (panel: string) => void;
}

export function IconSidebar({ activePanel, setActivePanel }: IconSidebarProps) {
  const togglePanel = (panelName: string) => {
    setActivePanel(activePanel === panelName ? '' : panelName);
  };

  return (
    <nav className="icon-sidebar">
      <ul>
        <li>
          <button 
            className={activePanel === 'nodes' ? 'active' : ''}
            onClick={() => togglePanel('nodes')}
            title="Ajouter un nœud"
          >
            <TokenizerIcon />
          </button>
        </li>
        <li>
          <button 
             className={activePanel === 'config' ? 'active' : ''}
             onClick={() => togglePanel('config')}
             title="Configuration"
          >
            <CharFilterIcon />
          </button>
        </li>
         <li>
          <button 
             className={activePanel === 'results' ? 'active' : ''}
             onClick={() => togglePanel('results')}
             title="Résultats"
          >
            <InputIcon />
          </button>
        </li>
      </ul>
    </nav>
  );
}