import React, { useMemo } from 'react';
import { useFlowEditorStore } from '../store';
import { findComponentDefinition } from '../../../registry/componentRegistry';
import { FormField } from './FormField';
import './ConfigurationPanel.css';

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
      return <p className="no-params-message">Aucun paramètre configurable.</p>;
    }

    const { elements, exclusive } = componentDef.params;

    if (exclusive) {
      // On se fie à `activeParamType` pour savoir quelle option est active.
      // Si aucune n'est définie, on prend la première de la liste par défaut.
      const activeParamDef =
        elements.find((el: any) => el.type === selectedNode.data.activeParamType) || elements[0];

      return (
        <>
          <div className="exclusive-options">
            {elements.map((param: any) => (
              <label key={`${param.name}-${param.type}`}>
                <input
                  type="radio"
                  name={`exclusive-option-${selectedNode.id}`}
                  checked={activeParamDef.type === param.type}
                  onChange={() => {
                    // Au clic, on met à jour l'état global avec les DEUX informations :
                    // 1. Les nouveaux `params` avec le bon nom et la valeur par défaut.
                    // 2. Le `activeParamType` qui correspond à l'option cliquée.
                    updateNodeData(selectedNode.id, {
                      params: { [param.name]: param.field.default ?? '' },
                      activeParamType: param.type,
                    });
                  }}
                />
                {param.field.label}
              </label>
            ))}
          </div>
          {activeParamDef && (
            <div className="form-group exclusive-field">
              <FormField paramDef={activeParamDef} nodeId={selectedNode.id} />
              {activeParamDef.field.description && (
                <p className="field-description">{activeParamDef.field.description}</p>
              )}
            </div>
          )}
        </>
      );
    }

    return elements.map((param: any) => (
      <div className="form-group" key={param.name}>
        <label>{param.field.label}</label>
        <FormField paramDef={param} nodeId={selectedNode.id} />
        {param.field.description && <p className="field-description">{param.field.description}</p>}
      </div>
    ));
  };

  const canBeDeleted = selectedNode.data.kind !== 'input' && selectedNode.data.kind !== 'output';

  return (
    <aside className="config-panel">
      <div className="panel-header">
        <button onClick={() => setSelectedNode(null)} className="back-button">
          ← Retour
        </button>
        <h3>Configuration</h3>
      </div>
      <div className="panel-content">
        <div className="node-info">
          <span>Type: {selectedNode.data.kind}</span>
          <span>Nom: {selectedNode.data.name}</span>
        </div>
        <div className="form-group">
          <label>Label du Nœud</label>
          <input
            type="text"
            value={selectedNode.data.label || ''}
            onChange={handleLabelChange}
            placeholder="Ex: Filtre français"
          />
        </div>
        <div className="params-section">
          <h4>Paramètres</h4>
          {renderParamsForm()}
        </div>
      </div>
      {canBeDeleted && (
        <div className="panel-footer">
          <button onClick={handleDelete} className="delete-button">Supprimer le Nœud</button>
        </div>
      )}
    </aside>
  );
}