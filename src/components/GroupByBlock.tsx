import type { FilterSet } from '@/store/subscriptionDataSlice.ts';
import type { BookGroup } from '@/utils/groupByVolume';
import type { ReactNode, RefObject } from 'react';
import { ChevronsDownUp, ChevronsUpDown, UnfoldVertical } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useDOMSize from '@/hooks/useDOMSize.ts';
import BookCardList from './BookCardList.tsx';

type CollapseOpenType = 'full' | 'collapse' | 'close';

const COLLAPSE_ICON_MAP: Record<CollapseOpenType, ReactNode> = {
  full: <ChevronsDownUp />,
  collapse: <UnfoldVertical />,
  close: <ChevronsUpDown />,
};

type Props = {
  scrollParentRef: RefObject<HTMLDivElement | null>;
  list: BookGroup;
  idx: number;
  stickyTop: number;
  filterSet: FilterSet;
  orIndex?: number;
  setContentHeight: (height: number) => void;
};

const GroupByBlock = ({ scrollParentRef, list, idx, stickyTop, filterSet, orIndex, setContentHeight }: Props) => {
  const [stickyRef, stickySize] = useDOMSize();
  const [contentRef, contentSize] = useDOMSize();
  const countRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const myHeaderRef = useRef<HTMLDivElement>(null);
  const [openType, setOpenType] = useState<CollapseOpenType>(list.length < 6 ? 'full' : 'collapse');

  useEffect(() => {
    setContentHeight(stickySize.height + contentSize.height);
  }, [setContentHeight, contentSize.height, stickySize.height]);

  useEffect(() => {
    setOpenType(list.length < 6 ? 'full' : 'collapse');
  }, [list.length]);

  const scrollToRef = useCallback(
    (ref: RefObject<HTMLDivElement | null>) => {
      setTimeout(() => {
        if (!stickyRef.current) return;
        if (!ref.current) return;
        if (!scrollParentRef.current) return;
        const stickyRect = stickyRef.current.getBoundingClientRect();
        const countRect = ref.current.getBoundingClientRect();
        scrollParentRef.current.scrollBy(0, countRect.top - stickyRect.bottom);
      });
    },
    [scrollParentRef, stickyRef]
  );

  const handleOpenChange = useCallback(() => {
    if (openType === 'full') {
      setOpenType('close');

      // 「〜件」が見える位置までスクロールする
      scrollToRef(countRef);
      return;
    }

    if (openType === 'close' && list.length >= 6) {
      setOpenType('collapse');
      // コンテンツが見える位置までスクロールする
      scrollToRef(contentRef.current ? contentRef : myHeaderRef);
    } else {
      setOpenType('full');
    }
  }, [contentRef, list.length, openType, scrollToRef]);

  const bookDetails = useMemo(() => list.map(({ bookDetail }) => bookDetail), [list]);

  const stickyStyle = useMemo(() => ({ top: stickyTop }), [stickyTop]);

  const bookCardList = useMemo(
    () => (
      <BookCardList countRef={countRef} bookDetails={bookDetails} {...{ filterSet, orIndex, openType, setOpenType }} />
    ),
    [bookDetails, filterSet, openType, orIndex]
  );

  return (
    <>
      <div
        ref={stickyRef}
        className="flex bg-green-800 text-white px-2 py-1 sticky z-[10] cursor-pointer"
        style={stickyStyle}
        onClick={handleOpenChange}
      >
        <div ref={headerRef} className="flex-1">
          {list[0].volume === -1
            ? 'グルーピングなし'
            : `グルーピング${idx + 1} (${list[0].volume}~${list[list.length - 1].volume}) ${list.length}件`}
        </div>
        {COLLAPSE_ICON_MAP[openType]}
      </div>
      <div ref={contentRef} className="flex">
        <div className="bg-green-800 w-2" />
        <div className="flex flex-col flex-1" style={{ maxWidth: 'calc(100% - 0.5rem)' }}>
          {bookCardList}
        </div>
      </div>
    </>
  );
};

export default memo(GroupByBlock);
