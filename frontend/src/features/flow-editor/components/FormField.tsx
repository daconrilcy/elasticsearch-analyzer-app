// frontend/src/features/flow-editor/components/FormField.tsx

import React from 'react';
import { useFlowEditorStore } from '../store';
import { findComponentDefinition } from '../../../registry/componentRegistry';

interface FormFieldProps {
  paramDef: any;
  nodeId: string;
}

export const FormField = ({ paramDef, nodeId }: FormFieldProps) => {
  // ... (le code pour récupérer currentValue et la fonction handleChange reste le même)
  const { selectedNode, updateNodeData } = useFlowEditorStore();

  const componentDef = findComponentDefinition(selectedNode!.data.kind, selectedNode!.data.name);
  const isExclusive = componentDef?.params.exclusive;

  const currentValue = isExclusive
    ? selectedNode?.data.params?.[paramDef.name]
    : selectedNode?.data.params?.[paramDef.name] ?? paramDef.field.default ?? '';

  const handleChange = (value: any) => {
    const newParams = isExclusive
      ? { [paramDef.name]: value }
      : { ...selectedNode?.data.params, [paramDef.name]: value };

    updateNodeData(nodeId, { params: newParams });
  };


  const { field } = paramDef;

  // --- CORRECTION ---
  // On identifie clairement si le champ est une checkbox en amont.
  const isCheckbox = field.type === 'checkbox' || (field.type === 'input' && field.itemType === 'checkbox');

  if (isCheckbox) {
    return (
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={!!currentValue}
          onChange={(e) => handleChange(e.target.checked)}
        />
        {field.description || field.label}
      </label>
    );
  }
  
  // Le reste de la logique est dans un switch
  switch (field.type) {
    case 'input':
      return (
        <input
          type={field.itemType || 'text'}
          value={currentValue || ''}
          placeholder={field.placeholder}
          onChange={(e) =>
            handleChange(
              field.itemType === 'number' ? Number(e.target.value) || 0 : e.target.value
            )
          }
        />
      );

    case 'select':
      // ... (logique du select)
      return (
        <select
          value={currentValue || (field.multiple ? [] : '')}
          onChange={(e) =>
            handleChange(
              field.multiple
                ? Array.from(e.target.selectedOptions, (option) => option.value)
                : e.target.value
            )
          }
          multiple={field.multiple === true}
          size={field.multiple ? 5 : 1}
        >
          {!field.multiple && <option value="" disabled>{field.placeholder || 'Sélectionner...'}</option>}
          {field.choices?.map((choice: any) => (
            <option key={choice.value} value={choice.value}>
              {choice.label}
            </option>
          ))}
        </select>
      );
      
    case 'textarea':
    case 'list':
    case 'file':
      // ... (logique du textarea)
      const textValue = Array.isArray(currentValue) ? currentValue.join('\n') : currentValue || '';
      const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
          const lines = e.target.value.split('\n').filter(Boolean);
          const newValue = (paramDef.type === 'list' || field.return === 'list')
              ? lines
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

    default:
      return <p>Type de champ non supporté : {field.type}</p>;
  }
};