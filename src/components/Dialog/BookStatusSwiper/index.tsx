import type { BookStatus } from '@/types/book.ts';
import type { BookWithVolume } from '@/utils/groupByVolume.ts';
import type { ClassValue } from 'clsx';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import BookWithVolumePagination from '@/components/Dialog/BookStatusSwiper/BookWithVolumePagination.tsx';
import DialogLikeCard from '@/components/Dialog/BookStatusSwiper/DialogLikeCard.tsx';
import OverlayHeader from '@/components/Dialog/BookStatusSwiper/OverlayHeader.tsx';
import OverlaySide from '@/components/Dialog/BookStatusSwiper/OverlaySide.tsx';
import { Dialog, DialogOverlay, DialogPortal } from '@/components/ui/dialog';
import { IconButton } from '@/components/ui/shadcn-io/icon-button';
import { cn } from '@/lib/utils.ts';
import { useAppDispatch, useAppSelector } from '@/store/hooks.ts';
import { selectSwipeDialogValue, setSwipeDialogValue } from '@/store/uiSlice.ts';
import { useBookStatusSwiper } from './useBookStatusSwiper';

const FIXED = 'fixed w-full left-[50%] translate-x-[-50%]';
const OPEN: ClassValue = 'data-[state=open]:animate-in data-[state=open]:fade-in-0';
const CLOSE: ClassValue = 'data-[state=closed]:animate-out data-[state=closed]:fade-out-0';

export default function BookStatusSwiper() {
  const dispatch = useAppDispatch();
  const bookWithVolumes = useAppSelector(selectSwipeDialogValue);
  const [currentBookApiId, setCurrentBookApiId] = useState<string | null>(
    bookWithVolumes.at(0)?.collectionBook.apiId ?? null
  );

  // 直近のスワイプされた書籍IDを格納
  const swipingCardApiId = useRef<string | null>(null);

  const { paginationList, first, next, prev, last, viewList } = useMemo((): {
    paginationList: (BookWithVolume | null)[];
    first: BookWithVolume | null;
    prev: string | null;
    next: string | null;
    last: BookWithVolume | null;
    viewList: BookWithVolume[];
  } => {
    const index = bookWithVolumes.findIndex(bwv => bwv.collectionBook.apiId === currentBookApiId);
    if (index < 0) return { paginationList: [], first: null, prev: null, next: null, last: null, viewList: [] };
    const viewList = bookWithVolumes.slice(index, index + 3);
    const first = bookWithVolumes.at(0) ?? null;
    const prev = index ? (bookWithVolumes.at(index - 1)?.collectionBook.apiId ?? null) : null;
    const next =
      index < bookWithVolumes.length - 1 ? (bookWithVolumes.at(index + 1)?.collectionBook.apiId ?? null) : null;
    const last = bookWithVolumes.at(-1) ?? null;
    const paginationList = [
      first && index > 1 ? [first, null] : [],
      bookWithVolumes.slice(index, index + 3),
      last && index + 4 < bookWithVolumes.length ? [null, last] : [],
    ].flat();

    return { paginationList, first, next, prev, last, viewList };
  }, [bookWithVolumes, currentBookApiId]);

  useEffect(() => {
    setCurrentBookApiId(bookWithVolumes.at(0)?.collectionBook.apiId ?? null);
    swipingCardApiId.current = null;
  }, [bookWithVolumes]);

  const bookStatusSwiperInfo = useBookStatusSwiper({
    swipingCardApiId,
    onSwipeComplete: direction => {
      console.log(direction);
      setCurrentBookApiId(next);
    },
    currentCardId: currentBookApiId,
  });

  const { dragX, navOpacity } = bookStatusSwiperInfo;

  const handleBookStatusSelect = useCallback((bookStatus: BookStatus) => {
    console.log(bookStatus);
  }, []);

  const handleClose = () => {
    console.log('SwipeDialog close');
    setCurrentBookApiId(next);
    swipingCardApiId.current = null;
  };

  const handleAllClose = useCallback(() => {
    dispatch(setSwipeDialogValue([]));
  }, [dispatch]);

  return (
    <Dialog open={bookWithVolumes.length > 0} onOpenChange={handleClose}>
      <DialogPortal>
        <DialogOverlay className="z-[1001]" />

        {/* 背景に表示するナビゲーション */}
        <div className="fixed inset-0 z-[1003] pointer-events-none flex flex-col">
          <OverlayHeader onBookStatusSelect={handleBookStatusSelect} />
          <IconButton
            icon={X}
            size="default"
            className="absolute right-2 top-2 pointer-events-auto"
            color={[25, 20, 20]}
            onClick={handleAllClose}
          />
          <div className="flex justify-between flex-1">
            <OverlaySide status="Planned" side="left" {...{ dragX, navOpacity }} />
            <OverlaySide status="Owned" side="right" {...{ dragX, navOpacity }} />
          </div>
          <BookWithVolumePagination
            {...{
              swipingCardApiId,
              currentBookApiId,
              setCurrentBookApiId,
              paginationList,
              first,
              prev,
              next,
              last,
            }}
          />
        </div>

        {/* DialogContentの代わりにDialogPrimitive.Contentを直接使用 */}
        <DialogPrimitive.Content
          className={cn(FIXED, OPEN, CLOSE, 'max-w-[75vw] sm:max-w-[425px] top-[5.5em] z-[1002]')}
          style={{ minHeight: 'calc(100dvh - 5.5em - 1em)' }}
          onInteractOutside={e => e.preventDefault()}
        >
          {/* 複数のカードを重ねて表示（最大2枚まで表示） */}
          {viewList.map(({ collectionBook }, index) => (
            <DialogLikeCard key={collectionBook.apiId} {...{ collectionBook, index, ...bookStatusSwiperInfo }} />
          ))}
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
