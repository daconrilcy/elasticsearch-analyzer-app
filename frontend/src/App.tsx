import { useMemo, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ReactFlow, { Controls, Background, ReactFlowProvider } from 'reactflow';
import { Toaster } from 'react-hot-toast';
import type { CustomNode as CustomNodeType } from './shared/types/analyzer.d';

// --- Stores & Hooks ---
import { useGraphStore, useUIStore, useAuthStore } from './features/store';
import { useDebouncedAnalysis } from './hooks/useDebouncedAnalysis';
import { useFlowInteractions } from './hooks/useFlowInteractions';
import { useConnectionValidation } from './hooks/useConnectionValidation';

// --- Composants ---
import { CustomNode } from './features/components/CustomNode';
import { Sidebar } from './features/components/Sidebar';
import { ResultPanel } from './features/components/ResultPanel';
import { ConfigurationPanel } from './features/components/ConfigurationPanel';
import { Header } from './features/layout/Header';
import { IconSidebar } from './features/layout/IconSidebar';

// --- Pages ---
import { AuthPage } from './pages/auth/AuthPage';
import { DatasetListPage } from './pages/DatasetListPage';
import { DatasetDetailPage } from './pages/DatasetDetail';

import 'reactflow/dist/style.css';

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
    const selectedNode = useMemo(() => graph.nodes.find((node: CustomNodeType) => node.id === selectedNodeId), [graph.nodes, selectedNodeId]);

    const ConfigPlaceholder = ({ isVisible }: { isVisible: boolean }) => (
        <aside className={`config-panel placeholder-panel ${isVisible ? 'visible' : ''}`}>
            <h3>Configuration</h3>
            <p>Sélectionnez un nœud pour voir ses options.</p>
        </aside>
    );

    // --- CORRECTION : La structure originale est restaurée ici ---
    // Cet élément <main> fournit le contexte de positionnement pour les panneaux.
    return (
        <main className="flow-editor-main">
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
                    fitView fitViewOptions={fitViewOptions}>
                    <Controls />
                    <Background color="#e0e7ff" gap={24} size={1.5} />
                </ReactFlow>
            </div>
            <Sidebar isVisible={activePanel === 'nodes'} />
            {selectedNode ? <ConfigurationPanel key={selectedNode.id} node={selectedNode} isVisible={activePanel === 'config'} /> : <ConfigPlaceholder isVisible={activePanel === 'config'} />}
            <ResultPanel isVisible={activePanel === 'results'} />
        </main>
    );
}

function App() {
    const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

    useEffect(() => { checkAuth(); }, [checkAuth]);

    if (isLoading) { return <div className="loading-fullscreen">Chargement...</div>; }

    return (
        <Router>
            <ReactFlowProvider>
                <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
                {!isAuthenticated ? (
                    <Routes>
                        <Route path="*" element={<AuthPage />} />
                    </Routes>
                ) : (
                    // --- CORRECTION : Nouvelle structure de mise en page globale ---
                    <div className="app-container">
                        <IconSidebar />
                        <div className="page-container">
                            <Header />
                            <main className="page-content">
                                <Routes>
                                    <Route path="/" element={<Navigate to="/analyzer" replace />} />
                                    <Route path="/analyzer" element={<AnalyzerPage />} />
                                    <Route path="/datasets" element={<DatasetListPage />} />
                                    <Route path="/datasets/:datasetId" element={<DatasetDetailPage />} />
                                </Routes>
                            </main>
                        </div>
                    </div>
                )}
            </ReactFlowProvider>
        </Router>
    );
}

export default App;