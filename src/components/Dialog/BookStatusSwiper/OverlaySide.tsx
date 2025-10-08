import type { BookStatus } from '@/types/book.ts';
import type { ClassValue } from 'clsx';
import { Settings2 } from 'lucide-react';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button.tsx';
import { cn } from '@/lib/utils.ts';
import { BookStatusLabelMap } from '@/types/book.ts';

const FLEX_CENTER = 'flex items-center justify-center gap-5 w-[10%]';
const VERTICAL_TEXT: ClassValue = 'tracking-[.25em] [writing-mode:vertical-rl]';

type Props = {
  status: BookStatus;
  side: 'left' | 'right';
  dragX: number;
  navOpacity: number;
};

export default function OverlaySide({ status, side, dragX, navOpacity }: Props) {
  const opacity = useMemo(() => {
    const isTargetSide = side === 'left' ? dragX < 0 : dragX > 0;

    return isTargetSide ? navOpacity : 0.6;
  }, [side, dragX, navOpacity]);

  return (
    <div className={cn(VERTICAL_TEXT, FLEX_CENTER, BookStatusLabelMap[status].className)} style={{ opacity }}>
      <span className="text-xs">ここまでスワイプ</span>
      <span className="font-bold">《{BookStatusLabelMap[status].label}》</span>
      <span className="text-xs">ここまでスワイプ</span>
      <Button size="icon">
        <Settings2 />
      </Button>
    </div>
  );
}
