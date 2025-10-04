import type { BookData, BookStatus, FilterSet } from '@/types/book.ts';
import type { RefObject } from 'react';
import { memo, useMemo } from 'react';
import BookCardList from '@/components/BookCardList.tsx';
import GroupByBlock from '@/components/GroupByBlock.tsx';
import { getFilteredItems } from '@/utils/filter.ts';
import { groupByVolume } from '@/utils/groupByVolume.ts';

type Props = {
  stickyTop: number;
  scrollParentRef: RefObject<HTMLDivElement | null>;
  books: BookData[];
  filterSet: FilterSet;
  setContentHeight: (height: number) => void;
  groupByType: 'volume' | null;
  orIndex?: number;
  viewBookStatusList: BookStatus[];
};

const BookDetailView = ({
  stickyTop,
  scrollParentRef,
  books,
  filterSet,
  setContentHeight,
  groupByType,
  orIndex,
  viewBookStatusList,
}: Props) => {
  const filteredResults = useMemo(
    (): BookData[] => getFilteredItems(books, filterSet, orIndex),
    [books, filterSet, orIndex]
  );

  const groupedBooks = useMemo(() => groupByVolume(filteredResults), [filteredResults]);

  const bookCardList = useMemo(
    () => <BookCardList books={filteredResults} {...{ filterSet, orIndex, setContentHeight, viewBookStatusList }} />,
    [filterSet, filteredResults, orIndex, setContentHeight, viewBookStatusList]
  );

  const groupedBooksElement = useMemo(
    () =>
      groupedBooks.map((list, idx) => (
        <GroupByBlock
          key={idx}
          stickyTop={stickyTop}
          setContentHeight={setContentHeight}
          viewBookStatusList={viewBookStatusList}
          {...{ scrollParentRef, list, idx, filterSet, orIndex }}
        />
      )),
    [filterSet, groupedBooks, orIndex, scrollParentRef, setContentHeight, stickyTop, viewBookStatusList]
  );

  return <div className="flex flex-col gap-5">{!groupByType ? bookCardList : groupedBooksElement}</div>;
};

// カスタム比較関数で不要な再レンダリングを防止
export default memo(BookDetailView);
