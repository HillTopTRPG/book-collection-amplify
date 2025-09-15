import { useCallback } from 'react';

import { useAppSelector } from '@/store/hooks';
import type { FilterSet } from '@/store/subscriptionDataSlice';
import { selectFilterSets , selectCollections } from '@/store/subscriptionDataSlice';
import type { BookData } from '@/types/book.ts';
import { bookDataToBookDetail, bookDataToFilterSets } from '@/utils/data.ts';
import { fetchGoogleBooksApi, fetchOpenBdApi, fetchRakutenBooksApi } from '@/utils/fetch.ts';

const _fetchBookData = async (isbn: string): Promise<BookData> => {
  const openBdApiResult = await fetchOpenBdApi(isbn);
  const googleBooksApiResult = await fetchGoogleBooksApi(isbn);
  const rakutenBooksApiResult = await fetchRakutenBooksApi({ isbn });

  return {
    isbn,
    title: rakutenBooksApiResult.at(0)?.title || googleBooksApiResult.title || openBdApiResult.title || '',
    subtitle: rakutenBooksApiResult.at(0)?.subtitle || googleBooksApiResult.subtitle || openBdApiResult.subtitle || '',
    author: rakutenBooksApiResult.at(0)?.author || googleBooksApiResult.author || openBdApiResult.author || '著者不明',
    publisher: rakutenBooksApiResult.at(0)?.publisher || googleBooksApiResult.publisher || openBdApiResult.publisher || '出版社不明',
    pubdate: rakutenBooksApiResult.at(0)?.pubdate || googleBooksApiResult.pubdate || openBdApiResult.pubdate || '出版日不明',
    cover: rakutenBooksApiResult.at(0)?.cover || googleBooksApiResult.cover || openBdApiResult.cover || '',
  };
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
