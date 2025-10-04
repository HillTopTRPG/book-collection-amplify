import type { BookData, FilterSet } from '@/types/book.ts';
import BookCard from '@/components/Card/BookCard.tsx';
import FilterCard from '@/components/Card/FilterCard';

type Props = {
  filterSet: FilterSet | null;
  books: BookData[];
};

export default function DrawerContent({ filterSet, books }: Props) {
  if (!filterSet) return null;

  return (
    <div className="space-y-4">
      <FilterCard filterSet={filterSet} />
      {books.map(scannedItemMapValue => (
        <BookCard key={scannedItemMapValue.isbn} book={scannedItemMapValue} />
      ))}
    </div>
  );
}
