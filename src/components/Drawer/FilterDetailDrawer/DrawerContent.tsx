import BookCard from '@/components/Card/BookCard.tsx';
import FilterCard from '@/components/Card/FilterCard';
import type { BookDetail } from '@/store/filterDetailDrawerSlice.ts';
import type { FilterSet } from '@/store/subscriptionDataSlice.ts';

type Props = {
  filterSet: FilterSet | null;
  bookDetails: BookDetail[];
}

export default function DrawerContent({ filterSet, bookDetails }: Props) {
  if (!filterSet) return null;

  return (
    <div className="space-y-4">
      <FilterCard filterSet={filterSet} />
      {bookDetails.map((bookDetail) => (
        <BookCard key={bookDetail.book?.isbn ?? ''} bookDetail={bookDetail} />
      ))}
    </div>
  );
}
