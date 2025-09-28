import type { ScannedItemMapValue } from '@/store/scannerSlice.ts';
import type { FilterSet } from '@/store/subscriptionDataSlice.ts';
import type { PickRequired } from '@/utils/type.ts';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { useEffect, useMemo, useState } from 'react';
import SelectBox from '@/components/SelectBox.tsx';
import { useAppDispatch } from '@/store/hooks.ts';
import { updateFetchedFetchOption } from '@/store/scannerSlice.ts';
import NdlOptionsForm from './NdlOptionsForm.tsx';

type Props = {
  scannedItemMapValue: PickRequired<ScannedItemMapValue, 'bookDetail'>;
  selectedFilterSet: string;
  setSelectedFilterSet: Dispatch<SetStateAction<string>>;
};

export default function FilterSets({ scannedItemMapValue, selectedFilterSet, setSelectedFilterSet }: Props) {
  const dispatch = useAppDispatch();
  const [filterSet, setFilterSet] = useState<FilterSet | null>(null);

  const currentFilterSet = scannedItemMapValue.filterSets.find(({ id }) => id === selectedFilterSet);

  useEffect(() => {
    if (!currentFilterSet) return;
    setFilterSet(currentFilterSet);
  }, [currentFilterSet]);

  const fetchFullOptions = useMemo(() => filterSet?.fetch, [filterSet?.fetch]);

  const options = useMemo(
    () =>
      scannedItemMapValue.filterSets.reduce<Record<string, { label: ReactNode; disabled: boolean }>>((acc, cur) => {
        acc[cur.id] = { label: cur.name, disabled: false };
        return acc;
      }, {}),
    [scannedItemMapValue.filterSets]
  );

  return (
    <div className="flex flex-col gap-1">
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
    </div>
  );
}
