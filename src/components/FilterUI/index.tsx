import { useCallback, useState } from 'react';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay
} from '@dnd-kit/core';
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { generateClient } from 'aws-amplify/api';
import { CloudUpload, FunnelPlus } from 'lucide-react';

import ComboBox from '@/components/ComboBox.tsx';
import { Button } from '@/components/ui/button.tsx';
import { resetFilterSet, selectEditFilters, selectEditFilterSetId, setFilterSet } from '@/store/editFilterSlice.ts';
import { useAppDispatch, useAppSelector } from '@/store/hooks.ts';
import { selectFilterSets, setCreateFilterSet } from '@/store/subscriptionDataSlice.ts';
import { filterMatch } from '@/utils/primitive.ts';

import FilterItem from './FilterItem.tsx';

import type { Schema } from '$/amplify/data/resource.ts';
import type {
  DragEndEvent,
  DragStartEvent } from '@dnd-kit/core';

const userPoolClient = generateClient<Schema>({
  authMode: 'userPool'
});

export default function FilterUI() {
  const dispatch = useAppDispatch();
  const dbFilters = useAppSelector(selectFilterSets);
  const editFilterSetId = useAppSelector(selectEditFilterSetId);
  const editFilters = useAppSelector(selectEditFilters);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent)=> {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = editFilters.findIndex((_, idx) => `filter-${idx}` === active.id);
      const newIndex = editFilters.findIndex((_, idx) => `filter-${idx}` === over?.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newFilterSet = arrayMove(editFilters, oldIndex, newIndex);
        dispatch(setFilterSet({ id: editFilterSetId, filters: newFilterSet }));
      }
    }

    setActiveId(null);
  }, [dispatch, editFilters, editFilterSetId]);

  const activeItem = activeId ? editFilters[parseInt(activeId.replace('filter-', ''))] : null;

  const onAddFilter = useCallback(() => {
    const newFilterSet = structuredClone(editFilters);
    newFilterSet.push({ type: 'title', value: '', sortOrder: 'asc' });
    dispatch(setFilterSet({ id: editFilterSetId, filters: newFilterSet }));
  }, [dispatch, editFilters, editFilterSetId]);

  const onSaveFilter = useCallback(() => {
    if (editFilterSetId) {
      // 更新
      userPoolClient.models.FilterSet.update({
        id: editFilterSetId,
        filters: JSON.stringify(editFilters),
      });
    } else {
      const nextFilterSetName = `Filter${dbFilters.length + 1}`;
      const newFilterSet = {
        name: nextFilterSetName,
        filters: JSON.stringify(editFilters),
        meta: '',
      } as const satisfies Parameters<typeof userPoolClient.models.FilterSet.create>[0];
      dispatch(setCreateFilterSet(newFilterSet));
    }
  }, [dbFilters.length, dispatch, editFilters, editFilterSetId]);

  const onDeleteFilter = useCallback(() => {
    if (!editFilterSetId) return;
    userPoolClient.models.FilterSet.delete({ id: editFilterSetId });
    dispatch(resetFilterSet());
  }, [dispatch, editFilterSetId]);

  const onChangeFilterSetId = useCallback((id: string) => {
    const filterSet = dbFilters.find(filterMatch({ id }));
    if (filterSet) {
      dispatch(setFilterSet({ id, filters: filterSet.filters }));
    } else {
      dispatch(resetFilterSet());
    }
  }, [dbFilters, dispatch]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
    >
      <div className="flex flex-col gap-0.5">
        <div className="flex gap-2 mb-1.5">
          <ComboBox
            label="フィルター"
            className="flex-1"
            list={[
              ...dbFilters.map(filter => ({ value: filter.id, label: filter.name ?? '無名' })),
              { value: '', label: '新規作成' },
            ]}
            value={editFilterSetId ?? ''}
            setValue={onChangeFilterSetId}
          />
          <Button onClick={onSaveFilter}>
            <CloudUpload />
            保存
          </Button>
          <Button onClick={onDeleteFilter}>
            <CloudUpload />
            削除
          </Button>
        </div>
        <SortableContext
          items={editFilters.map((_, idx) => `filter-${idx}`)}
          strategy={verticalListSortingStrategy}
        >
          {editFilters.map((item, index) => (
            <FilterItem
              key={`filter-${index}`}
              id={`filter-${index}`}
              {...{ item, index }}
            />
          ))}
        </SortableContext>
        <div className="flex gap-2 justify-between">
          <Button onClick={onAddFilter}>
            <FunnelPlus />
            条件追加
          </Button>
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeItem ? (
          <FilterItem id="overlay" item={activeItem} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}