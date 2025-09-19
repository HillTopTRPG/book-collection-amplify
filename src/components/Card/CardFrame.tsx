import type { ReactNode } from 'react';
import { useCallback, useState } from 'react';
import { cn } from '@/lib/utils.ts';

const BASE = 'relative cursor-pointer rounded-lg p-2 select-none';
const FLEX = 'flex items-center justify-center';
const COLOR = 'hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200';
const TOUCH = 'touch-manipulation min-h-[44px] active:bg-gray-100 dark:active:bg-gray-700';

type Props = {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
};

export default function CardFrame({ children, onClick, className }: Props) {
  const [isPressed, setIsPressed] = useState(false);

  const handleTouchStart = useCallback(() => {
    setIsPressed(true);
  }, []);

  const handleTouchEnd = useCallback(() => {
    setIsPressed(false);
    onClick?.();
  }, [onClick]);

  const handleTouchCancel = useCallback(() => {
    setIsPressed(false);
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if ('ontouchstart' in window) {
        e.preventDefault();
        return;
      }
      onClick?.();
    },
    [onClick]
  );

  return (
    <div
      className={cn(BASE, FLEX, COLOR, TOUCH, isPressed && 'bg-gray-100 dark:bg-gray-700', className)}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {children}
    </div>
  );
}
