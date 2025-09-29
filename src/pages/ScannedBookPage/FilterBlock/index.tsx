import type { FilterSet } from '@/store/subscriptionDataSlice.ts';
import type { BookDetail } from '@/types/book.ts';
import { type CSSProperties, Fragment, type RefObject, useCallback, useMemo, useState } from 'react';
import { Separator } from '@/components/ui/separator.tsx';
import useDOMSize from '@/hooks/useDOMSize.ts';
import { useAppDispatch } from '@/store/hooks.ts';
import { updateFetchedFilterAnywhere } from '@/store/subscriptionDataSlice.ts';
import { getFilteredItems } from '@/utils/filter.ts';
import { groupByVolume } from '@/utils/groupByVolume.ts';
import GroupByBlock from './GroupByBlock';
import NdlCardList from './NdlCardList.tsx';
import SearchConditionsForm from './SearchConditionsForm';

const BOTTOM_NAVIGATION_HEIGHT = 65;

type Props = {
  scrollParentRef: RefObject<HTMLDivElement | null>;
  fetchedBooks: BookDetail[];
  filterSet: FilterSet;
  orIndex: number;
  selectedIsbn: string | null;
  setSelectedIsbn: (isbn: string | null) => void;
};

export default function FilterBlock({
  scrollParentRef,
  fetchedBooks,
  filterSet,
  orIndex,
  selectedIsbn,
  setSelectedIsbn,
}: Props) {
  const dispatch = useAppDispatch();
  const [searchConditionsRef, searchConditionsSize] = useDOMSize();
  const [contentHeight, setContentHeight] = useState(0);
  const filteredResults = useMemo(
    (): BookDetail[] => getFilteredItems(fetchedBooks, filterSet, orIndex),
    [fetchedBooks, filterSet, orIndex]
  );
  const groupedBooks = useMemo(() => groupByVolume(filteredResults), [filteredResults]);

  const updateGroupingType = useCallback(
    (value: boolean) => {
      const newFilters = structuredClone(filterSet.filters);
      newFilters[orIndex].grouping = value ? 'date' : null;
      dispatch(updateFetchedFilterAnywhere({ id: filterSet.id, filters: newFilters }));
    },
    [dispatch, filterSet.filters, filterSet.id, orIndex]
  );

  return (
    <>
      <Separator />

      {/* 検索条件入力欄 */}
      <SearchConditionsForm
        ref={searchConditionsRef}
        {...{ filterSet, orIndex, fetchedBooks, filteredResults, updateGroupingType }}
      />

      {/* 書籍一覧 */}
      <div className="flex flex-col">
        {!filterSet.filters[orIndex].grouping ? (
          <NdlCardList
            bookDetails={filteredResults}
            setContentHeight={setContentHeight}
            {...{ filterSet, orIndex, selectedIsbn, setSelectedIsbn }}
          />
        ) : (
          groupedBooks.map((list, idx) => (
            <Fragment key={idx}>
              {idx ? <Separator /> : null}
              <GroupByBlock
                stickyTop={searchConditionsSize.height}
                setContentHeight={setContentHeight}
                {...{ scrollParentRef, list, idx, filterSet, orIndex, selectedIsbn, setSelectedIsbn }}
              />
            </Fragment>
          ))
        )}
      </div>
      <div
        className="min-h-viewport-with-offset"
        style={
          {
            '--content-end-y': `${searchConditionsSize.height + contentHeight + BOTTOM_NAVIGATION_HEIGHT}px`,
          } as CSSProperties
        }
      />
    </>
  );
}
