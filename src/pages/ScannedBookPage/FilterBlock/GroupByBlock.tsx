import type { ReactNode, RefObject } from 'react';
import { useEffect, useCallback, useRef, useState } from 'react';
import { ChevronsDownUp, ChevronsUpDown, UnfoldVertical } from 'lucide-react';
import useDOMSize from '@/hooks/useDOMSize.ts';
import type { FilterSet } from '@/store/subscriptionDataSlice.ts';
import type { BookGroup } from '@/utils/groupByVolume';
import NdlCardList from './NdlCardList.tsx';

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
  orIndex: number;
  selectedIsbn: string | null;
  setSelectedIsbn: (isbn: string | null) => void;
  setDetailIsbn: (isbn: string | null) => void;
  setContentHeight: (height: number) => void;
};

export default function GroupByBlock({
  scrollParentRef,
  list,
  idx,
  stickyTop,
  filterSet,
  orIndex,
  selectedIsbn,
  setSelectedIsbn,
  setDetailIsbn,
  setContentHeight,
}: Props) {
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
        scrollParentRef.current?.scrollBy(0, countRect.top - stickyRect.bottom);
      });
    },
    [scrollParentRef, stickyRef]
  );

  const onOpenChange = useCallback(() => {
    if (openType === 'full') {
      setOpenType('close');

      // 「〜件」が見える位置までスクロールする
      scrollToRef(countRef);
      return;
    }

    if (openType === 'close' && list.length >= 6) {
      setOpenType('collapse');
      // コンテンツが見える位置までスクロールする
      scrollToRef(contentRef ?? myHeaderRef);
    } else {
      setOpenType('full');
    }
  }, [contentRef, list.length, openType, scrollToRef]);

  return (
    <>
      <div
        ref={stickyRef}
        className="flex bg-green-800 text-white px-2 py-1 sticky z-[100] cursor-pointer"
        style={{ top: stickyTop }}
        onClick={onOpenChange}
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
        <div className="flex flex-col flex-1">
          <NdlCardList
            countRef={countRef}
            books={list.map(({ book }) => book)}
            {...{ filterSet, orIndex, selectedIsbn, setSelectedIsbn, setDetailIsbn, openType, setOpenType }}
          />
        </div>
      </div>
    </>
  );
}
