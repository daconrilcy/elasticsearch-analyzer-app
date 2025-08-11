import { DataGridVirtual } from './DataGridVirtual';
import styles from './DataGridVirtual.module.scss';

export function ForceScrollbarTest() {
  // Données de test avec 6 colonnes pour un test simple
  const testData = [
    {
      col1: 'Colonne 1 - Contenu très long pour forcer le défilement horizontal et vérifier la visibilité de la scrollbar',
      col2: 'Colonne 2 - Contenu très long pour forcer le défilement horizontal et vérifier la visibilité de la scrollbar',
      col3: 'Colonne 3 - Contenu très long pour forcer le défilement horizontal et vérifier la visibilité de la scrollbar',
      col4: 'Colonne 4 - Contenu très long pour forcer le défilement horizontal et vérifier la visibilité de la scrollbar',
      col5: 'Colonne 5 - Contenu très long pour forcer le défilement horizontal et vérifier la visibilité de la scrollbar',
      col6: 'Colonne 6 - Contenu très long pour forcer le défilement horizontal et vérifier la visibilité de la scrollbar'
    },
    {
      col1: 'Ligne 2 - Colonne 1',
      col2: 'Ligne 2 - Colonne 2',
      col3: 'Ligne 2 - Colonne 3',
      col4: 'Ligne 2 - Colonne 4',
      col5: 'Ligne 2 - Colonne 5',
      col6: 'Ligne 2 - Colonne 6'
    },
    {
      col1: 'Ligne 3 - Colonne 1',
      col2: 'Ligne 3 - Colonne 2',
      col3: 'Ligne 3 - Colonne 3',
      col4: 'Ligne 3 - Colonne 4',
      col5: 'Ligne 3 - Colonne 5',
      col6: 'Ligne 3 - Colonne 6'
    },
    {
      col1: 'Ligne 4 - Colonne 1',
      col2: 'Ligne 4 - Colonne 2',
      col3: 'Ligne 4 - Colonne 3',
      col4: 'Ligne 4 - Colonne 4',
      col5: 'Ligne 4 - Colonne 5',
      col6: 'Ligne 4 - Colonne 6'
    },
    {
      col1: 'Ligne 5 - Colonne 1',
      col2: 'Ligne 5 - Colonne 2',
      col3: 'Ligne 5 - Colonne 3',
      col4: 'Ligne 5 - Colonne 4',
      col5: 'Ligne 5 - Colonne 5',
      col6: 'Ligne 5 - Colonne 6'
    }
  ];

  // Styles CSS inline pour forcer l'affichage des scrollbars
  const forceScrollbarStyles = {
    tableContainer: {
      height: '200px',
      overflow: 'hidden',
      border: '3px solid #e5e7eb',
      borderRadius: '8px',
      position: 'relative' as const
    },
    tableWrapper: {
      height: '100%',
      width: '100%',
      overflowX: 'auto' as const,
      overflowY: 'auto' as const,
      // Styles explicites pour forcer l'affichage des scrollbars
      scrollbarWidth: 'thin' as const,
      scrollbarColor: '#64748b #f1f5f9' as const
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
      <h2>Test Force Scrollbar</h2>
      
      <div style={{ 
        marginBottom: '20px', 
        padding: '16px', 
        background: '#f0f9ff', 
        border: '1px solid #0ea5e9', 
        borderRadius: '8px' 
      }}>
        <h3>Test avec styles forcés :</h3>
        <ul>
          <li><strong>6 colonnes</strong> avec contenu long</li>
          <li><strong>5 lignes</strong> de données</li>
          <li>Conteneur de <strong>400px</strong> de large</li>
          <li>Hauteur fixe de <strong>200px</strong></li>
          <li>Styles CSS explicites pour scrollbars</li>
        </ul>
      </div>

      <div style={forceScrollbarStyles.tableContainer}>
        <div style={forceScrollbarStyles.tableWrapper}>
          <DataGridVirtual
            rows={testData}
            height={200}
            minColumnWidth={200}
            maxColumnWidth={250}
          />
        </div>
      </div>

      <div style={{ 
        marginTop: '20px', 
        padding: '16px', 
        background: '#fef3c7', 
        border: '1px solid #f59e0b', 
        borderRadius: '8px' 
      }}>
        <h4>Configuration :</h4>
        <ul>
          <li>📏 <strong>Largeur totale :</strong> ~1350px (6 colonnes × 225px moyenne)</li>
          <li>📐 <strong>Largeur conteneur :</strong> 400px</li>
          <li>📊 <strong>Défilement horizontal :</strong> OUI (1350px &gt; 400px)</li>
          <li>📊 <strong>Défilement vertical :</strong> OUI (5 lignes dans 200px)</li>
        </ul>
      </div>

      <div style={{ 
        marginTop: '20px', 
        padding: '16px', 
        background: '#ecfdf5', 
        border: '1px solid #10b981', 
        borderRadius: '8px' 
      }}>
        <h4>Styles appliqués :</h4>
        <ul>
          <li>✅ <code>overflow-x: auto</code> pour défilement horizontal</li>
          <li>✅ <code>overflow-y: auto</code> pour défilement vertical</li>
          <li>✅ <code>scrollbar-width: thin</code> pour Firefox</li>
          <li>✅ <code>scrollbar-color</code> pour Firefox</li>
          <li>✅ Classes CSS <code>{styles.tableWrapper}</code> appliquées</li>
        </ul>
      </div>

      <div style={{ 
        marginTop: '20px', 
        padding: '16px', 
        background: '#fef2f2', 
        border: '1px solid #ef4444', 
        borderRadius: '8px' 
      }}>
        <h4>Vérifications critiques :</h4>
        <ol>
          <li>🔍 Scrollbar horizontale visible en bas ?</li>
          <li>🔍 Scrollbar verticale visible à droite ?</li>
          <li>🔍 Défilement horizontal fonctionne ?</li>
          <li>🔍 Défilement vertical fonctionne ?</li>
          <li>🔍 Les scrollbars sont-elles stylisées ?</li>
        </ol>
      </div>
    </div>
  );
}

