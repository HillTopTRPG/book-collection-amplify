import { Fragment, useEffect, useMemo, useState } from 'react';
import BookCard from '@/components/Card/BookCard.tsx';
import NdlCard from '@/components/Card/NdlCard';
import BookDetailDialog from '@/components/Drawer/BookDetailDrawer/BookDetailDialog.tsx';
import NdlOptionsForm from '@/components/Drawer/BookDetailDrawer/NdlOptionsForm.tsx';
import SearchConditionsForm from '@/components/Drawer/BookDetailDrawer/SearchConditionsForm.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { Spinner } from '@/components/ui/shadcn-io/spinner';
import { enqueueNdlSearch, selectNdlSearchQueueResults } from '@/store/fetchNdlSearchSlice.ts';
import { useAppDispatch, useAppSelector } from '@/store/hooks.ts';
import type { ScannedItemMapValue } from '@/store/scannerSlice.ts';
import { updateFetchedFetchOption } from '@/store/scannerSlice.ts';
import type { BookData } from '@/types/book.ts';
import { makeNdlOptionsStringByNdlFullOptions } from '@/utils/data.ts';
import type { PickRequired } from '@/utils/type.ts';

type Props = {
  scannedItemMapValue: PickRequired<ScannedItemMapValue, 'bookDetail'>;
};

export default function DrawerContent({ scannedItemMapValue }: Props) {
  const dispatch = useAppDispatch();
  const ndlSearchQueueResults = useAppSelector(selectNdlSearchQueueResults);
  const [selectedIsbn, setSelectedIsbn] = useState<string | null>(null);
  const [detailIsbn, setDetailIsbn] = useState<string | null>(null);

  const fetchOptions = useMemo(() => scannedItemMapValue.filterSets.at(0)?.fetch, [scannedItemMapValue]);

  const anywhere = useMemo(
    () => scannedItemMapValue.filterSets.at(0)?.filters.at(0)?.at(0)?.anywhere,
    [scannedItemMapValue]
  );

  const stringifyFetchOptions = useMemo(
    () => (fetchOptions ? makeNdlOptionsStringByNdlFullOptions(fetchOptions) : ''),
    [fetchOptions]
  );

  const fetchedResults = useMemo(
    () => ndlSearchQueueResults[stringifyFetchOptions],
    [ndlSearchQueueResults, stringifyFetchOptions]
  );

  const filteredResults = useMemo((): BookData[] => {
    if (!fetchedResults?.length) return [];
    if (!anywhere) return fetchedResults;

    return fetchedResults.filter(book => JSON.stringify(book).includes(anywhere));
  }, [anywhere, fetchedResults]);

  useEffect(() => {
    if (!stringifyFetchOptions) return;
    dispatch(enqueueNdlSearch({ type: 'priority', list: [stringifyFetchOptions] }));
  }, [dispatch, stringifyFetchOptions]);

  return (
    <>
      <div className="flex justify-center">
        <BookCard bookDetail={scannedItemMapValue.bookDetail} />
      </div>
      {fetchOptions ? (
        <NdlOptionsForm
          defaultValues={fetchOptions}
          onChange={fetchFullOptions => {
            dispatch(
              updateFetchedFetchOption({ isbn: scannedItemMapValue.isbn, filterSetIndex: 0, fetch: fetchFullOptions })
            );
          }}
        />
      ) : null}
      <Separator className="my-2" />
      {fetchedResults ? <SearchConditionsForm {...{ scannedItemMapValue, fetchedResults }} /> : null}
      <div className="flex flex-col justify-center">
        {filteredResults ? (
          filteredResults.map((ndl, idx) => (
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
          ))
        ) : (
          <Spinner variant="bars" />
        )}
      </div>
      <span>{filteredResults?.length ?? 0}件</span>
      <BookDetailDialog
        book={fetchedResults?.find(book => book.isbn === detailIsbn) ?? null}
        onClose={() => setDetailIsbn(null)}
      />
    </>
  );
}
