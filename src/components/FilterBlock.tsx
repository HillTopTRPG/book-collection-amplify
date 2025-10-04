import type { CollectionBook, FilterSet } from '@/types/book.ts';
import { type CSSProperties, type RefObject, useCallback, useMemo, useState } from 'react';
import SearchConditionsForm from '@/components/SearchConditionsForm';
import useDOMSize from '@/hooks/useDOMSize.ts';
import { getFilteredItems } from '@/utils/filter.ts';
import FilterResultSetComponent from './FilterResultSetComponent.tsx';

const BOTTOM_NAVIGATION_HEIGHT = 65;

type Props = {
  scrollParentRef: RefObject<HTMLDivElement | null>;
  collectionBooks: CollectionBook[];
  filterSet: FilterSet;
  orIndex: number;
  onFilterSetUpdate: (filterSet: FilterSet) => void;
};

export default function FilterBlock({
  scrollParentRef,
  collectionBooks,
  filterSet,
  orIndex,
  onFilterSetUpdate,
}: Props) {
  const [searchConditionsRef, searchConditionsSize] = useDOMSize();
  const [contentHeight, setContentHeight] = useState(0);
  const filteredResults = useMemo(
    (): CollectionBook[] => getFilteredItems(collectionBooks, filterSet, orIndex),
    [collectionBooks, filterSet, orIndex]
  );

  const handleGroupByTypeUpdate = useCallback(
    (groupByType: 'volume' | null) => {
      const newFilters = structuredClone(filterSet.filters);
      newFilters[orIndex].groupByType = groupByType;
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
        onUpdateGroupByType={handleGroupByTypeUpdate}
        {...{ filterSet, orIndex, books: collectionBooks, filteredResults, onFilterSetUpdate }}
      />

      {/* TODO viewBookStatusList */}
      <FilterResultSetComponent
        collectionBooks={filteredResults}
        stickyTop={searchConditionsSize.height}
        groupByType={filterSet.filters[orIndex].groupByType}
        viewBookStatusList={[]}
        {...{ scrollParentRef, filterSet, setContentHeight, orIndex }}
      />
      <div className="min-h-viewport-with-offset" style={minHeightStyle} />
    </>
  );
}
