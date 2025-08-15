import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import styles from './SortableItem.module.scss';

type SortableItemProps = {
  id: string;
  className?: string;
  children: (args: {
    isDragging: boolean;
    attributes: React.HTMLAttributes<HTMLElement>;
    listeners: ReturnType<typeof useSortable>['listeners'];
    setActivatorNodeRef: (el: HTMLElement | null) => void;
  }) => React.ReactNode;
};

export const SortableItem: React.FC<SortableItemProps> = ({ id, className, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.sortableItem} ${isDragging ? styles.dragging : ''} ${className || ''}`}
    >
      {children({ isDragging, attributes, listeners, setActivatorNodeRef })}
    </div>
  );
};

export default SortableItem;
