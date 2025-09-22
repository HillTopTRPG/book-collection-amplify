import { useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { enqueueNdlSearch, selectNdlSearchQueueResults } from '@/store/fetchNdlSearchSlice.ts';
import { useAppDispatch, useAppSelector } from '@/store/hooks.ts';
import { dequeueScan, type ScannedItemMapValue, selectScanQueueTargets } from '@/store/scannerSlice.ts';
import type { Collection, FilterSet } from '@/store/subscriptionDataSlice.ts';
import type { Isbn13 } from '@/types/book.ts';
import { entries, getScannedItemMapValueByBookData, makeNdlOptionsStringByNdlFullOptions } from '@/utils/data.ts';
import { filterMatch } from '@/utils/primitive.ts';

type Props = {
  filterSets: FilterSet[];
  collections: Collection[];
};

export default function useScanQueueProcessor({ filterSets, collections }: Props) {
  const dispatch = useAppDispatch();

  const filterQueueResults = useAppSelector(selectNdlSearchQueueResults);

  // スキャンキューの対象
  const scanQueueTargets = useAppSelector(selectScanQueueTargets);

  // NDL検索キューの結果
  const ndlSearchQueueResults = useAppSelector(selectNdlSearchQueueResults);

  // スキャンキューの処理1 - NDL検索キューへのenqueue
  useEffect(() => {
    dispatch(enqueueNdlSearch({ type: 'priority', list: scanQueueTargets.map(isbn => JSON.stringify({ isbn })) }));
  }, [dispatch, scanQueueTargets]);

  // スキャンキューの処理2 - NDL検索結果から取得できたらスキャンキューからdequeue
  useEffect(() => {
    if (!scanQueueTargets.length) return;
    const results = scanQueueTargets.reduce<Map<Isbn13, ScannedItemMapValue | null>>((acc, isbn) => {
      const key = JSON.stringify({ isbn });
      if (ndlSearchQueueResults[key] === undefined) return acc;
      const ndlSearchQueueResult = ndlSearchQueueResults[key];
      if (!ndlSearchQueueResult.length) {
        acc.set(isbn, null);
        return acc;
      }
      const result = getScannedItemMapValueByBookData(collections, ndlSearchQueueResult[0]);
      const _filterSets: FilterSet[] = filterSets.filter(filterSet =>
        filterQueueResults[JSON.stringify(filterSet.fetch)]?.some(filterMatch({ isbn }))
      );
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
                filters: [[{ keyword: '', sign: '*=' }]],
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
      dispatch(enqueueNdlSearch({ type: 'new', list }));
    }
  }, [dispatch, scanQueueTargets, ndlSearchQueueResults, collections, filterSets, filterQueueResults]);
}
