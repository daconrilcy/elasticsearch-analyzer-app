import React, { useState } from 'react';
import { UnifiedDiffView } from '../components/studio/UnifiedDiffView';
import styles from './UnifiedDiffViewDemo.module.scss';

/**
 * Composant de démonstration d'UnifiedDiffView
 * Montre les deux modes (simple et avancé) avec des exemples
 */
export const UnifiedDiffViewDemo: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'simple' | 'advanced'>('advanced');
  const [showUnchanged, setShowUnchanged] = useState(false);
  const [showInline, setShowInline] = useState(false);

  // Données de test pour la démonstration
  const testMapping1 = {
    name: 'Mapping Test 1',
    version: '2.1',
    fields: {
      user: {
        type: 'object',
        properties: {
          name: { type: 'keyword' },
          email: { type: 'email' },
          age: { type: 'integer' }
        }
      },
      timestamp: { type: 'date' },
      tags: { type: 'keyword' }
    }
  };

  const testMapping2 = {
    name: 'Mapping Test 2',
    version: '2.2',
    fields: {
      user: {
        type: 'object',
        properties: {
          name: { type: 'keyword' },
          email: { type: 'email' },
          age: { type: 'integer' },
          phone: { type: 'phone' }
        }
      },
      timestamp: { type: 'date' },
      tags: { type: 'keyword' },
      location: { type: 'geo_point' }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>🔍 Démonstration UnifiedDiffView</h1>
        <p>Composant unifié qui combine les fonctionnalités de DiffView et RichDiffView</p>
      </div>

      <div className={styles.controls}>
        <div className={styles.modeSelector}>
          <h3>🎛️ Sélection du Mode</h3>
          <div className={styles.modeButtons}>
            <button
              className={`${styles.modeButton} ${activeMode === 'simple' ? styles.active : ''}`}
              onClick={() => setActiveMode('simple')}
            >
              📊 Mode Simple
            </button>
            <button
              className={`${styles.modeButton} ${activeMode === 'advanced' ? styles.active : ''}`}
              onClick={() => setActiveMode('advanced')}
            >
              🚀 Mode Avancé
            </button>
          </div>
          <p className={styles.modeDescription}>
            {activeMode === 'simple' 
              ? 'Comparaison basique native React - Rapide et léger'
              : 'Diff riche avec jsondiffpatch - Fonctionnalités avancées'
            }
          </p>
        </div>

        {activeMode === 'advanced' && (
          <div className={styles.advancedControls}>
            <h3>⚙️ Contrôles Avancés</h3>
            <div className={styles.controlGroup}>
              <label className={styles.control}>
                <input
                  type="checkbox"
                  checked={showInline}
                  onChange={(e) => setShowInline(e.target.checked)}
                />
                Affichage inline
              </label>
              <label className={styles.control}>
                <input
                  type="checkbox"
                  checked={showUnchanged}
                  onChange={(e) => setShowUnchanged(e.target.checked)}
                />
                Afficher les champs inchangés
              </label>
            </div>
          </div>
        )}
      </div>

      <div className={styles.mappingInfo}>
        <div className={styles.mappingCard}>
          <h3>📋 Mapping 1 (Original)</h3>
          <div className={styles.mappingDetails}>
            <p><strong>Nom :</strong> {testMapping1.name}</p>
            <p><strong>Version :</strong> {testMapping1.version}</p>
            <p><strong>Champs :</strong> {Object.keys(testMapping1.fields).length}</p>
          </div>
          <pre className={styles.mappingJson}>
            {JSON.stringify(testMapping1, null, 2)}
          </pre>
        </div>

        <div className={styles.mappingCard}>
          <h3>📋 Mapping 2 (Modifié)</h3>
          <div className={styles.mappingDetails}>
            <p><strong>Nom :</strong> {testMapping2.name}</p>
            <p><strong>Version :</strong> {testMapping2.version}</p>
            <p><strong>Champs :</strong> {Object.keys(testMapping2.fields).length}</p>
          </div>
          <pre className={styles.mappingJson}>
            {JSON.stringify(testMapping2, null, 2)}
          </pre>
        </div>
      </div>

      <div className={styles.diffSection}>
        <h3>🔍 Résultat de la Comparaison</h3>
        <p>Mode actuel : <strong>{activeMode === 'simple' ? 'Simple' : 'Avancé'}</strong></p>
        
        <UnifiedDiffView
          leftMapping={testMapping1}
          rightMapping={testMapping2}
          mode={activeMode}
          showInline={showInline}
          showUnchanged={showUnchanged}
          className={styles.unifiedDiffView}
        />
      </div>

      <div className={styles.features}>
        <h3>✨ Fonctionnalités du Composant Unifié</h3>
        
        <div className={styles.featureGrid}>
          <div className={styles.feature}>
            <h4>🔄 Basculement de Mode</h4>
            <p>Changez dynamiquement entre le mode simple et avancé selon vos besoins</p>
          </div>
          
          <div className={styles.feature}>
            <h4>📊 Statistiques Adaptatives</h4>
            <p>Les statistiques s'adaptent automatiquement au mode sélectionné</p>
          </div>
          
          <div className={styles.feature}>
            <h4>⚡ Performance Optimisée</h4>
            <p>Mode simple pour les comparaisons rapides, mode avancé pour l'analyse détaillée</p>
          </div>
          
          <div className={styles.feature}>
            <h4>🎨 Interface Cohérente</h4>
            <p>Design unifié qui maintient la cohérence visuelle entre les modes</p>
          </div>
        </div>
      </div>

      <div className={styles.usage}>
        <h3>📖 Guide d'Utilisation</h3>
        
        <div className={styles.usageSection}>
          <h4>Mode Simple</h4>
          <ul>
            <li>✅ <strong>Rapide</strong> - Pas de dépendance externe</li>
            <li>✅ <strong>Léger</strong> - Logique native React</li>
            <li>✅ <strong>Simple</strong> - Interface basique et claire</li>
            <li>✅ <strong>Idéal pour</strong> - Comparaisons rapides et aperçus</li>
          </ul>
        </div>
        
        <div className={styles.usageSection}>
          <h4>Mode Avancé</h4>
          <ul>
            <li>🚀 <strong>Puissant</strong> - Détection intelligente des changements</li>
            <li>🚀 <strong>Précis</strong> - Algorithme jsondiffpatch sophistiqué</li>
            <li>🚀 <strong>Configurable</strong> - Contrôles d'affichage avancés</li>
            <li>🚀 <strong>Idéal pour</strong> - Review de code et analyse détaillée</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UnifiedDiffViewDemo;
