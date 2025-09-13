import { useCallback } from 'react';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { isNil } from 'es-toolkit/compat';
import { Trash, GripVertical, BookA, UserPen, Building } from 'lucide-react';

import ComboInput from '@/components/ComboInput.tsx';
import SelectBox from '@/components/SelectBox.tsx';
import SortButton from '@/components/SortButton.tsx';
import { Button } from '@/components/ui/button.tsx';
import { selectFilterSet, selectFilterSetId, setFilterSet } from '@/store/filterSlice.ts';
import { useAppDispatch, useAppSelector } from '@/store/hooks.ts';
import { selectMyBooks } from '@/store/subscriptionDataSlice.ts';
import type { FilterData } from '@/types/filter.ts';

const TYPE_OPTIONS = {
  title: <BookA />,
  author: <UserPen />,
  publisher: <Building />,
  pubdate: <div className="flex">発売日</div>,
} as const;

const TypeMap = {
  title: 'タイトル',
  author: '著者',
  publisher: '出版社',
  pubdate: '出版日',
} as const;

type Props = {
  id: string;
  item: FilterData;
  index?: number;
}

export default function FilterItem({ id, item, index }: Props) {
  const dispatch = useAppDispatch();
  const filterSetId = useAppSelector(selectFilterSetId);
  const filterSet = useAppSelector(selectFilterSet);
  const books = useAppSelector(selectMyBooks);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: 'none',
    opacity: isDragging ? 0 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  const comboOptions = books
    .flatMap(book => book[item.type]?.split(','))
    .filter((value, index, self): value is string => Boolean(value) && (self.findIndex(v => v === value) === index))
    .map(value => ({ label: value, value }));

  const onChange = useCallback(<Property extends keyof FilterData>(property: Property, value: FilterData[Property]) => {
    if (isNil(index)) return;
    const newFilterSet = structuredClone(filterSet);
    const newItem = { ...item, [property]: value };
    if (property === 'type') newItem.value = '';
    newFilterSet.splice(index, 1, newItem);
    dispatch(setFilterSet({ id: filterSetId, filterSet: newFilterSet }));
  }, [dispatch, filterSet, filterSetId, index, item]);

  const onChangeType = useCallback((value: FilterData['type']) => {
    onChange('type', value);
  }, [onChange]);

  const onChangeValue = useCallback((value: FilterData['value']) => {
    onChange('value', value);
  }, [onChange]);

  const onChangeSortOrder = useCallback((value: FilterData['sortOrder']) => {
    onChange('sortOrder', value);
  }, [onChange]);

  const onDelete = useCallback(() => {
    if (isNil(index)) return;
    const newFilterSet = structuredClone(filterSet);
    newFilterSet.splice(index, 1);
    dispatch(setFilterSet({ id: filterSetId, filterSet: newFilterSet }));
  }, [dispatch, filterSet, filterSetId, index]);

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className="flex gap-1 w-full bg-background border rounded p-0.5"
    >
      <div
        {...attributes}
        {...listeners}
        className="flex items-center cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <SelectBox
        className="w-auto"
        options={TYPE_OPTIONS}
        value={item.type}
        onChange={onChangeType}
      />
      <SortButton sortOrder={item.sortOrder} setSortOrder={onChangeSortOrder} />
      {item.type !== 'pubdate' ? (
        <ComboInput
          label={TypeMap[item.type]}
          className="flex-1 text-left truncate bg-foreground text-background"
          list={comboOptions}
          value={item.value}
          setValue={onChangeValue}
        />
      ) : <div className="flex-1"></div>}
      <Button variant="destructive" size="icon" onClick={onDelete}><Trash /></Button>
    </div>
  );
}