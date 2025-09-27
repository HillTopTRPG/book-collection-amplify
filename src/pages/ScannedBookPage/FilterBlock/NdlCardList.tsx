import type { RefObject } from 'react';
import { useEffect, Fragment } from 'react';
import NdlCard from '@/components/Card/NdlCard';
import { Separator } from '@/components/ui/separator.tsx';
import useDOMSize from '@/hooks/useDOMSize.ts';
import type { FilterSet } from '@/store/subscriptionDataSlice.ts';
import type { BookData } from '@/types/book.ts';

type Props = {
  countRef?: RefObject<HTMLDivElement | null>;
  books: BookData[];
  filterSet: FilterSet;
  orIndex: number;
  selectedIsbn: string | null;
  setSelectedIsbn: (isbn: string | null) => void;
  setDetailIsbn: (isbn: string | null) => void;
  openType?: 'collapse' | 'full' | 'close';
  setOpenType?: (openType: 'collapse' | 'full' | 'close') => void;
  setContentHeight?: (height: number) => void;
};

export default function NdlCardList({
  countRef,
  books,
  filterSet,
  orIndex,
  selectedIsbn,
  setSelectedIsbn,
  setDetailIsbn,
  openType,
  setOpenType,
  setContentHeight,
}: Props) {
  const [contentRef, contentSize] = useDOMSize();
  const isOpen = !openType || ['collapse', 'full'].some(v => v === openType);

  useEffect(() => {
    setContentHeight?.(contentSize.height);
  }, [setContentHeight, contentSize.height]);

  const isCollapse = isOpen && openType === 'collapse' && books.length > 5;
  const collapseButtonIndex = 2;

  return (
    <>
      <div ref={contentRef} className="flex flex-col bg-background">
        {isOpen
          ? books.map((ndl, idx) => (
              <Fragment key={idx}>
                {!isCollapse || idx < 2 || books.length - 3 < idx ? (
                  <>
                    {idx ? <Separator /> : null}
                    <div className="relative">
                      <div
                        className="absolute inset-0 -z-1 bg-indigo-900"
                        style={{ opacity: 0.2 + (idx / books.length) * 0.6 }}
                      />
                      <NdlCard
                        {...{ ndl, filterSet, orIndex, selectedIsbn, setSelectedIsbn }}
                        onOpenBookDetail={isbn => {
                          setDetailIsbn(isbn);
                          setSelectedIsbn(null);
                        }}
                      />
                    </div>
                  </>
                ) : null}
                {isCollapse && idx == collapseButtonIndex ? (
                  <>
                    <Separator />
                    <div
                      className="flex py-2 items-center justify-center cursor-pointer bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
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
      <div ref={countRef} className="px-2 py-1 bg-background">
        {books.length}件
      </div>
    </>
  );
}
