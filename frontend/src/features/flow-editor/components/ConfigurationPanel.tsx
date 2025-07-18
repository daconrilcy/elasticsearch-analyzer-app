import React from 'react';
import { useFlowEditorStore } from '../store';
import { findComponentDefinition } from '../../../registry/componentRegistry';
import './ConfigurationPanel.css';

/**
 * Un composant générique pour afficher un champ de formulaire basé sur sa définition JSON.
 */
const FormField = ({ paramDef, nodeId }: { paramDef: any, nodeId: string }) => {
  const { selectedNode, updateNodeData } = useFlowEditorStore();
  const currentValue = selectedNode?.data.params?.[paramDef.name] ?? paramDef.field.default ?? '';

  const handleChange = (value: any) => {
    updateNodeData(nodeId, {
      params: {
        ...selectedNode?.data.params,
        [paramDef.name]: value,
      },
    });
  };

  const field = paramDef.field;

  // Gère les champs de type 'input' (text, number, etc.)
  if (field.type === 'input') {
    return (
      <input
        type={field.itemType || 'text'}
        value={currentValue}
        placeholder={field.placeholder}
        onChange={(e) => handleChange(field.itemType === 'number' ? Number(e.target.value) : e.target.value)}
      />
    );
  }
  
  // Gère les cases à cocher
  if (field.type === 'checkbox' || field.itemType === 'checkbox') {
    return (
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={!!currentValue}
          onChange={(e) => handleChange(e.target.checked)}
        />
        {paramDef.field.description}
      </label>
    );
  }
    
  // Gère les listes déroulantes
  if (field.type === 'select') {
    return (
      <select value={currentValue} onChange={(e) => handleChange(e.target.value)}>
        <option value="" disabled>{field.description}</option>
        {field.choices.map((choice: any) => (
          <option key={choice.value} value={choice.value}>{choice.label}</option>
        ))}
      </select>
    );
  }

  // Gère les zones de texte pour les listes (stopwords, synonyms)
  if (paramDef.type === 'list' || field.type === 'textarea') {
    const textValue = Array.isArray(currentValue) ? currentValue.join('\n') : currentValue;
    const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        // Pour les listes, on split par ligne. Sinon, on garde le texte tel quel.
        const newValue = paramDef.type === 'list' ? e.target.value.split('\n').filter(Boolean) : e.target.value;
        handleChange(newValue);
    }
    return (
      <textarea
        value={textValue}
        placeholder={field.placeholder}
        rows={5}
        onChange={handleTextAreaChange}
      />
    );
  }

  return <p>Type de champ inconnu : {field.type}</p>;
};


export function ConfigurationPanel() {
  const { selectedNode, setSelectedNode, updateNodeData } = useFlowEditorStore();

  if (!selectedNode) return null;

  // On récupère la définition complète du composant depuis notre registre
  const componentDef = findComponentDefinition(selectedNode.data.kind, selectedNode.data.name);

  const handleLabelChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateNodeData(selectedNode.id, { label: event.target.value });
  };

  // On génère le formulaire dynamiquement à partir de la définition JSON
  const renderParamsForm = () => {
    if (!componentDef || !componentDef.params || !componentDef.params.elements) {
      return <p className="no-params-message">Aucun paramètre configurable.</p>;
    }
    return componentDef.params.elements.map((param: any) => (
      <div className="form-group" key={param.name}>
        <label>{param.field.label}</label>
        <FormField paramDef={param} nodeId={selectedNode.id} />
        {param.field.description && <p className="field-description">{param.field.description}</p>}
      </div>
    ));
  };

  return (
    <aside className="config-panel">
      <button onClick={() => setSelectedNode(null)} className="back-button">
        ← Retour
      </button>

      <h3>Configuration</h3>
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
        />
      </div>

      <div className="params-section">
        <h4>Paramètres</h4>
        {renderParamsForm()}
      </div>
    </aside>
  );
}
