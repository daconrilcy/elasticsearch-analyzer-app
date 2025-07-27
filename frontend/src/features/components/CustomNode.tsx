import { Handle, Position, type NodeProps } from 'reactflow';
import { useAnalysisStore } from '../store/analysisStore';
import type { NodeData } from '../../shared/types/analyzer.d';

export function CustomNode({ data, selected }: NodeProps<NodeData>) {
  const { kind, label, name } = data;
  const { inputText, setInputText } = useAnalysisStore();

  const isInputNode = kind === 'input';
  const isOutputNode = kind === 'output';
  
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
