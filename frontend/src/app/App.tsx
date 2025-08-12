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
import { DatasetListPage } from '@features/datasets';
import { DatasetDetailPage } from '@features/datasets';

import 'reactflow/dist/style.css';
import styles from './App.module.scss'
import confPanel from '@features/analyzers/components/ConfigurationPanel.module.scss'

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
        <aside className={`${confPanel.configPanel} ${confPanel.placeholderPanel} ${isVisible ? 'visible' : ''}`}>
            <h3>Configuration</h3>
            <p>Sélectionnez un nœud pour voir ses options.</p>
        </aside>
    );

    // --- CORRECTION : La structure originale est restaurée ici ---
    // Cet élément <main> fournit le contexte de positionnement pour les panneaux.
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

function App() {
    const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
    const { resetGraph } = useGraphStore();
    const { resetUI } = useUIStore();

    useEffect(() => { 
        checkAuth(); 
    }, [checkAuth]);

    // Nettoyer l'état lors de la déconnexion
    useEffect(() => {
        if (!isAuthenticated && !isLoading) {
            resetGraph();
            resetUI();
        }
    }, [isAuthenticated, isLoading, resetGraph, resetUI]);

    if (isLoading) { return <div className={styles.loadingFullscreen}>Chargement...</div>; }

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