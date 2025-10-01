import { ArrowDownNarrowWide, ArrowUpWideNarrow } from 'lucide-react';
import { useCallback } from 'react';
import { Button } from '@/components/ui/button.tsx';

type Props = {
  sortOrder: 'asc' | 'desc';
  setSortOrder: (sortOrder: 'asc' | 'desc') => void;
};

export default function SortButton({ sortOrder, setSortOrder }: Props) {
  const handleClick = useCallback(() => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  }, [setSortOrder, sortOrder]);

  return (
    <Button size="icon" className="rounded-full" onClick={handleClick}>
      {sortOrder === 'asc' ? <ArrowDownNarrowWide /> : <ArrowUpWideNarrow />}
    </Button>
  );
}
