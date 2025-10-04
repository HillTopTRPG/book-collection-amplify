import type { FilterSet } from '@/types/book.ts';
import { X } from 'lucide-react';
import { useCallback } from 'react';
import CardFrame from '@/components/Card/CardFrame.tsx';
import { Button } from '@/components/ui/button.tsx';
import { useAwsAccess } from '@/hooks/useAwsAccess.ts';

type Props = {
  filterSet: FilterSet;
};

export default function FilterCard({ filterSet }: Props) {
  const { deleteFilterSet } = useAwsAccess();

  const handleDeleteFilterSet = useCallback(() => {
    void deleteFilterSet({ id: filterSet.id });
  }, [deleteFilterSet, filterSet.id]);

  return (
    <CardFrame>
      <h5 className="text-[14px] mb-1">{filterSet.name}</h5>
      <Button onClick={handleDeleteFilterSet}>
        <X />
        消去
      </Button>
    </CardFrame>
  );
}
