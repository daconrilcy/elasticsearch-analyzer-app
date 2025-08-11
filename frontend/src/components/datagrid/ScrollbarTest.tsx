import { DataGridVirtual } from './DataGridVirtual';

export function ScrollbarTest() {
  // Données de test avec beaucoup de colonnes
  const testData = [
    {
      col1: 'Colonne 1 - Contenu très long pour tester le défilement horizontal',
      col2: 'Colonne 2 - Contenu très long pour tester le défilement horizontal',
      col3: 'Colonne 3 - Contenu très long pour tester le défilement horizontal',
      col4: 'Colonne 4 - Contenu très long pour tester le défilement horizontal',
      col5: 'Colonne 5 - Contenu très long pour tester le défilement horizontal',
      col6: 'Colonne 6 - Contenu très long pour tester le défilement horizontal',
      col7: 'Colonne 7 - Contenu très long pour tester le défilement horizontal',
      col8: 'Colonne 8 - Contenu très long pour tester le défilement horizontal',
      col9: 'Colonne 9 - Contenu très long pour tester le défilement horizontal',
      col10: 'Colonne 10 - Contenu très long pour tester le défilement horizontal',
      col11: 'Colonne 11 - Contenu très long pour tester le défilement horizontal',
      col12: 'Colonne 12 - Contenu très long pour tester le défilement horizontal',
      col13: 'Colonne 13 - Contenu très long pour tester le défilement horizontal',
      col14: 'Colonne 14 - Contenu très long pour tester le défilement horizontal',
      col15: 'Colonne 15 - Contenu très long pour tester le défilement horizontal',
      col16: 'Colonne 16 - Contenu très long pour tester le défilement horizontal',
      col17: 'Colonne 17 - Contenu très long pour tester le défilement horizontal',
      col18: 'Colonne 18 - Contenu très long pour tester le défilement horizontal',
      col19: 'Colonne 19 - Contenu très long pour tester le défilement horizontal',
      col20: 'Colonne 20 - Contenu très long pour tester le défilement horizontal',
      col21: 'Colonne 21 - Contenu très long pour tester le défilement horizontal',
      col22: 'Colonne 22 - Contenu très long pour tester le défilement horizontal',
      col23: 'Colonne 23 - Contenu très long pour tester le défilement horizontal',
      col24: 'Colonne 24 - Contenu très long pour tester le défilement horizontal',
      col25: 'Colonne 25 - Contenu très long pour tester le défilement horizontal'
    },
    {
      col1: 'Ligne 2 - Colonne 1',
      col2: 'Ligne 2 - Colonne 2',
      col3: 'Ligne 2 - Colonne 3',
      col4: 'Ligne 2 - Colonne 4',
      col5: 'Ligne 2 - Colonne 5',
      col6: 'Ligne 2 - Colonne 6',
      col7: 'Ligne 2 - Colonne 7',
      col8: 'Ligne 2 - Colonne 8',
      col9: 'Ligne 2 - Colonne 9',
      col10: 'Ligne 2 - Colonne 10',
      col11: 'Ligne 2 - Colonne 11',
      col12: 'Ligne 2 - Colonne 12',
      col13: 'Ligne 2 - Colonne 13',
      col14: 'Ligne 2 - Colonne 14',
      col15: 'Ligne 2 - Colonne 15',
      col16: 'Ligne 2 - Colonne 16',
      col17: 'Ligne 2 - Colonne 17',
      col18: 'Ligne 2 - Colonne 18',
      col19: 'Ligne 2 - Colonne 19',
      col20: 'Ligne 2 - Colonne 20',
      col21: 'Ligne 2 - Colonne 21',
      col22: 'Ligne 2 - Colonne 22',
      col23: 'Ligne 2 - Colonne 23',
      col24: 'Ligne 2 - Colonne 24',
      col25: 'Ligne 2 - Colonne 25'
    },
    {
      col1: 'Ligne 3 - Colonne 1',
      col2: 'Ligne 3 - Colonne 2',
      col3: 'Ligne 3 - Colonne 3',
      col4: 'Ligne 3 - Colonne 4',
      col5: 'Ligne 3 - Colonne 5',
      col6: 'Ligne 3 - Colonne 6',
      col7: 'Ligne 3 - Colonne 7',
      col8: 'Ligne 3 - Colonne 8',
      col9: 'Ligne 3 - Colonne 9',
      col10: 'Ligne 3 - Colonne 10',
      col11: 'Ligne 3 - Colonne 11',
      col12: 'Ligne 3 - Colonne 12',
      col13: 'Ligne 3 - Colonne 13',
      col14: 'Ligne 3 - Colonne 14',
      col15: 'Ligne 3 - Colonne 15',
      col16: 'Ligne 3 - Colonne 16',
      col17: 'Ligne 3 - Colonne 17',
      col18: 'Ligne 3 - Colonne 18',
      col19: 'Ligne 3 - Colonne 19',
      col20: 'Ligne 3 - Colonne 20',
      col21: 'Ligne 3 - Colonne 21',
      col22: 'Ligne 3 - Colonne 22',
      col23: 'Ligne 3 - Colonne 23',
      col24: 'Ligne 3 - Colonne 24',
      col25: 'Ligne 3 - Colonne 25'
    }
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Test Scrollbar - Version Simplifiée</h2>
      
      <div style={{ 
        marginBottom: '20px', 
        padding: '16px', 
        background: '#f0f9ff', 
        border: '1px solid #0ea5e9', 
        borderRadius: '8px' 
      }}>
        <h3>Test des Scrollbars</h3>
        <p><strong>25 colonnes</strong> × <strong>3 lignes</strong> dans un conteneur de <strong>800px</strong></p>
        <p>Les scrollbars devraient être visibles !</p>
      </div>

      <div style={{ 
        border: '3px solid #e5e7eb', 
        borderRadius: '8px', 
        overflow: 'hidden',
        height: '300px' // Hauteur fixe pour forcer le défilement vertical
      }}>
        <DataGridVirtual
          rows={testData}
          height={300}
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
        <h4>Vérifications :</h4>
        <ul>
          <li>✅ Scrollbar horizontale visible en bas ?</li>
          <li>✅ Scrollbar verticale visible à droite ?</li>
          <li>✅ Défilement horizontal fonctionne ?</li>
          <li>✅ Défilement vertical fonctionne ?</li>
        </ul>
      </div>
    </div>
  );
}

