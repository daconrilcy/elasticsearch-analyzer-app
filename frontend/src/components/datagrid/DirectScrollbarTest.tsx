import styles from './DataGridVirtual.module.scss';

export function DirectScrollbarTest() {
  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Test Direct des Scrollbars CSS</h2>
      
      <div style={{ 
        marginBottom: '20px', 
        padding: '16px', 
        background: '#f0f9ff', 
        border: '1px solid #0ea5e9', 
        borderRadius: '8px' 
      }}>
        <h3>Test direct des styles CSS :</h3>
        <p>Ce composant teste directement les styles CSS des scrollbars sans passer par DataGridVirtual</p>
      </div>

      {/* Test 1: Conteneur avec défilement horizontal forcé */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '16px', 
        background: '#fef3c7', 
        border: '1px solid #f59e0b', 
        borderRadius: '8px' 
      }}>
        <h4>Test 1: Défilement Horizontal</h4>
        <div style={{ 
          width: '400px', 
          height: '100px', 
          overflow: 'auto',
          border: '2px solid #e5e7eb',
          borderRadius: '8px',
          background: '#f9fafb'
        }}>
          <div style={{ 
            width: '800px', 
            height: '100px', 
            background: 'linear-gradient(90deg, #3b82f6, #1d4ed8, #7c3aed, #dc2626, #ea580c, #16a34a)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold'
          }}>
            Contenu large (800px) dans conteneur étroit (400px) - Scrollbar horizontale attendue
          </div>
        </div>
      </div>

      {/* Test 2: Conteneur avec défilement vertical forcé */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '16px', 
        background: '#ecfdf5', 
        border: '1px solid #10b981', 
        borderRadius: '8px' 
      }}>
        <h4>Test 2: Défilement Vertical</h4>
        <div style={{ 
          width: '400px', 
          height: '100px', 
          overflow: 'auto',
          border: '2px solid #e5e7eb',
          borderRadius: '8px',
          background: '#f9fafb'
        }}>
          <div style={{ 
            width: '400px', 
            height: '300px', 
            background: 'linear-gradient(180deg, #3b82f6, #1d4ed8, #7c3aed, #dc2626, #ea580c, #16a34a)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            textAlign: 'center' as const
          }}>
            Contenu haut (300px) dans conteneur bas (100px)<br />
            Scrollbar verticale attendue
          </div>
        </div>
      </div>

      {/* Test 3: Conteneur avec défilement horizontal et vertical forcé */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '16px', 
        background: '#fef2f2', 
        border: '1px solid #ef4444', 
        borderRadius: '8px' 
      }}>
        <h4>Test 3: Défilement Horizontal ET Vertical</h4>
        <div style={{ 
          width: '300px', 
          height: '100px', 
          overflow: 'auto',
          border: '2px solid #e5e7eb',
          borderRadius: '8px',
          background: '#f9fafb'
        }}>
          <div style={{ 
            width: '600px', 
            height: '300px', 
            background: 'linear-gradient(45deg, #3b82f6, #1d4ed8, #7c3aed, #dc2626, #ea580c, #16a34a)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            textAlign: 'center' as const
          }}>
            Contenu large ET haut<br />
            Scrollbars horizontale ET verticale attendues
          </div>
        </div>
      </div>

      {/* Test 4: Conteneur avec styles CSS personnalisés */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '16px', 
        background: '#fdf4ff', 
        border: '1px solid #a855f7', 
        borderRadius: '8px' 
      }}>
        <h4>Test 4: Styles CSS Personnalisés</h4>
        <div 
          className={styles.tableWrapper}
          style={{ 
            width: '400px', 
            height: '100px', 
            border: '2px solid #e5e7eb',
            borderRadius: '8px',
            background: '#f9fafb'
          }}
        >
          <div style={{ 
            width: '800px', 
            height: '100px', 
            background: 'linear-gradient(90deg, #8b5cf6, #7c3aed, #6d28d9, #5b21b6, #4c1d95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold'
          }}>
            Contenu avec classe CSS {styles.tableWrapper} - Scrollbar stylisée attendue
          </div>
        </div>
      </div>

      <div style={{ 
        marginTop: '20px', 
        padding: '16px', 
        background: '#f8fafc', 
        border: '1px solid #64748b', 
        borderRadius: '8px' 
      }}>
        <h4>Résultats attendus :</h4>
        <ul>
          <li>✅ <strong>Test 1 :</strong> Scrollbar horizontale visible en bas</li>
          <li>✅ <strong>Test 2 :</strong> Scrollbar verticale visible à droite</li>
          <li>✅ <strong>Test 3 :</strong> Scrollbars horizontale ET verticale visibles</li>
          <li>✅ <strong>Test 4 :</strong> Scrollbar avec styles CSS personnalisés</li>
        </ul>
        
        <p style={{ marginTop: '16px', fontSize: '14px', color: '#64748b' }}>
          <strong>Note :</strong> Si ces tests affichent des scrollbars mais que DataGridVirtual ne les affiche pas, 
          le problème vient de la structure HTML ou des styles CSS du composant DataGridVirtual.
        </p>
      </div>
    </div>
  );
}

