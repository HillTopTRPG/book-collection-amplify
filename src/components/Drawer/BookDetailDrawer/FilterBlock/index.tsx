import { Fragment, useMemo } from 'react';
import NdlCard from '@/components/Card/NdlCard';
import { Separator } from '@/components/ui/separator.tsx';
import type { FilterSet } from '@/store/subscriptionDataSlice.ts';
import type { BookData, Isbn13 } from '@/types/book.ts';
import { getFilteredItems } from '@/utils/data.ts';
import SearchConditionsForm from './SearchConditionsForm.tsx';

type Props = {
  isbn: Isbn13;
  filterSet: FilterSet;
  orIndex: number;
  fetchedBooks: BookData[];
  selectedIsbn: string | null;
  setSelectedIsbn: (isbn: string | null) => void;
  setDetailIsbn: (isbn: string | null) => void;
};

export default function FilterBlock({
  isbn,
  filterSet,
  orIndex,
  fetchedBooks,
  selectedIsbn,
  setSelectedIsbn,
  setDetailIsbn,
}: Props) {
  const filteredResults = useMemo(
    (): BookData[] => getFilteredItems(fetchedBooks, filterSet, orIndex),
    [fetchedBooks, filterSet, orIndex]
  );

  return (
    <>
      <div className="relative">
        <Separator />
        {fetchedBooks?.length ? (
          <SearchConditionsForm {...{ isbn, filterSet, orIndex, fetchedBooks }} count={filteredResults.length} />
        ) : null}
        <div className="flex flex-col justify-center">
          {filteredResults.map((ndl, idx) => (
            <Fragment key={idx}>
              {idx ? <Separator /> : null}
              <NdlCard
                {...{ ndl, filterSet, orIndex, selectedIsbn, setSelectedIsbn }}
                onOpenBookDetail={isbn => {
                  setDetailIsbn(isbn);
                  setSelectedIsbn(null);
                }}
              />
            </Fragment>
          ))}
        </div>
      </div>
      {orIndex === filterSet.filters.length - 1 ? (
        <div style={{ minHeight: filteredResults.length ? '2rem' : 'calc(100vh - 7rem + 2px)' }}></div>
      ) : null}
    </>
  );
}
