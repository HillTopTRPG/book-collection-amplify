import type { BookData, BookStatus, FilterSet } from '@/types/book.ts';
import type { RefObject } from 'react';
import { Fragment, memo, useCallback, useEffect, useMemo } from 'react';
import { Separator } from '@/components/ui/separator.tsx';
import useDOMSize from '@/hooks/useDOMSize.ts';
import { useAppDispatch, useAppSelector } from '@/store/hooks.ts';
import { selectBookCollections } from '@/store/subscriptionDataSlice.ts';
import { setBookDialogValue } from '@/store/uiSlice.ts';
import BookCardNavi from './BookCardNavi.tsx';

import '@m_three_ui/m3ripple/css';

const collapseButtonIndex = 2;

type Props = {
  countRef?: RefObject<HTMLDivElement | null>;
  books: BookData[];
  filterSet: FilterSet;
  orIndex?: number;
  openType?: 'collapse' | 'full' | 'close';
  setOpenType?: (openType: 'collapse' | 'full' | 'close') => void;
  setContentHeight?: (height: number) => void;
  viewBookStatusList: BookStatus[];
};

const BookCardList = ({
  countRef,
  books,
  filterSet,
  orIndex,
  openType,
  setOpenType,
  setContentHeight,
  viewBookStatusList,
}: Props) => {
  const dispatch = useAppDispatch();
  const bookCollections = useAppSelector(state => selectBookCollections(state, books, viewBookStatusList));
  const [contentRef, contentSize] = useDOMSize();
  const isOpen = useMemo(() => !openType || ['collapse', 'full'].some(v => v === openType), [openType]);

  useEffect(() => {
    setContentHeight?.(contentSize.height);
  }, [setContentHeight, contentSize.height]);

  const handleOpenBook = useCallback(
    (book: BookData) => {
      dispatch(setBookDialogValue(book));
    },
    [dispatch]
  );

  const handleShowAll = useCallback(() => {
    setOpenType?.('full');
  }, [setOpenType]);

  const isCollapse = useMemo(
    () => isOpen && openType === 'collapse' && books.length > 5,
    [books.length, isOpen, openType]
  );

  const booksElement = useMemo(
    () =>
      bookCollections.map(({ book }, idx) => (
        <Fragment key={idx}>
          {!isCollapse || idx < 2 || books.length - 3 < idx ? (
            <>
              {idx ? <Separator /> : null}
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-900" style={{ opacity: 0.2 + (idx / books.length) * 0.6 }} />
                <BookCardNavi {...{ book, filterSet, orIndex }} onOpenBook={() => handleOpenBook(book)} />
              </div>
            </>
          ) : null}
          {isCollapse && idx == collapseButtonIndex ? (
            <>
              <Separator />
              <div
                className="flex py-2 text-xs items-center justify-center cursor-pointer text-white bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
                onClick={handleShowAll}
              >
                すべて表示する
              </div>
            </>
          ) : null}
        </Fragment>
      )),
    [bookCollections, books.length, filterSet, handleOpenBook, handleShowAll, isCollapse, orIndex]
  );

  if (!bookCollections.length) return null;

  return (
    <div>
      <div ref={contentRef} className="flex flex-col bg-background">
        {isOpen ? booksElement : null}
      </div>
      <div ref={countRef} className="w-full px-2 py-1 bg-green-800 text-white">
        {bookCollections.length}件
      </div>
    </div>
  );
};

export default memo(BookCardList);
