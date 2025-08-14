import React, { useState } from 'react';
import { SchemaBanner } from './SchemaBanner';
import { TemplatesMenu } from './TemplatesMenu';
import { PipelineDnD } from './PipelineDnD';
import { DiffView } from './DiffView';
import { ShortcutsHelp } from './ShortcutsHelp';
import { ToastsContainer } from './ToastsContainer';
import { useSchema, useToasts, useShortcuts, useAbortable } from '../hooks';
import { api } from '../../../lib/api';
import styles from './MappingStudioV2Demo.module.scss';

interface Operation {
  id: string;
  type: string;
  config: any;
}

export const MappingStudioV2Demo: React.FC = () => {
  const [mapping, setMapping] = useState<any>({
    version: '2.2',
    fields: []
  });
  const [previousMapping, setPreviousMapping] = useState<any>(null);
  
  const { schema, fieldTypes, operations, offline, updated, reload } = useSchema();
  const { success, error, info } = useToasts();
  const { signalNext, abort } = useAbortable();

  // Raccourcis clavier
  useShortcuts({
    onRun: () => {
      info('Raccourci ⌘+Enter détecté - Exécution de la validation');
      handleValidate();
    },
    onSave: () => {
      info('Raccourci ⌘+S détecté - Sauvegarde du mapping');
      handleSave();
    }
  });

  const handleTemplateApply = (template: any) => {
    setPreviousMapping(mapping);
    setMapping(template.dsl);
    success(`Template "${template.name}" appliqué avec succès`);
  };

  const handleOperationsChange = (newOperations: Operation[]) => {
    const newMapping = {
      ...mapping,
      fields: mapping.fields.map((field: any) => ({
        ...field,
        pipeline: newOperations
      }))
    };
    setPreviousMapping(mapping);
    setMapping(newMapping);
  };

  const handleValidate = async () => {
    try {
      const signal = signalNext();
      const result = await api.validateMapping(mapping, signal);
      success('Mapping validé avec succès');
      console.log('Validation result:', result);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        info('Validation annulée');
      } else {
        error(`Erreur de validation: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
      }
    }
  };

  const handleSave = () => {
    // Simulation de sauvegarde
    success('Mapping sauvegardé avec succès');
  };

  const renderOperation = (operation: Operation) => (
    <div className={styles.operationItem}>
      <div className={styles.operationHeader}>
        <span className={styles.operationType}>{operation.type}</span>
        <button
          className={styles.removeButton}
          onClick={() => {
            const newOperations = mapping.fields[0]?.pipeline?.filter((op: Operation) => op.id !== operation.id) || [];
            handleOperationsChange(newOperations);
          }}
          aria-label={`Supprimer l'opération ${operation.type}`}
        >
          ×
        </button>
      </div>
      <div className={styles.operationConfig}>
        <pre>{JSON.stringify(operation.config, null, 2)}</pre>
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      <ToastsContainer />
  
      <div className={styles.header}>
        <h1>🎯 Mapping Studio V2.2</h1>
        <div className={styles.headerActions}>
          {(updated || offline) && (
            <button
              className={styles.actionButton}
              onClick={() => reload(true)}
              title="Recharger le schéma"
            >
              ♻️ Recharger le schéma
            </button>
          )}
          <TemplatesMenu onApply={handleTemplateApply} />
          <ShortcutsHelp />
        </div>
      </div>
  
      <SchemaBanner />
  
      <div className={styles.content}>
        <div className={styles.sidebar}>
          <div className={styles.section}>
            <h3>Types de champs disponibles</h3>
            <div className={styles.fieldTypes}>
              {fieldTypes.map((type) => (
                <button
                  key={type}
                  className={styles.fieldType}
                  onClick={() => {
                    const newField = {
                      name: `field_${Date.now()}`,
                      type,
                      pipeline: [],
                    };
                    setPreviousMapping(mapping);
                    setMapping({
                      ...mapping,
                      fields: [...mapping.fields, newField],
                    });
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
  
          <div className={styles.section}>
            <h3>Opérations disponibles</h3>
            <div className={styles.operations}>
              {operations.map((op) => (
                <button
                  key={op}
                  className={styles.operation}
                  onClick={() => {
                    const newOperation: Operation = {
                      id: `op_${Date.now()}`,
                      type: op,
                      config: {},
                    };
                    const currentPipeline = mapping.fields[0]?.pipeline || [];
                    handleOperationsChange([...currentPipeline, newOperation]);
                  }}
                >
                  {op}
                </button>
              ))}
            </div>
          </div>
        </div>
  
        <div className={styles.main}>
          <div className={styles.section}>
            <h3>Pipeline d'opérations</h3>
            <PipelineDnD
              operations={mapping.fields[0]?.pipeline || []}
              onChange={handleOperationsChange}
              renderOperation={renderOperation}
            />
          </div>
  
          <div className={styles.section}>
            <h3>Actions</h3>
            <div className={styles.actions}>
              <button
                className={styles.actionButton}
                onClick={handleValidate}
                disabled={offline}
              >
                🔍 Valider
              </button>
              <button
                className={styles.actionButton}
                onClick={handleSave}
                disabled={offline}
              >
                💾 Sauvegarder
              </button>
              <button
                className={styles.actionButton}
                onClick={() => {
                  // Annule toute opération en cours et restaure l’état précédent
                  abort();
                  if (previousMapping) {
                    setMapping(previousMapping);
                    setPreviousMapping(null);
                  }
                }}
                disabled={!previousMapping}
              >
                ↩️ Annuler
              </button>
              {(updated || offline) && (
                <button
                  className={styles.actionButton}
                  onClick={() => reload(true)}
                  title="Recharger le schéma"
                >
                  ♻️ Recharger le schéma
                </button>
              )}
            </div>
          </div>
  
          {previousMapping && (
            <div className={styles.section}>
              <h3>Diff des versions</h3>
              <DiffView oldMapping={previousMapping} newMapping={mapping} />
            </div>
          )}
        </div>
      </div>
  
      <div className={styles.footer}>
        <p>
          <strong>État:</strong> {offline ? 'Hors ligne' : 'En ligne'}{' '}
          {updated && <span style={{ marginLeft: 8 }}>• Schéma mis à jour</span>} |{' '}
          <strong>Schéma:</strong> {schema ? 'Chargé' : 'Chargement...'} |{' '}
          <strong>Version:</strong> {mapping.version}
        </p>
      </div>
    </div>
  );
  
};

export default MappingStudioV2Demo;
