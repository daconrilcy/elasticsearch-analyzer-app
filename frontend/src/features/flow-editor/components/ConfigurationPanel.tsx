import React, { useState, useEffect } from 'react';
import { useFlowEditorStore } from '../store';
import { findComponentDefinition } from '../../../registry/componentRegistry';
import './ConfigurationPanel.css';

/**
 * A generic component to render a form field based on its JSON definition.
 */
const FormField = ({ paramDef, nodeId }: { paramDef: any, nodeId: string }) => {
  const { selectedNode, updateNodeData } = useFlowEditorStore();
  
  const componentDef = findComponentDefinition(selectedNode!.data.kind, selectedNode!.data.name);
  const isExclusive = componentDef?.params.exclusive;

  const currentValue = selectedNode?.data.params?.[paramDef.name] ?? paramDef.field.default ?? '';

  const handleChange = (value: any) => {
    const newParams = isExclusive 
      ? { [paramDef.name]: value } 
      : { ...selectedNode?.data.params, [paramDef.name]: value };
      
    updateNodeData(nodeId, { params: newParams });
  };

  const field = paramDef.field;

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
    
  if (field.type === 'select') {
    const handleMultiSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedValues = Array.from(e.target.selectedOptions, option => option.value);
        handleChange(selectedValues);
    };

    return (
      <select 
        value={currentValue} 
        onChange={field.multiple ? handleMultiSelectChange : (e) => handleChange(e.target.value)}
        multiple={field.multiple === true}
        size={field.multiple ? 5 : 1}
      >
        {!field.multiple && <option value="" disabled>{field.description}</option>}
        {field.choices.map((choice: any) => (
          <option key={choice.value} value={choice.value}>{choice.label}</option>
        ))}
      </select>
    );
  }

  if (paramDef.type === 'list' || field.type === 'textarea' || field.type === 'file') {
    const textValue = Array.isArray(currentValue) ? currentValue.join('\n') : currentValue;
    const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = (paramDef.type === 'list' || field.return === 'list') 
            ? e.target.value.split('\n').filter(Boolean) 
            : e.target.value;
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
  const { selectedNode, setSelectedNode, updateNodeData, deleteNode } = useFlowEditorStore();
  
  const [exclusiveOption, setExclusiveOption] = useState<string | null>(null);

  useEffect(() => {
    if (selectedNode) {
      const componentDef = findComponentDefinition(selectedNode.data.kind, selectedNode.data.name);
      const currentParam = componentDef?.params?.elements.find((p: any) => selectedNode.data.params?.[p.name] !== undefined);
      
      if (currentParam) {
        setExclusiveOption(currentParam.name);
      } else if (componentDef?.params?.exclusive && componentDef.params.elements.length > 0) {
        setExclusiveOption(componentDef.params.elements[0].name);
      } else {
        setExclusiveOption(null);
      }
    } else {
      setExclusiveOption(null);
    }
  }, [selectedNode?.id]);

  if (!selectedNode) return null;

  const componentDef = findComponentDefinition(selectedNode.data.kind, selectedNode.data.name);

  const handleLabelChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateNodeData(selectedNode.id, { label: event.target.value });
  };
  
  const handleDelete = () => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le nœud "${selectedNode.data.label}" ?`)) {
      deleteNode(selectedNode.id);
    }
  };

  const handleExclusiveOptionChange = (paramName: string) => {
    setExclusiveOption(paramName);
    updateNodeData(selectedNode.id, { params: {} });
  };

  const renderParamsForm = () => {
    if (!componentDef || !componentDef.params || !componentDef.params.elements) {
      return <p className="no-params-message">Aucun paramètre configurable.</p>;
    }

    const isExclusive = componentDef.params.exclusive === true;

    if (isExclusive) {
      const elements = componentDef.params.elements;
      const selectedParamDef = elements.find((param: any) => param.name === exclusiveOption);

      return (
        <>
          <div className="exclusive-options">
            {elements.map((param: any) => (
              <label key={param.name}>
                <input
                  type="radio"
                  name={`exclusive-option-${selectedNode.id}`}
                  value={param.name}
                  checked={exclusiveOption === param.name}
                  onChange={() => handleExclusiveOptionChange(param.name)}
                />
                {param.field.label}
              </label>
            ))}
          </div>
          {selectedParamDef && (
            <div className="form-group exclusive-field">
              <FormField paramDef={selectedParamDef} nodeId={selectedNode.id} />
              {selectedParamDef.field.description && <p className="field-description">{selectedParamDef.field.description}</p>}
            </div>
          )}
        </>
      );
    }

    return componentDef.params.elements.map((param: any) => (
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
          <input type="text" value={selectedNode.data.label || ''} onChange={handleLabelChange} />
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
