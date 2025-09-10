import FilterItem from '@/components/FilterItem.tsx';
import type {Schema} from '../../amplify/data/resource.ts';
import {Button} from '@/components/ui/button.tsx';
import {CloudUpload, FunnelPlus} from 'lucide-react';
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
import {useEffect, useRef, useState} from 'react';
import {generateClient} from 'aws-amplify/api';
import ComboBox from '@/components/ComboBox.tsx';
import {Switch} from '@/components/ui/switch.tsx';
import {useAppDispatch, useAppSelector} from '@/store/hooks.ts';
import {resetFilterSet, selectFilterSet, selectFilterSetId, setFilterSet} from '@/store/filterSlice.ts';

const userPoolClient = generateClient<Schema>({
  authMode: 'userPool'
});

export type FilterData = {
  type: 'title' | 'author' | 'publisher' | 'pubdate';
  value: string;
  sortOrder: 'asc' | 'desc';
};

type Props = {
  books: Array<Schema['Book']['type']>;
  isAddSearch: boolean;
  setIsAddSearch: (flg: boolean) => void;
};

export default function FilterUI({ books, isAddSearch, setIsAddSearch }: Props) {
  const dispatch = useAppDispatch();
  const [dbFilters, setDbFilters] = useState<Array<Schema['FilterSet']['type']>>([]);
  const filterSetId = useAppSelector(selectFilterSetId);
  const filterSet = useAppSelector(selectFilterSet);
  const [activeId, setActiveId] = useState<string | null>(null);
  const nextFilterSetNameRef = useRef<string | null>(null);

  useEffect(() => {
    userPoolClient.models.FilterSet.observeQuery().subscribe({
      next: (data) => {
        setDbFilters([...data.items]);
        if (nextFilterSetNameRef.current) {
          const item = data.items.find(item => item.name === nextFilterSetNameRef.current);
          if (item) {
            dispatch(setFilterSet({ id: item.id, filterSet: JSON.parse(item.filters) }));
          }
          nextFilterSetNameRef.current = null;
        }
      },
    });
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent)=> {
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
  };

  const activeItem = activeId ? filterSet[parseInt(activeId.replace('filter-', ''))] : null;

  const onAddFilter = () => {
    const newFilterSet = structuredClone(filterSet);
    newFilterSet.push({ type: 'title', value: '', sortOrder: 'asc' });
    dispatch(setFilterSet({ id: filterSetId, filterSet: newFilterSet }));
  };

  const onSaveFilter = () => {
    if (filterSetId) {
      // 更新
      userPoolClient.models.FilterSet.update({
        id: filterSetId,
        filters: JSON.stringify(filterSet),
      });
    } else {
      const nextFilterSetName = `Filter${dbFilters.length + 1}`;
      nextFilterSetNameRef.current = nextFilterSetName;

      // 新規作成
      userPoolClient.models.FilterSet.create({
        name: nextFilterSetName,
        filters: JSON.stringify(filterSet),
        meta: '',
      });
    }
  };

  const onDeleteFilter = () => {
    if (!filterSetId) return;
    userPoolClient.models.FilterSet.delete({ id: filterSetId });
    dispatch(resetFilterSet());
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
    >
      <div className="flex flex-col gap-0.5">
        <div className="flex gap-2 mb-2">
          <ComboBox
            label="フィルター"
            className="flex-1"
            list={[
              ...dbFilters.map(filter => ({ value: filter.id, label: filter.name ?? '無名' })),
              { value: '', label: '新規作成' },
            ]}
            value={filterSetId ?? ''}
            setValue={(id) => {
              const filter = dbFilters.find(filter => filter.id === id) ?? null;
              if (filter) {
                dispatch(setFilterSet({ id, filterSet: JSON.parse(filter.filters) }));
              } else {
                dispatch(resetFilterSet());
              }
            }}
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
          {filterSet.map((item, idx) => (
            <FilterItem
              key={`filter-${idx}`}
              id={`filter-${idx}`}
              books={books}
              item={item}
              onChange={(property, value) => {
                const newFilterSet = structuredClone(filterSet);
                const newItem = { ...item, [property]: value };
                if (property === 'type') newItem.value = '';
                newFilterSet.splice(idx, 1, newItem);
                dispatch(setFilterSet({ id: filterSetId, filterSet: newFilterSet }));
              }}
              onDelete={() => {
                const newFilterSet = structuredClone(filterSet);
                newFilterSet.splice(idx, 1);
                dispatch(setFilterSet({ id: filterSetId, filterSet: newFilterSet }));
              }}
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