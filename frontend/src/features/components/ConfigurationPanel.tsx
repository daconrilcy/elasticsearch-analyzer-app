import React, { useMemo } from 'react';
import { useFlowEditorStore } from '../store';
import { findComponentDefinition } from '../../registry/componentRegistry';
import { FormField } from './FormField';
// import './ConfigurationPanel.scss';

// Icône SVG pour le bouton Retour
const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    xmlns="http://www.w3.org/2000/svg">
    <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const DeleteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    xmlns="http://www.w3.org/2000/svg">
    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export function ConfigurationPanel() {
  const { selectedNode, setSelectedNode, updateNodeData, deleteNode } = useFlowEditorStore();

  const componentDef = useMemo(() => {
    if (!selectedNode) return null;
    return findComponentDefinition(selectedNode.data.kind, selectedNode.data.name);
  }, [selectedNode]);

  if (!selectedNode) return null;

  const handleLabelChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateNodeData(selectedNode.id, { label: event.target.value });
  };

  const handleDelete = () => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le nœud "${selectedNode.data.label || selectedNode.data.name}" ?`)) {
      deleteNode(selectedNode.id);
    }
  };

  const renderParamsForm = () => {
    if (!componentDef?.params?.elements) {
      return <p className="no-params-message">Aucun paramètre n'est configurable pour ce nœud.</p>;
    }
    const { elements } = componentDef.params;
    return elements.map((param: any) => {
      const isCheckbox =
        param.field.type === 'checkbox' ||
        (param.field.type === 'input' && param.field.itemType === 'checkbox');

      return (
        <div className="form-group" key={param.name}>
          {/* Affiche le label externe seulement si ce n'est pas un switch */}
          {!isCheckbox && <label>{param.field.label}</label>}
          <FormField paramDef={param} nodeId={selectedNode.id} />
          {param.field.description && <p className="field-description">{param.field.description}</p>}
        </div>
      );
    });
  };

  const canBeDeleted = selectedNode.data.kind !== 'input' && selectedNode.data.kind !== 'output';

  return (
    <aside className="config-panel">
      <div className="panel-header">
        <button onClick={() => setSelectedNode(null)} className="back-button">
          <BackIcon />
          <span>Retour</span>
        </button>
        <h2>Configuration</h2>
      </div>

      <div className="panel-content">
        <section className="node-meta">
          <div className="meta-item">
            <span className="meta-label">Type:</span>
            <span className="meta-value">{selectedNode.data.kind}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Nom:</span>
            <span className="meta-value">{selectedNode.data.name}</span>
          </div>
        </section>

        <section className="form-group">
          <label htmlFor="nodeLabel">Label du Nœud</label>
          <input
            id="nodeLabel"
            type="text"
            value={selectedNode.data.label || ''}
            onChange={handleLabelChange}
            placeholder="Ex: Filtre français"
          />
        </section>

        <section className="params-section">
          <h3>Paramètres</h3>
          {renderParamsForm()}
        </section>
      </div>

      {canBeDeleted && (
        <div className="panel-footer">
          <button onClick={handleDelete} className="delete-button">
            <DeleteIcon />
            <span>Supprimer le Nœud</span>
          </button>
        </div>
      )}
    </aside>
  );
}
