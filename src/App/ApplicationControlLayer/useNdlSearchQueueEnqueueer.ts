import type { NdlSearchResult } from '@/store/fetchNdlSearchSlice.ts';
import type { Collection, FilterSet } from '@/store/subscriptionDataSlice.ts';
import type { BookData } from '@/types/book.ts';
import type { NdlFetchOptions } from '@/types/fetch.ts';
import { useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { enqueueNdlSearch, selectNdlSearchResults } from '@/store/fetchNdlSearchSlice.ts';
import { useAppDispatch, useAppSelector } from '@/store/hooks.ts';
import { dequeueAllNdlSearch, enqueueAllNdlSearch, selectNdlSearchTargets } from '@/store/ndlSearchSlice.ts';
import { selectSelectedScannedItemFetchOptions } from '@/store/scannerSlice.ts';
import { addTempCollections } from '@/store/subscriptionDataSlice.ts';
import { makeNdlOptionsStringByNdlFullOptions } from '@/utils/data.ts';
import { filterMatch } from '@/utils/primitive.ts';
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
  return { numberOfRecords: numberOfRecords, nextRequest: null, retrying: false };
};

type Props = {
  collections: Collection[];
  tempCollections: Collection[];
  filterSets: FilterSet[];
};

export default function useNdlSearchQueueEnqueueer({ collections, tempCollections, filterSets }: Props) {
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
    const results = targets.reduce<{
      dequeue: Record<string, BookData[]>;
      enqueue: string[];
      tempCollections: Collection[];
    }>(
      (acc, target) => {
        const options = JSON.parse(target) as NdlFetchOptions;
        const books: BookData[] = [];
        const { nextRequest, retrying } = getRequests(books, ndlSearchResults, options, 1);
        if (!nextRequest && !retrying) {
          const _tempCollections: Collection[] = [];
          books.forEach(book => {
            const isbn = book.isbn;
            const collection = collections.find(filterMatch({ isbn }));
            const tempCollection = tempCollections.find(filterMatch({ isbn }));
            if (!collection && !tempCollection) {
              _tempCollections.push({
                id: uuidv4(),
                isbn,
                status: 'Unregistered',
                createdAt: '',
                updatedAt: '',
                owner: '',
              });
            }
          });
          acc.dequeue[target] = books;
          acc.tempCollections.push(..._tempCollections);
        }
        if (nextRequest) {
          acc.enqueue.push(nextRequest);
        }
        return acc;
      },
      { dequeue: {}, enqueue: [], tempCollections: [] }
    );
    if (results.tempCollections.length) dispatch(addTempCollections(results.tempCollections));
    if (getKeys(results.dequeue).length) {
      dispatch(dequeueAllNdlSearch(results.dequeue));
    }
    if (results.enqueue.length) {
      dispatch(enqueueNdlSearch({ type: 'new', list: results.enqueue }));
    }
  }, [collections, dispatch, ndlSearchResults, targets, tempCollections]);

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
