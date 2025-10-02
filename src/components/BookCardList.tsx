import type { FilterSet } from '@/store/subscriptionDataSlice.ts';
import type { BookDetail } from '@/types/book.ts';
import type { RefObject } from 'react';
import { RippleContainer } from '@m_three_ui/m3ripple';
import { Fragment, useCallback, useEffect } from 'react';
import { Separator } from '@/components/ui/separator.tsx';
import useDOMSize from '@/hooks/useDOMSize.ts';
import { useAppDispatch } from '@/store/hooks.ts';
import { setBookDetailDialogValue } from '@/store/uiSlice.ts';
import BookCardNavi from './BookCardNavi.tsx';

import '@m_three_ui/m3ripple/css';

type Props = {
  countRef?: RefObject<HTMLDivElement | null>;
  bookDetails: BookDetail[];
  filterSet: FilterSet;
  orIndex?: number;
  openType?: 'collapse' | 'full' | 'close';
  setOpenType?: (openType: 'collapse' | 'full' | 'close') => void;
  setContentHeight?: (height: number) => void;
};

export default function BookCardList({
  countRef,
  bookDetails,
  filterSet,
  orIndex,
  openType,
  setOpenType,
  setContentHeight,
}: Props) {
  const dispatch = useAppDispatch();
  const [contentRef, contentSize] = useDOMSize();
  const isOpen = !openType || ['collapse', 'full'].some(v => v === openType);

  useEffect(() => {
    setContentHeight?.(contentSize.height);
  }, [setContentHeight, contentSize.height]);

  const handleOpenBookDetail = useCallback(
    (bookDetail: BookDetail) => {
      dispatch(setBookDetailDialogValue(bookDetail));
    },
    [dispatch]
  );

  const handleShowAll = useCallback(() => {
    setOpenType?.('full');
  }, [setOpenType]);

  const isCollapse = isOpen && openType === 'collapse' && bookDetails.length > 5;
  const collapseButtonIndex = 2;

  return (
    <>
      <div ref={contentRef} className="flex flex-col bg-background">
        {isOpen
          ? bookDetails.map((bookDetail, idx) => (
              <Fragment key={idx}>
                {!isCollapse || idx < 2 || bookDetails.length - 3 < idx ? (
                  <>
                    {idx ? <Separator /> : null}
                    <div className="relative">
                      <div
                        className="absolute inset-0 bg-indigo-900"
                        style={{ opacity: 0.2 + (idx / bookDetails.length) * 0.6 }}
                      />
                      <BookCardNavi
                        {...{ bookDetail, filterSet, orIndex }}
                        onOpenBookDetail={() => handleOpenBookDetail(bookDetail)}
                      />
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
            ))
          : null}
      </div>
      <RippleContainer className="relative flex" rippleColor="hsla(29,81%,84%,0.15)">
        <div ref={countRef} className="w-full px-2 py-1">
          {bookDetails.length}件
        </div>
      </RippleContainer>
    </>
  );
}
