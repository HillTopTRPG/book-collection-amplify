import type { BookData, Isbn13 } from '@/types/book.ts';
import { useEffect } from 'react';
import { dequeueBookImage, selectFetchBookImageQueueTargets } from '@/store/fetchBookImageSlice.ts';
import { enqueueGoogleSearch, selectGoogleSearchResults } from '@/store/fetchGoogleSearchSlice.ts';
import { enqueueRakutenSearch, selectRakutenSearchResults } from '@/store/fetchRakutenSearchSlice.ts';
import { useAppDispatch, useAppSelector } from '@/store/hooks.ts';
import { isBookData } from '@/utils/bookData.ts';
import { checkImageExists } from '@/utils/fetch';
import { getKeys } from '@/utils/type.ts';

const preQueueProcess = async (
  queuedBookImageIsbn: Isbn13[]
): Promise<{ isbn: Isbn13; url: string | null; type: 'ndl' | 'other' }[]> => {
  if (!queuedBookImageIsbn.length) return [];

  return await Promise.all(
    queuedBookImageIsbn.map(
      isbn =>
        new Promise<{ isbn: Isbn13; url: string | null; type: 'ndl' | 'other' }>(resolve => {
          const ndlUrl = `https://ndlsearch.ndl.go.jp/thumbnail/${isbn}.jpg`;
          void checkImageExists(ndlUrl).then(result => {
            if (result) {
              resolve({ isbn, url: ndlUrl, type: 'ndl' });
              return;
            }
            resolve({ isbn, url: null, type: 'other' });
          });
        })
    )
  );
};

const pickBookDataProps = <P extends keyof BookData>(p: P, a: BookData, b: BookData) =>
  ({ [p]: a[p] || b[p] || null }) as Pick<BookData, P>;

const mergeBookData = (b1: BookData | string | null, b2: BookData | string | null): BookData | null => {
  if (isBookData(b1) && isBookData(b2)) {
    return {
      isbn: b1.isbn,
      ...pickBookDataProps('title', b1, b2),
      ...pickBookDataProps('volume', b1, b2),
      ...pickBookDataProps('volumeTitle', b1, b2),
      creator: b1.creator || b2.creator,
      ...pickBookDataProps('seriesTitle', b1, b2),
      ...pickBookDataProps('edition', b1, b2),
      ...pickBookDataProps('publisher', b1, b2),
      ...pickBookDataProps('date', b1, b2),
      ...pickBookDataProps('ndc', b1, b2),
      ...pickBookDataProps('cover', b1, b2),
      ...pickBookDataProps('extent', b1, b2),
      ndcLabels: b1.ndcLabels.length ? b1.ndcLabels : b2.ndcLabels,
    } as const satisfies BookData;
  }
  if (isBookData(b1)) return b1;
  if (isBookData(b2)) return b2;
  return null;
};

export default function useBookImageQueueProcessor() {
  const dispatch = useAppDispatch();

  // 書影URL取得キューの対象
  const fetchBookImageQueueTargets = useAppSelector(selectFetchBookImageQueueTargets);

  const googleSearchQueueResults = useAppSelector(selectGoogleSearchResults);
  const rakutenSearchQueueResults = useAppSelector(selectRakutenSearchResults);

  // 書影URL取得処理1
  useEffect(() => {
    if (!fetchBookImageQueueTargets.length) return;
    void preQueueProcess(fetchBookImageQueueTargets).then(list => {
      const dequeueInfo: Record<Isbn13, string> = {};
      const enqueueList: Isbn13[] = [];
      list.forEach(({ isbn, url }) => {
        if (!url) enqueueList.push(isbn);
        else dequeueInfo[isbn] = url;
      });
      if (getKeys(dequeueInfo).length) dispatch(dequeueBookImage(dequeueInfo));
      if (enqueueList.length) {
        dispatch(enqueueGoogleSearch({ type: 'new', list: enqueueList }));
        dispatch(enqueueRakutenSearch({ type: 'new', list: enqueueList }));
      }
    });
  }, [dispatch, fetchBookImageQueueTargets]);

  // 書影URL取得処理2
  useEffect(() => {
    if (!fetchBookImageQueueTargets.length) return;
    const results = fetchBookImageQueueTargets.reduce<Record<Isbn13, string | null>>((acc, isbn) => {
      const google = isbn in googleSearchQueueResults ? googleSearchQueueResults[isbn] : undefined;
      const rakuten = isbn in rakutenSearchQueueResults ? rakutenSearchQueueResults[isbn] : undefined;
      if (google === undefined || rakuten === undefined) return acc;
      acc[isbn] = mergeBookData(rakuten, google)?.cover ?? null;
      return acc;
    }, {});
    if (getKeys(results).length) dispatch(dequeueBookImage(results));
  }, [dispatch, fetchBookImageQueueTargets, googleSearchQueueResults, rakutenSearchQueueResults]);
}
