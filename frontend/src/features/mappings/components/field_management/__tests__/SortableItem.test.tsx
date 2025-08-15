import { render, screen } from '@testing-library/react';
import { SortableItem } from '../SortableItem';
import { DndContext } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

describe('SortableItem', () => {
  it('renders its children with render prop', () => {
    const id = 'item-1';
    render(
      <DndContext>
        <SortableContext items={[id]} strategy={verticalListSortingStrategy}>
          <SortableItem id={id}>
            {({ isDragging, attributes, listeners, setActivatorNodeRef }) => (
              <div data-testid="sortable-content">
                <button
                  ref={setActivatorNodeRef}
                  {...attributes}
                  {...listeners}
                  data-testid="drag-handle"
                >
                  ⋮⋮
                </button>
                <span>Sortable Content</span>
                {isDragging && <span data-testid="dragging-indicator">Dragging...</span>}
              </div>
            )}
          </SortableItem>
        </SortableContext>
      </DndContext>
    );
    
    expect(screen.getByText('Sortable Content')).toBeInTheDocument();
    expect(screen.getByTestId('drag-handle')).toBeInTheDocument();
    expect(screen.getByText('⋮⋮')).toBeInTheDocument();
  });

  it('applies dragging class when isDragging is true', () => {
    const id = 'item-1';
    render(
      <DndContext>
        <SortableContext items={[id]} strategy={verticalListSortingStrategy}>
          <SortableItem id={id}>
            {({ isDragging, attributes, listeners, setActivatorNodeRef }) => (
              <div 
                data-testid="sortable-item"
                className={isDragging ? 'dragging' : 'not-dragging'}
              >
                <button
                  ref={setActivatorNodeRef}
                  {...attributes}
                  {...listeners}
                >
                  Drag me
                </button>
                <span>Content</span>
              </div>
            )}
          </SortableItem>
        </SortableContext>
      </DndContext>
    );
    
    const sortableItem = screen.getByTestId('sortable-item');
    expect(sortableItem).toHaveClass('not-dragging');
  });
});