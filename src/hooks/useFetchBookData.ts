import { useCallback } from 'react';

import { useAppSelector } from '@/store/hooks';
import type { FilterSet } from '@/store/subscriptionDataSlice';
import { selectFilterSets , selectCollections } from '@/store/subscriptionDataSlice';
import type { BookData } from '@/types/book.ts';
import { bookDataToBookDetail, bookDataToFilterSets } from '@/utils/data.ts';
import { fetchGoogleBooksApi, fetchNdlSearch, fetchOpenBdApi, fetchRakutenBooksApi } from '@/utils/fetch.ts';
import { getKeys } from '@/utils/type.ts';

const _fetchBookData = async (isbn: string): Promise<BookData> => {
  const ndlBooksApiResult = (await fetchNdlSearch({ isbn }))?.at(0);

  console.log(JSON.stringify(ndlBooksApiResult, null, 2));

  if (ndlBooksApiResult) {
    return {
      isbn,
      title: ndlBooksApiResult?.title,
      subtitle: null,
      author: ndlBooksApiResult?.creator.join(', '),
      publisher: ndlBooksApiResult?.publisher,
      pubdate: ndlBooksApiResult?.date,
      cover: `https://ndlsearch.ndl.go.jp/thumbnail/${isbn}.jpg`,
    } as const satisfies BookData;
  }

  return [
    await fetchOpenBdApi(isbn),
    await fetchGoogleBooksApi(isbn),
    (await fetchRakutenBooksApi({ isbn })).at(0),
  ].reduce<BookData>((acc, cur) => {
    if (!cur) return acc;
    getKeys(cur).forEach(property => {
      if (!acc[property] && cur[property]) acc[property] = cur[property];
    });
    return acc;
  }, { isbn });
};

export default function useFetchBookData() {
  const collections = useAppSelector(selectCollections);
  const dbFilterSets = useAppSelector(selectFilterSets);

  const fetchBookData = useCallback(async (isbn: string) => {
    console.log('fetchBookData', isbn);
    const bookData = await _fetchBookData(isbn);
    const bookDetail = bookDataToBookDetail(collections, bookData);
    const filterSets: FilterSet[] = bookDataToFilterSets(dbFilterSets, bookData);

    return { bookDetail, filterSets };
  }, [collections, dbFilterSets]);

  return {
    fetchBookData
  };
}
