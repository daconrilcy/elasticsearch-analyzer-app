import React, { useState } from 'react';
import { OperationEditor, type Operation } from '../components/studio/OperationEditor';
import styles from './OperationEditorDemo.module.scss';

export const OperationEditorDemo: React.FC = () => {
  const [operations, setOperations] = useState<Operation[]>([
    {
      op: 'cast',
      to: 'string'
    },
    {
      op: 'regex_replace',
      pattern: '\\d+',
      replacement: 'NUMBER',
      flags: 'g'
    },
    {
      op: 'date_parse',
      formats: ['YYYY-MM-DD', 'DD/MM/YYYY'],
      assume_tz: 'Europe/Paris'
    }
  ]);

  const [selectedOperationIndex, setSelectedOperationIndex] = useState<number>(0);

  const handleOperationChange = (index: number, updatedOperation: Operation) => {
    setOperations(prev => prev.map((op, i) => i === index ? updatedOperation : op));
  };

  const handleOperationRemove = (index: number) => {
    setOperations(prev => prev.filter((_, i) => i !== index));
    if (selectedOperationIndex >= operations.length - 1) {
      setSelectedOperationIndex(Math.max(0, operations.length - 2));
    }
  };

  const addOperation = () => {
    const newOperation: Operation = {
      op: 'cast',
      to: 'string'
    };
    setOperations(prev => [...prev, newOperation]);
    setSelectedOperationIndex(operations.length);
  };

  const resetOperations = () => {
    setOperations([
      {
        op: 'cast',
        to: 'string'
      },
      {
        op: 'regex_replace',
        pattern: '\\d+',
        replacement: 'NUMBER',
        flags: 'g'
      },
      {
        op: 'date_parse',
        formats: ['YYYY-MM-DD', 'DD/MM/YYYY'],
        assume_tz: 'Europe/Paris'
      }
    ]);
    setSelectedOperationIndex(0);
  };

  return (
    <div className={styles.operationEditorDemo}>
      <div className={styles.header}>
        <h1>🔧 Démo - Éditeur d'Opérations</h1>
        <p>Explorez les capacités avancées de l'éditeur d'opérations de transformation</p>
      </div>

      <div className={styles.demoContainer}>
        <div className={styles.operationsList}>
          <div className={styles.operationsHeader}>
            <h3>📋 Liste des Opérations</h3>
            <button onClick={addOperation} className={styles.addButton}>
              ➕ Ajouter
            </button>
          </div>
          
          <div className={styles.operationsTabs}>
            {operations.map((operation, index) => (
              <button
                key={index}
                className={`${styles.operationTab} ${selectedOperationIndex === index ? styles.active : ''}`}
                onClick={() => setSelectedOperationIndex(index)}
              >
                <span className={styles.operationType}>{operation.op}</span>
                <span className={styles.operationPreview}>
                  {operation.op === 'cast' && `→ ${operation.to}`}
                  {operation.op === 'regex_replace' && `${operation.pattern} → ${operation.replacement}`}
                  {operation.op === 'date_parse' && `${operation.formats?.length || 0} formats`}
                  {operation.op === 'dict' && `Dict: ${operation.key}`}
                  {operation.op === 'sort' && `by: ${operation.by}`}
                  {operation.op === 'filter' && `Condition: ${operation.condition}`}
                  {operation.op === 'unique' && `by: ${operation.by}`}
                  {!['cast', 'regex_replace', 'date_parse', 'dict', 'sort', 'filter', 'unique'].includes(operation.op) && 'Custom'}
                </span>
              </button>
            ))}
          </div>

          <div className={styles.operationsActions}>
            <button onClick={resetOperations} className={styles.resetButton}>
              🔄 Réinitialiser
            </button>
            <div className={styles.operationsCount}>
              {operations.length} opération{operations.length > 1 ? 's' : ''}
            </div>
          </div>
        </div>

        <div className={styles.editorSection}>
          <div className={styles.editorHeader}>
            <h3>✏️ Éditeur d'Opération</h3>
            <span className={styles.operationInfo}>
              Opération {selectedOperationIndex + 1} sur {operations.length}
            </span>
          </div>

          {operations.length > 0 && (
            <div className={styles.editorContainer}>
              <OperationEditor
                operation={operations[selectedOperationIndex]}
                onOperationChange={(updatedOp) => handleOperationChange(selectedOperationIndex, updatedOp)}
                onRemove={() => handleOperationRemove(selectedOperationIndex)}
              />
            </div>
          )}

          {operations.length === 0 && (
            <div className={styles.emptyState}>
              <p>📝 Aucune opération configurée</p>
              <p>Cliquez sur "Ajouter" pour commencer à créer des opérations de transformation</p>
            </div>
          )}
        </div>
      </div>

      <div className={styles.features}>
        <h3>🚀 Fonctionnalités Avancées</h3>
        <div className={styles.featuresGrid}>
          <div className={styles.feature}>
            <h4>🎯 Opérations Typées</h4>
            <p>Interfaces spécialisées pour chaque type d'opération avec validation en temps réel</p>
          </div>
          <div className={styles.feature}>
            <h4>🔧 Fallback Générique</h4>
            <p>Support des opérations personnalisées via format clé=valeur</p>
          </div>
          <div className={styles.feature}>
            <h4>📚 Dictionnaires</h4>
            <p>Intégration avec l'API des dictionnaires pour les remplacements de valeurs</p>
          </div>
          <div className={styles.feature}>
            <h4>⚡ Performance</h4>
            <p>Gestion optimisée des états et des mises à jour</p>
          </div>
        </div>
      </div>

      <div className={styles.examples}>
        <h3>💡 Exemples d'Utilisation</h3>
        <div className={styles.examplesList}>
          <div className={styles.example}>
            <h4>Type Casting</h4>
            <p>Convertissez automatiquement les types de données (string → number, date → timestamp)</p>
          </div>
          <div className={styles.example}>
            <h4>Regex & Remplacement</h4>
            <p>Utilisez des expressions régulières pour nettoyer et transformer vos données</p>
          </div>
          <div className={styles.example}>
            <h4>Parsing de Dates</h4>
            <p>Parsez des dates dans différents formats avec gestion des fuseaux horaires</p>
          </div>
          <div className={styles.example}>
            <h4>Filtrage & Tri</h4>
            <p>Filtrez vos données selon des critères complexes et triez-les efficacement</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperationEditorDemo;
