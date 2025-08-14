import React, { useState } from 'react';
import { MappingStudioV2Demo, MappingWorkbenchV2Demo } from '../components';
import { MAPPING_STUDIO_CONFIG } from '../config';
import './App.module.scss';

export const App: React.FC = () => {
  const [activeDemo, setActiveDemo] = useState<'studio' | 'workbench'>('studio');

  // Vérifier la configuration
  console.log('Mapping Studio V2.2 Configuration:', MAPPING_STUDIO_CONFIG);
  
  // Vérifier les variables d'environnement
  console.log('Environment:', {
    VITE_API_BASE: import.meta.env.VITE_API_BASE,
    DEV: import.meta.env.DEV,
    PROD: import.meta.env.PROD,
  });

  return (
    <div className="mapping-studio-demo">
      {/* Sélecteur de démonstration */}
      <div className="demo-selector">
        <button
          className={`demo-button ${activeDemo === 'studio' ? 'active' : ''}`}
          onClick={() => setActiveDemo('studio')}
        >
          🎨 Studio V2.2
        </button>
        <button
          className={`demo-button ${activeDemo === 'workbench' ? 'active' : ''}`}
          onClick={() => setActiveDemo('workbench')}
        >
          🔧 Workbench V2.2
        </button>
      </div>

      {/* Contenu de la démonstration */}
      {activeDemo === 'studio' && <MappingStudioV2Demo />}
      {activeDemo === 'workbench' && <MappingWorkbenchV2Demo />}
      
      {/* Informations de debug en mode développement */}
      {import.meta.env.DEV && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          fontSize: '12px',
          fontFamily: 'monospace',
          zIndex: 10000,
        }}>
          <div>🚀 Mapping Studio V2.2</div>
          <div>Mode: Développement</div>
          <div>API: {import.meta.env.VITE_API_BASE || 'Non configuré'}</div>
          <div>Version: {MAPPING_STUDIO_CONFIG.ui.version || '2.2'}</div>
          <div>Demo: {activeDemo === 'studio' ? 'Studio' : 'Workbench'}</div>
        </div>
      )}
    </div>
  );
};

export default App;
