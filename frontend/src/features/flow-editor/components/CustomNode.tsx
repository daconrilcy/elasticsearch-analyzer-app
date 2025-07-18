import { Handle, Position, type NodeProps } from 'reactflow';
import { useFlowEditorStore } from '../store';
import type { NodeData } from '../../../shared/types/analyzer.d';
import './CustomNode.css';

export function CustomNode({ data }: NodeProps<NodeData>) {
  const { kind, label, name } = data;
  const { inputText, setInputText, analysisPath } = useFlowEditorStore();

  const isInputNode = kind === 'input';
  const isOutputNode = kind === 'output';
  
  // Détermine si ce nœud fait partie du chemin d'analyse valide
  const isActive = analysisPath?.nodes.includes(data.id);

  return (
    // On ajoute la classe 'active-path' si le nœud est dans le chemin
    <div className={`custom-node custom-node-${kind} ${isActive ? 'active-path' : ''}`}>
      {!isInputNode && <Handle type="target" position={Position.Left} />}

      <div className="node-content">
        <strong>{label || name}</strong>
        
        {isInputNode && (
          <textarea
            className="input-textarea"
            value={inputText}
            onChange={(evt) => setInputText(evt.target.value)}
          />
        )}
      </div>

      {!isOutputNode && <Handle type="source" position={Position.Right} />}
    </div>
  );
}
