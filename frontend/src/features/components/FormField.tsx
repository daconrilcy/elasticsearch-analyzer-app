import React from 'react';
import { useGraphStore } from '../store/graphStore';
import { findComponentDefinition } from '../../registry/componentRegistry';

// --- Interface des Props ---

interface FormFieldProps {
  paramDef: any; // La définition du paramètre depuis le JSON
  nodeId: string;  // L'ID du nœud en cours d'édition
}

export const FormField = ({ paramDef, nodeId }: FormFieldProps) => {
  // --- Lecture depuis le store ---
  // On récupère le nœud et la fonction de mise à jour depuis le store du graphe.
  const { graph, updateNodeData } = useGraphStore();
  const node = graph.nodes.find(n => n.id === nodeId);

  if (!node) return null; // Sécurité au cas où le nœud n'existerait pas

  const componentDef = findComponentDefinition(node.data.kind, node.data.name);
  const isExclusive = componentDef?.params.exclusive;

  // Détermine la valeur actuelle du champ depuis les paramètres du nœud.
  const currentValue = isExclusive
    ? node.data.params?.[Object.keys(node.data.params)[0]] // Pour les exclusifs, on prend la seule clé qui existe
    : node.data.params?.[paramDef.name] ?? paramDef.field.default ?? '';

  // --- Logique de mise à jour ---

  const handleChange = (newValue: any) => {
    const currentParams = node.data.params || {};
    let newParams;

    if (isExclusive) {
      // Pour les champs exclusifs, on remplace tous les paramètres par le nouveau.
      newParams = { [paramDef.name]: newValue };
    } else {
      // Sinon, on met à jour uniquement le paramètre concerné.
      newParams = { ...currentParams, [paramDef.name]: newValue };
    }

    updateNodeData(nodeId, { params: newParams });
  };

  // --- Rendu du composant ---

  const { field } = paramDef;
  const isCheckbox = field.type === 'checkbox' || (field.type === 'input' && field.itemType === 'checkbox');

  // Cas 1 : Le champ est une checkbox (switch)
  if (isCheckbox) {
    return (
      <label className="switch-label">
        <input
          type="checkbox"
          checked={!!currentValue}
          onChange={e => handleChange(e.target.checked)}
        />
        <span className="switch-slider"></span>
        <span className="switch-text">{field.description || field.label}</span>
      </label>
    );
  }

  // Cas 2 : Autres types de champs
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
    case 'list': // Les listes sont gérées comme des textareas avec un retour à la ligne
      const textValue = Array.isArray(currentValue) ? currentValue.join('\n') : currentValue || '';
      const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
          const lines = e.target.value.split('\n').filter(Boolean); // Ignore les lignes vides
          handleChange(lines);
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