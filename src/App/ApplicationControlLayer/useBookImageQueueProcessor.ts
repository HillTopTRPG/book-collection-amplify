import type { BookData, Isbn13 } from '@/types/book.ts';
import { useEffect } from 'react';
import { dequeueBookImage, selectFetchBookImageQueueTargets } from '@/store/fetchBookImageSlice.ts';
import { enqueueGoogleSearch, selectGoogleSearchResults } from '@/store/fetchGoogleSearchSlice.ts';
import { enqueueRakutenSearch, selectRakutenSearchResults } from '@/store/fetchRakutenSearchSlice.ts';
import { useAppDispatch, useAppSelector } from '@/store/hooks.ts';
import { isBookData } from '@/utils/bookData.ts';
import { getNdlBookImage } from '@/utils/fetch';
import { getKeys } from '@/utils/type.ts';

const pickBookDataProps = <P extends keyof BookData>(p: P, a: BookData, b: BookData) =>
  ({ [p]: a[p] || b[p] || null }) as Pick<BookData, P>;

const mergeBookData = (b1: BookData | string | null, b2: BookData | string | null): BookData | null => {
  if (isBookData(b1) && isBookData(b2)) {
    return {
      isbn: b1.isbn,
      ...pickBookDataProps('apiId', b1, b2),
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

    // NDL書影APIは非常に高速なので、まとめて良い
    void Promise.all(
      fetchBookImageQueueTargets.map(
        isbn =>
          new Promise<{ isbn: Isbn13; url: string | null }>(resolve => {
            void getNdlBookImage(isbn)
              .then(url => {
                resolve({ isbn, url });
              })
              .catch(() => {
                resolve({ isbn, url: null });
              });
          })
      )
    ).then(list => {
      const { enqueue, dequeue } = list.reduce<{ dequeue: Record<Isbn13, string>; enqueue: Isbn13[] }>(
        (acc, { isbn, url }) => {
          if (url) acc.dequeue[isbn] = url;
          else acc.enqueue.push(isbn);
          return acc;
        },
        { enqueue: [], dequeue: {} }
      );
      if (getKeys(dequeue).length) {
        dispatch(dequeueBookImage(dequeue));
        return;
      }
      dispatch(enqueueGoogleSearch({ type: 'new', list: enqueue }));
      dispatch(enqueueRakutenSearch({ type: 'new', list: enqueue }));
    });
  }, [dispatch, fetchBookImageQueueTargets]);

  // 書影URL取得処理2
  useEffect(() => {
    if (!fetchBookImageQueueTargets.length) return;
    const results = fetchBookImageQueueTargets.reduce<Record<Isbn13, string | null>>((acc, isbn) => {
      const google: BookData | 'retrying' | null | undefined =
        isbn in googleSearchQueueResults ? googleSearchQueueResults[isbn] : undefined;
      const googleImageUrl = (() => {
        if (google === 'retrying') return null;
        return google?.cover ?? null;
      })();
      const rakuten: BookData | 'retrying' | null | undefined =
        isbn in rakutenSearchQueueResults ? rakutenSearchQueueResults[isbn] : undefined;
      const rakutenImageUrl = (() => {
        if (rakuten === 'retrying') return null;
        return rakuten?.cover ?? null;
      })();

      // 片方でも書影が取得できたらもう片方を待たずにデキューして良い
      const imageUrl = googleImageUrl || rakutenImageUrl;
      if (imageUrl) {
        acc[isbn] = imageUrl;
        return acc;
      }

      // 書影がまだ取得できてないなら、両方の結果を得てからデキューする
      if (google === undefined || rakuten === undefined) return acc;
      acc[isbn] = mergeBookData(rakuten, google)?.cover ?? null;
      return acc;
    }, {});
    if (getKeys(results).length) dispatch(dequeueBookImage(results));
  }, [dispatch, fetchBookImageQueueTargets, googleSearchQueueResults, rakutenSearchQueueResults]);
}
