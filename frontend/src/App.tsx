import { useState, useCallback } from 'react';
import type { DragEvent, MouseEvent } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useReactFlow,
  ReactFlowProvider,
  type Node,
  type Connection,
  type EdgeTypes,
  type DefaultEdgeOptions,
} from 'reactflow';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';

// --- Import des composants et hooks ---
import { useFlowEditorStore } from './features/store';
import { useDebouncedAnalysis } from './hooks/useDebouncedAnalysis';
import { CustomNode } from './features/components/CustomNode';
import { Sidebar } from './features/components/Sidebar';
import { ResultPanel } from './features/components/ResultPanel';
import { ConfigurationPanel } from './features/components/ConfigurationPanel';
import { Header } from './features/components/Header';
import { IconSidebar } from './features/components/IconSidebar';

// --- Import des types et de la logique de validation ---
import { Kind, type NodeData, type CustomNode as CustomNodeType } from './shared/types/analyzer.d';
import { isFilterCompatible } from './registry/componentRegistry';

// --- Import des styles ---
import 'reactflow/dist/style.css';

// --- Constantes et Helpers ---
let id = 4;
const getUniqueId = () => `${id++}`;

const NODE_ORDER: Record<string, number> = {
  [Kind.Input]: 0,
  [Kind.CharFilter]: 1,
  [Kind.Tokenizer]: 2,
  [Kind.TokenFilter]: 3,
  [Kind.Output]: 4,
};

const nodeTypes = {
  input: CustomNode,
  output: CustomNode,
  tokenizer: CustomNode,
  char_filter: CustomNode,
  token_filter: CustomNode,
};

const edgeTypes: EdgeTypes = {};

// Ces options sont pour la prévisualisation de la connexion pendant le drag.
// La logique finale est gérée dans le store.
const defaultEdgeOptions: DefaultEdgeOptions = {
    type: 'smoothstep',
    // @ts-ignore - 'borderRadius' est une prop valide pour 'smoothstep'
    borderRadius: 200,
};

/**
 * Le composant principal de l'éditeur avec le layout et la logique finale.
 */
function FlowEditor() {
  const {
    graph,
    onNodesChange,
    onEdgesChange,
    onConnect, // Utilise la fonction onConnect directement depuis le store
    addNode,
    analysisSteps,
    isLoading,
    selectedNode,
    setSelectedNode,
    deleteNode,
  } = useFlowEditorStore();

  useDebouncedAnalysis();

  const [activePanel, setActivePanel] = useState('nodes');
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
    setActivePanel('config');
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
      if (targetOrder < sourceOrder) {
        toast.error(`Connexion invalide : un '${sourceNode.data.kind}' doit précéder un '${targetNode.data.kind}'.`);
        return false;
      }

      if (targetNode.data.kind === Kind.TokenFilter) {
        const tokenizerNode = graph.nodes.find(n => n.data.kind === Kind.Tokenizer);
        if (!tokenizerNode) {
          toast.error("Veuillez d'abord ajouter un tokenizer avant d'ajouter un token filter.");
          return false;
        }
        if (!isFilterCompatible(tokenizerNode.data.name, targetNode.data.name)) {
          toast.error(`Le filtre '${targetNode.data.name}' n'est pas compatible avec le tokenizer '${tokenizerNode.data.name}'.`);
          return false;
        }
      }
      return true;
    },
    [graph.nodes]
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
          {activePanel === 'config' && (selectedNode ? <ConfigurationPanel /> : <ConfigPlaceholder />)}
          
          <div className="main-content" onDragOver={onDragOver} onDrop={onDrop}>
            <ReactFlow
              nodes={graph.nodes}
              edges={graph.edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              onNodesDelete={onNodesDelete}
              isValidConnection={isValidConnection}
              fitView
              defaultEdgeOptions={defaultEdgeOptions}
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
 * Le composant racine de l'application.
 */
export default function App() {
  return (
    <ReactFlowProvider>
      <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
      <FlowEditor />
    </ReactFlowProvider>
  );
}