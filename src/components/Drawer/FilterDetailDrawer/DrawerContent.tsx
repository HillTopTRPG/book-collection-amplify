import type { ScannedItemMapValue } from '@/store/scannerSlice.ts';
import type { FilterSet } from '@/store/subscriptionDataSlice.ts';
import BookCard from '@/components/Card/BookCard.tsx';
import FilterCard from '@/components/Card/FilterCard';

type Props = {
  filterSet: FilterSet | null;
  scannedItemMapValues: ScannedItemMapValue[];
};

export default function DrawerContent({ filterSet, scannedItemMapValues }: Props) {
  if (!filterSet) return null;

  return (
    <div className="space-y-4">
      <FilterCard filterSet={filterSet} />
      {scannedItemMapValues.map(scannedItemMapValue => (
        <BookCard key={scannedItemMapValue.isbn} bookDetail={scannedItemMapValue.bookDetail} />
      ))}
    </div>
  );
}
