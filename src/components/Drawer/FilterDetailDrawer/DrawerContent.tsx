import type { CollectionBook, FilterSet } from '@/types/book.ts';
import BookCard from '@/components/Card/BookCard.tsx';
import FilterCard from '@/components/Card/FilterCard';

type Props = {
  filterSet: FilterSet | null;
  collectionBooks: CollectionBook[];
};

export default function DrawerContent({ filterSet, collectionBooks }: Props) {
  if (!filterSet) return null;

  return (
    <div className="space-y-4">
      <FilterCard filterSet={filterSet} />
      {collectionBooks.map(collectionBook => (
        <BookCard key={collectionBook.id} collectionBook={collectionBook} />
      ))}
    </div>
  );
}
