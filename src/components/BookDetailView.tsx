import type { FilterSet } from '@/store/subscriptionDataSlice.ts';
import type { BookDetail } from '@/types/book.ts';
import type { RefObject } from 'react';
import { useMemo } from 'react';
import BookCardList from '@/components/BookCardList.tsx';
import GroupByBlock from '@/components/GroupByBlock.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { getFilteredItems } from '@/utils/filter.ts';
import { groupByVolume } from '@/utils/groupByVolume.ts';

type Props = {
  stickyTop: number;
  scrollParentRef: RefObject<HTMLDivElement | null>;
  bookDetails: BookDetail[];
  filterSet: FilterSet;
  setContentHeight: (height: number) => void;
  groupByType: 'volume' | null;
  orIndex?: number;
};

export default function BookDetailView({
  stickyTop,
  scrollParentRef,
  bookDetails,
  filterSet,
  setContentHeight,
  groupByType,
  orIndex,
}: Props) {
  const filteredResults = useMemo((): BookDetail[] => {
    console.log('&&&&&&&&&1');
    const result = getFilteredItems(bookDetails, filterSet, orIndex);
    console.log('&&&&&&&&&2');
    return result;
  }, [bookDetails, filterSet, orIndex]);
  const groupedBooks = useMemo(() => groupByVolume(filteredResults), [filteredResults]);

  const bookCardList = useMemo(
    () => <BookCardList bookDetails={filteredResults} {...{ filterSet, orIndex, setContentHeight }} />,
    [filterSet, filteredResults, orIndex, setContentHeight]
  );

  const groupedBooksElement = useMemo(
    () =>
      groupedBooks.map((list, idx) => (
        <div key={idx}>
          {idx ? <Separator /> : null}
          <GroupByBlock
            stickyTop={stickyTop}
            setContentHeight={setContentHeight}
            {...{ scrollParentRef, list, idx, filterSet, orIndex }}
          />
        </div>
      )),
    [filterSet, groupedBooks, orIndex, scrollParentRef, setContentHeight, stickyTop]
  );

  return <div className="flex flex-col gap-5">{!groupByType ? bookCardList : groupedBooksElement}</div>;
}
