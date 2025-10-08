import type { NdlSearchResult } from '@/store/fetchNdlSearchSlice.ts';
import type { BookData, Collection } from '@/types/book.ts';
import type { NdlFetchOptions } from '@/types/fetch.ts';
import { useEffect } from 'react';
import { enqueueNdlSearch, selectNdlSearchResults } from '@/store/fetchNdlSearchSlice.ts';
import { useAppDispatch, useAppSelector } from '@/store/hooks.ts';
import { dequeueAllNdlSearch, enqueueAllNdlSearch, selectAllNdlSearchTargets } from '@/store/ndlSearchSlice.ts';
import {
  selectAllFilerSetFetchOptionStrings,
  selectTempFilerSetFetchOptionStrings,
} from '@/store/subscriptionDataSlice.ts';
import { getKeys } from '@/utils/type.ts';

const getRequests = (
  results: BookData[],
  ndlSearchResults: Record<string, NdlSearchResult | 'retrying'>,
  ndlFetchOptions: NdlFetchOptions,
  startRecord: number
): { numberOfRecords: number | null; nextRequest: string | null; retrying: boolean } => {
  const option = structuredClone(ndlFetchOptions);
  option.startRecord = startRecord;
  const nextRequest = JSON.stringify(option);
  const fetchResult = nextRequest in ndlSearchResults ? ndlSearchResults[nextRequest] : undefined;
  if (!fetchResult) {
    return { numberOfRecords: null, nextRequest, retrying: false };
  }
  if (fetchResult === 'retrying') {
    return { numberOfRecords: null, nextRequest: null, retrying: true };
  }

  results.push(...fetchResult.list);
  const nextRecordPosition = fetchResult.nextRecordPosition;
  const numberOfRecords = fetchResult.numberOfRecords;
  if (nextRecordPosition !== null) {
    const result = getRequests(results, ndlSearchResults, ndlFetchOptions, nextRecordPosition);

    return {
      numberOfRecords: result.numberOfRecords ?? numberOfRecords,
      nextRequest: result.nextRequest,
      retrying: result.retrying,
    };
  }
  return { numberOfRecords, nextRequest: null, retrying: false };
};

type Props = {
  collections: Collection[];
};

export default function useNdlSearchQueueEnqueueer({ collections }: Props) {
  const dispatch = useAppDispatch();

  // NDL検索キューの対象
  const targets = useAppSelector(selectAllNdlSearchTargets);
  const ndlSearchResults = useAppSelector(selectNdlSearchResults);

  const allFilerSetFetchOptionStrings = useAppSelector(selectAllFilerSetFetchOptionStrings);
  const tempFilerSetFetchOptionStrings = useAppSelector(selectTempFilerSetFetchOptionStrings);

  useEffect(() => {
    if (!targets.length) return;
    const list = targets.map(target => {
      const options = JSON.parse(target) as NdlFetchOptions;
      options.startRecord = 1;
      return JSON.stringify(options);
    });
    dispatch(enqueueNdlSearch({ type: 'new', list }));
  }, [dispatch, targets]);

  useEffect(() => {
    if (!targets.length) return;
    const results = targets.reduce<{
      dequeue: Record<string, BookData[]>;
      enqueue: string[];
    }>(
      (acc, target) => {
        const options = JSON.parse(target) as NdlFetchOptions;
        const books: BookData[] = [];
        const { nextRequest, retrying } = getRequests(books, ndlSearchResults, options, 1);
        if (!nextRequest && !retrying) {
          acc.dequeue[target] = books;
        }
        if (nextRequest) {
          acc.enqueue.push(nextRequest);
        }
        return acc;
      },
      { dequeue: {}, enqueue: [] }
    );
    if (getKeys(results.dequeue).length) {
      dispatch(dequeueAllNdlSearch(results.dequeue));
    }
    if (results.enqueue.length) {
      dispatch(enqueueNdlSearch({ type: 'new', list: results.enqueue }));
    }
  }, [collections, dispatch, ndlSearchResults, targets]);

  // DBと更新中、両方のフィルターセットの検索条件は常にキューに突っ込もうとしまくる（キューイング時に結果があれば弾いてくれる）
  useEffect(() => {
    if (!allFilerSetFetchOptionStrings.length) return;
    dispatch(enqueueAllNdlSearch({ type: 'new', list: allFilerSetFetchOptionStrings }));
  }, [dispatch, allFilerSetFetchOptionStrings]);

  // 更新中のフィルターセットの条件が変更される度に検索し直し
  useEffect(() => {
    if (!tempFilerSetFetchOptionStrings.length) return;
    dispatch(enqueueAllNdlSearch({ type: 'priority', list: tempFilerSetFetchOptionStrings }));
  }, [dispatch, tempFilerSetFetchOptionStrings]);
}
