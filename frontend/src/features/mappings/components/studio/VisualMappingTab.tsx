import React, { useState, useCallback } from 'react';
import ReactFlow, {
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { TargetNode } from './TargetNode';
import styles from './VisualMappingTab.module.scss';

interface MappingField {
  target?: string;
  type?: string;
}

interface Mapping {
  fields?: MappingField[];
  [key: string]: unknown;
}

interface VisualMappingTabProps {
  mapping: Mapping;
  onMappingChange: (mapping: Mapping) => void;
}

const nodeTypes: NodeTypes = {
  target: TargetNode,
};

export const VisualMappingTab: React.FC<VisualMappingTabProps> = ({
  mapping,
  onMappingChange,
}) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  // Gestion des changements de nœuds
  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  // Gestion des changements d'arêtes
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  // Gestion des connexions
  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    []
  );

  // Ajouter un nouveau nœud cible
  const handleAddTargetNode = useCallback(() => {
    const newNode: Node = {
      id: `target-${Date.now()}`,
      type: 'target',
      position: { x: Math.random() * 400, y: Math.random() * 300 },
      data: {
        label: 'Nouveau champ',
        es_type: 'keyword',
        onNameChange: (nodeId: string, value: string) => {
          setNodes((nds) =>
            nds.map((node) =>
              node.id === nodeId
                ? { ...node, data: { ...node.data, label: value } }
                : node
            )
          );
        },
        onTypeChange: (nodeId: string, value: string) => {
          setNodes((nds) =>
            nds.map((node) =>
              node.id === nodeId
                ? { ...node, data: { ...node.data, es_type: value } }
                : node
            )
          );
        },
      },
    };

    setNodes((nds) => [...nds, newNode]);
  }, []);

  // Convertir les nœuds en structure de mapping
  const convertToMapping = useCallback(() => {
    const fields = nodes
      .filter((node) => node.type === 'target')
      .map((node) => ({
        target: node.data.label,
        type: node.data.es_type || 'keyword',
      }));

    const newMapping = {
      ...mapping,
      fields,
    };

    onMappingChange(newMapping);
  }, [nodes, mapping, onMappingChange]);

  // Charger le mapping existant dans la vue visuelle
  const loadExistingMapping = useCallback(() => {
    if (mapping?.fields && mapping.fields.length > 0) {
      const existingNodes: Node[] = mapping.fields.map((field: MappingField, index: number) => ({
        id: `target-${index}`,
        type: 'target',
        position: { x: 100 + index * 200, y: 100 },
        data: {
          label: field.target || 'Champ',
          es_type: field.type || 'keyword',
          onNameChange: (nodeId: string, value: string) => {
            setNodes((nds) =>
              nds.map((node) =>
                node.id === nodeId
                  ? { ...node, data: { ...node.data, label: value } }
                  : node
              )
            );
          },
          onTypeChange: (nodeId: string, value: string) => {
            setNodes((nds) =>
              nds.map((node) =>
                node.id === nodeId
                  ? { ...node, data: { ...node.data, es_type: value } }
                  : node
              )
            );
          },
        },
      }));

      setNodes(existingNodes);
    }
  }, [mapping]);

  // Charger le mapping existant au montage
  React.useEffect(() => {
    loadExistingMapping();
  }, [loadExistingMapping]);

  return (
    <div className={styles.visualMappingTab}>
      <div className={styles.header}>
        <h3>🎨 Mapping Visuel</h3>
        <p>Créez votre mapping Elasticsearch de manière visuelle avec des nœuds connectables</p>
      </div>

      <div className={styles.controls}>
        <button
          onClick={handleAddTargetNode}
          className={styles.addButton}
          title="Ajouter un champ cible"
        >
          ➕ Ajouter un champ
        </button>
        <button
          onClick={convertToMapping}
          className={styles.convertButton}
          title="Convertir en mapping"
          disabled={nodes.length === 0}
        >
          🔄 Convertir en mapping
        </button>
        <button
          onClick={loadExistingMapping}
          className={styles.loadButton}
          title="Recharger le mapping existant"
        >
          📥 Recharger
        </button>
      </div>

      <div className={styles.stats}>
        <span>📊 Champs : {nodes.filter(n => n.type === 'target').length}</span>
        <span>🔗 Connexions : {edges.length}</span>
      </div>

      <div className={styles.flowContainer}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          className={styles.reactFlow}
        >
          <Controls />
          <Background color="#e0e7ff" gap={24} size={1.5} />
        </ReactFlow>
      </div>

      {nodes.length === 0 && (
        <div className={styles.emptyState}>
          <p>🎯 Aucun champ défini</p>
          <p>Commencez par ajouter votre premier champ de mapping</p>
          <button onClick={handleAddTargetNode} className={styles.emptyStateButton}>
            ➕ Ajouter un champ
          </button>
        </div>
      )}
    </div>
  );
};

export default VisualMappingTab;
