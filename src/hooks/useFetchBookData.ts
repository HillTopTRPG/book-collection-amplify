import { useCallback } from 'react';
import { pick } from 'es-toolkit';
import { omit } from 'es-toolkit/compat';
import { selectFilterQueueResults } from '@/store/fetchApiQueueSlice.ts';
import { useAppSelector } from '@/store/hooks';
import type { ScanFinishedItemMapValue } from '@/store/scannerSlice.ts';
import type { FilterSet } from '@/store/subscriptionDataSlice';
import { selectFilterSets, selectCollections } from '@/store/subscriptionDataSlice';
import type { BookData } from '@/types/book.ts';
import { getScannedItemMapValueByBookData } from '@/utils/data.ts';
import { fetchGoogleBooksApi, fetchNdlSearch, fetchOpenBdApi, fetchRakutenBooksApi } from '@/utils/fetch.ts';
import { getKeys } from '@/utils/type.ts';

const _fetchBookData = async (isbn: string): Promise<BookData> => {
  const ndlBooksApiResult = (await fetchNdlSearch({ isbn }))?.at(0);
  if (ndlBooksApiResult) return ndlBooksApiResult;

  return [
    await fetchOpenBdApi(isbn),
    await fetchGoogleBooksApi(isbn),
    (await fetchRakutenBooksApi({ isbn })).at(0),
  ].reduce<BookData>(
    (acc, cur) => {
      if (!cur) return acc;
      const listProperty = ['creator'] as const;
      getKeys(omit(cur, listProperty)).forEach(property => {
        if (!acc[property] && cur[property]) acc[property] = cur[property];
      });
      getKeys(pick(cur, listProperty)).forEach(property => {
        if (!acc[property] && cur[property]) acc[property] = cur[property];
      });
      return acc;
    },
    { isbn }
  );
};

export default function useFetchBookData() {
  const collections = useAppSelector(selectCollections);
  const dbFilterSets = useAppSelector(selectFilterSets);
  const filterQueueResults = useAppSelector(selectFilterQueueResults);

  const fetchBookData = useCallback(
    async (isbn: string): Promise<ScanFinishedItemMapValue> => {
      console.log('fetchBookData', isbn);
      const book = await _fetchBookData(isbn);
      const scannedItemMapValue = getScannedItemMapValueByBookData(collections, book);
      const _filterSets: FilterSet[] = dbFilterSets.filter(filterSet =>
        filterQueueResults.get(JSON.stringify(filterSet.fetch))
      );
      const wrappedFilterSets =
        _filterSets.length > 0
          ? _filterSets
          : [
              {
                id: '',
                name: book.title ?? '無名のフィルター',
                fetch: {
                  title: book.title ?? '無名',
                  publisher: book.publisher ?? '',
                  creator: book.creator?.at(0) ?? '',
                  usePublisher: true,
                  useCreator: true,
                },
                filters: [],
                createdAt: '',
                updatedAt: '',
                owner: '',
              } as const satisfies FilterSet,
            ];

      // 書籍データが取得できたかどうかはタイトルが取得できたかで判定する
      if (book.title && !scannedItemMapValue.filterSets.length) {
        scannedItemMapValue.filterSets.push(...wrappedFilterSets);
      }

      return scannedItemMapValue;
    },
    [collections, dbFilterSets, filterQueueResults]
  );

  return {
    fetchBookData,
  };
}
