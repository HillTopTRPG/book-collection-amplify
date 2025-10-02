import type { FilterSet } from '@/store/subscriptionDataSlice.ts';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import FilterBlock from '@/components/FilterBlock.tsx';
import NdlOptionsForm, { type NdlFullOptions } from '@/components/NdlOptionsForm.tsx';
import { enqueueNdlSearch } from '@/store/fetchNdlSearchSlice.ts';
import { useAppDispatch, useAppSelector } from '@/store/hooks.ts';
import { selectAllBookDetails } from '@/store/ndlSearchSlice.ts';
import { makeNdlOptionsStringByNdlFullOptions } from '@/utils/data.ts';

type Props = {
  filterSet: FilterSet;
  onFilterSetUpdate: (filterSet: FilterSet) => void;
};

export default function FilterSetEdit({ filterSet, onFilterSetUpdate }: Props) {
  const dispatch = useAppDispatch();
  const allBookDetails = useAppSelector(selectAllBookDetails);
  const scrollParentRef = useRef<HTMLDivElement>(document.getElementById('root') as HTMLDivElement);

  const stringifyFetchOptions = useMemo(() => makeNdlOptionsStringByNdlFullOptions(filterSet.fetch), [filterSet.fetch]);
  const bookDetails = useMemo(
    () => (stringifyFetchOptions in allBookDetails ? allBookDetails[stringifyFetchOptions] : []),
    [allBookDetails, stringifyFetchOptions]
  );

  const handleOptionsChange = useCallback(
    (fetch: NdlFullOptions) => {
      onFilterSetUpdate({ ...filterSet, fetch });
    },
    [filterSet, onFilterSetUpdate]
  );

  useEffect(() => {
    if (!stringifyFetchOptions) return;
    dispatch(enqueueNdlSearch({ type: 'priority', list: [stringifyFetchOptions] }));
  }, [dispatch, stringifyFetchOptions]);

  return (
    <div className="flex flex-col w-full flex-1">
      <div className="flex flex-col gap-3 pt-3">
        <div className="flex flex-col bg-background px-2 pt-2 pb-5">
          <NdlOptionsForm defaultValues={filterSet.fetch} onChange={handleOptionsChange} />
        </div>
      </div>

      <div className="bg-background">
        <div className="text-xs bg-background pl-2 z-[60]">さらに絞り込む</div>
        {filterSet.filters.map((_, orIndex) => (
          <FilterBlock key={orIndex} {...{ scrollParentRef, filterSet, orIndex, bookDetails, onFilterSetUpdate }} />
        ))}
      </div>
    </div>
  );
}
