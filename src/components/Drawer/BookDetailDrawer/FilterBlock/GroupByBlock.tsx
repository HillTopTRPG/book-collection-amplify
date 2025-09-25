import type { ReactNode, RefObject } from 'react';
import { useCallback, useRef, useEffect, useState } from 'react';
import { ChevronsDownUp, ChevronsUpDown, UnfoldVertical } from 'lucide-react';
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
  conditionsFormRef: RefObject<HTMLDivElement | null>;
  scrollParentRef: RefObject<HTMLDivElement | null>;
  list: BookGroup;
  idx: number;
  isLastBlock: boolean;
  stickyTop: number;
  filterSet: FilterSet;
  orIndex: number;
  selectedIsbn: string | null;
  setSelectedIsbn: (isbn: string | null) => void;
  setDetailIsbn: (isbn: string | null) => void;
};

export default function GroupByBlock({
  conditionsFormRef,
  scrollParentRef,
  list,
  idx,
  isLastBlock,
  stickyTop,
  filterSet,
  orIndex,
  selectedIsbn,
  setSelectedIsbn,
  setDetailIsbn,
}: Props) {
  const stickyRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [openType, setOpenType] = useState<CollapseOpenType>(list.length < 6 ? 'full' : 'collapse');

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
    [scrollParentRef]
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
      scrollToRef(contentRef);
    } else {
      setOpenType('full');
    }
  }, [list.length, openType, scrollToRef]);

  return (
    <>
      <div
        ref={stickyRef}
        className="flex dark:bg-green-800 px-2 py-1 sticky z-[100] cursor-pointer"
        style={{ top: stickyTop }}
        onClick={onOpenChange}
      >
        <div className="flex-1">
          {list[0].volume === -1
            ? 'グルーピングなし'
            : `グルーピング${idx + 1} (${list[0].volume}~${list[list.length - 1].volume}) ${list.length}件`}
        </div>
        {COLLAPSE_ICON_MAP[openType]}
      </div>
      <div className="flex">
        <div ref={contentRef} className="dark:bg-green-800 w-2"></div>
        <div className="flex flex-col flex-1">
          <NdlCardList
            countRef={countRef}
            books={list.map(({ book }) => book)}
            conditionsFormRef={conditionsFormRef}
            isLastBlock={isLastBlock}
            {...{ filterSet, orIndex, selectedIsbn, setSelectedIsbn, setDetailIsbn, openType, setOpenType }}
          />
        </div>
      </div>
    </>
  );
}
