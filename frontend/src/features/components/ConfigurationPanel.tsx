import React, { useMemo } from 'react';
import { useGraphStore } from '../store/graphStore';
import { useUIStore } from '../store/uiStore';
import { findComponentDefinition } from '../../registry/componentRegistry';
import { FormField } from './FormField';
import { FormExclusiveChoice } from './form/FormExclusiveChoice'; // <-- AJOUTER L'IMPORT
import { type CustomNode } from '@/shared/types/analyzer.d';
import styles from './ConfigurationPanel.module.scss'

// --- Icônes ---
const BackIcon = () => ( <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> );
const DeleteIcon = () => ( <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2-2H7a2 2 0 01-2-2V6h14z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> );

interface ConfigurationPanelProps {
  node: CustomNode;
  isVisible: boolean;
}

export function ConfigurationPanel({ node, isVisible }: ConfigurationPanelProps) {
  const { updateNodeData, deleteNode } = useGraphStore();
  const { setSelectedNodeId } = useUIStore();

  const componentDef = useMemo(() => {
    if (!node) return null;
    return findComponentDefinition(node.data.kind, node.data.name);
  }, [node]);

  if (!node) return null;

  const handleLabelChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateNodeData(node.id, { label: event.target.value });
  };

  const handleDelete = () => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le nœud "${node.data.label || node.data.name}" ?`)) {
      deleteNode(node.id);
      setSelectedNodeId(null);
    }
  };

  const renderParamsForm = () => {
    if (!componentDef?.params?.elements) {
      return <p className={styles.noParamsMessage}>Aucun paramètre n'est configurable.</p>;
    }

    const { elements, exclusive: isExclusive } = componentDef.params;

    // --- NOUVELLE LOGIQUE ---
    if (isExclusive) {
      // Si les paramètres sont exclusifs, on rend notre nouveau composant conteneur
      return (
        <div className={styles.formGroup}>
          <FormExclusiveChoice
            paramDef={{ elements }}
            value={node.data.params || {}}
            onChange={(newValue) => updateNodeData(node.id, { params: newValue })}
          />
        </div>
      );
    }

    // --- Logique existante pour les paramètres non-exclusifs ---
    return elements.map((param: any) => {
      const currentValue = node.data.params?.[param.name] ?? param.field.default ?? '';
      const handleChange = (newValue: any) => {
        updateNodeData(node.id, { params: { ...node.data.params, [param.name]: newValue } });
      };
      const shouldShowLabel = param.field.component !== 'switch';

      return (
        <div className={styles.formGroup} key={param.name}>
          {shouldShowLabel && <label>{param.field.label}</label>}
          <FormField paramDef={param} value={currentValue} onChange={handleChange} />
          {param.field.description && shouldShowLabel && <p className={styles.fieldDescription}>{param.field.description}</p>}
        </div>
      );
    });
  };

  const canBeDeleted = node.data.kind !== 'input' && node.data.kind !== 'output';

  return (
    <aside className={`${styles.configPanel} ${isVisible ? 'visible' : ''}`}>
      <div className={styles.panelHeader}>
        <button onClick={() => setSelectedNodeId(null)} className={styles.backButton}><BackIcon /><span>Retour</span></button>
        <h2>Configuration</h2>
      </div>
      <div className={styles.panelContent}>
        <section className={styles.nodeMeta}>
          <div className={styles.metaItem}><span className={styles.metaLabel}>Type:</span><span className={styles.metaValue}>{node.data.kind}</span></div>
          <div className={styles.metaItem}><span className={styles.metaLabel}>Nom:</span><span className={styles.metaValue}>{node.data.name}</span></div>
        </section>
        <section className={styles.formGroup}>
          <label htmlFor="nodeLabel">Label du Nœud</label>
          <input id="nodeLabel" type="text" value={node.data.label || ''} onChange={handleLabelChange} placeholder="Ex: Filtre français" />
        </section>
        <section className={styles.paramsSection}>
          <h3>Paramètres</h3>
          {renderParamsForm()}
        </section>
      </div>
      {canBeDeleted && (
        <div className={styles.panelFooter}>
          <button onClick={handleDelete} className={styles.deleteButton}><DeleteIcon /><span>Supprimer le Nœud</span></button>
        </div>
      )}
    </aside>
  );
}
