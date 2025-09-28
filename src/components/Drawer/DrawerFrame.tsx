import type { ReactNode, RefObject } from 'react';
import { Fragment, isValidElement, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button.tsx';
import { useAppDispatch } from '@/store/hooks.ts';
import { setScrollValue } from '@/store/uiSlice.ts';

type Props = {
  drawerType: 'bookDetail';
  isVisible: boolean;
  onClose?: () => void;
  header: ReactNode;
  children: ReactNode | ((scrollParentRef: RefObject<HTMLDivElement | null>) => ReactNode);
  useFooter?: boolean;
};

export default function DrawerFrame({ drawerType, isVisible, onClose, header, children, useFooter }: Props) {
  const dispatch = useAppDispatch();
  const scrollParentRef = useRef<HTMLDivElement>(null);
  const overlayClassName = useMemo(
    () =>
      `fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'}`,
    [isVisible]
  );

  const drawerClassName = useMemo(
    () =>
      `fixed top-0 right-0 bottom-0 w-full md:w-[32rem] bg-background border-l z-50 shadow-lg transition-transform duration-300 ease-in-out ${isVisible ? 'transform translate-x-0' : 'transform translate-x-full'}`,
    [isVisible]
  );

  const isReactNode = (c: Props['children']): c is ReactNode => isValidElement(c);

  const onScroll = () => {
    if (!scrollParentRef.current) return;
    const scrollTop = scrollParentRef.current?.scrollTop;
    dispatch(setScrollValue({ key: drawerType, value: scrollTop }));
  };

  return (
    <Fragment>
      <div className={overlayClassName} onClick={onClose} />
      <div className={drawerClassName}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="border-b p-4 flex items-center gap-3">{header}</div>

          {/* Content */}
          <div
            ref={scrollParentRef}
            className="flex-1 overflow-y-auto w-full h-full"
            onScrollCapture={e => {
              e.stopPropagation();
              onScroll();
            }}
          >
            {isReactNode(children) ? children : children(scrollParentRef)}
          </div>

          {/* Footer */}
          {useFooter ? (
            <div className="border-t p-4">
              <Button variant="outline" onClick={onClose} className="w-full">
                閉じる
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </Fragment>
  );
}
