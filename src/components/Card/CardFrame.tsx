import type { ReactNode } from 'react';
import { useCallback } from 'react';
import { RippleContainer } from '@m_three_ui/m3ripple';
import { cn } from '@/lib/utils.ts';
import '@m_three_ui/m3ripple/css';

const BASE = 'relative p-2';
const FLEX = 'flex items-center justify-center';
const COLOR = 'hover:bg-gray-50/30 dark:hover:bg-white-100/10 transition-colors duration-200';
const TOUCH = 'touch-manipulation min-h-[44px]';

type Props = {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
};

export default function CardFrame({ children, onClick, className }: Props) {
  const handleTouchEnd = useCallback(() => {
    onClick?.();
  }, [onClick]);

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
    <RippleContainer>
      <div
        className={cn(BASE, FLEX, COLOR, TOUCH, className)}
        onClick={handleClick}
        onTouchEnd={handleTouchEnd}
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
    </RippleContainer>
  );
}
