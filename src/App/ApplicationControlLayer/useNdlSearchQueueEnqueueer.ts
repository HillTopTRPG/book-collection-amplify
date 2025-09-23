import { useEffect } from 'react';
import { enqueueNdlSearch } from '@/store/fetchNdlSearchSlice.ts';
import { useAppDispatch, useAppSelector } from '@/store/hooks.ts';
import { selectSelectedScannedItemFetchOptions } from '@/store/scannerSlice.ts';
import type { FilterSet } from '@/store/subscriptionDataSlice.ts';
import { makeNdlOptionsStringByNdlFullOptions } from '@/utils/data.ts';

type Props = {
  filterSets: FilterSet[];
};

export default function useNdlSearchQueueEnqueueer({ filterSets }: Props) {
  const dispatch = useAppDispatch();

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
}
