import type { ScannedItemMapValue } from '@/store/scannerSlice.ts';
import type { FilterSet } from '@/store/subscriptionDataSlice.ts';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { useEffect, useMemo, useState } from 'react';
import SelectBox from '@/components/SelectBox.tsx';
import { useAppDispatch } from '@/store/hooks.ts';
import useIdInfo from '@/store/hooks/useIdInfo.ts';
import { updateTempFilterSetOption } from '@/store/subscriptionDataSlice.ts';
import NdlOptionsForm from './NdlOptionsForm.tsx';

type Props = {
  scannedItemMapValue: ScannedItemMapValue;
  selectedFilterSet: string;
  setSelectedFilterSet: Dispatch<SetStateAction<string>>;
};

export default function FilterSets({ scannedItemMapValue, selectedFilterSet, setSelectedFilterSet }: Props) {
  const dispatch = useAppDispatch();
  const [filterSet, setFilterSet] = useState<FilterSet | null>(null);
  const { getFilterSetByIdInfo } = useIdInfo();

  const currentFilterSet = useMemo(
    () => scannedItemMapValue.filterSets.find(({ id }) => id === selectedFilterSet),
    [scannedItemMapValue.filterSets, selectedFilterSet]
  );

  useEffect(() => {
    if (!currentFilterSet) return;
    setFilterSet(getFilterSetByIdInfo(currentFilterSet));
  }, [currentFilterSet, getFilterSetByIdInfo]);

  const fetchFullOptions = useMemo(() => filterSet?.fetch, [filterSet?.fetch]);

  const options = useMemo(
    () =>
      scannedItemMapValue.filterSets.reduce<Record<string, { label: ReactNode; disabled: boolean }>>((acc, cur) => {
        acc[cur.id] = { label: getFilterSetByIdInfo(cur).name, disabled: false };
        return acc;
      }, {}),
    [getFilterSetByIdInfo, scannedItemMapValue.filterSets]
  );

  return (
    <div className="flex flex-col bg-background px-2 pt-2 pb-5">
      <div className="text-xs">検索条件セット</div>
      <SelectBox className="ml-3 mb-5" options={options} value={selectedFilterSet} onChange={setSelectedFilterSet} />
      {fetchFullOptions && currentFilterSet?.type === 'temp' ? (
        <NdlOptionsForm
          defaultValues={fetchFullOptions}
          onChange={fetch => {
            dispatch(updateTempFilterSetOption({ id: selectedFilterSet, fetch }));
          }}
        />
      ) : null}
    </div>
  );
}
