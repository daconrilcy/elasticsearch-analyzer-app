import { DataGridVirtual } from './DataGridVirtual';

export function SimpleScrollbarTest() {
  // Données de test avec exactement 10 colonnes pour un test simple
  const testData = [
    {
      id: '1',
      name: 'Nom très long pour tester le défilement horizontal et vérifier la visibilité de la scrollbar',
      email: 'email.tres.long@example.com',
      phone: '+33 1 23 45 67 89',
      address: 'Adresse très longue pour tester le défilement horizontal et vérifier la visibilité de la scrollbar',
      city: 'Ville très longue pour tester le défilement horizontal',
      country: 'Pays très long pour tester le défilement horizontal',
      department: 'Département très long pour tester le défilement horizontal',
      position: 'Position très longue pour tester le défilement horizontal',
      salary: 'Salaire très long pour tester le défilement horizontal',
      notes: 'Notes très longues pour tester le défilement horizontal et vérifier la visibilité de la scrollbar'
    },
    {
      id: '2',
      name: 'Autre nom très long',
      email: 'autre.email@example.com',
      phone: '+33 9 87 65 43 21',
      address: 'Autre adresse très longue',
      city: 'Autre ville très longue',
      country: 'Autre pays très long',
      department: 'Autre département très long',
      position: 'Autre position très longue',
      salary: 'Autre salaire très long',
      notes: 'Autres notes très longues'
    },
    {
      id: '3',
      name: 'Troisième nom très long',
      email: 'troisieme@example.com',
      phone: '+33 5 55 55 55 55',
      address: 'Troisième adresse très longue',
      city: 'Troisième ville très longue',
      country: 'Troisième pays très long',
      department: 'Troisième département très long',
      position: 'Troisième position très longue',
      salary: 'Troisième salaire très long',
      notes: 'Troisièmes notes très longues'
    }
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Test Scrollbar Simple</h2>
      
      <div style={{ 
        marginBottom: '20px', 
        padding: '16px', 
        background: '#f0f9ff', 
        border: '1px solid #0ea5e9', 
        borderRadius: '8px' 
      }}>
        <h3>Configuration de test :</h3>
        <ul>
          <li><strong>10 colonnes</strong> avec du contenu long</li>
          <li><strong>3 lignes</strong> de données</li>
          <li>Conteneur de <strong>600px</strong> de large</li>
          <li>Hauteur fixe de <strong>200px</strong></li>
          <li>Largeur minimale des colonnes : <strong>120px</strong></li>
        </ul>
      </div>

      <div style={{ 
        border: '3px solid #e5e7eb', 
        borderRadius: '8px', 
        overflow: 'hidden',
        height: '200px' // Hauteur fixe pour forcer le défilement vertical
      }}>
        <DataGridVirtual
          rows={testData}
          height={200}
          minColumnWidth={120}
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
        <h4>Résultats attendus :</h4>
        <ul>
          <li>📏 <strong>Largeur totale estimée :</strong> ~1600px (10 colonnes × 160px moyenne)</li>
          <li>📐 <strong>Largeur conteneur :</strong> 600px</li>
          <li>📊 <strong>Défilement horizontal :</strong> OUI (1600px &gt; 600px)</li>
          <li>📊 <strong>Défilement vertical :</strong> OUI (3 lignes dans 200px)</li>
          <li>🎯 <strong>Scrollbars visibles :</strong> Devraient être visibles !</li>
        </ul>
      </div>

      <div style={{ 
        marginTop: '20px', 
        padding: '16px', 
        background: '#ecfdf5', 
        border: '1px solid #10b981', 
        borderRadius: '8px' 
      }}>
        <h4>Actions de test :</h4>
        <ol>
          <li>Vérifiez que la scrollbar horizontale est visible en bas</li>
          <li>Vérifiez que la scrollbar verticale est visible à droite</li>
          <li>Testez le défilement horizontal avec la molette de la souris</li>
          <li>Testez le défilement vertical avec la molette de la souris</li>
          <li>Testez le défilement avec les flèches du clavier</li>
        </ol>
      </div>
    </div>
  );
}
