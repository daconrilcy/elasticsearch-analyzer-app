import { useState } from 'react';
import { DataGridVirtual } from './DataGridVirtual';
import styles from './DataGridVirtual.demo.module.scss';

export function DataGridVirtualDemo() {
  const [rowCount, setRowCount] = useState(20);
  const [colCount, setColCount] = useState(25);
  const [minWidth, setMinWidth] = useState(120);
  const [maxWidth, setMaxWidth] = useState(300);
  const [showScrollbarInfo, setShowScrollbarInfo] = useState(false);

  const generateDemoData = () => {
    const data = [];
    for (let i = 0; i < rowCount; i++) {
      const row: Record<string, any> = {};
      for (let j = 0; j < colCount; j++) {
        const colName = `col_${j + 1}`;
        if (j % 4 === 0) {
          row[colName] = `Texte très long pour la colonne ${j + 1} - Ligne ${i + 1}`;
        } else if (j % 4 === 1) {
          row[colName] = Math.floor(Math.random() * 10000);
        } else if (j % 4 === 2) {
          row[colName] = Math.random() > 0.5;
        } else {
          row[colName] = { 
            id: i * colCount + j, 
            value: `Objet complexe ${i}-${j}`,
            metadata: { timestamp: new Date().toISOString() }
          };
        }
      }
      data.push(row);
    }
    return data;
  };

  const demoData = generateDemoData();
  const totalWidth = colCount * Math.min(maxWidth, Math.max(minWidth, 150));
  const containerWidth = 800; // Largeur approximative du conteneur
  const needsHorizontalScroll = totalWidth > containerWidth;

  return (
    <div className={styles.demoContainer}>
      <div className={styles.controls}>
        <h2>Démonstration DataGridVirtual</h2>
        
        <div className={styles.controlGroup}>
          <label>
            Nombre de lignes:
            <input
              type="number"
              value={rowCount}
              onChange={(e) => setRowCount(Number(e.target.value))}
              min="5"
              max="100"
            />
          </label>
          
          <label>
            Nombre de colonnes:
            <input
              type="number"
              value={colCount}
              onChange={(e) => setColCount(Number(e.target.value))}
              min="5"
              max="50"
            />
          </label>
        </div>
        
        <div className={styles.controlGroup}>
          <label>
            Largeur min (px):
            <input
              type="number"
              value={minWidth}
              onChange={(e) => setMinWidth(Number(e.target.value))}
              min="80"
              max="200"
            />
          </label>
          
          <label>
            Largeur max (px):
            <input
              type="number"
              value={maxWidth}
              onChange={(e) => setMaxWidth(Number(e.target.value))}
              min="200"
              max="500"
            />
          </label>
        </div>

        <div className={styles.infoPanel}>
          <div className={styles.infoItem}>
            <strong>Largeur totale calculée:</strong> {totalWidth}px
          </div>
          <div className={styles.infoItem}>
            <strong>Largeur du conteneur:</strong> ~{containerWidth}px
          </div>
          <div className={styles.infoItem}>
            <strong>Défilement horizontal nécessaire:</strong> 
            <span className={needsHorizontalScroll ? styles.yes : styles.no}>
              {needsHorizontalScroll ? 'OUI' : 'NON'}
            </span>
          </div>
          <div className={styles.infoItem}>
            <strong>Nombre de colonnes:</strong> {colCount}
          </div>
        </div>

        <button 
          className={styles.toggleButton}
          onClick={() => setShowScrollbarInfo(!showScrollbarInfo)}
        >
          {showScrollbarInfo ? 'Masquer' : 'Afficher'} Info Scrollbar
        </button>

        {showScrollbarInfo && (
          <div className={styles.scrollbarInfo}>
            <h4>Diagnostic Scrollbar</h4>
            <ul>
              <li>✅ Défilement horizontal fonctionne avec les flèches du clavier</li>
              <li>✅ Défilement horizontal fonctionne avec la molette de la souris</li>
              <li>❓ Scrollbar horizontale visible: {needsHorizontalScroll ? 'Devrait être visible' : 'Pas nécessaire'}</li>
              <li>📏 Largeur totale: {totalWidth}px</li>
              <li>📐 Largeur conteneur: ~{containerWidth}px</li>
            </ul>
            <div className={styles.scrollbarTips}>
              <strong>Conseils pour tester:</strong>
              <ul>
                <li>Augmentez le nombre de colonnes pour forcer le défilement horizontal</li>
                <li>Utilisez les flèches du clavier pour naviguer horizontalement</li>
                <li>Vérifiez que la scrollbar apparaît en bas de la table</li>
                <li>Testez avec différentes tailles de colonnes</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      <div className={styles.gridContainer}>
        <DataGridVirtual
          rows={demoData}
          height={400}
          minColumnWidth={minWidth}
          maxColumnWidth={maxWidth}
        />
      </div>
    </div>
  );
}
