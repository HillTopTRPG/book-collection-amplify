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

const COLLAPSE_BUTTON_INDEX = 2;

type Props = {
  mode: 'foldable' | 'foldable-footer' | 'normal' | 'normal-footer';
  hasGap?: boolean;
  className: ClassValue;
  stickyTop: number;
  scrollParentRef: RefObject<HTMLDivElement | null>;
  headerText: ReactNode;
  setContentHeight: (height: number) => void;
  children: ReactNode[] | ((stickyTop: number) => ReactNode[]);
  zIndex: number;
};

const isReactNode = (c: Props['children']): c is ReactNode[] => Array.isArray(c);

export default function CollapsibleFrame({
  mode,
  hasGap,
  className,
  stickyTop,
  scrollParentRef,
  headerText,
  setContentHeight,
  children,
  zIndex,
}: Props) {
  const [headerRef, headerSize] = useDOMSize();
  const [contentRef, contentSize] = useDOMSize();
  const stickyStyle = useMemo(() => ({ top: stickyTop, zIndex }), [stickyTop, zIndex]);
  const footerRef = useRef<HTMLDivElement>(null);
  const isFoldable = useMemo(() => mode.startsWith('foldable'), [mode]);
  const isUseFooter = useMemo(() => mode.endsWith('footer'), [mode]);
  const defaultOpenType = useMemo(() => (children.length > 5 ? 'collapse' : 'full'), [children.length]);
  const [openType, setOpenType] = useState<CollapseOpenType>(isFoldable ? defaultOpenType : 'full');

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
        scrollParentRef.current.scrollBy(0, headerRect.top - stickyTop + (countRect.top - headerRect.bottom));
      });
    },
    [headerRef, scrollParentRef, stickyTop]
  );

  const handleOpenChange = useCallback(() => {
    if (openType === 'full') {
      setOpenType('close');

      // 「〜件」が見える位置までスクロールする
      scrollToRef(isUseFooter ? footerRef : contentRef);
      return;
    }

    if (isFoldable) {
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
  }, [children.length, contentRef, isFoldable, isUseFooter, openType, scrollToRef]);

  const handleShowAll = useCallback(() => {
    setOpenType('full');
  }, [setOpenType]);

  const childrenList = useMemo(
    () => (isReactNode(children) ? children : children(stickyTop + headerSize.height)),
    [children, headerSize.height, stickyTop]
  );

  const childrenListElm = useMemo(
    () =>
      childrenList.flatMap((elm, idx) => {
        if (openType === 'collapse' && COLLAPSE_BUTTON_INDEX <= idx && idx < childrenList.length - 2) {
          if (idx == COLLAPSE_BUTTON_INDEX) {
            return [
              <div key={idx} className="flex flex-col">
                {!hasGap ? <Separator /> : null}
                <div
                  className="flex py-2 text-xs items-center justify-center cursor-pointer text-white bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
                  onClick={handleShowAll}
                >
                  すべて表示する
                </div>
              </div>,
            ];
          }
          return null;
        }
        if (!elm) return [];
        return [
          <div key={idx} className="flex flex-col">
            {idx && !hasGap ? <Separator /> : null}
            {elm}
          </div>,
        ];
      }),
    [childrenList, handleShowAll, hasGap, openType]
  );

  return (
    <>
      <div
        ref={headerRef}
        className={cn('flex items-center px-2 py-1 sticky cursor-pointer', className)}
        style={stickyStyle}
        onClick={handleOpenChange}
      >
        <div className="flex-1">{headerText}</div>
        {COLLAPSE_ICON_MAP[openType]}
      </div>
      <div ref={contentRef} className="flex">
        <div className={cn('w-2', className)} />
        <div className="flex flex-col flex-1" style={{ maxWidth: 'calc(100% - 0.5rem)' }}>
          <div className={cn('flex flex-col flex-1', hasGap ? 'gap-5' : null)}>
            {openType === 'close' ? null : childrenListElm}
          </div>
          <div ref={footerRef} className={cn('w-full', className)}>
            {isUseFooter ? <div className="px-2 py-1">{children.length}件</div> : null}
          </div>
        </div>
      </div>
    </>
  );
}
