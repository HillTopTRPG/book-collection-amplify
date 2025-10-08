import type { BookData, Collection, FilterSet, Isbn13 } from '@/types/book.ts';
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks.ts';
import { enqueueAllNdlSearch } from '@/store/ndlSearchSlice.ts';
import { dequeueScan, selectScanQueueTargets } from '@/store/scannerSlice.ts';
import { entries, filterMatch } from '@/utils/primitive.ts';

type Props = {
  collections: Collection[];
  filterSets: FilterSet[];
  allNdlSearchQueueResults: Record<string, BookData[]>;
};

export default function useScanQueueProcessor({ collections, filterSets, allNdlSearchQueueResults }: Props) {
  const dispatch = useAppDispatch();

  // スキャンキューの対象
  const scanQueueTargets = useAppSelector(selectScanQueueTargets);

  // スキャンキューの処理1 - NDL検索キューへのenqueue
  useEffect(() => {
    if (!scanQueueTargets.length) return;
    dispatch(enqueueAllNdlSearch({ type: 'priority', list: scanQueueTargets.map(isbn => JSON.stringify({ isbn })) }));
  }, [dispatch, scanQueueTargets]);

  // スキャンキューの処理2 - NDL検索結果から取得できたらスキャンキューからdequeue
  useEffect(() => {
    if (!scanQueueTargets.length) return;
    const results = scanQueueTargets.reduce<Map<Isbn13, BookData>>((acc, isbn) => {
      const key = JSON.stringify({ isbn });
      if (!(key in allNdlSearchQueueResults)) return acc;
      const ndlSearchQueueResult = allNdlSearchQueueResults[key];
      if (!ndlSearchQueueResult.length) {
        return acc;
      }
      const book = ndlSearchQueueResult.find(filterMatch({ isbn })) ?? ndlSearchQueueResult[0];

      acc.set(isbn, book);
      return acc;
    }, new Map<Isbn13, BookData>());

    if (!results.size) return;
    dispatch(dequeueScan(entries(results)));
  }, [dispatch, scanQueueTargets, allNdlSearchQueueResults, collections, filterSets]);
}
