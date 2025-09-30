import type { FilterSet } from '@/store/subscriptionDataSlice.ts';
import type { BookDetail } from '@/types/book.ts';
import type { RefObject } from 'react';
import { RippleContainer } from '@m_three_ui/m3ripple';
import { Fragment, useEffect } from 'react';
import { Separator } from '@/components/ui/separator.tsx';
import useDOMSize from '@/hooks/useDOMSize.ts';
import { useAppDispatch } from '@/store/hooks.ts';
import { setBookDetailDialogValue } from '@/store/uiSlice.ts';
import NdlCardNavi from './NdlCardNavi.tsx';

import '@m_three_ui/m3ripple/css';

type Props = {
  countRef?: RefObject<HTMLDivElement | null>;
  bookDetails: BookDetail[];
  filterSet: FilterSet;
  orIndex: number;
  selectedIsbn: string | null;
  setSelectedIsbn: (isbn: string | null) => void;
  openType?: 'collapse' | 'full' | 'close';
  setOpenType?: (openType: 'collapse' | 'full' | 'close') => void;
  setContentHeight?: (height: number) => void;
};

export default function NdlCardList({
  countRef,
  bookDetails,
  filterSet,
  orIndex,
  selectedIsbn,
  setSelectedIsbn,
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
                      <NdlCardNavi
                        idx={idx}
                        bookDetails={bookDetails}
                        {...{ bookDetail, filterSet, orIndex, selectedIsbn, setSelectedIsbn }}
                        onOpenBookDetail={() => {
                          dispatch(setBookDetailDialogValue(bookDetail));
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
      <RippleContainer className="relative flex" rippleColor="hsla(29,81%,84%,0.15)">
        <div ref={countRef} className="w-full px-2 py-1">
          {bookDetails.length}件
        </div>
      </RippleContainer>
    </>
  );
}
