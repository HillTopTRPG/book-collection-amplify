import type { ClassValue } from 'clsx';
import type { ReactNode, RefObject } from 'react';
import { ChevronsDownUp, ChevronsUpDown, UnfoldVertical } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Separator } from '@/components/ui/separator.tsx';
import useDOMSize from '@/hooks/useDOMSize.ts';
import { cn } from '@/lib/utils.ts';

type CollapseOpenType = 'full' | 'collapse' | 'close';

const COLLAPSE_ICON_MAP: Record<CollapseOpenType, ReactNode> = {
  full: <ChevronsDownUp />,
  collapse: <UnfoldVertical />,
  close: <ChevronsUpDown />,
};

const collapseButtonIndex = 2;

type Props = {
  mode: 'foldable' | 'foldable-footer' | 'normal' | 'normal-footer';
  className: ClassValue;
  stickyTop: number;
  scrollParentRef: RefObject<HTMLDivElement | null>;
  headerRef: RefObject<HTMLDivElement | null>;
  headerText: ReactNode;
  setContentHeight: (height: number) => void;
  children: ReactNode[];
};

export default function CollapsibleFrame({
  mode,
  className,
  stickyTop,
  scrollParentRef,
  headerText,
  setContentHeight,
  children,
}: Props) {
  const [headerRef, headerSize] = useDOMSize();
  const stickyStyle = useMemo(() => ({ top: stickyTop }), [stickyTop]);
  const [contentRef, contentSize] = useDOMSize();
  const footerRef = useRef<HTMLDivElement>(null);
  const [openType, setOpenType] = useState<CollapseOpenType>(children.length < 6 ? 'full' : 'collapse');

  useEffect(() => {
    setContentHeight(headerSize.height + contentSize.height);
  }, [setContentHeight, headerSize.height, contentSize.height]);

  const scrollToRef = useCallback(
    (ref: RefObject<HTMLDivElement | null>) => {
      setTimeout(() => {
        if (!headerRef.current) return;
        if (!ref.current) return;
        if (!scrollParentRef.current) return;
        const headerRect = headerRef.current.getBoundingClientRect();
        const countRect = ref.current.getBoundingClientRect();
        scrollParentRef.current.scrollBy(0, countRect.top - headerRect.bottom);
      });
    },
    [scrollParentRef, headerRef]
  );

  const handleOpenChange = useCallback(() => {
    if (openType === 'full') {
      setOpenType('close');

      // 「〜件」が見える位置までスクロールする
      scrollToRef(footerRef);
      return;
    }

    if (mode.startsWith('foldable')) {
      if (openType === 'close' && children.length >= 6) {
        setOpenType('collapse');
        if (!contentRef.current) return;
        // コンテンツが見える位置までスクロールする
        scrollToRef(contentRef);
      } else {
        setOpenType('full');
      }
    } else {
      setOpenType('full');
    }
  }, [mode, contentRef, children.length, openType, scrollToRef]);

  const isOpen = useMemo(() => ['collapse', 'full'].some(v => v === openType), [openType]);

  const isCollapse = useMemo(
    () => isOpen && openType === 'collapse' && children.length > 5,
    [children.length, isOpen, openType]
  );

  const handleShowAll = useCallback(() => {
    setOpenType('full');
  }, [setOpenType]);

  return (
    <>
      <div
        ref={headerRef}
        className={cn('flex px-2 py-1 sticky z-[10] cursor-pointer', className)}
        style={stickyStyle}
        onClick={handleOpenChange}
      >
        <div className="flex-1">{headerText}</div>
        {COLLAPSE_ICON_MAP[openType]}
      </div>
      <div ref={contentRef} className="flex">
        <div className="bg-green-800 w-2" />
        <div className="flex flex-col flex-1" style={{ maxWidth: 'calc(100% - 0.5rem)' }}>
          {children.map((elm, idx) => {
            if (isCollapse && (2 <= idx || idx < children.length - 2)) {
              if (idx == collapseButtonIndex) {
                return (
                  <>
                    <Separator />
                    <div
                      className="flex py-2 text-xs items-center justify-center cursor-pointer text-white bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
                      onClick={handleShowAll}
                    >
                      すべて表示する
                    </div>
                  </>
                );
              }
              return null;
            }
            return (
              <>
                {idx ? <Separator /> : null}
                {elm}
              </>
            );
          })}
          <div className={cn('w-full', className)} ref={footerRef}>
            {mode.endsWith('footer') ? <div className="px-2 py-1">{children.length}件</div> : null}
          </div>
        </div>
      </div>
    </>
  );
}
