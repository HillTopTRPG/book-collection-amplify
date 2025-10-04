import type { BookStatus, FilterSet } from '@/types/book.ts';
import type { BookWithVolume } from '@/utils/groupByVolume';
import type { ReactNode, RefObject } from 'react';
import { ChevronsDownUp, ChevronsUpDown, UnfoldVertical } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Separator } from '@/components/ui/separator.tsx';
import useDOMSize from '@/hooks/useDOMSize.ts';
import { useAppSelector } from '@/store/hooks.ts';
import { selectBookWithVolumeCollections } from '@/store/subscriptionDataSlice.ts';
import BookCardList from './BookCardList.tsx';

type CollapseOpenType = 'full' | 'collapse' | 'close';

const COLLAPSE_ICON_MAP: Record<CollapseOpenType, ReactNode> = {
  full: <ChevronsDownUp />,
  collapse: <UnfoldVertical />,
  close: <ChevronsUpDown />,
};

type Props = {
  scrollParentRef: RefObject<HTMLDivElement | null>;
  list: BookWithVolume[];
  idx: number;
  stickyTop: number;
  filterSet: FilterSet;
  orIndex?: number;
  setContentHeight: (height: number) => void;
  viewBookStatusList: BookStatus[];
};

const GroupByBlock = ({
  scrollParentRef,
  list,
  idx,
  stickyTop,
  filterSet,
  orIndex,
  setContentHeight,
  viewBookStatusList,
}: Props) => {
  const [stickyRef, stickySize] = useDOMSize();
  const [contentRef, contentSize] = useDOMSize();
  const countRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const myHeaderRef = useRef<HTMLDivElement>(null);

  const books = useMemo(() => list.map(({ book }) => book), [list]);

  const bookCollections = useAppSelector(state => selectBookWithVolumeCollections(state, list, viewBookStatusList));
  const [openType, setOpenType] = useState<CollapseOpenType>(bookCollections.length < 6 ? 'full' : 'collapse');

  useEffect(() => {
    setContentHeight(stickySize.height + contentSize.height);
  }, [setContentHeight, contentSize.height, stickySize.height]);

  useEffect(() => {
    setOpenType(bookCollections.length < 6 ? 'full' : 'collapse');
  }, [bookCollections.length]);

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

    if (openType === 'close' && bookCollections.length >= 6) {
      setOpenType('collapse');
      // コンテンツが見える位置までスクロールする
      scrollToRef(contentRef.current ? contentRef : myHeaderRef);
    } else {
      setOpenType('full');
    }
  }, [contentRef, bookCollections.length, openType, scrollToRef]);

  const stickyStyle = useMemo(() => ({ top: stickyTop }), [stickyTop]);

  const bookCardList = useMemo(
    () => (
      <BookCardList countRef={countRef} {...{ filterSet, orIndex, openType, setOpenType, books, viewBookStatusList }} />
    ),
    [books, filterSet, openType, orIndex, viewBookStatusList]
  );

  if (!bookCollections.length) return null;

  return (
    <div>
      {idx ? <Separator /> : null}
      <div
        ref={stickyRef}
        className="flex bg-green-800 text-white px-2 py-1 sticky z-[10] cursor-pointer"
        style={stickyStyle}
        onClick={handleOpenChange}
      >
        <div ref={headerRef} className="flex-1">
          {bookCollections[0].volume === -1
            ? 'グルーピングなし'
            : `グルーピング${idx + 1} (${bookCollections[0].volume}~${bookCollections[bookCollections.length - 1].volume}) ${bookCollections.length}件`}
        </div>
        {COLLAPSE_ICON_MAP[openType]}
      </div>
      <div ref={contentRef} className="flex">
        <div className="bg-green-800 w-2" />
        <div className="flex flex-col flex-1" style={{ maxWidth: 'calc(100% - 0.5rem)' }}>
          {bookCardList}
        </div>
      </div>
    </div>
  );
};

export default memo(GroupByBlock);
