import type { BookStatus, CollectionBook, FilterSet } from '@/types/book.ts';
import type { RefObject } from 'react';
import { memo, useCallback, useMemo } from 'react';
import BookCardList from '@/components/BookCardList.tsx';
import CollapsibleFrame from '@/components/CollapsibleFrame.tsx';
import FilterSetCollapsibleHeader from '@/components/FilterSetCollapsibleHeader.tsx';
import GroupByBlock from '@/components/GroupByBlock.tsx';
import { getFilteredItems } from '@/utils/filter.ts';
import { groupByVolume } from '@/utils/groupByVolume.ts';

type Props = {
  viewType?: 'default' | 'simple';
  stickyTop: number;
  scrollParentRef: RefObject<HTMLDivElement | null>;
  collectionBooks: CollectionBook[];
  filterSet: FilterSet;
  setContentHeight: (height: number) => void;
  groupByType: 'volume' | null;
  orIndex?: number;
  viewBookStatusList: BookStatus[];
};

const FilterResultSetComponent = ({
  viewType,
  stickyTop,
  scrollParentRef,
  collectionBooks,
  filterSet,
  setContentHeight,
  groupByType,
  orIndex,
  viewBookStatusList,
}: Props) => {
  const filteredResults = useMemo(
    (): CollectionBook[] => getFilteredItems(collectionBooks, filterSet, orIndex),
    [collectionBooks, filterSet, orIndex]
  );

  const groupedBooks = useMemo(() => groupByVolume(filteredResults), [filteredResults]);
  const filteredGroupedBooks = useMemo(
    () =>
      groupedBooks.map(bookWithVolumes =>
        bookWithVolumes.filter(({ collectionBook }) => viewBookStatusList.includes(collectionBook.status))
      ),
    [groupedBooks, viewBookStatusList]
  );

  const bookCardList = useMemo(
    () => (
      <BookCardList
        books={filteredResults}
        {...{ viewType, filterSet, orIndex, setContentHeight, viewBookStatusList }}
      />
    ),
    [filterSet, filteredResults, orIndex, setContentHeight, viewBookStatusList, viewType]
  );

  const groupedBookElms = useCallback(
    (stickyTop: number) =>
      filteredGroupedBooks
        .map((list, idx) =>
          !list.length ? null : (
            <GroupByBlock
              key={idx}
              stickyTop={stickyTop}
              setContentHeight={setContentHeight}
              bookWithVolumes={list}
              {...{ viewType, scrollParentRef, idx, filterSet, orIndex }}
            />
          )
        )
        .filter(Boolean),
    [filterSet, filteredGroupedBooks, orIndex, scrollParentRef, setContentHeight, viewType]
  );

  const groupedBooksElement = useMemo(
    () => (
      <CollapsibleFrame
        mode="normal"
        hasGap
        className="bg-orange-800 text-white"
        stickyTop={stickyTop}
        scrollParentRef={scrollParentRef}
        headerText={<FilterSetCollapsibleHeader filterSet={filterSet} />}
        setContentHeight={setContentHeight}
        zIndex={11}
      >
        {!groupByType ? [bookCardList] : stickyTop => groupedBookElms(stickyTop)}
      </CollapsibleFrame>
    ),
    [bookCardList, filterSet, groupByType, groupedBookElms, scrollParentRef, setContentHeight, stickyTop]
  );

  return <div className="flex flex-col">{groupedBooksElement}</div>;
};

// カスタム比較関数で不要な再レンダリングを防止
export default memo(FilterResultSetComponent);
