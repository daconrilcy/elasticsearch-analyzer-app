import { useFlowEditorStore } from '../store';
import './ConfigurationPanel.css';

// --- Composants de configuration spécifiques ---

/**
 * Un composant dédié à la configuration du filtre "stop".
 * Il s'affiche uniquement lorsque l'utilisateur sélectionne un nœud "stop".
 */
function StopwordsConfig() {
  const { selectedNode, updateNodeData } = useFlowEditorStore();
  
  // Les stopwords sont un tableau dans le store, mais une chaîne dans le textarea pour l'édition.
  const stopwords = selectedNode?.data.params?.stopwords?.join(', ') || '';

  const handleStopwordsChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    // On convertit la chaîne de caractères en un tableau de mots propres.
    const words = event.target.value.split(',').map(w => w.trim()).filter(Boolean);
    // On met à jour le nœud avec ses nouveaux paramètres.
    updateNodeData(selectedNode!.id, { params: { stopwords: words } });
  };

  return (
    <div className="form-group">
      <label htmlFor="stopwords-input">Mots à ignorer (séparés par une virgule)</label>
      <textarea
        id="stopwords-input"
        value={stopwords}
        onChange={handleStopwordsChange}
        rows={4}
        placeholder="ex: le, la, les, un, une"
      />
    </div>
  );
}

// --- Composant principal du panneau ---

export function ConfigurationPanel() {
  const { selectedNode, setSelectedNode, updateNodeData } = useFlowEditorStore();

  // Si aucun nœud n'est sélectionné, on n'affiche rien.
  if (!selectedNode) {
    return null;
  }

  // Gère le changement du label du nœud.
  const handleLabelChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateNodeData(selectedNode.id, { label: event.target.value });
  };

  // Affiche le formulaire de paramètres approprié en fonction du nom du nœud.
  const renderParamsForm = () => {
    switch (selectedNode.data.name) {
      case 'stop':
        return <StopwordsConfig />;
      // Vous pouvez ajouter d'autres 'case' ici pour d'autres nœuds configurables.
      // case 'synonym':
      //   return <SynonymConfig />;
      default:
        return <p className="no-params-message">Aucun paramètre configurable pour ce nœud.</p>;
    }
  };

  return (
    <aside className="config-panel">
      <button onClick={() => setSelectedNode(null)} className="back-button">
        ← Retour
      </button>

      <h3>Configuration</h3>
      <div className="node-info">
        <span>Type: {selectedNode.data.kind}</span>
        <span>Nom: {selectedNode.data.name}</span>
      </div>
      
      <div className="form-group">
        <label htmlFor="label-input">Label du Nœud</label>
        <input
          id="label-input"
          type="text"
          value={selectedNode.data.label || ''}
          onChange={handleLabelChange}
        />
      </div>

      <div className="form-group">
        <label>Paramètres</label>
        {renderParamsForm()}
      </div>
    </aside>
  );
}
