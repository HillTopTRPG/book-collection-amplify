import FilterItem from '@/components/FilterItem.tsx';
import type {Schema} from '../../amplify/data/resource.ts';
import {Button} from '@/components/ui/button.tsx';
import {FunnelPlus} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from '@dnd-kit/modifiers';
import { useState } from 'react';

export type FilterData = {
  type: 'title' | 'author' | 'publisher' | 'pubdate';
  value: string;
  sortOrder: 'asc' | 'desc';
};

type Props = {
  books: Array<Schema['Book']['type']>;
  list: FilterData[];
  onChange: (list: FilterData[]) => void;
};

export default function FilterUI({ books, list, onChange }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
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

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = list.findIndex((_, idx) => `filter-${idx}` === active.id);
      const newIndex = list.findIndex((_, idx) => `filter-${idx}` === over?.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newList = arrayMove(list, oldIndex, newIndex);
        onChange(newList);
      }
    }

    setActiveId(null);
  }

  const activeItem = activeId ? list[parseInt(activeId.replace('filter-', ''))] : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
    >
      <div className="flex flex-col gap-0.5">
        <SortableContext
          items={list.map((_, idx) => `filter-${idx}`)}
          strategy={verticalListSortingStrategy}
        >
          {list.map((item, idx) => (
            <FilterItem
              key={`filter-${idx}`}
              id={`filter-${idx}`}
              books={books}
              item={item}
              onChange={(property, value) => {
                const newList = structuredClone(list);
                const newItem = { ...item, [property]: value };
                if (property === 'type') newItem.value = '';
                newList.splice(idx, 1, newItem);
                onChange(newList);
              }}
              onDelete={() => {
                const newList = structuredClone(list);
                newList.splice(idx, 1);
                onChange(newList);
              }}
            />
          ))}
        </SortableContext>
        <Button className="self-start" onClick={()=>{
          const newList = structuredClone(list);
          newList.push({ type: 'author', value: '', sortOrder: 'asc' });
          onChange(newList);
        }}>
          <FunnelPlus />
          検索・ソート
        </Button>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeItem ? (
          <FilterItem
            id="overlay"
            books={books}
            item={activeItem}
            onChange={() => {}}
            onDelete={() => {}}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}