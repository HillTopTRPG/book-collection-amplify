import type { BookWithVolume } from '@/utils/groupByVolume.ts';
import { memo } from 'react';
import { PaginationItem, PaginationLink } from '@/components/ui/pagination.tsx';

type PaginationButtonProps = {
  bookWithVolume: BookWithVolume | null;
  idx: number;
  isActive: boolean;
  onBookApiIdChange: (apiId: string) => void;
};

const PaginationButton = memo(({ bookWithVolume, idx, isActive, onBookApiIdChange }: PaginationButtonProps) => {
  if (!bookWithVolume) {
    if ([1, 5].includes(idx)) {
      return <span className="text-muted-foreground text-xs w-4 text-center">..</span>;
    }
    return <span className="w-8"></span>;
  }

  const handleClick = () => onBookApiIdChange(bookWithVolume.collectionBook.apiId);

  return (
    <PaginationItem>
      <PaginationLink isActive={isActive} onClick={handleClick} className="h-8 w-8 text-xs">
        #{bookWithVolume.volume}
      </PaginationLink>
    </PaginationItem>
  );
});

PaginationButton.displayName = 'PaginationButton';

export default PaginationButton;
