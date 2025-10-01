import type { FilterSet } from '@/store/subscriptionDataSlice.ts';
import { useCallback } from 'react';
import CardFrame from '@/components/Card/CardFrame.tsx';
import { openDrawer } from '@/store/filterDetailDrawerSlice.ts';
import { useAppDispatch } from '@/store/hooks.ts';

type Props = {
  filterSet: FilterSet;
};

export default function FilterCard({ filterSet }: Props) {
  const dispatch = useAppDispatch();

  const handleClick = useCallback(() => {
    dispatch(openDrawer(filterSet.id));
  }, [filterSet.id, dispatch]);

  return (
    <CardFrame onClick={handleClick}>
      <h5 className="text-[14px] mb-1">{filterSet.name}</h5>
    </CardFrame>
  );
}
