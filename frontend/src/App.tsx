import { useMemo } from 'react';
import ReactFlow, { Controls, Background, ReactFlowProvider } from 'reactflow';
import { Toaster } from 'react-hot-toast';

// --- Import des Stores (via le fichier baril pour la propreté) ---
import {
  useGraphStore,
  useAnalysisStore,
  useUIStore
} from './features/store/index'; // <- L'import est maintenant unifié et plus propre

// --- Import des Hooks personnalisés ---
import { useDebouncedAnalysis } from './hooks/useDebouncedAnalysis';
import { useFlowInteractions } from './hooks/useFlowInteractions';

// --- Import des Composants ---
import { CustomNode } from './features/components/CustomNode';
import { Sidebar } from './features/components/Sidebar';
import { ResultPanel } from './features/components/ResultPanel';
import { ConfigurationPanel } from './features/components/ConfigurationPanel';
import { Header } from './features/components/Header';
import { IconSidebar } from './features/components/IconSidebar';

// --- Import des styles ---
import 'reactflow/dist/style.css';

// --- Constantes de configuration ---
const nodeTypes = {
  input: CustomNode,
  output: CustomNode,
  tokenizer: CustomNode,
  char_filter: CustomNode,
  token_filter: CustomNode,
};

/**
 * Le composant principal de l'éditeur de flux.
 * Il assemble les composants et connecte les stores et les hooks.
 */
function FlowEditor() {
  // --- Lecture depuis les stores ---
  const { graph, onNodesChange, onEdgesChange, onConnect } = useGraphStore();
  const { analysisSteps, isLoading } = useAnalysisStore();
  const { activePanel, setActivePanel, selectedNodeId } = useUIStore();
  
  // --- Logique extraite dans les hooks ---
  useDebouncedAnalysis();
  const { onDragOver, onDrop, onNodeClick, onPaneClick, onNodesDelete } = useFlowInteractions();

  // On retrouve le noeud sélectionné à partir de son ID et de la liste des noeuds
  const selectedNode = useMemo(
    () => graph.nodes.find(node => node.id === selectedNodeId),
    [graph.nodes, selectedNodeId]
  );

  const ConfigPlaceholder = () => (
    <div className="placeholder-panel">
      <h3>Configuration</h3>
      <p>Sélectionnez un nœud sur le canvas pour voir ses options.</p>
    </div>
  );

  return (
    <div className="app-container">
      <IconSidebar activePanel={activePanel} setActivePanel={setActivePanel} />
      
      <main className="flow-editor-main">
        <Header />
        <div className="content-wrapper">
          {activePanel === 'nodes' && <Sidebar />}
          {activePanel === 'config' && (selectedNode ? <ConfigurationPanel key={selectedNode.id} node={selectedNode} /> : <ConfigPlaceholder />)}
          
          <div className="main-content" onDragOver={onDragOver} onDrop={onDrop}>
            <ReactFlow
              nodes={graph.nodes}
              edges={graph.edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              onNodesDelete={onNodesDelete}
              nodeTypes={nodeTypes}
              fitView
            >
              <Controls style={{ bottom: 20, left: 20 }} />
              <Background color="#e0e7ff" gap={24} size={1.5} />
            </ReactFlow>
          </div>
          
          {activePanel === 'results' && <ResultPanel steps={analysisSteps} isLoading={isLoading} />}
        </div>
      </main>
    </div>
  );
}

/**
 * Le composant racine de l'application qui fournit les contextes nécessaires.
 */
export default function App() {
  return (
    <ReactFlowProvider>
      <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
      <FlowEditor />
    </ReactFlowProvider>
  );
}