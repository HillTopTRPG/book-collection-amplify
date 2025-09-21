import type { MutableRefObject } from 'react';
import { useEffect, useRef } from 'react';
import {
  dequeueRakutenSearch,
  enqueueRakutenSearch,
  selectRakutenSearchQueueTargets,
} from '@/store/fetchRakutenSearchSlice.ts';
import { useAppDispatch, useAppSelector } from '@/store/hooks.ts';
import type { BookData, Isbn13 } from '@/types/book.ts';
import { fetchRakutenBooksApi } from '@/utils/fetch.ts';
import { wait } from '@/utils/primitive.ts';
import { getKeys } from '@/utils/type.ts';

const rakutenSearchProcess = async (targets: Isbn13[], lastEndTime: MutableRefObject<number>) => {
  if (!targets.length) return { results: {}, retryList: [] };
  const needWait = Math.ceil(10 - (performance.now() - lastEndTime.current));
  if (needWait > 0) await wait(needWait);

  const retryList: Isbn13[] = [];

  const list = await Promise.all(
    targets.map(
      isbn =>
        new Promise<{ isbn: Isbn13; book: BookData | string | null }>(resolve => {
          fetchRakutenBooksApi(isbn).then(({ book, retry, error }) => {
            if (retry) {
              retryList.push(isbn);
              resolve({ isbn, book: 'retrying' });
              return;
            }
            if (error) {
              console.log('rakuten search error:', isbn, error);
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

export default function useRakutenSearchQueueProcessor() {
  const dispatch = useAppDispatch();

  // Rakuten検索キューの対象
  const rakutenSearchQueueTargets = useAppSelector(selectRakutenSearchQueueTargets);

  const lastEndTime = useRef(0);

  // Rakuten検索キューの処理
  useEffect(() => {
    if (!rakutenSearchQueueTargets.length) return;
    rakutenSearchProcess(rakutenSearchQueueTargets, lastEndTime).then(({ results, retryList }) => {
      if (getKeys(results).length) dispatch(dequeueRakutenSearch(results));
      if (retryList.length) {
        setTimeout(() => {
          dispatch(enqueueRakutenSearch({ type: 'retry', list: retryList }));
        }, 500);
      }
    });
  }, [dispatch, rakutenSearchQueueTargets]);
}
