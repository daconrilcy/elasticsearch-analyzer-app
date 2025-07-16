// frontend/src/components/Sidebar.tsx
import './Sidebar.css';

// Les données du noeud que l'on veut créer sont passées dans l'événement de drag
const onDragStart = (event: React.DragEvent, nodeType: string, nodeName: string) => {
  const nodeInfo = { type: nodeType, name: nodeName };
  event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeInfo));
  event.dataTransfer.effectAllowed = 'move';
};

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="description">Glissez un de ces nœuds sur le canvas.</div>
      <div
        className="sidebar-node token-filter"
        onDragStart={(event) => onDragStart(event, 'token_filter', 'lowercase')}
        draggable
      >
        Lowercase Filter
      </div>
      <div
        className="sidebar-node token-filter"
        onDragStart={(event) => onDragStart(event, 'token_filter', 'stop')}
        draggable
      >
        Stopwords Filter
      </div>
      <div
        className="sidebar-node char-filter"
        onDragStart={(event) => onDragStart(event, 'char_filter', 'html_strip')}
        draggable
      >
        HTML Strip Filter
      </div>
      <div
        className="sidebar-node tokenizer"
        onDragStart={(event) => onDragStart(event, 'tokenizer', 'standard')}
        draggable
      >
        Standard Tokenizer
      </div>
    </aside>
  );
}