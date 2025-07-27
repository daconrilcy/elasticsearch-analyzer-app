import { useMemo, useEffect } from 'react';
import ReactFlow, { Controls, Background, ReactFlowProvider } from 'reactflow';
import { Toaster } from 'react-hot-toast';
import type { CustomNode as CustomNodeType } from './shared/types/analyzer.d';

// --- Imports des Stores ---
import { useGraphStore, useUIStore, useAuthStore } from './features/store';

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
import { ImportDataWizard } from './pages/ImportDataWizard';

// --- Import des styles ---
import 'reactflow/dist/style.css';

const nodeTypes = {
  input: CustomNode,
  output: CustomNode,
  tokenizer: CustomNode,
  char_filter: CustomNode,
  token_filter: CustomNode,
};

const fitViewOptions = {
  padding: 0.2,
  maxZoom: 1.0,
};

/**
 * Page principale de l'éditeur d'analyseur.
 */
function AnalyzerPage() {
  const { graph, onNodesChange, onEdgesChange, onConnect } = useGraphStore();
  const { activePanel, selectedNodeId } = useUIStore();

  useDebouncedAnalysis();
  const { onDragOver, onDrop, onNodeClick, onPaneClick, onNodesDelete } = useFlowInteractions();
  const { isValidConnection } = useConnectionValidation();

  const selectedNode = useMemo(
    () => graph.nodes.find((node: CustomNodeType) => node.id === selectedNodeId),
    [graph.nodes, selectedNodeId]
  );

  const ConfigPlaceholder = ({ isVisible }: { isVisible: boolean }) => (
    <aside className={`config-panel placeholder-panel ${isVisible ? 'visible' : ''}`}>
      <h3>Configuration</h3>
      <p>Sélectionnez un nœud pour voir ses options.</p>
    </aside>
  );

  return (
    <main className="flow-editor-main">
      <Header />
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
      <ResultPanel isVisible={activePanel === 'results'} />
    </main>
  );
}

/**
 * Composant racine qui gère l'authentification et le routage des pages.
 */
function App() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const { activePage } = useUIStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return <div className="loading-fullscreen">Chargement...</div>;
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <ReactFlowProvider>
      <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
      <div className="app-container">
        <IconSidebar />
        {activePage === 'analyzer' && <AnalyzerPage />}
        {activePage === 'importer' && <ImportDataWizard />}
      </div>
    </ReactFlowProvider>
  );
}

export default App;
