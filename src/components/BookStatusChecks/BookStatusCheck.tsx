import type { BookStatus } from '@/types/book.ts';
import { useCallback, useMemo } from 'react';
import { Toggle } from '@/components/ui/toggle.tsx';
import { cn } from '@/lib/utils.ts';
import { BookStatusLabelMap } from '@/types/book.ts';

type Props = {
  value: BookStatus;
  statusList: BookStatus[];
  onUpdate: (type: 'add' | 'delete', status: BookStatus) => void;
};

export default function BookStatusCheck({ value, statusList, onUpdate }: Props) {
  const checked = useMemo(() => statusList.includes(value), [statusList, value]);
  const handleCheckedChange = useCallback((v: boolean) => onUpdate(v ? 'add' : 'delete', value), [onUpdate, value]);
  const { label, className } = useMemo(() => BookStatusLabelMap[value], [value]);

  return (
    <Toggle
      className={cn('text-xs px-2 py-2 min-w-[3rem] h-auto rounded-full', className)}
      aria-label="Toggle italic"
      pressed={checked}
      onPressedChange={handleCheckedChange}
    >
      {label}
    </Toggle>
  );
}
