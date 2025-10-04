import type { FilterSet } from '@/types/book.ts';
import { useEffect } from 'react';
import BookImage from '@/components/BookImage.tsx';
import { enqueueNdlSearch } from '@/store/fetchNdlSearchSlice.ts';
import { useAppDispatch, useAppSelector } from '@/store/hooks.ts';
import { selectIsbnByApiId } from '@/store/ndlSearchSlice.ts';

type Props = {
  filterSet: FilterSet;
};

export default function FilterSetCollapsibleHeader({ filterSet }: Props) {
  const dispatch = useAppDispatch();
  const isbn = useAppSelector(state => selectIsbnByApiId(state, filterSet.apiId));

  useEffect(() => {
    if (isbn) return;
    dispatch(enqueueNdlSearch({ type: 'priority', list: [JSON.stringify({ itemno: filterSet.apiId })] }));
  }, [dispatch, filterSet.apiId, isbn]);

  return (
    <div className="flex items-center gap-1">
      <BookImage size="small" isbn={isbn} />
      <span>{filterSet.name}</span>
    </div>
  );
}
