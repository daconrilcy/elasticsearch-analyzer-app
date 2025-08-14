import React, { useState } from 'react';
import { RichDiffView } from './RichDiffView';
import { PresetsShowcase } from './PresetsShowcase';
import { OperationSuggestions } from './OperationSuggestions';
import { ShareableExport } from './ShareableExport';
import styles from './MicroIterationsDemo.module.scss';

/**
 * Composant de démonstration des micro-itérations V2.2.1
 * Permet de tester tous les nouveaux composants
 */
export const MicroIterationsDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'diff' | 'presets' | 'suggestions' | 'export'>('diff');
  const [selectedPreset, setSelectedPreset] = useState<any>(null);
  const [selectedOperation, setSelectedOperation] = useState<string>('');

  // Données de test pour le diff
  const testMapping1 = {
    name: 'Mapping Test 1',
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

  // Données de test pour les suggestions d'opérations
  const testInferredFields = [
    {
      field: 'user.email',
      suggested_type: 'email',
      confidence: 0.95,
      sample_values: ['test@example.com', 'user@domain.org'],
      reasoning: 'Format email standard détecté'
    },
    {
      field: 'user.phone',
      suggested_type: 'phone',
      confidence: 0.87,
      sample_values: ['+33 1 23 45 67 89', '01 23 45 67 89'],
      reasoning: 'Format téléphone français détecté'
    },
    {
      field: 'timestamp',
      suggested_type: 'date',
      confidence: 0.92,
      sample_values: ['2024-01-15T10:30:00Z', '2024-01-16T14:45:00Z'],
      reasoning: 'Format ISO 8601 détecté'
    },
    {
      field: 'location',
      suggested_type: 'geo_point',
      confidence: 0.78,
      sample_values: ['48.8566,2.3522', '43.2965,5.3698'],
      reasoning: 'Coordonnées géographiques détectées'
    }
  ];

  // Données de test pour l'export
  const testMappingDSL = {
    name: 'Mapping Demo V2.2.1',
    description: 'Mapping de démonstration pour les micro-itérations',
    mapping: testMapping2,
    operations: [
      { type: 'email_validation', field: 'user.email' },
      { type: 'phone_formatting', field: 'user.phone' },
      { type: 'date_normalization', field: 'timestamp' }
    ],
    sample_data: [
      {
        user: {
          name: 'John Doe',
          email: 'john@example.com',
          age: 30,
          phone: '+33 1 23 45 67 89'
        },
        timestamp: '2024-01-15T10:30:00Z',
        tags: ['demo', 'test'],
        location: '48.8566,2.3522'
      }
    ],
    metadata: {
      version: '2.2.1',
      created_at: '2024-01-15',
      author: 'Mapping Studio Team',
      tags: ['demo', 'micro-iterations', 'v2.2.1']
    }
  };

  const tabs = [
    { id: 'diff', label: '🔍 Diff Riche', icon: '🔍' },
    { id: 'presets', label: '🚀 Presets', icon: '🚀' },
    { id: 'suggestions', label: '💡 Suggestions', icon: '💡' },
    { id: 'export', label: '📤 Export', icon: '📤' }
  ] as const;

  const handlePresetSelect = (preset: any) => {
    setSelectedPreset(preset);
    console.log('Preset sélectionné:', preset);
  };

  const handleOperationSelect = (operation: string) => {
    setSelectedOperation(operation);
    console.log('Opération sélectionnée:', operation);
  };

  const handleExport = (exportData: any) => {
    console.log('Export effectué:', exportData);
  };

  return (
    <div className={styles.container}>
      {/* En-tête */}
      <div className={styles.header}>
        <h1>🚀 Micro-itérations V2.2.1 - Démonstration</h1>
        <p>Testez tous les nouveaux composants enrichis du Mapping Studio</p>
      </div>

      {/* Navigation par onglets */}
      <div className={styles.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className={styles.tabIcon}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenu des onglets */}
      <div className={styles.content}>
        {activeTab === 'diff' && (
          <div className={styles.tabContent}>
            <h2>🔍 Diff Riche avec jsondiffpatch</h2>
            <p>Comparez deux mappings et visualisez les différences de manière intuitive</p>
            
            <div className={styles.demoSection}>
              <h3>Comparaison de Mappings</h3>
              <div className={styles.mappingInfo}>
                <div className={styles.mappingCard}>
                  <h4>Mapping 1 (Original)</h4>
                  <pre>{JSON.stringify(testMapping1, null, 2)}</pre>
                </div>
                <div className={styles.mappingCard}>
                  <h4>Mapping 2 (Modifié)</h4>
                  <pre>{JSON.stringify(testMapping2, null, 2)}</pre>
                </div>
              </div>
              
              <RichDiffView
                leftMapping={testMapping1}
                rightMapping={testMapping2}
                showInline={false}
                showUnchanged={true}
                className={styles.richDiffView}
              />
            </div>
          </div>
        )}

        {activeTab === 'presets' && (
          <div className={styles.tabContent}>
            <h2>🚀 Templates Prêts à l'Emploi</h2>
            <p>Découvrez nos presets optimisés pour les cas d'usage courants</p>
            
            <PresetsShowcase
              onPresetSelect={handlePresetSelect}
              className={styles.presetsShowcase}
              showHeader={false}
            />
            
            {selectedPreset && (
              <div className={styles.selectedPreset}>
                <h3>✅ Preset sélectionné : {selectedPreset.name}</h3>
                <p>Vous pouvez maintenant utiliser ce template pour créer votre mapping</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'suggestions' && (
          <div className={styles.tabContent}>
            <h2>💡 Suggestions d'Opérations Intelligentes</h2>
            <p>Recevez des suggestions basées sur l'inférence de types avec quality hints</p>
            
            <OperationSuggestions
              inferredFields={testInferredFields}
              onOperationSelect={handleOperationSelect}
              className={styles.operationSuggestions}
            />
            
            {selectedOperation && (
              <div className={styles.selectedOperation}>
                <h3>✅ Opération sélectionnée : {selectedOperation}</h3>
                <p>Cette opération sera appliquée à votre mapping</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'export' && (
          <div className={styles.tabContent}>
            <h2>📤 Export Shareable</h2>
            <p>Exportez votre mapping DSL dans différents formats et partagez-le facilement</p>
            
            <ShareableExport
              mappingDSL={testMappingDSL}
              onExport={handleExport}
              className={styles.shareableExport}
            />
          </div>
        )}
      </div>

      {/* Informations sur les micro-itérations */}
      <div className={styles.infoSection}>
        <h3>ℹ️ À propos des Micro-itérations V2.2.1</h3>
        <p>
          Ces fonctionnalités enrichissent le Mapping Studio V2.2 avec des outils avancés 
          de collaboration, d'IA et de productivité. Elles sont conçues pour être 
          <strong>non-bloquantes</strong> et peuvent être déployées progressivement.
        </p>
        
        <div className={styles.featuresList}>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>🔍</span>
            <div>
              <strong>Diff Riche</strong> : Visualisation avancée des différences entre mappings
            </div>
          </div>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>🚀</span>
            <div>
              <strong>Presets</strong> : Templates prêts à l'emploi pour les cas d'usage courants
            </div>
          </div>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>💡</span>
            <div>
              <strong>Suggestions IA</strong> : Recommandations intelligentes basées sur l'inférence
            </div>
          </div>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>📤</span>
            <div>
              <strong>Export Shareable</strong> : Partage facile des DSLs et samples
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MicroIterationsDemo;
