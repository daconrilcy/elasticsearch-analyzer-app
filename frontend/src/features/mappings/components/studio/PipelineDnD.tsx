import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core/dist/types/events';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableItem } from '../field_management/SortableItem';
import { OperationEditor, type Operation as OperationEditorOperation } from './OperationEditor';
import styles from './PipelineDnD.module.scss';

interface Operation {
  id: string;
  type: string;
  config: any;
}

interface PipelineDnDProps {
  operations: Operation[];
  onChange: (operations: Operation[]) => void;
  renderOperation: (operation: Operation) => React.ReactNode;
  className?: string;
}

export const PipelineDnD: React.FC<PipelineDnDProps> = ({
  operations,
  onChange,
  renderOperation,
  className,
}) => {
  const [editingOperationId, setEditingOperationId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = operations.findIndex(op => op.id === active.id);
      const newIndex = operations.findIndex(op => op.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOperations = arrayMove(operations, oldIndex, newIndex);
        onChange(newOperations);
      }
    }
  };

  const handleOperationChange = (operationId: string, updatedOperation: OperationEditorOperation) => {
    const newOperations = operations.map(op => 
      op.id === operationId 
        ? { ...op, type: updatedOperation.op, config: updatedOperation }
        : op
    );
    onChange(newOperations);
  };

  const handleOperationRemove = (operationId: string) => {
    const newOperations = operations.filter(op => op.id !== operationId);
    onChange(newOperations);
    setEditingOperationId(null);
  };

  const startEditing = (operationId: string) => {
    setEditingOperationId(operationId);
  };

  const stopEditing = () => {
    setEditingOperationId(null);
  };

  const convertToEditorOperation = (operation: Operation): OperationEditorOperation => {
    return {
      op: operation.type,
      ...operation.config
    };
  };

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={operations.map(op => op.id)}
          strategy={verticalListSortingStrategy}
        >
          {operations.map((operation) => (
            <SortableItem key={operation.id} id={operation.id}>
              {({ attributes, listeners, setActivatorNodeRef }) => (
                <div className={styles.operationWrapper}>
                  {/* Handle de drag dédié */}
                  <button
                    type="button"
                    ref={setActivatorNodeRef}
                    {...attributes}
                    {...listeners}
                    className={styles.dragHandle}
                    aria-label="Réorganiser l'opération"
                    title="Glisse pour réordonner"
                  >
                    ⋮⋮
                  </button>

                  {/* Contenu de l'opération */}
                  {editingOperationId === operation.id ? (
                    <div className={styles.editorContainer}>
                      <OperationEditor
                        operation={convertToEditorOperation(operation)}
                        onOperationChange={(updatedOp) => handleOperationChange(operation.id, updatedOp)}
                        onRemove={() => handleOperationRemove(operation.id)}
                      />
                      <div className={styles.editorActions}>
                        <button 
                          onClick={stopEditing}
                          className={styles.saveButton}
                        >
                          ✓ Sauvegarder
                        </button>
                        <button 
                          onClick={stopEditing}
                          className={styles.cancelButton}
                        >
                          ✗ Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.operationDisplay}>
                      {renderOperation(operation)}
                      <button
                        onClick={() => startEditing(operation.id)}
                        className={styles.editButton}
                        title="Éditer l'opération"
                      >
                        ✏️
                      </button>
                    </div>
                  )}
                </div>
              )}
            </SortableItem>
          ))}
        </SortableContext>
      </DndContext>

      {operations.length === 0 && (
        <div className={styles.empty}>
          <p>Aucune opération dans le pipeline</p>
          <span>Glissez-déposez des opérations ici pour commencer</span>
        </div>
      )}
    </div>
  );
};

export default PipelineDnD;
