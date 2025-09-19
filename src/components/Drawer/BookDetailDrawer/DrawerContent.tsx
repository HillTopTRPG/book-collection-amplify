import { Fragment, useEffect, useMemo } from 'react';

import BookCard from '@/components/Card/BookCard.tsx';
import NdlCard from '@/components/Card/NdlCard';
import NdlOptionsForm from '@/components/Drawer/BookDetailDrawer/NdlOptionsForm.tsx';
import SearchConditionsForm from '@/components/Drawer/BookDetailDrawer/SearchConditionsForm.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { Spinner } from '@/components/ui/shadcn-io/spinner';
import { addFilterQueue, selectFilterQueueResults } from '@/store/fetchApiQueueSlice.ts';
import { useAppDispatch, useAppSelector } from '@/store/hooks.ts';
import type { ScanFinishedItemMapValue } from '@/store/scannerSlice.ts';
import { updateFetchedFetchOption } from '@/store/scannerSlice.ts';
import type { BookData } from '@/types/book.ts';
import type { PickRequired } from '@/utils/type.ts';

type Props = {
  scannedItemMapValue: PickRequired<ScanFinishedItemMapValue, 'bookDetail'>;
};

export default function DrawerContent({ scannedItemMapValue }: Props) {
  const dispatch = useAppDispatch();
  const filterQueueResults = useAppSelector(selectFilterQueueResults);

  const fetchOptions = useMemo(() => scannedItemMapValue.filterSets.at(0)?.fetch, [scannedItemMapValue]);

  const anywhere = useMemo(
    () => scannedItemMapValue.filterSets.at(0)?.filters.at(0)?.at(0)?.anywhere,
    [scannedItemMapValue]
  );

  const stringifyFetchOptions = useMemo(() => JSON.stringify(fetchOptions), [fetchOptions]);

  const fetchedResults = useMemo(
    () => filterQueueResults.get(stringifyFetchOptions),
    [filterQueueResults, stringifyFetchOptions]
  );

  const filteredResults = useMemo((): BookData[] => {
    if (!fetchedResults?.length) return [];
    if (!anywhere) return fetchedResults;

    return fetchedResults.filter(book => JSON.stringify(book).includes(anywhere));
  }, [anywhere, fetchedResults]);

  useEffect(() => {
    dispatch(addFilterQueue(stringifyFetchOptions));
  }, [dispatch, stringifyFetchOptions]);

  return (
    <Fragment>
      <div className="flex justify-center">
        <BookCard bookDetail={scannedItemMapValue.bookDetail} />
      </div>
      {fetchOptions && fetchedResults ? (
        <>
          <NdlOptionsForm
            defaultValues={fetchOptions}
            onChange={fetchFullOptions => {
              dispatch(updateFetchedFetchOption({ isbn: scannedItemMapValue.isbn, index: 0, fetch: fetchFullOptions }));
            }}
          />
          <SearchConditionsForm {...{ scannedItemMapValue, fetchedResults }} />
        </>
      ) : null}
      <Separator className="my-2" />
      <span>{filteredResults?.length ?? 0}件</span>
      <div className="flex flex-col justify-center">
        {filteredResults ? (
          filteredResults.map((ndl, idx) => <NdlCard key={idx} ndl={ndl} options={fetchOptions} anywhere={anywhere} />)
        ) : (
          <Spinner variant="bars" />
        )}
      </div>
    </Fragment>
  );
}
