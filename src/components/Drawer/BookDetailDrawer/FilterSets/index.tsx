import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import SelectBox from '@/components/SelectBox.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { selectNdlSearchQueueResults } from '@/store/fetchNdlSearchSlice.ts';
import { useAppDispatch, useAppSelector } from '@/store/hooks.ts';
import type { ScannedItemMapValue } from '@/store/scannerSlice.ts';
import { updateFetchedFetchOption } from '@/store/scannerSlice.ts';
import type { FilterSet } from '@/store/subscriptionDataSlice.ts';
import { makeNdlOptionsStringByNdlFullOptions } from '@/utils/data.ts';
import type { PickRequired } from '@/utils/type.ts';
import NdlOptionsForm from './NdlOptionsForm.tsx';
import SearchConditionsForm from './SearchConditionsForm.tsx';

type Props = {
  scannedItemMapValue: PickRequired<ScannedItemMapValue, 'bookDetail'>;
};

export default function FilterSets({ scannedItemMapValue }: Props) {
  const dispatch = useAppDispatch();
  const [selectedFilterSet, setSelectedFilterSet] = useState<string>(scannedItemMapValue.filterSets.at(0)?.id ?? '');
  const [filterSet, setFilterSet] = useState<FilterSet | null>(null);
  const ndlSearchQueueResults = useAppSelector(selectNdlSearchQueueResults);

  const isbn = scannedItemMapValue.isbn;

  useEffect(() => {
    setSelectedFilterSet(scannedItemMapValue.filterSets.at(0)?.id ?? '');
  }, [scannedItemMapValue.filterSets]);

  const currentFilterSet = scannedItemMapValue.filterSets.find(({ id }) => id === selectedFilterSet);

  useEffect(() => {
    if (!currentFilterSet) return;
    setFilterSet(currentFilterSet);
  }, [currentFilterSet]);

  const fetchFullOptions = useMemo(() => filterSet?.fetch, [filterSet?.fetch]);

  const stringifyFetchOptions = useMemo(
    () => (fetchFullOptions ? makeNdlOptionsStringByNdlFullOptions(fetchFullOptions) : ''),
    [fetchFullOptions]
  );

  const fetchedBooks = useMemo(
    () => ndlSearchQueueResults[stringifyFetchOptions],
    [ndlSearchQueueResults, stringifyFetchOptions]
  );

  const options = useMemo(
    () =>
      scannedItemMapValue.filterSets.reduce<Record<string, ReactNode>>((acc, cur) => {
        acc[cur.id] = cur.name;
        return acc;
      }, {}),
    [scannedItemMapValue.filterSets]
  );

  return (
    <>
      <SelectBox options={options} value={selectedFilterSet} onChange={setSelectedFilterSet} />
      {fetchFullOptions ? (
        <NdlOptionsForm
          defaultValues={fetchFullOptions}
          onChange={fetch => {
            dispatch(
              updateFetchedFetchOption({
                isbn: scannedItemMapValue.isbn,
                filterSetId: selectedFilterSet,
                fetch,
              })
            );
          }}
        />
      ) : null}
      <Separator className="my-2" />
      {fetchedBooks?.length ? <SearchConditionsForm {...{ isbn, filterSet, fetchedBooks }} /> : null}
    </>
  );
}
