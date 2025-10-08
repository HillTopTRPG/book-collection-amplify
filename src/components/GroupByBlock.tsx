import type { CollectionBook, FilterSet } from '@/types/book.ts';
import type { BookWithVolume } from '@/utils/groupByVolume';
import type { RefObject } from 'react';
import { useCallback, useMemo } from 'react';
import BookCardNavi from '@/components/BookCardNavi.tsx';
import CollapsibleFrame from '@/components/CollapsibleFrame.tsx';
import { Button } from '@/components/ui/button.tsx';
import { useAppDispatch } from '@/store/hooks.ts';
import { setBookDialogValue, setSwipeDialogValue } from '@/store/uiSlice.ts';

type Props = {
  viewType?: 'default' | 'simple';
  scrollParentRef: RefObject<HTMLDivElement | null>;
  bookWithVolumes: BookWithVolume[];
  idx: number;
  stickyTop: number;
  filterSet: FilterSet;
  orIndex?: number;
  setContentHeight: (height: number) => void;
};

export default function GroupByBlock({
  viewType,
  scrollParentRef,
  bookWithVolumes,
  idx,
  stickyTop,
  filterSet,
  orIndex,
  setContentHeight,
}: Props) {
  const dispatch = useAppDispatch();

  const handleOpenBook = useCallback(
    (collectionBook: CollectionBook) => {
      dispatch(setBookDialogValue(collectionBook));
    },
    [dispatch]
  );

  const handleSwiperOpen = useCallback(() => {
    dispatch(setSwipeDialogValue(bookWithVolumes));
  }, [bookWithVolumes, dispatch]);

  const collectionBookElms = useMemo(
    () =>
      bookWithVolumes.map(({ collectionBook }, idx) => (
        <div key={idx} className="relative">
          <div
            className="absolute inset-0 bg-indigo-900"
            style={{ opacity: 0.2 + (idx / bookWithVolumes.length) * 0.6 }}
          />
          <BookCardNavi
            {...{ viewType, collectionBook, filterSet, orIndex }}
            onOpenBook={() => handleOpenBook(collectionBook)}
          />
        </div>
      )),
    [bookWithVolumes, filterSet, handleOpenBook, orIndex, viewType]
  );

  if (!bookWithVolumes.length) return null;

  return (
    <CollapsibleFrame
      mode="foldable"
      className="bg-green-800 text-white"
      stickyTop={stickyTop}
      scrollParentRef={scrollParentRef}
      headerText={
        bookWithVolumes[0].volume === -1
          ? 'グルーピングなし'
          : `グルーピング${idx + 1} (${bookWithVolumes[0].volume}~${bookWithVolumes[bookWithVolumes.length - 1].volume}) ${bookWithVolumes.length}件`
      }
      setContentHeight={setContentHeight}
      zIndex={10}
    >
      <Button size="sm" onClick={handleSwiperOpen}>
        まとめて更新
      </Button>
      {collectionBookElms}
    </CollapsibleFrame>
  );
}
