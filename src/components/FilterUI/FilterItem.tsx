import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash, GripVertical, BookA, UserPen, Building } from 'lucide-react';

import ComboInput from '@/components/ComboInput.tsx';
import { FilterData } from '@/components/FilterUI';
import SelectBox from '@/components/SelectBox.tsx';
import SortButton from '@/components/SortButton.tsx';
import { Button } from '@/components/ui/button.tsx';

import type { Schema } from '$/amplify/data/resource.ts';

const TYPE_OPTIONS = {
  title: <BookA />,
  author: <UserPen />,
  publisher: <Building />,
  pubdate: <div className="flex gap-2">発売日</div>,
} as const;

const TypeMap = {
  title: 'タイトル',
  author: '著者',
  publisher: '出版社',
  pubdate: '出版日',
} as const;

type Props = {
  id: string;
  books: Array<Schema['Book']['type']>;
  item: FilterData;
  onChange: <Property extends keyof FilterData>(property: Property, value: FilterData[Property]) => void;
  onDelete: () => void;
}

export default function FilterItem({ id, books, item, onChange, onDelete }: Props) {
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
    .flatMap(book => {
      switch (item.type) {
        case 'title':
        case 'author':
        case 'publisher':
        case 'pubdate':
          return book[item.type]?.split(',');
      }
    })
    .filter((value, index, self): value is string => Boolean(value) && (self.findIndex(v => v === value) === index))
    .map(value => ({ label: value, value }));

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
        onChange={(v) => onChange('type', v)}
      />
      <SortButton sortOrder={item.sortOrder} setSortOrder={(v) => onChange('sortOrder', v)} />
      {item.type !== 'pubdate' ? (
        <ComboInput
          label={TypeMap[item.type]}
          className="flex-1 text-left truncate bg-foreground text-background"
          list={comboOptions}
          value={item.value}
          setValue={(v) => onChange('value', v)}
        />
      ) : <div className="flex-1"></div>}
      <Button variant="destructive" size="icon" onClick={onDelete}><Trash /></Button>
    </div>
  );
}