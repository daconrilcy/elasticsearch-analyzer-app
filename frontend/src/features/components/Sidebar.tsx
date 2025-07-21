// frontend/src/features/flow-editor/components/Sidebar.tsx

import { useMemo } from 'react';
import { useGraphStore } from '../store/graphStore'; // <- Correction: Importer le store du graphe
import {
  availableTokenizers, 
  availableTokenFilters, 
  availableCharFilters,
  isFilterCompatible 
} from '../../registry/componentRegistry';

// Correction: Le type de l'événement est `React.DragEvent`
const onDragStart = (event: React.DragEvent, nodeType: string, nodeName: string, isDisabled: boolean) => {
  if (isDisabled) {
    event.preventDefault();
    return;
  }
  const nodeInfo = { type: nodeType, name: nodeName };
  event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeInfo));
  event.dataTransfer.effectAllowed = 'move';
};

export function Sidebar() {
  // Correction: Utiliser le nouveau store pour accéder au graphe
  const { graph } = useGraphStore();

  // On analyse le graphe actuel pour en déduire les règles de validation
  const validationState = useMemo(() => {
    const nodes = graph.nodes || [];
    const existingTokenizer = nodes.find(node => node.data.kind === 'tokenizer');
    
    return {
      hasTokenizer: !!existingTokenizer,
      tokenizerName: existingTokenizer?.data.name || '',
    };
  }, [graph.nodes]);

  return (
    <aside className="sidebar">
      <div className="description">Glissez un de ces nœuds sur le canvas.</div>

      <h4>Character Filters</h4>
      {availableCharFilters.map(cf => (
        <div
          key={cf.name}
          className="sidebar-node char-filter"
          title={cf.description}
          onDragStart={(event) => onDragStart(event, 'char_filter', cf.name, false)}
          draggable
        >
          {cf.label}
        </div>
      ))}

      <h4>Tokenizer</h4>
      {availableTokenizers.map(t => {
        const isDisabled = validationState.hasTokenizer;
        return (
          <div
            key={t.name}
            className={`sidebar-node tokenizer ${isDisabled ? 'disabled' : ''}`}
            onDragStart={(event) => onDragStart(event, 'tokenizer', t.name, isDisabled)}
            draggable={!isDisabled}
            title={isDisabled ? "Un seul tokenizer est autorisé par analyseur." : t.description}
          >
            {t.label}
          </div>
        );
      })}

      <h4>Token Filters</h4>
      {availableTokenFilters.map(tf => {
        const isDisabled = !validationState.hasTokenizer || !isFilterCompatible(validationState.tokenizerName, tf.name);
        return (
          <div
            key={tf.name}
            className={`sidebar-node token-filter ${isDisabled ? 'disabled' : ''}`}
            onDragStart={(event) => onDragStart(event, 'token_filter', tf.name, isDisabled)}
            draggable={!isDisabled}
            title={isDisabled ? `Requiert un tokenizer compatible (actuel: ${validationState.tokenizerName || 'aucun'})` : tf.description}
          >
            {tf.label}
          </div>
        );
      })}
    </aside>
  );
}