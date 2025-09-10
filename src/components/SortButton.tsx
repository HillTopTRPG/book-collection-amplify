import {Button} from '@/components/ui/button.tsx';
import {
  ArrowDownNarrowWide, ArrowUpWideNarrow,
} from 'lucide-react';

type Props = {
  sortOrder: 'asc' | 'desc';
  setSortOrder: (sortOrder: 'asc' | 'desc') => void;
};

export default function SortButton({ sortOrder, setSortOrder }: Props) {
  return (
    <Button size="icon" className="rounded-full" onClick={() => {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    }}>{sortOrder === 'asc' ? <ArrowDownNarrowWide /> : <ArrowUpWideNarrow />}</Button>
  );
}
