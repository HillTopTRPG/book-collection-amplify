import type { ScannedItemMapValue } from '@/store/scannerSlice.ts';
import type { FilterSet } from '@/store/subscriptionDataSlice.ts';
import type { BookDetail } from '@/types/book.ts';
import { useEffect, useMemo, useRef, useState } from 'react';
import BookCardNavi from '@/pages/ScannedBookPage/FilterBlock/BookCardNavi.tsx';
import { enqueueNdlSearch } from '@/store/fetchNdlSearchSlice.ts';
import { useAppDispatch, useAppSelector } from '@/store/hooks.ts';
import useIdInfo from '@/store/hooks/useIdInfo.ts';
import { selectAllBookDetails } from '@/store/ndlSearchSlice.ts';
import { makeNdlOptionsStringByNdlFullOptions } from '@/utils/data.ts';
import FilterBlock from './FilterBlock';
import FilterSets from './FilterSets';

type Props = {
  scannedItemMapValue: ScannedItemMapValue;
};

export default function Contents({ scannedItemMapValue }: Props) {
  const dispatch = useAppDispatch();
  const allBookDetails = useAppSelector(selectAllBookDetails);
  const scrollParentRef = useRef<HTMLDivElement>(document.getElementById('root') as HTMLDivElement);
  const { getFilterSetByIdInfo } = useIdInfo();

  const [selectedFilterSet, setSelectedFilterSet] = useState<string>(scannedItemMapValue.filterSets.at(0)?.id ?? '');
  useEffect(() => {
    setSelectedFilterSet(scannedItemMapValue.filterSets.at(0)?.id ?? '');
  }, [scannedItemMapValue.filterSets, setSelectedFilterSet]);

  const [filterSet, setFilterSet] = useState<FilterSet | null>(null);
  useEffect(() => {
    const currentFilterSet = scannedItemMapValue.filterSets.find(({ id }) => id === selectedFilterSet);
    if (!currentFilterSet) return;
    setFilterSet(getFilterSetByIdInfo(currentFilterSet));
  }, [getFilterSetByIdInfo, scannedItemMapValue.filterSets, selectedFilterSet]);

  const stringifyFetchOptions = useMemo(
    () => (filterSet?.fetch ? makeNdlOptionsStringByNdlFullOptions(filterSet.fetch) : ''),
    [filterSet?.fetch]
  );

  const fetchedBooks: BookDetail[] = useMemo(() => {
    const result = stringifyFetchOptions in allBookDetails ? allBookDetails[stringifyFetchOptions] : [];
    if (typeof result === 'string') return [];
    return result;
  }, [allBookDetails, stringifyFetchOptions]);

  useEffect(() => {
    if (!stringifyFetchOptions) return;
    dispatch(enqueueNdlSearch({ type: 'priority', list: [stringifyFetchOptions] }));
  }, [dispatch, stringifyFetchOptions]);

  return (
    <div className="flex flex-col w-full flex-1">
      <div className="flex flex-col gap-3 pt-3">
        <div className="bg-background">
          <BookCardNavi bookDetail={scannedItemMapValue.bookDetail} />
        </div>
        <FilterSets {...{ scannedItemMapValue, selectedFilterSet, setSelectedFilterSet }} />
      </div>

      {filterSet ? (
        <div className="bg-background">
          <div className="text-xs bg-background pl-2 z-[60]">さらに絞り込む</div>
          {filterSet.filters.map((_, orIndex) => (
            <FilterBlock key={orIndex} {...{ scrollParentRef, filterSet, orIndex, fetchedBooks }} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
