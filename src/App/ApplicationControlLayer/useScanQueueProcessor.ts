import type { Collection, FilterSet } from '@/store/subscriptionDataSlice.ts';
import type { Isbn13 } from '@/types/book.ts';
import { useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAppDispatch, useAppSelector } from '@/store/hooks.ts';
import { enqueueAllNdlSearch, selectAllNdlSearchResults } from '@/store/ndlSearchSlice.ts';
import { dequeueScan, type ScannedItemMapValue, selectScanQueueTargets } from '@/store/scannerSlice.ts';
import { getScannedItemMapValueByBookData, makeNdlOptionsStringByNdlFullOptions } from '@/utils/data.ts';
import { entries, filterMatch } from '@/utils/primitive.ts';

type Props = {
  filterSets: FilterSet[];
  collections: Collection[];
};

export default function useScanQueueProcessor({ filterSets, collections }: Props) {
  const dispatch = useAppDispatch();

  // スキャンキューの対象
  const scanQueueTargets = useAppSelector(selectScanQueueTargets);

  // NDL検索キューの結果
  const allNdlSearchQueueResults = useAppSelector(selectAllNdlSearchResults);

  // スキャンキューの処理1 - NDL検索キューへのenqueue
  useEffect(() => {
    dispatch(enqueueAllNdlSearch({ type: 'priority', list: scanQueueTargets.map(isbn => JSON.stringify({ isbn })) }));
  }, [dispatch, scanQueueTargets]);

  // スキャンキューの処理2 - NDL検索結果から取得できたらスキャンキューからdequeue
  useEffect(() => {
    if (!scanQueueTargets.length) return;
    const results = scanQueueTargets.reduce<Map<Isbn13, ScannedItemMapValue | null>>((acc, isbn) => {
      const key = JSON.stringify({ isbn });
      if (allNdlSearchQueueResults[key] === undefined) return acc;
      const ndlSearchQueueResult = allNdlSearchQueueResults[key];
      if (typeof ndlSearchQueueResult === 'string') return acc;
      if (!ndlSearchQueueResult.length) {
        acc.set(isbn, null);
        return acc;
      }
      const result = getScannedItemMapValueByBookData(collections, ndlSearchQueueResult[0]);
      const _filterSets: FilterSet[] = filterSets.filter(filterSet => {
        const result = allNdlSearchQueueResults[JSON.stringify(filterSet.fetch)];
        if (typeof result === 'string') return false;
        return result?.some(filterMatch({ isbn }));
      });
      const wrappedFilterSets =
        _filterSets.length > 0
          ? _filterSets
          : [
              {
                id: uuidv4(),
                name: result.bookDetail?.book.title ?? '無名のフィルター',
                fetch: {
                  title: result.bookDetail?.book.title ?? '無名',
                  publisher: result.bookDetail?.book.publisher ?? '',
                  creator: result.bookDetail?.book.creator?.at(0) ?? '',
                  usePublisher: true,
                  useCreator: true,
                },
                filters: [{ list: [{ keyword: '', sign: '*=' }], grouping: 'date' }],
                primary: isbn,
                createdAt: '',
                updatedAt: '',
                owner: '',
              } as const satisfies FilterSet,
            ];
      result.filterSets.push(...wrappedFilterSets);

      acc.set(isbn, result);
      return acc;
    }, new Map<Isbn13, ScannedItemMapValue | null>());

    if (!results.size) return;
    dispatch(dequeueScan(entries(results)));
    const list = Array.from(results.entries()).flatMap(([_, result]): string[] => {
      if (!result) return [];
      return result.filterSets.map(filterSet => makeNdlOptionsStringByNdlFullOptions(filterSet.fetch));
    });
    if (list.length) {
      dispatch(enqueueAllNdlSearch({ type: 'new', list }));
    }
  }, [dispatch, scanQueueTargets, allNdlSearchQueueResults, collections, filterSets]);
}
