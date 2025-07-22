import { useMemo } from 'react';
import ReactFlow, { Controls, Background, ReactFlowProvider } from 'reactflow';
import { Toaster } from 'react-hot-toast';
import type { CustomNode as CustomNodeType } from './shared/types/analyzer.d';

// --- Imports des Stores ---
import { useGraphStore, useAnalysisStore, useUIStore } from './features/store';

// --- Imports des Hooks ---
import { useDebouncedAnalysis } from './hooks/useDebouncedAnalysis';
import { useFlowInteractions } from './hooks/useFlowInteractions';
import { useConnectionValidation } from './hooks/useConnectionValidation';

// --- Imports des Composants ---
import { CustomNode } from './features/components/CustomNode';
import { Sidebar } from './features/components/Sidebar';
import { ResultPanel } from './features/components/ResultPanel';
import { ConfigurationPanel } from './features/components/ConfigurationPanel';
import { Header } from './features/components/Header';
import { IconSidebar } from './features/components/IconSidebar';

// --- Import des styles ---
import 'reactflow/dist/style.css';

// Défini en dehors du composant pour éviter les re-créations inutiles (optimisation)
const nodeTypes = {
  input: CustomNode,
  output: CustomNode,
  tokenizer: CustomNode,
  char_filter: CustomNode,
  token_filter: CustomNode,
};

function FlowEditor() {
  // --- Récupération de l'état depuis les stores ---
  const { graph, onNodesChange, onEdgesChange, onConnect } = useGraphStore();
  const { analysisSteps, isLoading } = useAnalysisStore();
  const { activePanel, setActivePanel, selectedNodeId } = useUIStore();
  
  // --- Hooks personnalisés pour la logique métier ---
  useDebouncedAnalysis();
  const { onDragOver, onDrop, onNodeClick, onPaneClick, onNodesDelete } = useFlowInteractions();
  const { isValidConnection } = useConnectionValidation();

  const selectedNode = useMemo(
    () => graph.nodes.find((node: CustomNodeType) => node.id === selectedNodeId),
    [graph.nodes, selectedNodeId]
  );

  // Un composant simple pour le cas où aucun nœud n'est sélectionné
  const ConfigPlaceholder = () => (
    <div className="placeholder-panel">
      <h3>Configuration</h3>
      <p>Sélectionnez un nœud pour voir ses options.</p>
    </div>
  );

  return (
    <div className="app-container">
      <IconSidebar activePanel={activePanel} setActivePanel={setActivePanel} />
      
      <main className="flow-editor-main">
        <Header />
        <div className="content-wrapper">
          {/* Les panneaux latéraux (Sidebar, ConfigurationPanel) sont affichés ici */}
          {activePanel === 'nodes' && <Sidebar />}
          {activePanel === 'config' && (selectedNode ? <ConfigurationPanel key={selectedNode.id} node={selectedNode} /> : <ConfigPlaceholder />)}
          
          {/* Le conteneur principal pour le canvas React Flow */}
          {/* Il a `position: relative` grâce à la classe .main-content */}
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
              isValidConnection={isValidConnection}
              fitView
            >
              <Controls style={{ bottom: 20, left: 20 }} />
              <Background color="#e0e7ff" gap={24} size={1.5} />
            </ReactFlow>
            
            {/* --- POSITIONNEMENT CLÉ ---
              En plaçant le ResultPanel ici, il devient un enfant de .main-content.
              Comme .main-content a `position: relative` et que .result-panel a `position: absolute`,
              le panneau de résultats se positionnera par rapport à son parent (le canvas)
              et flottera au-dessus, comme souhaité.
            */}
            {activePanel === 'results' && <ResultPanel steps={analysisSteps} isLoading={isLoading} />}
          </div>
        </div>
      </main>
    </div>
  );
}

// Le composant racine qui fournit le contexte React Flow
export default function App() {
  return (
    <ReactFlowProvider>
      <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
      <FlowEditor />
    </ReactFlowProvider>
  );
}
