import { useMemo } from 'react';
import { useGraphStore } from '../store/graphStore';
import {
  availableTokenizers, 
  availableTokenFilters, 
  availableCharFilters,
  isFilterCompatible 
} from '../../registry/componentRegistry';


interface SidebarProps {
  isVisible: boolean;
}


const onDragStart = (event: React.DragEvent, nodeType: string, nodeName: string, isDisabled: boolean) => {
  if (isDisabled) {
    event.preventDefault();
    return;
  }
  const nodeInfo = { type: nodeType, name: nodeName };
  event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeInfo));
  event.dataTransfer.effectAllowed = 'move';
};

export function Sidebar({ isVisible }: SidebarProps) {
  const { graph } = useGraphStore();

  const validationState = useMemo(() => {
    const nodes = graph.nodes || [];
    const existingTokenizer = nodes.find(node => node.data.kind === 'tokenizer');
    
    return {
      hasTokenizer: !!existingTokenizer,
      tokenizerName: existingTokenizer?.data.name || '',
    };
  }, [graph.nodes]);

  return (
    <aside className={`sidebar ${isVisible ? 'visible' : ''}`}>
      {/* Ce conteneur enfant est la clé de la solution */}
      <div className="sidebar-content-scrollable">
        <p className="sidebar-description">Glissez un de ces nœuds sur le canvas.</p>

        <div className="sidebar-section">
          <h4 className="sidebar-section-title">
            <span className="title-icon">🎨</span>
            <span>Character Filters</span>
          </h4>
          {availableCharFilters.map(cf => (
            <div
              key={cf.name}
              className="sidebar-node char-filter"
              title={cf.description}
              onDragStart={(event) => onDragStart(event, 'char_filter', cf.name, false)}
              draggable
            >
              {cf.label.toUpperCase()}
            </div>
          ))}
        </div>

        <div className="sidebar-section">
          <h4 className="sidebar-section-title">
            <span className="title-icon">🧩</span>
            <span>Tokenizer</span>
          </h4>
          {availableTokenizers.map(t => {
            const isDisabled = validationState.hasTokenizer;
            return (
              <div
                key={t.name}
                className={`sidebar-node tokenizer ${isDisabled ? 'disabled' : ''}`}
                onDragStart={(event) => onDragStart(event, 'tokenizer', t.name, isDisabled)}
                draggable={!isDisabled}
                title={isDisabled ? "Un seul tokenizer est autorisé." : t.description}
              >
                {t.label.toUpperCase()}
              </div>
            );
          })}
        </div>

        <div className="sidebar-section">
          <h4 className="sidebar-section-title">
            <span className="title-icon">⚙️</span>
            <span>Token Filters</span>
          </h4>
          {availableTokenFilters.map(tf => {
            const isDisabled = !validationState.hasTokenizer || !isFilterCompatible(validationState.tokenizerName, tf.name);
            return (
              <div
                key={tf.name}
                className={`sidebar-node token-filter ${isDisabled ? 'disabled' : ''}`}
                onDragStart={(event) => onDragStart(event, 'token_filter', tf.name, isDisabled)}
                draggable={!isDisabled}
                title={isDisabled ? `Requiert un tokenizer compatible.` : tf.description}
              >
                {tf.label.toUpperCase()}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
