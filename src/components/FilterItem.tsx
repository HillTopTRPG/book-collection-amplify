import {FilterData} from '@/components/FilterUI.tsx';
import SelectBox from '@/components/SelectBox.tsx';
import type {Schema} from '../../amplify/data/resource.ts';
import ComboBox from '@/components/ComboBox.tsx';
import SortButton from '@/components/SortButton.tsx';
import {Trash,} from 'lucide-react';
// import {Building, Calendar, CaseUpper, FunnelPlus, UserPen} from 'lucide-react';
import {Button} from '@/components/ui/button.tsx';

// const TYPE_OPTIONS = {
//   title: <div className="flex gap-2"><CaseUpper />タイトル</div>,
//   author: <div className="flex gap-2"><UserPen />著者</div>,
//   publisher: <div className="flex gap-2"><Building />出版社</div>,
//   pubdate: <div className="flex gap-2"><Calendar />発売日</div>,
//   none: <div className="flex gap-2"><FunnelPlus /></div>,
// } as const;

const TYPE_OPTIONS = {
  title: <div className="flex gap-2">タイトル</div>,
  author: <div className="flex gap-2">著者</div>,
  publisher: <div className="flex gap-2">出版社</div>,
  pubdate: <div className="flex gap-2">発売日</div>,
} as const;

const TypeMap = {
  title: 'タイトル',
  author: '著者',
  publisher: '出版社',
  pubdate: '出版日',
} as const;

type Props = {
  books: Array<Schema['Book']['type']>;
  item: FilterData;
  onChange: <Property extends keyof FilterData>(property: Property, value: FilterData[Property]) => void;
  onDelete: () => void;
}

export default function FilterItem({ books, item, onChange, onDelete }: Props) {
  const comboBoxList = books
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
    <div className="flex gap-1 w-full">
      <SelectBox
        className="w-auto"
        options={TYPE_OPTIONS}
        value={item.type}
        onChange={(v) => onChange('type', v)}
      />
      {!item.value && (
        <SortButton sortOrder={item.sortOrder} setSortOrder={(v) => onChange('sortOrder', v)} />
      )}
      <ComboBox
        label={TypeMap[item.type]}
        className="flex-1 text-left truncate bg-foreground text-background"
        list={comboBoxList}
        value={item.value}
        setValue={(v) => onChange('value', v)}
      />
      <Button variant="destructive" size="icon" onClick={onDelete}><Trash /></Button>
    </div>
  );
}