import { useCallback } from 'react';
import type { DragEvent, MouseEvent } from 'react';
import { useReactFlow, type Node } from 'reactflow';
import { useGraphStore, useUIStore } from '@shared/lib';
import { Kind, type NodeData, type CustomNode as CustomNodeType } from '@shared/types/analyzer.d';

let id = 4; // Simple ID generator
const getUniqueId = () => `${id++}`;

export function useFlowInteractions() {
  const reactFlowInstance = useReactFlow();
  const { addNode, deleteNode } = useGraphStore();
  const { setSelectedNodeId } = useUIStore();

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      const nodeInfoString = event.dataTransfer.getData('application/reactflow');
      if (!nodeInfoString) return;

      const { type, name } = JSON.parse(nodeInfoString);
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      
      const newNodeId = getUniqueId();
      const newNodeData: NodeData = {
        id: newNodeId,
        kind: type as Kind,
        name: name,
        label: name.charAt(0).toUpperCase() + name.slice(1),
      };

      const newNode: CustomNodeType = {
        id: newNodeId,
        type: type,
        position,
        data: newNodeData,
      };

      addNode(newNode);
    },
    [reactFlowInstance, addNode]
  );

  const onNodeClick = useCallback((_event: MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, [setSelectedNodeId]);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, [setSelectedNodeId]);

  const onNodesDelete = useCallback((nodesToDelete: Node[]) => {
      nodesToDelete.forEach(node => deleteNode(node.id));
    }, [deleteNode]
  );

  return { onDragOver, onDrop, onNodeClick, onPaneClick, onNodesDelete };
}