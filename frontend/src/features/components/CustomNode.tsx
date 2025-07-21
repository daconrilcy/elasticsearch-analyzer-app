import { Handle, Position, type NodeProps } from 'reactflow';
import { useFlowEditorStore } from '../store';
import type { NodeData } from '../../shared/types/analyzer';

export function CustomNode({ data }: NodeProps<NodeData>) {
  const { kind, label, name } = data;
  const { inputText, setInputText, analysisPath } = useFlowEditorStore();

  const isInputNode = kind === 'input';
  const isOutputNode = kind === 'output';
  const isActive = analysisPath?.nodes.includes(data.id);

  return (
    <div className={`custom-node custom-node-${kind} ${isActive ? 'active-path' : ''}`}>
      {/* Handle de droite, toujours centré verticalement */}
      {!isOutputNode && (
        <Handle type="source" position={Position.Right} />
      )}

      <div className="node-header">
        {/* Handle de gauche (target) */}
        {!isInputNode && (
          <Handle type="target" position={Position.Left} />
        )}
        <strong>{label || name}</strong>
      </div>

      {/* Contenu spécifique input */}
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
