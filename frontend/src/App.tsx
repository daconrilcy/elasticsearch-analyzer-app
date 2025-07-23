import { useMemo, useEffect } from 'react';
import ReactFlow, { Controls, Background, ReactFlowProvider } from 'reactflow';
import { Toaster } from 'react-hot-toast';
import type { CustomNode as CustomNodeType } from './shared/types/analyzer.d';

// --- Imports des Stores ---
import { useGraphStore, useAnalysisStore, useUIStore, useAuthStore } from './features/store';

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
import { AuthPage } from './features/auth/AuthPage';

// --- Import des styles ---
import 'reactflow/dist/style.css';

// Défini en dehors du composant pour la performance
const nodeTypes = {
  input: CustomNode, output: CustomNode, tokenizer: CustomNode,
  char_filter: CustomNode, token_filter: CustomNode,
};

const fitViewOptions = {
  padding: 0.2,
  maxZoom: 1.0,
};

/**
 * Le composant principal de l'éditeur, affiché lorsque l'utilisateur est authentifié.
 */
function FlowEditor() {
  const { graph, onNodesChange, onEdgesChange, onConnect } = useGraphStore();
  const { analysisSteps, isLoading } = useAnalysisStore();
  const { activePanel, setActivePanel, selectedNodeId } = useUIStore();
  
  useDebouncedAnalysis();
  const { onDragOver, onDrop, onNodeClick, onPaneClick, onNodesDelete } = useFlowInteractions();
  const { isValidConnection } = useConnectionValidation();

  const selectedNode = useMemo(
    () => graph.nodes.find((node: CustomNodeType) => node.id === selectedNodeId),
    [graph.nodes, selectedNodeId]
  );

  // Un composant placeholder qui reçoit aussi la prop de visibilité
  const ConfigPlaceholder = ({ isVisible }: { isVisible: boolean }) => (
    <aside className={`config-panel placeholder-panel ${isVisible ? 'visible' : ''}`}>
      <h3>Configuration</h3>
      <p>Sélectionnez un nœud pour voir ses options.</p>
    </aside>
  );

  return (
    <div className="app-container">
      <IconSidebar activePanel={activePanel} setActivePanel={setActivePanel} />
      
      <main className="flow-editor-main">
        <Header />
        
        {/* Le canvas ReactFlow prend toute la place disponible */}
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
            fitViewOptions={fitViewOptions}
          >
            <Controls />
            <Background color="#e0e7ff" gap={24} size={1.5} />
          </ReactFlow>
        </div>

        {/* --- PANNEAUX FLOTTANTS --- */}
        {/* Ils sont toujours rendus, mais leur visibilité est contrôlée par CSS */}
        <Sidebar isVisible={activePanel === 'nodes'} />
        
        {selectedNode ? (
          <ConfigurationPanel 
            key={selectedNode.id} 
            node={selectedNode} 
            isVisible={activePanel === 'config'} 
          />
        ) : (
          <ConfigPlaceholder isVisible={activePanel === 'config'} />
        )}
        
        <ResultPanel 
          steps={analysisSteps} 
          isLoading={isLoading} 
          isVisible={activePanel === 'results'} 
        />
      </main>
    </div>
  );
}

/**
 * Le composant racine qui gère l'authentification et fournit les contextes.
 */
function App() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return <div className="loading-fullscreen">Chargement...</div>;
  }

  return (
    <ReactFlowProvider>
      <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
      {isAuthenticated ? <FlowEditor /> : <AuthPage />}
    </ReactFlowProvider>
  );
}

export default App;
