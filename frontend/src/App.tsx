import { useCallback } from 'react';
import type { DragEvent, MouseEvent } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useReactFlow,
  ReactFlowProvider,
  type Node,
  type Connection,
} from 'reactflow';
import { Toaster } from 'react-hot-toast';

// --- Import des composants et hooks ---
import { useFlowEditorStore } from '@/features/flow-editor/store';
import { useDebouncedAnalysis } from '@/hooks/useDebouncedAnalysis';
import { CustomNode } from '@/features/flow-editor/components/CustomNode';
import { Sidebar } from '@/features/flow-editor/components/Sidebar';
// CORRECTION : Correction des chemins d'importation pour être cohérents
import { ResultPanel } from '@/features/flow-editor/components/ResultPanel';
import { ConfigurationPanel } from '@/features/flow-editor/components/ConfigurationPanel';
import { Header } from '@/features/flow-editor/components/Header';

// --- Import des types ---
import { Kind, type NodeData, type CustomNode as CustomNodeType } from '@/shared/types/analyzer.d';

// --- Import des styles ---
import 'reactflow/dist/style.css';
import './App.css';

let id = 4;
const getUniqueId = () => `${id++}`;

// --- Logique de validation des connexions ---
const NODE_ORDER: Record<string, number> = {
  [Kind.Input]: 0,
  [Kind.CharFilter]: 1,
  [Kind.Tokenizer]: 2,
  [Kind.TokenFilter]: 3,
  [Kind.Output]: 4,
};

// On définit les nodeTypes en dehors du composant pour la performance.
const nodeTypes = {
  input: CustomNode,
  output: CustomNode,
  tokenizer: CustomNode,
  char_filter: CustomNode,
  token_filter: CustomNode,
};

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
    analysisSteps,
    isLoading,
    selectedNode,
    setSelectedNode,
    deleteNode,
  } = useFlowEditorStore();

  // On active l'analyse automatique en temps réel
  useDebouncedAnalysis();

  const reactFlowInstance = useReactFlow();

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

  const onNodesDelete = useCallback(
    (nodesToDelete: Node[]) => {
      nodesToDelete.forEach(node => deleteNode(node.id));
    },
    [deleteNode]
  );
  
  const isValidConnection = useCallback(
    (connection: Connection) => {
      const sourceNode = graph.nodes.find(node => node.id === connection.source);
      const targetNode = graph.nodes.find(node => node.id === connection.target);

      if (!sourceNode || !targetNode) return false;

      const sourceOrder = NODE_ORDER[sourceNode.data.kind];
      const targetOrder = NODE_ORDER[targetNode.data.kind];

      return targetOrder >= sourceOrder;
    },
    [graph.nodes]
  );

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
              onNodesDelete={onNodesDelete}
              isValidConnection={isValidConnection}
              fitView
            >
              <Controls />
              <Background />
            </ReactFlow>
          </div>
        </div>
        <ResultPanel steps={analysisSteps} isLoading={isLoading} />
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
