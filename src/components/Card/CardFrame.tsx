import type { ReactNode } from 'react';
import { cn } from '@/lib/utils.ts';

const BASE = 'relative cursor-pointer rounded-lg p-2';
const FLEX = 'flex items-center justify-center gap-3';
const COLOR = 'hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200';

type Props = {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
};

export default function CardFrame({ children, onClick, className }: Props) {
  return (
    <div className={cn(BASE, FLEX, COLOR, className)} onClick={onClick}>
      {children}
    </div>
  );
}
