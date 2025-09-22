import { Fragment } from 'react';
import NdlCard from '@/components/Card/NdlCard';
import { Separator } from '@/components/ui/separator.tsx';
import type { FilterSet } from '@/store/subscriptionDataSlice.ts';
import type { BookData } from '@/types/book.ts';

type Props = {
  books: BookData[];
  filterSet: FilterSet;
  orIndex: number;
  selectedIsbn: string | null;
  setSelectedIsbn: (isbn: string | null) => void;
  setDetailIsbn: (isbn: string | null) => void;
};

export default function NdlCardList({
  books,
  filterSet,
  orIndex,
  selectedIsbn,
  setSelectedIsbn,
  setDetailIsbn,
}: Props) {
  return (
    <>
      {books.map((ndl, idx) => (
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
    </>
  );
}
