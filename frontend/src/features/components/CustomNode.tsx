// CustomNode.tsx
import { Handle, Position, type NodeProps } from 'reactflow';
import { useAnalysisStore } from '../store/analysisStore';
import type { NodeData } from '../../shared/types/analyzer.d';
import styles from './CustomNode.module.scss';

export function CustomNode({ data, selected }: NodeProps<NodeData>) {
  const { kind, label, name } = data;
  const { inputText, setInputText } = useAnalysisStore();

  const isInputNode = kind === 'input';
  const isOutputNode = kind === 'output';

  return (
    <div
      data-kind={kind}
      className={`${styles.customNode} ${selected ? 'selected' : ''}`}
    >
      {/* Handles -> en dehors du wrapper visuel */}
      {!isInputNode && <Handle type="target" position={Position.Left} />}
      {!isOutputNode && <Handle type="source" position={Position.Right} />}

      {/* Wrapper visuel qui clippe uniquement le décor */}
      <div className={styles.visual}>
        <span className={styles.typeBar} aria-hidden="true" />

        <div className={styles.nodeHeader}>
          <strong>{label || name}</strong>
          <span className={styles.typeSubtitle}>
            {isInputNode
              ? 'Input'
              : isOutputNode
              ? 'Output'
              : kind === 'tokenizer'
              ? 'Tokenizer'
              : kind === 'token_filter'
              ? 'Token Filter'
              : kind === 'char_filter'
              ? 'Char Filter'
              : ''}
          </span>
        </div>

        {isInputNode && (
          <div className={styles.nodeContent}>
            <textarea
              className={styles.inputTextarea}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Saisissez votre texte ici..."
            />
          </div>
        )}
      </div>
    </div>
  );
}
