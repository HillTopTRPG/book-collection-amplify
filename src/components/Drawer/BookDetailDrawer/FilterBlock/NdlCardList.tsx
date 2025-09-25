import type { RefObject } from 'react';
import { Fragment, useEffect, useRef, useState } from 'react';
import NdlCard from '@/components/Card/NdlCard';
import { Separator } from '@/components/ui/separator.tsx';
import { useAppSelector } from '@/store/hooks.ts';
import type { FilterSet } from '@/store/subscriptionDataSlice.ts';
import { selectBookDetailScrollValue } from '@/store/uiSlice.ts';
import type { BookData } from '@/types/book.ts';

type Props = {
  countRef?: RefObject<HTMLDivElement | null>;
  conditionsFormRef: RefObject<HTMLDivElement | null>;
  books: BookData[];
  filterSet: FilterSet;
  orIndex: number;
  selectedIsbn: string | null;
  setSelectedIsbn: (isbn: string | null) => void;
  setDetailIsbn: (isbn: string | null) => void;
  openType?: 'collapse' | 'full' | 'close';
  setOpenType?: (openType: 'collapse' | 'full' | 'close') => void;
  isLastBlock: boolean;
};

export default function NdlCardList({
  countRef,
  conditionsFormRef,
  books,
  filterSet,
  orIndex,
  selectedIsbn,
  setSelectedIsbn,
  setDetailIsbn,
  openType,
  setOpenType,
  isLastBlock,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const bookDetailScrollValue = useAppSelector(selectBookDetailScrollValue);
  const [contentEndY, setContentEndY] = useState<number | null>(null);

  const isOpen = !openType || ['collapse', 'full'].some(v => v === openType);

  const isCollapse = isOpen && openType === 'collapse' && books.length > 5;
  const collapseButtonIndex = 2;

  const isEndOfTotal = isLastBlock && orIndex === filterSet.filters.length - 1;

  useEffect(() => {
    setTimeout(() => {
      if (!isEndOfTotal) return;
      if (!ref.current) return;
      if (!conditionsFormRef.current) return;
      const cRect = conditionsFormRef.current.getBoundingClientRect();
      const rect = ref.current.getBoundingClientRect();
      setContentEndY(cRect.bottom + rect.height + 64);
    });
  }, [openType, books.length, conditionsFormRef, bookDetailScrollValue, isEndOfTotal]);

  return (
    <>
      <div ref={ref} className="flex flex-col">
        {isOpen
          ? books.map((ndl, idx) => (
              <Fragment key={idx}>
                {!isCollapse || idx < 2 || books.length - 3 < idx ? (
                  <>
                    {idx ? <Separator /> : null}
                    <NdlCard
                      {...{ ndl, filterSet, orIndex, selectedIsbn, setSelectedIsbn }}
                      onOpenBookDetail={isbn => {
                        setDetailIsbn(isbn);
                        setSelectedIsbn(null);
                      }}
                    />
                  </>
                ) : null}
                {isCollapse && idx == collapseButtonIndex ? (
                  <>
                    <Separator />
                    <div
                      className="flex py-2 items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
                      onClick={() => setOpenType?.('full')}
                    >
                      全て表示する
                    </div>
                  </>
                ) : null}
              </Fragment>
            ))
          : null}
      </div>
      <div ref={countRef} className="px-2 py-1">
        {books.length}件
      </div>
      {/* 最後のブロックなら下に余白を入れる */}
      {isEndOfTotal ? <div style={{ minHeight: `calc(100vh - ${contentEndY}px)` }}></div> : null}
    </>
  );
}
