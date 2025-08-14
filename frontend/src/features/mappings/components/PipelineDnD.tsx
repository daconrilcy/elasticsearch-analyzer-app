import React from 'react';
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
import { SortableItem } from './SortableItem';
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
              {renderOperation(operation)}
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
