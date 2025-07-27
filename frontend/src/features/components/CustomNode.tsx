import { Handle, Position, type NodeProps } from 'reactflow';
// CORRECTION: 'useAnalysisStore' est maintenant importé pour obtenir l'inputText.
import { useAnalysisStore } from '../store/analysisStore';
import type { NodeData } from '../../shared/types/analyzer.d';

export function CustomNode({ data, selected }: NodeProps<NodeData>) {
  const { kind, label, name } = data;
  
  // Le hook est toujours nécessaire pour le nœud 'input'.
  const { inputText, setInputText } = useAnalysisStore();

  const isInputNode = kind === 'input';
  const isOutputNode = kind === 'output';
  
  // La logique 'isActive' a été retirée. La sélection de React Flow (la bordure bleue)
  // sert maintenant d'indicateur principal pour le nœud actif.
  // La classe 'selected' est automatiquement ajoutée par React Flow.
  return (
    <div className={`custom-node custom-node-${kind} ${selected ? 'selected' : ''}`}>
      {!isOutputNode && (
        <Handle type="source" position={Position.Right} />
      )}

      <div className="node-header">
        {!isInputNode && (
          <Handle type="target" position={Position.Left} />
        )}
        <strong>{label || name}</strong>
      </div>

      {isInputNode && (
        <div className="node-content">
          <textarea
            className="input-textarea"
            value={inputText}
            onChange={(evt) => setInputText(evt.target.value)}
            placeholder="Saisissez votre texte ici..."
          />
        </div>
      )}
    </div>
  );
}
