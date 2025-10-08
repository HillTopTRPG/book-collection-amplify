import type { BookData, FilterSet } from '@/types/book.ts';
import type { RefObject } from 'react';
import GroupByTypeCheck from '@/components/GroupByTypeCheck.tsx';
import SearchConditionItem from './SearchConditionItem.tsx';

type Props = {
  ref: RefObject<HTMLDivElement | null>;
  filterSet: FilterSet;
  orIndex: number;
  books: BookData[];
  filteredResults: BookData[];
  onUpdateGroupByType: (groupByType: 'volume' | null) => void;
  onFilterSetUpdate: (value: FilterSet) => void;
};

export default function SearchConditionsForm({
  ref,
  filterSet,
  orIndex,
  books,
  filteredResults,
  onUpdateGroupByType,
  onFilterSetUpdate,
}: Props) {
  return (
    <div
      ref={ref}
      className="sticky top-0 flex flex-col z-[110] items-stretch gap-1 bg-background py-1 px-2 border-b shadow-md overflow-visible"
    >
      <div className="text-sm min-w-[4rem] flex items-center justify-between">
        <span className="ml-4">{!orIndex ? '条件' : `OR条件${orIndex}`}</span>
        <span>計{filteredResults.length}件</span>
        <GroupByTypeCheck
          groupByType={filterSet.filters[orIndex].groupByType}
          onUpdateGroupByType={onUpdateGroupByType}
        />
      </div>
      {books.length
        ? filterSet.filters[orIndex].list.map((_, andIndex) => (
            <SearchConditionItem key={andIndex} {...{ filterSet, orIndex, books, andIndex, onFilterSetUpdate }} />
          ))
        : null}
    </div>
  );
}
