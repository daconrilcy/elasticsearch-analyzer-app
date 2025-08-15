import React, { useState, useEffect, useCallback } from 'react'; // 'useMemo' removed
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ReactFlow, {
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from 'reactflow';
import type {
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  Connection,
  NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import styles from './CreateMappingModal.module.scss'

import { createMapping, getFileDetails } from '@shared/lib';
import type { FileDetailOut, MappingCreate, MappingRule, FileOut } from '@shared/types';
import { TargetNode } from './studio/TargetNode';
import { OperationEditor, type Operation as OperationEditorOperation } from './studio/OperationEditor';
// import './CreateMappingModal.scss';

interface CreateMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: FileOut;
  datasetId: string;
}

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];
const nodeTypes: NodeTypes = { target: TargetNode };

export const CreateMappingModal: React.FC<CreateMappingModalProps> = ({ isOpen, onClose, file, datasetId }) => {
    const queryClient = useQueryClient();
    const [nodes, setNodes] = useState<Node[]>(initialNodes);
    const [edges, setEdges] = useState<Edge[]>(initialEdges);
    const [mappingName, setMappingName] = useState('');
    const [operations, setOperations] = useState<OperationEditorOperation[]>([]);
    const [showOperations, setShowOperations] = useState(false);

    const { data: fileDetails, isLoading: isFileLoading } = useQuery<FileDetailOut, Error>({
        queryKey: ['fileDetails', file.id],
        queryFn: () => getFileDetails(file.id),
        enabled: isOpen,
    });

    // --- CORRECTION ---
    // This effect now correctly depends on `fileDetails` (from the API) instead of `file` (the prop).
    useEffect(() => {
        if (fileDetails?.inferred_schema) {
            const sourceNodes: Node[] = Object.entries(fileDetails.inferred_schema).map(([fieldName, fieldType], index) => ({
                id: `source-${fieldName}`, type: 'input', data: { label: `${fieldName} (${String(fieldType)})` },
                position: { x: 50, y: index * 60 }, deletable: false,
            }));
            setNodes(sourceNodes);
            setEdges([]);
            setMappingName(`Mapping pour ${fileDetails.filename_original}`);
        }
    }, [fileDetails]); // Dependency is now on the fetched data

    const onNodesChange: OnNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
    const onEdgesChange: OnEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);
    const onConnect: OnConnect = useCallback((connection: Connection) => setEdges((eds) => addEdge(connection, eds)), []);

    const updateNodeData = (nodeId: string, newData: Partial<{ label: string; es_type: string }>) => {
        setNodes((nds) => nds.map((node) => (node.id === nodeId) ? { ...node, data: { ...node.data, ...newData } } : node));
    };
    const onNodeNameChange = (nodeId: string, newName: string) => updateNodeData(nodeId, { label: newName });
    const onNodeTypeChange = (nodeId: string, newType: string) => updateNodeData(nodeId, { es_type: newType });

    const createMappingMutation = useMutation({
        mutationFn: (mappingData: MappingCreate) => createMapping(datasetId, mappingData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dataset', datasetId] });
            onClose();
        },
        onError: (error) => console.error("Erreur:", error),
    });
    
    const handleAddTargetNode = () => {
        const newNodeId = `target-${Date.now()}`;
        const newNode: Node = {
          id: newNodeId, type: 'target',
          data: { label: 'NouveauChamp', es_type: 'keyword', onNameChange: onNodeNameChange, onTypeChange: onNodeTypeChange },
          position: { x: 400, y: (nodes.filter(n => n.type === 'target').length) * 100 },
        };
        setNodes((nds) => [...nds, newNode]);
    };

    const handleAddOperation = () => {
        const newOperation: OperationEditorOperation = {
            op: 'cast',
            to: 'string'
        };
        setOperations(prev => [...prev, newOperation]);
    };

    const handleOperationChange = (index: number, updatedOperation: OperationEditorOperation) => {
        setOperations(prev => prev.map((op, i) => i === index ? updatedOperation : op));
    };

    const handleOperationRemove = (index: number) => {
        setOperations(prev => prev.filter((_, i) => i !== index));
    };

    const handleSaveMapping = () => {
        if (!fileDetails || !mappingName) return;
        const mappingRules: MappingRule[] = edges.map(edge => {
          const sourceNode = nodes.find(node => node.id === edge.source)!;
          const targetNode = nodes.find(node => node.id === edge.target)!;
          return {
            source: sourceNode.data.label.split(' ')[0],
            target: targetNode.data.label,
            es_type: targetNode.data.es_type || 'keyword',
          };
        });
        createMappingMutation.mutate({ name: mappingName, source_file_id: fileDetails.id, mapping_rules: mappingRules });
    };

    if (!isOpen) return null;

    return (
        <div className="modalOverlay">
          <div className="modalContent">
            <header className="modalHeader">
              <h2>Créer un Mapping</h2>
              <button onClick={onClose} className="closeButton">&times;</button>
            </header>
            {isFileLoading ? (
              <div>Chargement des détails du fichier...</div>
            ) : fileDetails ? (
              <>
                <main className="modalBody">
                   <p className={styles['file-info']}>Fichier source : <strong>{fileDetails.filename_original}</strong></p>
                   <div className={styles['mapping-form']}>
                     <input
                      type="text"
                       className={styles['mapping-name-input']}
                      value={mappingName}
                      onChange={(e) => setMappingName(e.target.value)}
                      placeholder="Nom du mapping"
                      />
                   </div>
                  <div className={styles['flow-container']}>
                    <ReactFlow
                      nodes={nodes}
                      edges={edges}
                      onNodesChange={onNodesChange}
                      onEdgesChange={onEdgesChange}
                      onConnect={onConnect}
                      nodeTypes={nodeTypes}
                      fitView
                    >
                      <Controls />
                      <Background />
                    </ReactFlow>
                  </div>
                   <button onClick={handleAddTargetNode} className={styles['add-target-button']}>
                     Ajouter un champ cible
                   </button>

                   <div className={styles['operations-section']}>
                     <div className={styles['operations-header']}>
                       <h3>🔧 Opérations de Transformation</h3>
                       <button 
                         onClick={() => setShowOperations(!showOperations)}
                         className={styles['toggle-operations-button']}
                       >
                         {showOperations ? 'Masquer' : 'Afficher'} les opérations
                       </button>
                     </div>
                     
                     {showOperations && (
                       <div className={styles['operations-container']}>
                         <button 
                           onClick={handleAddOperation}
                           className={styles['add-operation-button']}
                         >
                           ➕ Ajouter une opération
                         </button>
                         
                         {operations.map((operation, index) => (
                           <div key={index} className={styles['operation-item']}>
                             <OperationEditor
                               operation={operation}
                               onOperationChange={(updatedOp) => handleOperationChange(index, updatedOp)}
                               onRemove={() => handleOperationRemove(index)}
                             />
                           </div>
                         ))}
                         
                         {operations.length === 0 && (
                           <p className={styles['no-operations']}>
                             Aucune opération configurée. Ajoutez des opérations pour transformer vos données.
                           </p>
                         )}
                       </div>
                     )}
                   </div>
                </main>
                <footer className="modalFooter">
                  <button onClick={onClose} disabled={createMappingMutation.isPending}>Annuler</button>
                  <button onClick={handleSaveMapping} className="primary" disabled={createMappingMutation.isPending}>
                    {createMappingMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </footer>
              </>
            ) : (
              <div>Erreur lors du chargement des détails du fichier.</div>
            )}
          </div>
        </div>
    );
};