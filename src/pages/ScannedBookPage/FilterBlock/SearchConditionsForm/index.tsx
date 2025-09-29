import type { FilterSet } from '@/store/subscriptionDataSlice.ts';
import type { BookDetail } from '@/types/book.ts';
import type { RefObject } from 'react';
import { MessageCircleQuestionMark } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox.tsx';
import { Label } from '@/components/ui/label.tsx';
import { IconButton } from '@/components/ui/shadcn-io/icon-button';
import SearchConditionItem from './SearchConditionItem.tsx';

type Props = {
  ref: RefObject<HTMLDivElement | null>;
  filterSet: FilterSet;
  orIndex: number;
  fetchedBooks: BookDetail[];
  filteredResults: BookDetail[];
  updateGroupingType: (value: boolean) => void;
};

export default function SearchConditionsForm({
  ref,
  filterSet,
  orIndex,
  fetchedBooks,
  filteredResults,
  updateGroupingType,
}: Props) {
  return (
    <div
      ref={ref}
      className="sticky top-0 flex flex-col z-50 items-stretch gap-1 bg-background py-1 px-2 border-b shadow-md"
    >
      <div className="text-sm min-w-[4rem] flex items-center justify-between">
        <span>{!orIndex ? '必須条件' : `OR条件${orIndex}`}</span>
        <span>{filteredResults.length}件</span>
        <div className="flex items-center gap-1">
          <Checkbox
            id="terms"
            checked={filterSet.filters[orIndex].grouping === 'date'}
            onCheckedChange={updateGroupingType}
          />
          <Label htmlFor="terms">連載グルーピング</Label>
          <IconButton icon={MessageCircleQuestionMark} className="border-0" />
        </div>
      </div>
      {fetchedBooks.length
        ? filterSet.filters[orIndex].list.map((_, andIndex) => (
            <SearchConditionItem key={andIndex} {...{ filterSet, orIndex, fetchedBooks, andIndex }} />
          ))
        : null}
    </div>
  );
}
