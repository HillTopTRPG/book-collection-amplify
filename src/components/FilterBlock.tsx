import type { FilterSet } from '@/store/subscriptionDataSlice.ts';
import type { BookDetail } from '@/types/book.ts';
import { type CSSProperties, type RefObject, useCallback, useMemo, useState } from 'react';
import BookDetailView from '@/components/BookDetailView.tsx';
import SearchConditionsForm from '@/components/SearchConditionsForm';
import useDOMSize from '@/hooks/useDOMSize.ts';
import { getFilteredItems } from '@/utils/filter.ts';

const BOTTOM_NAVIGATION_HEIGHT = 65;

type Props = {
  scrollParentRef: RefObject<HTMLDivElement | null>;
  bookDetails: BookDetail[];
  filterSet: FilterSet;
  orIndex: number;
  onFilterSetUpdate: (filterSet: FilterSet) => void;
};

export default function FilterBlock({ scrollParentRef, bookDetails, filterSet, orIndex, onFilterSetUpdate }: Props) {
  const [searchConditionsRef, searchConditionsSize] = useDOMSize();
  const [contentHeight, setContentHeight] = useState(0);
  const filteredResults = useMemo(
    (): BookDetail[] => getFilteredItems(bookDetails, filterSet, orIndex),
    [bookDetails, filterSet, orIndex]
  );

  const updateGroupingType = useCallback(
    (value: boolean) => {
      const newFilters = structuredClone(filterSet.filters);
      newFilters[orIndex].groupByType = value ? 'volume' : null;
      onFilterSetUpdate({ ...filterSet, filters: newFilters });
    },
    [filterSet, onFilterSetUpdate, orIndex]
  );

  const minHeightStyle = useMemo(
    () =>
      ({
        '--content-end-y': `${searchConditionsSize.height + contentHeight + BOTTOM_NAVIGATION_HEIGHT}px`,
      }) as CSSProperties,
    [searchConditionsSize.height, contentHeight]
  );

  return (
    <>
      <SearchConditionsForm
        ref={searchConditionsRef}
        {...{ filterSet, orIndex, bookDetails, filteredResults, updateGroupingType, onFilterSetUpdate }}
      />

      <BookDetailView
        bookDetails={filteredResults}
        stickyTop={searchConditionsSize.height}
        groupByType={filterSet.filters[orIndex].groupByType}
        {...{ scrollParentRef, filterSet, setContentHeight, orIndex }}
      />
      <div className="min-h-viewport-with-offset" style={minHeightStyle} />
    </>
  );
}
