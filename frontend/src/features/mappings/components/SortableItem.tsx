import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import styles from './SortableItem.module.scss';

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export const SortableItem: React.FC<SortableItemProps> = ({ 
  id, 
  children, 
  className 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.sortableItem} ${className || ''} ${isDragging ? styles.dragging : ''}`}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
};

export default SortableItem;
