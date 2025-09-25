import { Fragment, type RefObject, useCallback, useMemo } from 'react';
import { Separator } from '@/components/ui/separator.tsx';
import useDOMSize from '@/hooks/useDOMSize.ts';
import { useAppDispatch } from '@/store/hooks.ts';
import { updateFetchedFilterAnywhere } from '@/store/scannerSlice.ts';
import type { FilterSet } from '@/store/subscriptionDataSlice.ts';
import type { BookData, Isbn13 } from '@/types/book.ts';
import { getFilteredItems } from '@/utils/filter.ts';
import { groupByVolume } from '@/utils/groupByVolume.ts';
import GroupByBlock from './GroupByBlock';
import NdlCardList from './NdlCardList.tsx';
import SearchConditionsForm from './SearchConditionsForm';

type Props = {
  scrollParentRef: RefObject<HTMLDivElement | null>;
  isbn: Isbn13;
  fetchedBooks: BookData[];
  filterSet: FilterSet;
  orIndex: number;
  selectedIsbn: string | null;
  setSelectedIsbn: (isbn: string | null) => void;
  setDetailIsbn: (isbn: string | null) => void;
};

export default function FilterBlock({
  scrollParentRef,
  isbn,
  fetchedBooks,
  filterSet,
  orIndex,
  selectedIsbn,
  setSelectedIsbn,
  setDetailIsbn,
}: Props) {
  const dispatch = useAppDispatch();
  const { ref, size } = useDOMSize();
  const filteredResults = useMemo(
    (): BookData[] => getFilteredItems(fetchedBooks, filterSet, orIndex),
    [fetchedBooks, filterSet, orIndex]
  );
  const groupedBooks = useMemo(() => groupByVolume(filteredResults), [filteredResults]);

  const updateGroupingType = useCallback(
    (value: boolean) => {
      const newFilters = structuredClone(filterSet.filters);
      newFilters[orIndex].grouping = value ? 'date' : null;
      dispatch(updateFetchedFilterAnywhere({ key: isbn, filterSetId: filterSet.id, filters: newFilters }));
    },
    [dispatch, filterSet.filters, filterSet.id, isbn, orIndex]
  );

  return (
    <>
      <Separator />

      {/* 検索条件入力欄 */}
      <SearchConditionsForm
        ref={ref}
        {...{ isbn, filterSet, orIndex, fetchedBooks, filteredResults, updateGroupingType }}
      />

      {/* 書籍一覧 */}
      <div>
        {!filterSet.filters[orIndex].grouping ? (
          <NdlCardList
            books={filteredResults}
            conditionsFormRef={ref}
            isLastBlock
            {...{ filterSet, orIndex, selectedIsbn, setSelectedIsbn, setDetailIsbn }}
          />
        ) : (
          groupedBooks.map((list, idx) => (
            <Fragment key={idx}>
              {idx ? <Separator /> : null}
              <GroupByBlock
                stickyTop={size.height}
                conditionsFormRef={ref}
                isLastBlock={idx === groupedBooks.length - 1}
                {...{ scrollParentRef, list, idx, filterSet, orIndex, selectedIsbn, setSelectedIsbn, setDetailIsbn }}
              />
            </Fragment>
          ))
        )}
      </div>
    </>
  );
}
