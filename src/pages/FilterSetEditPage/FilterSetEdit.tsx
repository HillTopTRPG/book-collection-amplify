import type { FilterSet } from '@/types/book.ts';
import type { RefObject } from 'react';
import { useCallback } from 'react';
import FilterBlock from '@/components/FilterBlock.tsx';
import NdlOptionsForm, { type NdlFullOptions } from '@/components/NdlOptionsForm.tsx';
import { Spinner } from '@/components/ui/shadcn-io/spinner';
import { useAppSelector } from '@/store/hooks.ts';
import { selectCollectionBooksByFetch } from '@/store/ndlSearchSlice.ts';

type Props = {
  filterSet: FilterSet;
  scrollParentRef: RefObject<HTMLDivElement | null>;
  onFilterSetUpdate: (filterSet: FilterSet) => void;
};

export default function FilterSetEdit({ filterSet, scrollParentRef, onFilterSetUpdate }: Props) {
  const collectionBooks = useAppSelector(state => selectCollectionBooksByFetch(state, filterSet.fetch));

  const handleOptionsChange = useCallback(
    (fetch: NdlFullOptions) => {
      onFilterSetUpdate({ ...filterSet, fetch });
    },
    [filterSet, onFilterSetUpdate]
  );

  if (!collectionBooks) return <Spinner variant="bars" />;

  return (
    <div className="flex flex-col w-full flex-1">
      <div className="flex flex-col gap-3 pt-3">
        <div className="flex flex-col bg-background px-2 pt-2 pb-5">
          <NdlOptionsForm defaultValues={filterSet.fetch} onChange={handleOptionsChange} />
        </div>
      </div>

      <div>
        <div className="text-xs bg-background pl-2 z-[60]">さらに絞り込む</div>
        {filterSet.filters.map((_, orIndex) => (
          <FilterBlock key={orIndex} {...{ scrollParentRef, filterSet, orIndex, collectionBooks, onFilterSetUpdate }} />
        ))}
      </div>
    </div>
  );
}
