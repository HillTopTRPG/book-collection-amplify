import { useState } from 'react';
import { cn } from '@/lib/utils.ts';

const BASE = 'cursor-pointer h-full';
const FLEX = 'flex items-center justify-center';
const VERTICAL_TEXT = 'tracking-[.25em] [writing-mode:vertical-rl]';

type Props = {
  onClick: () => void;
  zIndex: number;
  className: string;
  label: string;
  isFirst?: boolean;
};

export default function BookStatusParts({ onClick, zIndex, className, label, isFirst }: Props) {
  const [hover, setHover] = useState(false);

  const polygons = [
    '0 0',
    'calc(100% - 23px) 0',
    '100% 50%',
    'calc(100% - 23px) 100%',
    '0 100%',
    isFirst ? null : '23px 50%',
  ];
  const clipPath = `polygon(${polygons.filter(Boolean).join(', ')})`;

  return (
    <div
      className={cn('relative flex h-full -mr-6 overflow-hidden')}
      style={{ clipPath, zIndex }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {hover ? (
        <div className="absolute inset-0 z-20 pointer-events-none hover-supported:bg-gray-50/10 dark:hover-supported:bg-white/5" />
      ) : null}
      <div
        onClick={onClick}
        className={cn(BASE, 'z-10', FLEX, isFirst ? 'pl-2 min-w-6 max-w-6' : 'pl-8 min-w-12 max-w-12', className)}
      />
      <span
        className={cn(
          VERTICAL_TEXT,
          'text-xs right-6 select-none absolute z-30 inset-y-0 flex justify-center pointer-events-none text-white'
        )}
      >
        {label}
      </span>
      <div
        onClick={onClick}
        className={cn(BASE, FLEX, 'min-w-6 max-w-6 bg-foreground')}
        style={{ clipPath: 'polygon(0 0, 1px 0, 100% 50%, 1px 100%, 0 100%)' }}
      />
      <div
        onClick={onClick}
        className={cn(BASE, FLEX, 'min-w-6 max-w-6 absolute right-0 z-10', className)}
        style={{ clipPath: 'polygon(0 0, calc(100% - 1px) 50%, 0 100%)' }}
      />
    </div>
  );
}
