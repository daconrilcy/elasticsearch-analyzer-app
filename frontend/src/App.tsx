import { useMemo, useCallback } from 'react';
import type { DragEvent, MouseEvent } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useReactFlow,
  ReactFlowProvider,
  type Node,
} from 'reactflow';
import { Toaster } from 'react-hot-toast';

// --- Import des composants avec des chemins relatifs ---
import { useFlowEditorStore } from './features/flow-editor/store';
import { CustomNode } from './features/flow-editor/components/CustomNode';
import { Sidebar } from './features/flow-editor/components/Sidebar';
import { ResultPanel } from './features/flow-editor/components/ResultPanel';
import { ConfigurationPanel } from './features/flow-editor/components/ConfigurationPanel';
import { Header } from './features/flow-editor/components/Header';

// --- Import des types avec des chemins relatifs ---
import { Kind, type NodeData, type CustomNode as CustomNodeType } from './shared/types/analyzer.d';

// --- Import des styles ---
import 'reactflow/dist/style.css';
import './App.css';

let id = 4;
const getUniqueId = () => `${id++}`;

/**
 * Le composant principal de l'éditeur qui contient toute la logique d'affichage.
 */
function FlowEditor() {
  const { 
    graph, 
    onNodesChange, 
    onEdgesChange, 
    onConnect, 
    addNode,
    analysisResult,
    isLoading,
    analyze,
    selectedNode,
    setSelectedNode,
  } = useFlowEditorStore();

  const reactFlowInstance = useReactFlow();

  const nodeTypes = useMemo(() => ({
    input: CustomNode,
    output: CustomNode,
    tokenizer: CustomNode,
    char_filter: CustomNode,
    token_filter: CustomNode,
  }), []);

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      const nodeInfoString = event.dataTransfer.getData('application/reactflow');
      if (!nodeInfoString) return;
      
      const nodeInfo = JSON.parse(nodeInfoString);
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNodeId = getUniqueId();
      const newNodeData: NodeData = {
        id: newNodeId,
        kind: nodeInfo.type as Kind,
        name: nodeInfo.name,
        label: nodeInfo.name.charAt(0).toUpperCase() + nodeInfo.name.slice(1),
      };

      const newNode: CustomNodeType = {
        id: newNodeId,
        type: nodeInfo.type,
        position,
        data: newNodeData,
      };

      addNode(newNode);
    },
    [reactFlowInstance, addNode]
  );

  const onNodeClick = useCallback((_event: MouseEvent, node: Node) => {
    setSelectedNode(node as CustomNodeType);
  }, [setSelectedNode]);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);

  return (
    <div className="app-container">
      <Header />
      <div className="dnd-flow">
        {selectedNode ? <ConfigurationPanel /> : <Sidebar />}
        
        <div className="main-content">
          <div className="reactflow-wrapper" onDragOver={onDragOver} onDrop={onDrop}>
            <ReactFlow
              nodes={graph.nodes}
              edges={graph.edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              fitView
            >
              <Controls />
              <Background />
            </ReactFlow>
          </div>
          <button className="analyze-button" onClick={analyze} disabled={isLoading}>
            {isLoading ? 'Analyse en cours...' : 'Analyser le Texte'}
          </button>
        </div>
        <ResultPanel tokens={analysisResult.tokens} isLoading={isLoading} />
      </div>
    </div>
  );
}

/**
 * Le composant racine de l'application.
 * Il fournit le contexte pour React Flow et le système de notifications.
 */
export default function App() {
  return (
    <ReactFlowProvider>
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
      <FlowEditor />
    </ReactFlowProvider>
  );
}
