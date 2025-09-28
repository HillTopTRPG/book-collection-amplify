import type { ReactNode } from 'react';
import { useCallback } from 'react';
import { cn } from '@/lib/utils.ts';

import '@m_three_ui/m3ripple/css';

const BASE = 'relative';
const FLEX = 'flex items-center justify-center';
const COLOR =
  'hover-supported:hover:bg-gray-50/30 dark:hover-supported:hover:bg-white/5 transition-colors duration-200';
const TOUCH = 'touch-manipulation min-h-[44px]';

type Props = {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
};

export default function CardFrame({ children, onClick, className }: Props) {
  const handleClick = useCallback(() => {
    onClick?.();
  }, [onClick]);

  return (
    <div
      className={cn(BASE, FLEX, COLOR, TOUCH, className)}
      onClick={handleClick}
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
