import { type MutableRefObject, useEffect, useRef } from 'react';
import {
  dequeueGoogleSearch,
  enqueueGoogleSearch,
  selectGoogleSearchQueueTargets,
} from '@/store/fetchGoogleSearchSlice.ts';
import { useAppDispatch, useAppSelector } from '@/store/hooks.ts';
import type { BookData, Isbn13 } from '@/types/book.ts';
import { fetchGoogleBooksApi } from '@/utils/fetch.ts';
import { wait } from '@/utils/primitive.ts';
import { getKeys } from '@/utils/type.ts';

const googleSearchProcess = async (targets: Isbn13[], lastEndTime: MutableRefObject<number>) => {
  if (!targets.length) return { results: {}, retryList: [] };
  const needWait = Math.ceil(10 - (performance.now() - lastEndTime.current));
  if (needWait > 0) await wait(needWait);

  const retryList: Isbn13[] = [];

  const list = await Promise.all(
    targets.map(
      isbn =>
        new Promise<{ isbn: Isbn13; book: BookData | string | null }>(resolve => {
          fetchGoogleBooksApi(isbn).then(({ book, retry, error }) => {
            if (retry) {
              retryList.push(isbn);
              resolve({ isbn, book: 'retrying' });
              return;
            }
            if (error) {
              console.log('google search error:', isbn, error);
            }
            resolve({ isbn, book });
          });
        })
    )
  );
  lastEndTime.current = performance.now();

  return {
    results: list.reduce<Record<Isbn13, BookData | string | null>>((acc, { isbn, book }) => {
      acc[isbn] = book;
      return acc;
    }, {}),
    retryList,
  };
};

export default function useGoogleSearchQueueProcessor() {
  const dispatch = useAppDispatch();

  // Google検索キューの対象
  const googleSearchQueueTargets = useAppSelector(selectGoogleSearchQueueTargets);

  const lastEndTime = useRef(0);

  // Google検索キューの処理
  useEffect(() => {
    if (!googleSearchQueueTargets.length) return;
    googleSearchProcess(googleSearchQueueTargets, lastEndTime).then(({ results, retryList }) => {
      if (getKeys(results).length) dispatch(dequeueGoogleSearch(results));
      if (retryList.length) {
        setTimeout(() => {
          dispatch(enqueueGoogleSearch({ type: 'retry', list: retryList }));
        }, 500);
      }
    });
  }, [dispatch, googleSearchQueueTargets]);
}
