import type { BookData, FilterSet } from '@/types/book.ts';
import type { BookWithVolume } from '@/utils/groupByVolume';
import type { RefObject } from 'react';
import { useCallback, useMemo } from 'react';
import BookCardNavi from '@/components/BookCardNavi.tsx';
import CollapsibleFrame from '@/components/CollapsibleFrame.tsx';
import { useAppDispatch } from '@/store/hooks.ts';
import { setBookDialogValue } from '@/store/uiSlice.ts';

type Props = {
  scrollParentRef: RefObject<HTMLDivElement | null>;
  bookCollections: BookWithVolume[];
  idx: number;
  stickyTop: number;
  filterSet: FilterSet;
  orIndex?: number;
  setContentHeight: (height: number) => void;
};

export default function GroupByBlock({
  scrollParentRef,
  bookCollections,
  idx,
  stickyTop,
  filterSet,
  orIndex,
  setContentHeight,
}: Props) {
  const dispatch = useAppDispatch();

  const handleOpenBook = useCallback(
    (book: BookData) => {
      dispatch(setBookDialogValue(book));
    },
    [dispatch]
  );

  const collectionBookElms = useMemo(
    () =>
      bookCollections.map(({ collectionBook }, idx) => (
        <div key={idx} className="relative">
          <div
            className="absolute inset-0 bg-indigo-900"
            style={{ opacity: 0.2 + (idx / bookCollections.length) * 0.6 }}
          />
          <BookCardNavi {...{ collectionBook, filterSet, orIndex }} onOpenBook={() => handleOpenBook(collectionBook)} />
        </div>
      )),
    [bookCollections, filterSet, handleOpenBook, orIndex]
  );

  if (!bookCollections.length) return null;

  return (
    <CollapsibleFrame
      mode="foldable"
      className="bg-green-800 text-white"
      stickyTop={stickyTop}
      scrollParentRef={scrollParentRef}
      headerText={
        bookCollections[0].volume === -1
          ? 'グルーピングなし'
          : `グルーピング${idx + 1} (${bookCollections[0].volume}~${bookCollections[bookCollections.length - 1].volume}) ${bookCollections.length}件`
      }
      setContentHeight={setContentHeight}
      zIndex={10}
    >
      {collectionBookElms}
    </CollapsibleFrame>
  );
}
