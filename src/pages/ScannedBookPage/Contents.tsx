import type { ScannedItemMapValue } from '@/store/scannerSlice.ts';
import type { FilterSet } from '@/store/subscriptionDataSlice.ts';
import type { BookDetail } from '@/types/book.ts';
import { useEffect, useMemo, useRef, useState } from 'react';
import BookCardNavi from '@/pages/ScannedBookPage/FilterBlock/BookCardNavi.tsx';
import { enqueueNdlSearch } from '@/store/fetchNdlSearchSlice.ts';
import { useAppDispatch, useAppSelector } from '@/store/hooks.ts';
import { selectAllBookDetails, selectAllFilterResults } from '@/store/ndlSearchSlice.ts';
import { makeNdlOptionsStringByNdlFullOptions } from '@/utils/data.ts';
import FilterBlock from './FilterBlock';
import FilterSets from './FilterSets';

type Props = {
  scannedItemMapValue: ScannedItemMapValue;
};

export default function Contents({ scannedItemMapValue }: Props) {
  const dispatch = useAppDispatch();
  const allBookDetails = useAppSelector(selectAllBookDetails);
  const allFilterResults = useAppSelector(selectAllFilterResults);
  const scrollParentRef = useRef<HTMLDivElement>(document.getElementById('root') as HTMLDivElement);

  const primeFilterSet: { filterSet: FilterSet; books: BookDetail[] } | null = useMemo(
    () =>
      allFilterResults?.find(
        ({ filterSet }) => filterSet.collectionId === scannedItemMapValue.bookDetail.collection.id
      ) ?? null,
    [allFilterResults, scannedItemMapValue.bookDetail.collection.id]
  );
  const otherFilterSets: { filterSet: FilterSet; books: BookDetail[] }[] = useMemo(
    () =>
      allFilterResults?.filter(
        ({ filterSet, books }) =>
          filterSet.collectionId !== scannedItemMapValue.bookDetail.collection.id &&
          books.some(({ book }) => book.isbn === scannedItemMapValue.bookDetail.book.isbn)
      ) ?? [],
    [allFilterResults, scannedItemMapValue.bookDetail.book.isbn, scannedItemMapValue.bookDetail.collection.id]
  );

  const [selectedFilterSet, setSelectedFilterSet] = useState<string | null>(
    primeFilterSet?.filterSet.id ?? otherFilterSets.at(0)?.filterSet.id ?? null
  );

  useEffect(() => {
    console.log(`'${selectedFilterSet}'`);
    if (selectedFilterSet) return;
    const primeFilterSetId = primeFilterSet?.filterSet.id;
    console.log(primeFilterSetId);
    if (primeFilterSetId) {
      setSelectedFilterSet(primeFilterSetId);
      return;
    }
    const otherFilterSetId = otherFilterSets.at(0)?.filterSet.id;
    console.log(otherFilterSetId);
    if (otherFilterSetId) setSelectedFilterSet(otherFilterSetId);
  }, [otherFilterSets, primeFilterSet?.filterSet.id, selectedFilterSet]);

  const filterSet = useMemo(() => {
    if (!selectedFilterSet) return null;
    if (primeFilterSet?.filterSet.id === selectedFilterSet) return primeFilterSet.filterSet;
    return otherFilterSets.find(({ filterSet }) => filterSet.id === selectedFilterSet)?.filterSet ?? null;
  }, [otherFilterSets, primeFilterSet?.filterSet, selectedFilterSet]);

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
        <FilterSets
          {...{ primeFilterSet, otherFilterSets, scannedItemMapValue, selectedFilterSet, setSelectedFilterSet }}
        />
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
