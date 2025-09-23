import { type RefObject, useEffect, useRef } from 'react';
import type { RootState } from '@/store';
import { useAppDispatch, useAppSelector } from '@/store/hooks.ts';
import type { FetchProcessResult } from '@/utils/fetch';
import { wait } from '@/utils/primitive.ts';
import { getKeys } from '@/utils/type.ts';

export const searchProcess = async <Key extends string, Value>(
  fetchFunc: (input: Key) => Promise<FetchProcessResult<Value>>,
  targets: Key[],
  lastEndTime: RefObject<number>
): Promise<{ results: Record<Key, Value | 'retrying'>; retryList: Key[] }> => {
  if (!targets.length) return { results: {} as Record<Key, Value>, retryList: [] };
  const needWait = Math.ceil(100 - (performance.now() - lastEndTime.current));
  if (needWait > 0) await wait(needWait);

  const retryList: Key[] = [];

  const list = await Promise.all(
    targets.map(
      isbn =>
        new Promise<{ isbn: Key; value: Value }>(resolve => {
          fetchFunc(isbn).then(({ value, retry }) => {
            if (retry) {
              retryList.push(isbn);
              resolve({ isbn, value: 'retrying' as Value });
              return;
            }
            resolve({ isbn, value });
          });
        })
    )
  );
  lastEndTime.current = performance.now();

  return {
    results: list.reduce(
      (acc, { isbn, value }) => {
        acc[isbn] = value;
        return acc;
      },
      {} as Record<Key, Value>
    ),
    retryList,
  };
};

export default function useSearchQueueProcessor<Key extends string, Value>(
  targetSelector: (state: RootState) => Key[],
  fetchFunc: (input: Key) => Promise<FetchProcessResult<Value>>,
  dequeueFunc: (payload: Record<Key, Value | 'retrying'>) => { payload: Record<Key, Value | 'retrying'>; type: string },
  enqueueFunc: (payload: { type: 'new' | 'retry' | 'priority'; list: Key[] }) => {
    payload: { type: 'new' | 'retry' | 'priority'; list: Key[] };
    type: string;
  },
  additionalResultsFunc?: (results: Record<Key, Value | 'retrying'>) => void
) {
  const dispatch = useAppDispatch();
  const targets = useAppSelector(targetSelector);

  const lastEndTime = useRef(0);

  useEffect(() => {
    searchProcess(fetchFunc, targets, lastEndTime).then(({ results, retryList }) => {
      if (getKeys(results).length) dispatch(dequeueFunc(results));
      if (retryList.length) {
        setTimeout(() => {
          dispatch(enqueueFunc({ type: 'retry', list: retryList }));
        }, 500);
      }
      additionalResultsFunc?.(results);
    });
  }, [additionalResultsFunc, dequeueFunc, dispatch, enqueueFunc, fetchFunc, targets]);
}
