import type { FilterSet } from '@/store/subscriptionDataSlice.ts';
import type { BookData, Isbn13 } from '@/types/book.ts';
import SearchConditionItem from './SearchConditionItem.tsx';

type Props = {
  isbn: Isbn13;
  filterSet: FilterSet;
  orIndex: number;
  fetchedBooks: BookData[];
  count: number;
};

export default function SearchConditionsForm({ isbn, filterSet, orIndex, fetchedBooks, count }: Props) {
  return (
    <div className="sticky top-0 flex flex-col z-50 items-stretch gap-1 bg-background py-1 px-2 border-b shadow-md">
      <div className="text-sm min-w-[4rem] flex items-center">
        {!orIndex ? '必須条件' : `OR条件${orIndex}`}
        {count}件
      </div>
      {filterSet.filters[orIndex].map((_, andIndex) => (
        <SearchConditionItem key={andIndex} {...{ isbn, filterSet, orIndex, fetchedBooks, andIndex }} />
      ))}
    </div>
  );
}
