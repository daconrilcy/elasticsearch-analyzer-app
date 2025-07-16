// frontend/src/features/flow-editor/components/CustomNode.tsx
import { Handle, Position, type NodeProps } from 'reactflow';
import type { NodeData } from '../../../shared/types/analyzer.d';
import { useFlowEditorStore } from '../store';
import './CustomNode.css';

export function CustomNode({ data }: NodeProps<NodeData>) {
  const { kind, label, name } = data;
  // 👇 Récupérez l'état et l'action du store
  const { inputText, setInputText } = useFlowEditorStore();

  const isInputNode = kind === 'input';
  const isOutputNode = kind === 'output';

  return (
    <div className={`custom-node custom-node-${kind}`}>
      {!isInputNode && <Handle type="target" position={Position.Left} />}

      <div className="node-content">
        <strong>{label || name}</strong>

        {/* 👇 Affichez le textarea uniquement pour le noeud "input" */}
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