import { DataGridVirtual } from './DataGridVirtual';

export function DataGridVirtualTest() {
  // Données de test avec beaucoup de colonnes pour forcer le défilement horizontal
  const testData = [
    {
      id: 1,
      name: 'Test 1',
      description: 'Description très longue pour tester le défilement horizontal et vérifier que la scrollbar est visible',
      category: 'Category A',
      status: 'Active',
      priority: 'High',
      assignedTo: 'John Doe',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-02',
      tags: 'tag1,tag2,tag3',
      notes: 'Notes très longues pour tester le défilement horizontal et vérifier que la scrollbar est visible',
      location: 'Paris, France',
      department: 'Engineering',
      manager: 'Jane Smith',
      budget: 50000,
      progress: 75,
      deadline: '2024-12-31',
      risk: 'Low',
      impact: 'High',
      effort: 'Medium',
      complexity: 'High',
      dependencies: 'None',
      stakeholders: 'Multiple',
      requirements: 'Complex requirements for testing horizontal scrollbar visibility',
      constraints: 'Time and budget constraints',
      assumptions: 'Team availability and resource allocation',
      success: 'Project completion and stakeholder satisfaction',
      metrics: 'Performance, quality, and delivery metrics'
    },
    {
      id: 2,
      name: 'Test 2',
      description: 'Another very long description to ensure horizontal scrolling is necessary and scrollbar is visible',
      category: 'Category B',
      status: 'Pending',
      priority: 'Medium',
      assignedTo: 'Jane Smith',
      createdAt: '2024-01-03',
      updatedAt: '2024-01-04',
      tags: 'tag4,tag5,tag6',
      notes: 'Additional very long notes to test horizontal scrolling and scrollbar visibility',
      location: 'London, UK',
      department: 'Marketing',
      manager: 'Bob Johnson',
      budget: 75000,
      progress: 25,
      deadline: '2024-11-30',
      risk: 'Medium',
      impact: 'Medium',
      effort: 'High',
      complexity: 'Medium',
      dependencies: 'External vendors',
      stakeholders: 'Marketing team',
      requirements: 'Marketing campaign requirements for testing scrollbar visibility',
      constraints: 'Brand guidelines and timeline',
      assumptions: 'Market conditions and customer response',
      success: 'Campaign performance and ROI',
      metrics: 'Engagement, conversion, and brand awareness metrics'
    }
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2>Test Scrollbar DataGridVirtual</h2>
      
      <div style={{ 
        marginBottom: '20px', 
        padding: '16px', 
        background: '#f0f9ff', 
        border: '1px solid #0ea5e9', 
        borderRadius: '8px' 
      }}>
        <h3>Instructions de test :</h3>
        <ul>
          <li>Cette table a 25 colonnes avec du contenu long</li>
          <li>La largeur totale dépasse celle du conteneur (1200px)</li>
          <li>Une scrollbar horizontale devrait être visible en bas</li>
          <li>Une scrollbar verticale devrait être visible à droite</li>
          <li>Utilisez les flèches du clavier ou la molette de la souris pour défiler</li>
        </ul>
      </div>

      <div style={{ 
        border: '2px solid #e5e7eb', 
        borderRadius: '8px', 
        overflow: 'hidden',
        height: '400px' // Hauteur fixe pour forcer le défilement vertical
      }}>
        <DataGridVirtual
          rows={testData}
          height={400}
          minColumnWidth={120}
          maxColumnWidth={300}
        />
      </div>

      <div style={{ 
        marginTop: '20px', 
        padding: '16px', 
        background: '#fef3c7', 
        border: '1px solid #f59e0b', 
        borderRadius: '8px' 
      }}>
        <h4>Diagnostic :</h4>
        <p><strong>Largeur totale estimée :</strong> ~6000px (25 colonnes × 240px moyenne)</p>
        <p><strong>Largeur du conteneur :</strong> 1200px</p>
        <p><strong>Hauteur du conteneur :</strong> 400px</p>
        <p><strong>Défilement horizontal nécessaire :</strong> OUI</p>
        <p><strong>Défilement vertical nécessaire :</strong> OUI (2 lignes dans 400px)</p>
        <p><strong>Scrollbars visibles :</strong> Devraient être visibles en bas et à droite</p>
      </div>

      <div style={{ 
        marginTop: '20px', 
        padding: '16px', 
        background: '#ecfdf5', 
        border: '1px solid #10b981', 
        borderRadius: '8px' 
      }}>
        <h4>Conseils de test :</h4>
        <ul>
          <li>Vérifiez que la scrollbar horizontale apparaît en bas de la table</li>
          <li>Vérifiez que la scrollbar verticale apparaît à droite de la table</li>
          <li>Testez le défilement avec les flèches du clavier</li>
          <li>Testez le défilement avec la molette de la souris</li>
          <li>Testez le défilement en faisant glisser les scrollbars</li>
          <li>Vérifiez que les colonnes conservent leur largeur lors du défilement</li>
        </ul>
      </div>
    </div>
  );
}
