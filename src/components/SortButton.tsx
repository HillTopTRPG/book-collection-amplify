import {Button} from '@/components/ui/button.tsx';
import {
  ArrowDownNarrowWide, ArrowUpWideNarrow,
} from 'lucide-react';

type Props = {
  sortOrder: 'asc' | 'desc';
  setSortOrder: (sortOrder: 'asc' | 'desc') => void;
};

export default function SortButton({ sortOrder, setSortOrder }: Props) {
  const icon = (() => {
    switch (sortOrder) {
      case 'asc':
        return <ArrowDownNarrowWide />;
      case 'desc':
        return <ArrowUpWideNarrow />;
    }
  })();
  return (
    <Button size="icon" variant="outline" onClick={() => {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    }}>{icon}</Button>
  );
}
