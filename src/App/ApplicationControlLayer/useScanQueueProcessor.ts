import type { Collection, FilterSet } from '@/store/subscriptionDataSlice.ts';
import type { BookData, Isbn13 } from '@/types/book.ts';
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks.ts';
import { enqueueAllNdlSearch } from '@/store/ndlSearchSlice.ts';
import { dequeueScan, selectScanQueueTargets } from '@/store/scannerSlice.ts';
import { addTempCollections } from '@/store/subscriptionDataSlice.ts';
import { getScannedItemMapValueByBookData } from '@/utils/data.ts';
import { entries } from '@/utils/primitive.ts';

type Props = {
  collections: Collection[];
  tempCollections: Collection[];
  filterSets: FilterSet[];
  allNdlSearchQueueResults: Record<string, BookData[]>;
};

export default function useScanQueueProcessor({
  collections,
  tempCollections,
  filterSets,
  allNdlSearchQueueResults,
}: Props) {
  const dispatch = useAppDispatch();

  // スキャンキューの対象
  const scanQueueTargets = useAppSelector(selectScanQueueTargets);

  // スキャンキューの処理1 - NDL検索キューへのenqueue
  useEffect(() => {
    dispatch(enqueueAllNdlSearch({ type: 'priority', list: scanQueueTargets.map(isbn => JSON.stringify({ isbn })) }));
  }, [dispatch, scanQueueTargets]);

  // スキャンキューの処理2 - NDL検索結果から取得できたらスキャンキューからdequeue
  useEffect(() => {
    if (!scanQueueTargets.length) return;
    const tempCollections: Collection[] = [];
    const results = scanQueueTargets.reduce<Map<Isbn13, BookData>>((acc, isbn) => {
      const key = JSON.stringify({ isbn });
      if (!(key in allNdlSearchQueueResults)) return acc;
      const ndlSearchQueueResult = allNdlSearchQueueResults[key];
      if (!ndlSearchQueueResult.length) {
        return acc;
      }
      const { tempCollection } = getScannedItemMapValueByBookData(
        ndlSearchQueueResult[0],
        collections,
        tempCollections,
        filterSets,
        allNdlSearchQueueResults
      );

      if (tempCollection) {
        tempCollections.push(tempCollection);
      }

      acc.set(isbn, ndlSearchQueueResult[0]);
      return acc;
    }, new Map<Isbn13, BookData>());

    if (tempCollections.length) dispatch(addTempCollections(tempCollections));
    if (!results.size) return;
    dispatch(dequeueScan(entries(results)));
  }, [dispatch, scanQueueTargets, allNdlSearchQueueResults, collections, filterSets, tempCollections]);
}
