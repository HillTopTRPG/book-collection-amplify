import { Fragment, useEffect, useMemo, useState } from 'react';
import { isNil } from 'es-toolkit/compat';
import BookCard from '@/components/Card/BookCard.tsx';
import NdlCard from '@/components/Card/NdlCard';
import BookDetailDialog from '@/components/Drawer/BookDetailDrawer/BookDetailDialog.tsx';
import FilterSets from '@/components/Drawer/BookDetailDrawer/FilterSets';
import { Separator } from '@/components/ui/separator.tsx';
import { enqueueNdlSearch, selectNdlSearchQueueResults } from '@/store/fetchNdlSearchSlice.ts';
import { useAppDispatch, useAppSelector } from '@/store/hooks.ts';
import type { ScannedItemMapValue } from '@/store/scannerSlice.ts';
import type { BookData } from '@/types/book.ts';
import { makeNdlOptionsStringByNdlFullOptions } from '@/utils/data.ts';
import type { PickRequired } from '@/utils/type.ts';
import { getKeys } from '@/utils/type.ts';

type Props = {
  scannedItemMapValue: PickRequired<ScannedItemMapValue, 'bookDetail'>;
};

export default function DrawerContent({ scannedItemMapValue }: Props) {
  const dispatch = useAppDispatch();
  const ndlSearchQueueResults = useAppSelector(selectNdlSearchQueueResults);
  const [selectedIsbn, setSelectedIsbn] = useState<string | null>(null);
  const [detailIsbn, setDetailIsbn] = useState<string | null>(null);

  const fetchOptions = useMemo(() => scannedItemMapValue.filterSets.at(0)?.fetch, [scannedItemMapValue]);

  const anywhereList = useMemo(
    () =>
      scannedItemMapValue.filterSets
        .at(0)
        ?.filters.at(0)
        ?.map(({ anywhere }) => anywhere) ?? [],
    [scannedItemMapValue]
  );

  const stringifyFetchOptions = useMemo(
    () => (fetchOptions ? makeNdlOptionsStringByNdlFullOptions(fetchOptions) : ''),
    [fetchOptions]
  );

  const fetchedBooks = useMemo(
    () => ndlSearchQueueResults[stringifyFetchOptions],
    [ndlSearchQueueResults, stringifyFetchOptions]
  );

  const filteredResults = useMemo((): BookData[] => {
    if (!fetchedBooks?.length) return [];
    if (!anywhereList.length) return fetchedBooks;

    return fetchedBooks.filter(book =>
      anywhereList.filter(Boolean).every(anywhere =>
        getKeys(book).some(property => {
          const value = book[property];
          if (isNil(value)) return false;
          if (typeof value === 'string') {
            return value.includes(anywhere);
          }
          return value.some(v => v.includes(anywhere));
        })
      )
    );
  }, [anywhereList, fetchedBooks]);

  useEffect(() => {
    if (!stringifyFetchOptions) return;
    dispatch(enqueueNdlSearch({ type: 'priority', list: [stringifyFetchOptions] }));
  }, [dispatch, stringifyFetchOptions]);

  return (
    <>
      <div className="flex justify-center">
        <BookCard bookDetail={scannedItemMapValue.bookDetail} />
      </div>
      <FilterSets scannedItemMapValue={scannedItemMapValue} />
      <div className="flex flex-col justify-center">
        {filteredResults.map((ndl, idx) => (
          <Fragment key={idx}>
            {idx ? <Separator /> : null}
            <NdlCard
              filterSets={scannedItemMapValue.filterSets}
              {...{ ndl, selectedIsbn, setSelectedIsbn }}
              onOpenBookDetail={isbn => {
                setDetailIsbn(isbn);
                setSelectedIsbn(null);
              }}
            />
          </Fragment>
        ))}
      </div>
      <span>{filteredResults?.length ?? 0}件</span>
      <BookDetailDialog
        book={fetchedBooks?.find(book => book.isbn === detailIsbn) ?? null}
        onClose={() => setDetailIsbn(null)}
      />
    </>
  );
}
