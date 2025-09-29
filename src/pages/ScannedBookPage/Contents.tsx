import type { ScannedItemMapValue } from '@/store/scannerSlice.ts';
import type { FilterSet } from '@/store/subscriptionDataSlice.ts';
import type { BookDetail } from '@/types/book.ts';
import { useEffect, useMemo, useRef, useState } from 'react';
import BookCard from '@/components/Card/BookCard.tsx';
import BookDetailDialog from '@/components/Dialog/BookDetailDialog';
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
  const [selectedIsbn, setSelectedIsbn] = useState<string | null>(null);
  const [detailIsbn, setDetailIsbn] = useState<string | null>(null);
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
    () => (filterSet?.fetch ? makeNdlOptionsStringByNdlFullOptions(filterSet?.fetch) : ''),
    [filterSet?.fetch]
  );

  const fetchedBooks: BookDetail[] = useMemo(() => {
    const result = allBookDetails[stringifyFetchOptions] ?? null;
    if (typeof result === 'string') return [];
    return result;
  }, [allBookDetails, stringifyFetchOptions]);

  useEffect(() => {
    if (!stringifyFetchOptions) return;
    dispatch(enqueueNdlSearch({ type: 'priority', list: [stringifyFetchOptions] }));
  }, [dispatch, stringifyFetchOptions]);

  return (
    <div className="flex flex-col w-full flex-1">
      <div className="flex flex-col gap-3 py-3">
        <div className="flex justify-center">
          <BookCard bookDetail={scannedItemMapValue.bookDetail} />
        </div>
        <FilterSets {...{ scannedItemMapValue, selectedFilterSet, setSelectedFilterSet }} />
      </div>
      {filterSet?.filters.map((_, orIndex) => (
        <FilterBlock
          key={orIndex}
          {...{ scrollParentRef, filterSet, orIndex, fetchedBooks, selectedIsbn, setSelectedIsbn, setDetailIsbn }}
        />
      ))}
      <BookDetailDialog
        bookDetail={fetchedBooks?.find(({ book }) => book.isbn === detailIsbn) ?? null}
        onClose={() => setDetailIsbn(null)}
      />
    </div>
  );
}
