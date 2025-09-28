import { ArrowDownNarrowWide, ArrowUpWideNarrow } from 'lucide-react';
import { useCallback } from 'react';
import { Button } from '@/components/ui/button.tsx';

type Props = {
  sortOrder: 'asc' | 'desc';
  setSortOrder: (sortOrder: 'asc' | 'desc') => void;
};

export default function SortButton({ sortOrder, setSortOrder }: Props) {
  const onClick = useCallback(() => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  }, [setSortOrder, sortOrder]);

  return (
    <Button size="icon" className="rounded-full" onClick={onClick}>
      {sortOrder === 'asc' ? <ArrowDownNarrowWide /> : <ArrowUpWideNarrow />}
    </Button>
  );
}
