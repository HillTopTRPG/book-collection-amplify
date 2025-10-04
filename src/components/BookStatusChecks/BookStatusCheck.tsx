import type { BookStatus } from '@/types/book.ts';
import type { ClassValue } from 'clsx';
import { useCallback, useId, useMemo } from 'react';
import { Checkbox } from '@/components/ui/checkbox.tsx';
import { Label } from '@/components/ui/label.tsx';
import { cn } from '@/lib/utils.ts';
import { BookStatusLabelMap } from '@/types/book.ts';

const BASE: ClassValue = 'flex items-center rounded-full border border-foreground/20';

type Props = {
  value: BookStatus;
  statusList: BookStatus[];
  onUpdate: (type: 'add' | 'delete', status: BookStatus) => void;
};

export default function BookStatusCheck({ value, statusList, onUpdate }: Props) {
  const id = useId();
  const checked = useMemo(() => statusList.includes(value), [statusList, value]);
  const handleCheckedChange = useCallback((v: boolean) => onUpdate(v ? 'add' : 'delete', value), [onUpdate, value]);
  const { label, className } = useMemo(() => BookStatusLabelMap[value], [value]);

  return (
    <div className={cn(BASE, 'p-0.5', className)}>
      <div className={cn(BASE, 'py-1 px-2 bg-background text-foreground gap-1')}>
        <Checkbox id={id} checked={checked} onCheckedChange={handleCheckedChange} />
        <Label htmlFor={id} className="text-[8px]">
          {label}
        </Label>
      </div>
    </div>
  );
}
