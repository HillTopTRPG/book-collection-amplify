import FilterItem from '@/components/FilterItem.tsx';
import type {Schema} from '../../amplify/data/resource.ts';
import {Button} from '@/components/ui/button.tsx';
import {FunnelPlus} from 'lucide-react';

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
  return (
    <div className="flex flex-col gap-2">
      {list.map((item, idx) => (
        <FilterItem
          key={idx}
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
      <Button className="self-start" onClick={()=>{
        const newList = structuredClone(list);
        newList.push({ type: 'author', value: '', sortOrder: 'asc' });
        onChange(newList);
      }}>
        <FunnelPlus />
        検索・ソート
      </Button>
    </div>
  );
}