import type { useBookStatusSwiper } from '@/components/Dialog/BookStatusSwiper/useBookStatusSwiper.ts';
import type { CollectionBook } from '@/types/book.ts';
import type { ClassValue } from 'clsx';
import type { PanInfo } from 'framer-motion';
import { motion } from 'framer-motion';
import { useCallback, useMemo } from 'react';
import BookDialogContent from '@/components/Dialog/BookDialog/BookDialogContent.tsx';
import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog.tsx';
import { cn } from '@/lib/utils.ts';

const MARK: ClassValue = 'absolute top-8 text-6xl pointer-events-none z-10';

type Props = ReturnType<typeof useBookStatusSwiper> & {
  collectionBook: CollectionBook;
  index: number;
};

export default function DialogLikeCard({
  swipingCardApiId,
  rotate,
  swipeOutDirection,
  dragX,
  markOpacity,
  handleDrag,
  handleDragEnd,
  handleSwipeOutComplete,
  collectionBook,
  index,
}: Props) {
  const isTopCard = index === 0;
  const scale = 1 - index * 0.05; // 下のカードほど少し小さく
  const yOffset = index * 10; // 下のカードほど少し下に
  const zIndex = 100 - index; // 上のカードほど大きいz-index

  // このカードがスワイプ中かどうか
  const isSwipingCard = swipingCardApiId.current === collectionBook.apiId;

  // アニメーション設定を計算（カード毎に独立）
  const animate = useMemo(() => {
    // このカードがスワイプアウト中
    if (isSwipingCard) {
      return {
        x: swipeOutDirection === 'right' ? window.innerWidth : -window.innerWidth,
        rotate: swipeOutDirection === 'right' ? 30 : -30,
        opacity: 0,
        scale: 1,
        y: 0,
      };
    }
    // 一番上のカード（通常ドラッグ中）
    if (isTopCard) {
      return { x: 0, rotate, scale: 1, y: 0, opacity: 1 };
    }
    // その他のカード（現在の位置を維持）
    return { scale, y: yOffset, x: 0, rotate: 0, opacity: 1 };
  }, [isSwipingCard, isTopCard, rotate, scale, swipeOutDirection, yOffset]);

  const handleAnimationComplete = useCallback(() => {
    if (isSwipingCard) {
      handleSwipeOutComplete();
    }
  }, [handleSwipeOutComplete, isSwipingCard]);

  const drag = useMemo(() => (isTopCard && !isSwipingCard ? 'x' : false), [isSwipingCard, isTopCard]);
  const handleDragWrap = useCallback(
    (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (!isTopCard) return;
      handleDrag(event, info);
    },
    [handleDrag, isTopCard]
  );
  const handleDragEndWrap = useCallback(
    (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (!isTopCard) return;
      handleDragEnd(event, info);
    },
    [handleDragEnd, isTopCard]
  );
  const style = useMemo(
    () => (isTopCard && !isSwipingCard ? { x: dragX, zIndex } : { zIndex }),
    [dragX, isSwipingCard, isTopCard, zIndex]
  );

  const leftMark = useMemo(
    () => (
      <div className={cn(MARK, 'right-8')} style={{ opacity: isTopCard && dragX < 0 ? markOpacity : 0 }}>
        👈
      </div>
    ),
    [dragX, isTopCard, markOpacity]
  );

  const rightMark = useMemo(
    () => (
      <div className={cn(MARK, 'left-8')} style={{ opacity: isTopCard && dragX > 0 ? markOpacity : 0 }}>
        👉
      </div>
    ),
    [dragX, isTopCard, markOpacity]
  );

  const titleText = [collectionBook.title, collectionBook.volume, collectionBook.volumeTitle].filter(Boolean).join(' ');

  const descriptionText = [collectionBook.publisher || '出版社不明', collectionBook.creator?.join(', ') || '著者不明']
    .filter(Boolean)
    .join(' ');

  return (
    <motion.div
      drag={drag}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDrag={handleDragWrap}
      onDragEnd={handleDragEndWrap}
      initial={animate}
      animate={animate}
      transition={{ duration: 0.3 }}
      onAnimationComplete={handleAnimationComplete}
      style={style}
      className={cn(
        'flex flex-col rounded-lg origin-bottom',
        'bg-background border shadow-lg',
        'absolute inset-0 w-full px-1 py-3'
      )}
    >
      {/* スワイプ中に表示するマーク */}
      {leftMark}
      {rightMark}

      <DialogHeader>
        <DialogTitle className="text-sm/5 px-2">{titleText}</DialogTitle>
        <DialogDescription className="text-xs/5 px-2">{descriptionText}</DialogDescription>
      </DialogHeader>
      <div className="pb-4 px-1 flex-1 overflow-y-scroll">
        <BookDialogContent
          collectionBook={collectionBook}
          excludeProperties={['ndc', 'ndcLabels', 'publisher', 'creator', 'isbn']}
        />
      </div>
    </motion.div>
  );
}
