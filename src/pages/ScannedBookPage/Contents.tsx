import { useEffect, useMemo, useRef, useState } from 'react';
import BookCard from '@/components/Card/BookCard.tsx';
import BookDetailDialog from '@/components/Dialog/BookDetailDialog';
import { enqueueNdlSearch } from '@/store/fetchNdlSearchSlice.ts';
import { useAppDispatch, useAppSelector } from '@/store/hooks.ts';
import { selectAllNdlSearchResults } from '@/store/ndlSearchSlice.ts';
import type { ScannedItemMapValue } from '@/store/scannerSlice.ts';
import type { FilterSet } from '@/store/subscriptionDataSlice.ts';
import { makeNdlOptionsStringByNdlFullOptions } from '@/utils/data.ts';
import type { PickRequired } from '@/utils/type.ts';
import FilterBlock from './FilterBlock';
import FilterSets from './FilterSets';

type Props = {
  scannedItemMapValue: PickRequired<ScannedItemMapValue, 'bookDetail'>;
};

export default function Contents({ scannedItemMapValue }: Props) {
  const dispatch = useAppDispatch();
  const allNdlSearchQueueResults = useAppSelector(selectAllNdlSearchResults);
  const [selectedIsbn, setSelectedIsbn] = useState<string | null>(null);
  const [detailIsbn, setDetailIsbn] = useState<string | null>(null);
  const scrollParentRef = useRef<HTMLDivElement>(document.getElementById('root') as HTMLDivElement);

  const isbn = scannedItemMapValue.isbn;

  const [selectedFilterSet, setSelectedFilterSet] = useState<string>(scannedItemMapValue.filterSets.at(0)?.id ?? '');
  useEffect(() => {
    setSelectedFilterSet(scannedItemMapValue.filterSets.at(0)?.id ?? '');
  }, [scannedItemMapValue.filterSets, setSelectedFilterSet]);

  const [filterSet, setFilterSet] = useState<FilterSet | null>(null);
  useEffect(() => {
    const currentFilterSet = scannedItemMapValue.filterSets.find(({ id }) => id === selectedFilterSet);
    if (!currentFilterSet) return;
    setFilterSet(currentFilterSet);
  }, [scannedItemMapValue.filterSets, selectedFilterSet]);

  const stringifyFetchOptions = useMemo(
    () => (filterSet?.fetch ? makeNdlOptionsStringByNdlFullOptions(filterSet?.fetch) : ''),
    [filterSet?.fetch]
  );

  const fetchedBooks = useMemo(() => {
    const result = allNdlSearchQueueResults[stringifyFetchOptions] ?? null;
    if (typeof result === 'string') return [];
    return result;
  }, [allNdlSearchQueueResults, stringifyFetchOptions]);

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
          {...{ scrollParentRef, isbn, filterSet, orIndex, fetchedBooks, selectedIsbn, setSelectedIsbn, setDetailIsbn }}
        />
      ))}
      <BookDetailDialog
        book={fetchedBooks?.find(book => book.isbn === detailIsbn) ?? null}
        onClose={() => setDetailIsbn(null)}
      />
    </div>
  );
}
