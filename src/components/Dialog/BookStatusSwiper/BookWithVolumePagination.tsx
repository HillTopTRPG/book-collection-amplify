import type { BookWithVolume } from '@/utils/groupByVolume.ts';
import type { RefObject } from 'react';
import { useCallback } from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination.tsx';
import PaginationButton from './PaginationButton.tsx';

type Props = {
  swipingCardApiId: RefObject<string | null>;
  currentBookApiId: string | null;
  setCurrentBookApiId: (apiId: string | null) => void;
  paginationList: (BookWithVolume | null)[];
  prev: string | null;
  next: string | null;
};

export default function BookWithVolumePagination({
  swipingCardApiId,
  currentBookApiId,
  setCurrentBookApiId,
  paginationList,
  prev,
  next,
}: Props) {
  const handleBookApiIdChange = useCallback(
    (apiId: string | null) => {
      setCurrentBookApiId(apiId);
      swipingCardApiId.current = null;
    },
    [setCurrentBookApiId, swipingCardApiId]
  );

  const handlePrev = useCallback(() => handleBookApiIdChange(prev), [handleBookApiIdChange, prev]);
  const handleNext = useCallback(() => handleBookApiIdChange(next), [handleBookApiIdChange, next]);

  return (
    <Pagination className="flex min-w-0 bg-background/95 backdrop-blur-sm border-t border-border shadow-lg py-1 pointer-events-auto">
      <PaginationContent className="flex-nowrap gap-1">
        <PaginationItem>
          <PaginationPrevious disabled={!prev} onClick={handlePrev} className="px-2 text-xs" />
        </PaginationItem>
        {paginationList.map((bookWithVolume, idx) => (
          <PaginationButton
            key={bookWithVolume?.collectionBook.apiId ?? `empty-${idx}`}
            bookWithVolume={bookWithVolume}
            idx={idx}
            isActive={bookWithVolume?.collectionBook.apiId === currentBookApiId}
            onBookApiIdChange={handleBookApiIdChange}
          />
        ))}
        <PaginationItem>
          <PaginationNext disabled={!next} onClick={handleNext} className="px-2 text-xs" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
