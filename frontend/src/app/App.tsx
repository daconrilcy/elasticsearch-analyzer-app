import { useMemo, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ReactFlow, { Controls, Background, ReactFlowProvider } from 'reactflow';
import { Toaster } from 'react-hot-toast';
import type { CustomNode as CustomNodeType } from '@shared/types';

// --- Stores & Hooks ---
import { useGraphStore, useUIStore, useAuthStore } from '@shared/lib';
import { useDebouncedAnalysis, useFlowInteractions, useConnectionValidation } from '@shared/hooks';

// --- Composants ---
import { CustomNode, Sidebar, ResultPanel, ConfigurationPanel } from '@features/analyzers';
import { Header, IconSidebar } from '@shared/ui';
import { FilePreview } from '@features/preview';

// --- Pages ---
import { AuthPage } from '@pages/auth/AuthPage';
import { DatasetListPage, DatasetDetailPage } from '@features/datasets';

// 👉 Workbench (version de travail)
import { MappingWorkbenchV2 } from '@features/mappings/components/MappingWorkbenchV2';

// 👉 Démos Mapping
import { MappingStudioV2Demo, MappingWorkbenchV2Demo, MicroIterationsDemo, OperationEditorDemo, UnifiedDiffViewDemo } from '@features/mappings/demo';

import 'reactflow/dist/style.css';
import styles from './App.module.scss';
import confPanel from '@features/analyzers/components/ConfigurationPanel.module.scss';

const nodeTypes = {
  input: CustomNode,
  output: CustomNode,
  tokenizer: CustomNode,
  char_filter: CustomNode,
  token_filter: CustomNode,
};

const fitViewOptions = { padding: 0.2, maxZoom: 1.0 };

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
    <aside className={`${confPanel.configPanel} ${confPanel.placeholderPanel} ${isVisible ? 'visible' : ''}`}>
      <h3>Configuration</h3>
      <p>Sélectionnez un nœud pour voir ses options.</p>
    </aside>
  );

  return (
    <main className={styles.flowEditorMain}>
      <div className={styles.mainContent} onDragOver={onDragOver} onDrop={onDrop}>
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
        <ConfigurationPanel key={selectedNode.id} node={selectedNode} isVisible={activePanel === 'config'} />
      ) : (
        <ConfigPlaceholder isVisible={activePanel === 'config'} />
      )}

      <ResultPanel isVisible={activePanel === 'results'} />
    </main>
  );
}

function FilePreviewPage() {
  const [fileId, setFileId] = useState<string>('');
  const [inputValue, setInputValue] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setFileId(inputValue.trim());
    }
  };

  return (
    <div className={styles.filePreviewPage}>
      <div className={styles.filePreviewHeader}>
        <h1>Prévisualisation de Fichiers</h1>
        <p>Collez un UUID de fichier pour commencer la prévisualisation</p>

        <form onSubmit={handleSubmit} className={styles.fileIdForm}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Entrez l'UUID du fichier..."
            className={styles.fileIdInput}
          />
          <button type="submit" className={styles.fileIdButton}>
            Charger
          </button>
        </form>
      </div>

      {fileId && <FilePreview fileId={fileId} />}
    </div>
  );
}

// --- Page Workbench de travail (props par défaut) ---
function WorkbenchPage() {
  const defaultMapping = {
    name: 'contacts_mapping',
    version: '2.2',
    fields: [
      { 
        name: 'full_name', 
        type: 'text', 
        pipeline: [
          { id: 'op1', type: 'trim', config: {} },
          { id: 'op2', type: 'cast', config: { to: 'string' } }
        ] 
      },
      { 
        name: 'email', 
        type: 'keyword', 
        pipeline: [
          { id: 'op3', type: 'regex_replace', config: { pattern: '\\s+', replacement: '', flags: 'g' } }
        ] 
      },
      { 
        name: 'age', 
        type: 'integer', 
        pipeline: [
          { id: 'op4', type: 'cast', config: { to: 'number' } },
          { id: 'op5', type: 'filter', config: { condition: 'range', min: 0, max: 150 } }
        ] 
      },
    ],
  };

  const defaultSample = [
    { full_name: 'John Doe', email: 'john@example.com', age: 30 },
    { full_name: 'Jane Smith', email: 'jane@example.com', age: 25 },
  ];

  return <MappingWorkbenchV2 mapping={defaultMapping} sampleData={defaultSample} />;
}

function App() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const { resetGraph } = useGraphStore();
  const { resetUI } = useUIStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      resetGraph();
      resetUI();
    }
  }, [isAuthenticated, isLoading, resetGraph, resetUI]);

  if (isLoading) {
    return <div className={styles.loadingFullscreen}>Chargement...</div>;
  }

  return (
    <Router>
      <ReactFlowProvider>
        <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
        {!isAuthenticated ? (
          <Routes>
            <Route path="*" element={<AuthPage />} />
          </Routes>
        ) : (
          <div className={styles.appContainer}>
            <div className={styles.pageContainer}>
              <Header />
              <main className={styles.pageContent}>
                <Routes>
                  <Route path="/" element={<Navigate to="/analyzer" replace />} />
                  <Route path="/analyzer" element={<AnalyzerPage />} />
                  <Route path="/datasets" element={<DatasetListPage />} />
                  <Route path="/datasets/:datasetId" element={<DatasetDetailPage />} />
                  <Route path="/preview" element={<FilePreviewPage />} />

                  {/* Workbench – version de travail */}
                  <Route path="/mappings/workbench" element={<WorkbenchPage />} />

                  {/* Démos Mapping */}
                  <Route path="/demo/studio" element={<MappingStudioV2Demo />} />
                  <Route path="/demo/workbench" element={<MappingWorkbenchV2Demo />} />
                  <Route path="/demo/micro-iterations" element={<MicroIterationsDemo />} />
                  <Route path="/demo/operation-editor" element={<OperationEditorDemo />} />
                  <Route path="/demo/unified-diff" element={<UnifiedDiffViewDemo />} />
                </Routes>
              </main>
            </div>
            <IconSidebar />
          </div>
        )}
      </ReactFlowProvider>
    </Router>
  );
}

export default App;
