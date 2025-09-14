import type { ReactNode } from 'react';
import { Fragment, useMemo } from 'react';

import { Button } from '@/components/ui/button.tsx';

type Props = {
  isVisible: boolean;
  onClose: () => void;
  header: ReactNode;
  children: ReactNode;
};

export default function DrawerFrame({ isVisible, onClose, header, children }: Props) {
  const overlayClassName = useMemo(() =>
    `fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'}`,
  [isVisible]
  );

  const drawerClassName = useMemo(() =>
    `fixed top-0 right-0 h-screen w-full md:w-[32rem] bg-background border-l z-50 shadow-lg transition-transform duration-300 ease-in-out ${isVisible ? 'transform translate-x-0' : 'transform translate-x-full'}`,
  [isVisible]
  );

  return (
    <Fragment>
      <div className={overlayClassName} onClick={onClose} />
      <div className={drawerClassName}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="border-b p-4">
            {header}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto w-full h-full p-4">
            {children}
          </div>

          {/* Footer */}
          <div className="border-t p-4">
            <Button variant="outline" onClick={onClose} className="w-full">
              閉じる
            </Button>
          </div>
        </div>
      </div>
    </Fragment>
  );
}