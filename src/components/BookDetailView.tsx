import type { FilterSet } from '@/store/subscriptionDataSlice.ts';
import type { BookDetail } from '@/types/book.ts';
import type { RefObject } from 'react';
import { memo, useMemo } from 'react';
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

const BookDetailView = ({
  stickyTop,
  scrollParentRef,
  bookDetails,
  filterSet,
  setContentHeight,
  groupByType,
  orIndex,
}: Props) => {
  const filteredResults = useMemo(
    (): BookDetail[] => getFilteredItems(bookDetails, filterSet, orIndex),
    [bookDetails, filterSet, orIndex]
  );

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
};

// カスタム比較関数で不要な再レンダリングを防止
export default memo(BookDetailView, (prevProps, nextProps) => {
  // bookDetails の配列参照が同じかチェック
  if (prevProps.bookDetails !== nextProps.bookDetails) return false;
  // filterSet の ID が同じかチェック
  if (prevProps.filterSet.id !== nextProps.filterSet.id) return false;
  // 他の props をチェック
  if (prevProps.stickyTop !== nextProps.stickyTop) return false;
  if (prevProps.groupByType !== nextProps.groupByType) return false;
  if (prevProps.orIndex !== nextProps.orIndex) return false;
  // scrollParentRef と setContentHeight は関数なので、変わらないと仮定
  return true;
});
