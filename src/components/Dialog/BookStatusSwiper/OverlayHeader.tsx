import type { BookStatus } from '@/types/book.ts';
import swipeImg from '@/assets/swipe.png';
import { Button } from '@/components/ui/button.tsx';
import { cn } from '@/lib/utils.ts';
import { BookStatusEnum, BookStatusLabelMap } from '@/types/book.ts';

type Props = {
  onBookStatusSelect: (status: BookStatus) => void;
};

export default function OverlayHeader({ onBookStatusSelect }: Props) {
  return (
    <div className={cn('flex flex-col justify-center gap-1 py-1', 'bg-green-400 text-gray-700')}>
      <div className="flex items-center justify-center gap-3">
        <img src={swipeImg} alt="swipe" style={{ height: '2em' }} />
        <div className="flex items-baseline gap-2">
          <span>でステータスを変更</span>
          <div className="text-xs">または</div>
        </div>
      </div>
      <div className="flex justify-center gap-2">
        {[BookStatusEnum.Planned, BookStatusEnum.Owned, BookStatusEnum.NotBuy, BookStatusEnum.Hold].map(status => (
          <Button
            key={status}
            size="sm"
            className={cn(BookStatusLabelMap[status].className, 'pointer-events-auto')}
            onClick={() => onBookStatusSelect(status)}
          >
            {BookStatusLabelMap[status].label}
          </Button>
        ))}
      </div>
    </div>
  );
}
