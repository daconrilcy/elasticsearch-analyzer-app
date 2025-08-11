import { DataGridVirtual } from './DataGridVirtual';

export function BasicScrollbarTest() {
  // Données de test avec 8 colonnes pour un test simple
  const testData = [
    {
      col1: 'Colonne 1 - Contenu très long pour forcer le défilement horizontal',
      col2: 'Colonne 2 - Contenu très long pour forcer le défilement horizontal',
      col3: 'Colonne 3 - Contenu très long pour forcer le défilement horizontal',
      col4: 'Colonne 4 - Contenu très long pour forcer le défilement horizontal',
      col5: 'Colonne 5 - Contenu très long pour forcer le défilement horizontal',
      col6: 'Colonne 6 - Contenu très long pour forcer le défilement horizontal',
      col7: 'Colonne 7 - Contenu très long pour forcer le défilement horizontal',
      col8: 'Colonne 8 - Contenu très long pour forcer le défilement horizontal'
    },
    {
      col1: 'Ligne 2 - Colonne 1',
      col2: 'Ligne 2 - Colonne 2',
      col3: 'Ligne 2 - Colonne 3',
      col4: 'Ligne 2 - Colonne 4',
      col5: 'Ligne 2 - Colonne 5',
      col6: 'Ligne 2 - Colonne 6',
      col7: 'Ligne 2 - Colonne 7',
      col8: 'Ligne 2 - Colonne 8'
    },
    {
      col1: 'Ligne 3 - Colonne 1',
      col2: 'Ligne 3 - Colonne 2',
      col3: 'Ligne 3 - Colonne 3',
      col4: 'Ligne 3 - Colonne 4',
      col5: 'Ligne 3 - Colonne 5',
      col6: 'Ligne 3 - Colonne 6',
      col7: 'Ligne 3 - Colonne 7',
      col8: 'Ligne 3 - Colonne 8'
    },
    {
      col1: 'Ligne 4 - Colonne 1',
      col2: 'Ligne 4 - Colonne 2',
      col3: 'Ligne 4 - Colonne 3',
      col4: 'Ligne 4 - Colonne 4',
      col5: 'Ligne 4 - Colonne 5',
      col6: 'Ligne 4 - Colonne 6',
      col7: 'Ligne 4 - Colonne 7',
      col8: 'Ligne 4 - Colonne 8'
    }
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <h2>Test Scrollbar Basique</h2>
      
      <div style={{ 
        marginBottom: '20px', 
        padding: '16px', 
        background: '#f0f9ff', 
        border: '1px solid #0ea5e9', 
        borderRadius: '8px' 
      }}>
        <h3>Test minimal :</h3>
        <ul>
          <li><strong>8 colonnes</strong> avec contenu long</li>
          <li><strong>4 lignes</strong> de données</li>
          <li>Conteneur de <strong>500px</strong> de large</li>
          <li>Hauteur fixe de <strong>150px</strong></li>
        </ul>
      </div>

      <div style={{ 
        border: '3px solid #e5e7eb', 
        borderRadius: '8px', 
        overflow: 'hidden',
        height: '150px'
      }}>
        <DataGridVirtual
          rows={testData}
          height={150}
          minColumnWidth={150}
          maxColumnWidth={200}
        />
      </div>

      <div style={{ 
        marginTop: '20px', 
        padding: '16px', 
        background: '#fef3c7', 
        border: '1px solid #f59e0b', 
        borderRadius: '8px' 
      }}>
        <h4>Calculs :</h4>
        <ul>
          <li>📏 <strong>Largeur totale :</strong> ~1400px (8 colonnes × 175px moyenne)</li>
          <li>📐 <strong>Largeur conteneur :</strong> 500px</li>
          <li>📊 <strong>Défilement horizontal :</strong> OUI (1400px &gt; 500px)</li>
          <li>📊 <strong>Défilement vertical :</strong> OUI (4 lignes dans 150px)</li>
        </ul>
      </div>

      <div style={{ 
        marginTop: '20px', 
        padding: '16px', 
        background: '#ecfdf5', 
        border: '1px solid #10b981', 
        borderRadius: '8px' 
      }}>
        <h4>Vérifications :</h4>
        <ol>
          <li>Scrollbar horizontale visible en bas ?</li>
          <li>Scrollbar verticale visible à droite ?</li>
          <li>Défilement horizontal fonctionne ?</li>
          <li>Défilement vertical fonctionne ?</li>
        </ol>
      </div>
    </div>
  );
}

