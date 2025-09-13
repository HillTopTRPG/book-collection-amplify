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
import { Switch } from '@/components/ui/switch.tsx';
import { resetFilterSet, selectFilterSet, selectFilterSetId, setFilterSet } from '@/store/filterSlice.ts';
import { useAppDispatch, useAppSelector } from '@/store/hooks.ts';
import { selectFilterSets, setCreateFilterSet } from '@/store/subscriptionDataSlice.ts';

import FilterItem from './FilterItem.tsx';

import type { Schema } from '$/amplify/data/resource.ts';
import type {
  DragEndEvent,
  DragStartEvent } from '@dnd-kit/core';

const userPoolClient = generateClient<Schema>({
  authMode: 'userPool'
});

type Props = {
  isAddSearch: boolean;
  setIsAddSearch: (flg: boolean) => void;
};

export default function FilterUI({ isAddSearch, setIsAddSearch }: Props) {
  const dispatch = useAppDispatch();
  const dbFilters = useAppSelector(selectFilterSets);
  const filterSetId = useAppSelector(selectFilterSetId);
  const filterSet = useAppSelector(selectFilterSet);
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
      const oldIndex = filterSet.findIndex((_, idx) => `filter-${idx}` === active.id);
      const newIndex = filterSet.findIndex((_, idx) => `filter-${idx}` === over?.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newFilterSet = arrayMove(filterSet, oldIndex, newIndex);
        dispatch(setFilterSet({ id: filterSetId, filterSet: newFilterSet }));
      }
    }

    setActiveId(null);
  }, [dispatch, filterSet, filterSetId]);

  const activeItem = activeId ? filterSet[parseInt(activeId.replace('filter-', ''))] : null;

  const onAddFilter = useCallback(() => {
    const newFilterSet = structuredClone(filterSet);
    newFilterSet.push({ type: 'title', value: '', sortOrder: 'asc' });
    dispatch(setFilterSet({ id: filterSetId, filterSet: newFilterSet }));
  }, [dispatch, filterSet, filterSetId]);

  const onSaveFilter = useCallback(() => {
    if (filterSetId) {
      // 更新
      userPoolClient.models.FilterSet.update({
        id: filterSetId,
        filters: JSON.stringify(filterSet),
      });
    } else {
      const nextFilterSetName = `Filter${dbFilters.length + 1}`;
      const newFilterSet = {
        name: nextFilterSetName,
        filters: JSON.stringify(filterSet),
        meta: '',
      } as const satisfies Parameters<typeof userPoolClient.models.FilterSet.create>[0];
      dispatch(setCreateFilterSet(newFilterSet));
    }
  }, [dbFilters.length, dispatch, filterSet, filterSetId]);

  const onDeleteFilter = useCallback(() => {
    if (!filterSetId) return;
    userPoolClient.models.FilterSet.delete({ id: filterSetId });
    dispatch(resetFilterSet());
  }, [dispatch, filterSetId]);

  const onChangeFilterSetId = useCallback((id: string) => {
    const filter = dbFilters.find(filter => filter.id === id) ?? null;
    if (filter) {
      dispatch(setFilterSet({ id, filterSet: JSON.parse(filter.filters) }));
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
            value={filterSetId ?? ''}
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
          items={filterSet.map((_, idx) => `filter-${idx}`)}
          strategy={verticalListSortingStrategy}
        >
          {filterSet.map((item, index) => (
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
          <div className="flex items-center flex-1 gap-2">
            <Switch id="airplane-mode" checked={isAddSearch} onCheckedChange={setIsAddSearch} />
            <label htmlFor="airplane-mode">未所持検索</label>
          </div>
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