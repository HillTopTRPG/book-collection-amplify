import type { BookWithVolume } from '@/utils/groupByVolume.ts';
import type { RefObject } from 'react';
import { Fragment, useCallback } from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination.tsx';

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

  return (
    <Pagination className="flex min-w-0 bg-gray-400 py-1 pointer-events-auto">
      <PaginationContent className="flex-nowrap">
        <PaginationItem>
          <PaginationPrevious disabled={!prev} onClick={() => handleBookApiIdChange(prev)} />
        </PaginationItem>
        {paginationList.map((bookWithVolume, idx) => (
          <Fragment key={idx}>
            {!bookWithVolume ? (
              <span>...</span>
            ) : (
              <PaginationItem>
                <PaginationLink
                  isActive={bookWithVolume.collectionBook.apiId === currentBookApiId}
                  onClick={() => handleBookApiIdChange(bookWithVolume.collectionBook.apiId)}
                >
                  #{bookWithVolume.volume}
                </PaginationLink>
              </PaginationItem>
            )}
          </Fragment>
        ))}
        <PaginationItem>
          <PaginationNext disabled={!next} onClick={() => handleBookApiIdChange(next)} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
