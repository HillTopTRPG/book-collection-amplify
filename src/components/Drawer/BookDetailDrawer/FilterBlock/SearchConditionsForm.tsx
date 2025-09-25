import { useCallback } from 'react';
import { Checkbox } from '@/components/ui/checkbox.tsx';
import { Label } from '@/components/ui/label.tsx';
import { useAppDispatch } from '@/store/hooks.ts';
import { updateFetchedFilterAnywhere } from '@/store/scannerSlice.ts';
import type { FilterSet } from '@/store/subscriptionDataSlice.ts';
import type { BookData, Isbn13 } from '@/types/book.ts';
import SearchConditionItem from './SearchConditionItem.tsx';

type Props = {
  isbn: Isbn13;
  filterSet: FilterSet;
  orIndex: number;
  fetchedBooks: BookData[];
  count: number;
};

export default function SearchConditionsForm({ isbn, filterSet, orIndex, fetchedBooks, count }: Props) {
  const dispatch = useAppDispatch();

  const updateGroupingType = useCallback(
    (value: boolean) => {
      const newFilters = structuredClone(filterSet.filters);
      newFilters[orIndex].grouping = value ? 'date' : null;
      dispatch(updateFetchedFilterAnywhere({ key: isbn, filterSetId: filterSet.id, filters: newFilters }));
    },
    [dispatch, filterSet.filters, filterSet.id, isbn, orIndex]
  );

  return (
    <div className="sticky top-0 flex flex-col z-50 items-stretch gap-1 bg-background py-1 px-2 border-b shadow-md">
      <div className="text-sm min-w-[4rem] flex items-center justify-between">
        <span>{!orIndex ? '必須条件' : `OR条件${orIndex}`}</span>
        <span>{count}件</span>
        <div className="flex items-center gap-1">
          <Checkbox
            id="terms"
            checked={filterSet.filters[orIndex].grouping === 'date'}
            onCheckedChange={updateGroupingType}
          />
          <Label htmlFor="terms">連載グルーピング</Label>
        </div>
      </div>
      {filterSet.filters[orIndex].list.map((_, andIndex) => (
        <SearchConditionItem key={andIndex} {...{ isbn, filterSet, orIndex, fetchedBooks, andIndex }} />
      ))}
    </div>
  );
}
