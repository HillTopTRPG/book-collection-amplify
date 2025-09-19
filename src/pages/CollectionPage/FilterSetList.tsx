import { Fragment } from 'react';
import FilterCard from '@/components/Card/FilterCard';
import { Separator } from '@/components/ui/separator.tsx';
import { useAppSelector } from '@/store/hooks.ts';
import { selectFilterSets } from '@/store/subscriptionDataSlice.ts';

export default function FilterSetList() {
  const filterSets = useAppSelector(selectFilterSets);

  return (
    <div className="flex flex-col bg-background rounded-xl p-2 w-full flex-1 overflow-clip relative">
      {filterSets.map((filterSet, index) => (
        <Fragment key={index}>
          {index > 0 && <Separator className="my-1" />}
          <FilterCard filterSet={filterSet} />
        </Fragment>
      ))}
      {!filterSets.length && '表示する書籍がありません。'}
    </div>
  );
}
