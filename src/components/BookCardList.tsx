import type { BookData, BookStatus, CollectionBook, FilterSet } from '@/types/book.ts';
import type { RefObject } from 'react';
import { Fragment, memo, useCallback, useEffect, useMemo } from 'react';
import { Separator } from '@/components/ui/separator.tsx';
import useDOMSize from '@/hooks/useDOMSize.ts';
import { useAppDispatch, useAppSelector } from '@/store/hooks.ts';
import { selectCollectionBooks } from '@/store/subscriptionDataSlice.ts';
import { setBookDialogValue } from '@/store/uiSlice.ts';
import BookCardNavi from './BookCardNavi.tsx';

import '@m_three_ui/m3ripple/css';

type Props = {
  viewType?: 'default' | 'simple';
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
  viewType,
  countRef,
  books,
  filterSet,
  orIndex,
  setContentHeight,
  viewBookStatusList,
}: Props) => {
  const dispatch = useAppDispatch();
  const collectionBooks = useAppSelector(state => selectCollectionBooks(state, books, viewBookStatusList));
  const [contentRef, contentSize] = useDOMSize();

  useEffect(() => {
    setContentHeight?.(contentSize.height);
  }, [setContentHeight, contentSize.height]);

  const handleOpenBook = useCallback(
    (collectionBook: CollectionBook) => {
      dispatch(setBookDialogValue(collectionBook));
    },
    [dispatch]
  );

  const booksElement = useMemo(
    () =>
      collectionBooks.map((collectionBook, idx) => (
        <Fragment key={idx}>
          {idx ? <Separator /> : null}
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-900" style={{ opacity: 0.2 + (idx / books.length) * 0.6 }} />
            <BookCardNavi
              viewType={viewType}
              {...{ collectionBook, filterSet, orIndex }}
              onOpenBook={() => handleOpenBook(collectionBook)}
            />
          </div>
        </Fragment>
      )),
    [collectionBooks, books.length, viewType, filterSet, orIndex, handleOpenBook]
  );

  if (!collectionBooks.length) return null;

  return (
    <div>
      <div ref={contentRef} className="flex flex-col bg-background">
        {booksElement}
      </div>
      <div ref={countRef} className="w-full px-2 py-1 bg-green-800 text-white">
        {collectionBooks.length}件
      </div>
    </div>
  );
};

export default memo(BookCardList);
