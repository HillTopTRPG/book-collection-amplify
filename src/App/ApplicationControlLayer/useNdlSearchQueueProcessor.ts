import { useEffect } from 'react';
import { enqueueBookImage } from '@/store/fetchBookImageSlice.ts';
import { dequeueNdlSearch, enqueueNdlSearch, selectNdlSearchQueueTargets } from '@/store/fetchNdlSearchSlice.ts';
import { useAppDispatch, useAppSelector } from '@/store/hooks.ts';
import { selectSelectedScannedItemFetchOptions } from '@/store/scannerSlice.ts';
import type { FilterSet } from '@/store/subscriptionDataSlice.ts';
import type { BookData, Isbn13 } from '@/types/book.ts';
import { makeNdlOptionsStringByNdlFullOptions } from '@/utils/data.ts';
import type { NdlFetchOptions } from '@/utils/fetch.ts';
import { fetchNdlSearch } from '@/utils/fetch.ts';
import { getKeys } from '@/utils/type.ts';

type Props = {
  filterSets: FilterSet[];
};

export default function useNdlSearchQueueProcessor({ filterSets }: Props) {
  const dispatch = useAppDispatch();

  // NDL検索キューの対象
  const ndlSearchQueueTargets = useAppSelector(selectNdlSearchQueueTargets);

  const selectedScannedItemFetchOptions = useAppSelector(selectSelectedScannedItemFetchOptions);

  // 蔵書のグループ本を全て検索する
  useEffect(() => {
    filterSets.forEach(filterSet => {
      dispatch(enqueueNdlSearch({ type: 'new', list: [makeNdlOptionsStringByNdlFullOptions(filterSet.fetch)] }));
    });
  }, [dispatch, filterSets]);

  // 読み込み書籍のグループ本のフィルターが変更される毎に検索結果を取得し直す
  useEffect(() => {
    dispatch(enqueueNdlSearch({ type: 'priority', list: selectedScannedItemFetchOptions }));
  }, [dispatch, selectedScannedItemFetchOptions]);

  // NDL検索キューの処理
  useEffect(() => {
    if (!ndlSearchQueueTargets.length) return;
    Promise.all(
      ndlSearchQueueTargets.map(
        optionsStr =>
          new Promise<{ optionsStr: string; books: BookData[] }>(resolve => {
            const ndlOptions = JSON.parse(optionsStr) as NdlFetchOptions;
            fetchNdlSearch(ndlOptions).then(books => {
              resolve({ optionsStr, books });
            });
          })
      )
    ).then(list => {
      let result: Record<string, BookData[]> = {};
      const isbnList: Isbn13[] = [];
      list.forEach(({ optionsStr, books }) => {
        result = { ...result, ...{ [optionsStr]: books } };
        isbnList.push(...books.map(b => b.isbn));
      });

      if (getKeys(result).length) dispatch(dequeueNdlSearch(result));
      if (isbnList.length) dispatch(enqueueBookImage({ type: 'new', list: isbnList }));
    });
  }, [dispatch, ndlSearchQueueTargets]);
}
