import { useEffect } from 'react';
import type { NdlSearchResult } from '@/store/fetchNdlSearchSlice.ts';
import { enqueueNdlSearch, selectNdlSearchResults } from '@/store/fetchNdlSearchSlice.ts';
import { useAppDispatch, useAppSelector } from '@/store/hooks.ts';
import { dequeueAllNdlSearch, enqueueAllNdlSearch, selectNdlSearchTargets } from '@/store/ndlSearchSlice.ts';
import { selectSelectedScannedItemFetchOptions } from '@/store/scannerSlice.ts';
import type { FilterSet } from '@/store/subscriptionDataSlice.ts';
import type { BookData } from '@/types/book.ts';
import type { NdlFetchOptions } from '@/types/fetch.ts';
import { makeNdlOptionsStringByNdlFullOptions } from '@/utils/data.ts';
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
  const fetchResult = ndlSearchResults[nextRequest];
  if (!fetchResult) {
    return { numberOfRecords: null, nextRequest, retrying: false };
  }
  if (fetchResult === 'retrying') {
    return { numberOfRecords: null, nextRequest: null, retrying: true };
  }

  console.log(fetchResult.list.length, fetchResult.numberOfRecords, fetchResult.nextRecordPosition);
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
  return { numberOfRecords: numberOfRecords, nextRequest: null, retrying: false };
};

type Props = {
  filterSets: FilterSet[];
};

export default function useNdlSearchQueueEnqueueer({ filterSets }: Props) {
  const dispatch = useAppDispatch();

  // NDL検索キューの対象
  const targets = useAppSelector(selectNdlSearchTargets);
  const ndlSearchResults = useAppSelector(selectNdlSearchResults);

  const selectedScannedItemFetchOptions = useAppSelector(selectSelectedScannedItemFetchOptions);

  useEffect(() => {
    const list = targets.map(target => {
      const options = JSON.parse(target) as NdlFetchOptions;
      options.startRecord = 1;
      return JSON.stringify(options);
    });
    dispatch(enqueueNdlSearch({ type: 'new', list }));
  }, [dispatch, targets]);

  useEffect(() => {
    const results = targets.reduce<{ dequeue: Record<string, BookData[]>; enqueue: string[] }>(
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
  }, [dispatch, ndlSearchResults, targets]);

  // 蔵書のグループ本を全て検索する
  useEffect(() => {
    filterSets.forEach(filterSet => {
      dispatch(enqueueAllNdlSearch({ type: 'new', list: [makeNdlOptionsStringByNdlFullOptions(filterSet.fetch)] }));
    });
  }, [dispatch, filterSets]);

  // 読み込み書籍のグループ本のフィルターが変更される毎に検索結果を取得し直す
  useEffect(() => {
    dispatch(enqueueAllNdlSearch({ type: 'priority', list: selectedScannedItemFetchOptions }));
  }, [dispatch, selectedScannedItemFetchOptions]);
}
