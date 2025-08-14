import { render, screen } from '@testing-library/react';
import { SortableItem } from '../SortableItem';
import { DndContext } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

describe('SortableItem', () => {
  it('renders its children', () => {
    const id = 'item-1';
    render(
      <DndContext>
        <SortableContext items={[id]} strategy={verticalListSortingStrategy}>
          <SortableItem id={id}>
            <div>Sortable Content</div>
          </SortableItem>
        </SortableContext>
      </DndContext>
    );
    expect(screen.getByText('Sortable Content')).toBeInTheDocument();
  });
});