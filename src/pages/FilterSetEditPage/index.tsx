import type { BottomNavigationItem } from '@/pages/MainLayout/BottomNavigation.tsx';
import type { FilterSet } from '@/types/book.ts';
import { Save, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAwsAccess } from '@/hooks/useAwsAccess.ts';
import { useLogs } from '@/hooks/useLogs.ts';
import FilterSetEdit from '@/pages/FilterSetEditPage/FilterSetEdit.tsx';
import BottomNavigation from '@/pages/MainLayout/BottomNavigation.tsx';
import { enqueueNdlSearch } from '@/store/fetchNdlSearchSlice.ts';
import { useAppDispatch, useAppSelector } from '@/store/hooks.ts';
import { selectFilterSet } from '@/store/subscriptionDataSlice.ts';
import { makeNdlOptionsStringByNdlFullOptions } from '@/utils/data.ts';

export default function FilterSetEditPage() {
  const dispatch = useAppDispatch();
  const { filterSetId } = useParams<{ filterSetId: string }>();
  const dbFilterSet = useAppSelector(state => selectFilterSet(state, filterSetId));
  const [filterSet, setFilterSet] = useState<FilterSet | null>(null);
  const { updateFilterSet } = useAwsAccess();

  useEffect(() => {
    if (filterSet) return;
    setFilterSet(structuredClone(dbFilterSet));
  }, [dbFilterSet, filterSet]);

  // scrollParentRef を useEffect で初期化（レンダリング時の DOM 検索を回避）
  const scrollParentRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!scrollParentRef.current) {
      scrollParentRef.current = document.getElementById('root') as HTMLDivElement;
    }
  }, []);

  useLogs({
    componentName: 'SearchEditPage',
    additionalInfo: `filterSetId: ${filterSetId || 'N/A'}`,
  });

  useEffect(() => {
    if (!filterSet?.fetch) return;
    dispatch(enqueueNdlSearch({ type: 'priority', list: [makeNdlOptionsStringByNdlFullOptions(filterSet.fetch)] }));
  }, [dispatch, filterSet?.fetch]);

  const content = useMemo(() => {
    if (!filterSet) return '存在しないフィルターです。';

    return <FilterSetEdit filterSet={filterSet} scrollParentRef={scrollParentRef} onFilterSetUpdate={setFilterSet} />;
  }, [filterSet]);

  const navigationList: BottomNavigationItem[] = useMemo(
    () => [
      {
        icon: X,
        label: 'キャンセル',
        handleClick: navigate => {
          console.log('キャンセル');
          void navigate(-1);
        },
        disabled: !filterSet,
      },
      {
        icon: Save,
        label: '保存',
        handleClick: async navigate => {
          console.log('保存');
          if (!filterSet) return;
          await updateFilterSet(filterSet);
          void navigate(-1);
        },
        disabled: !filterSet,
      },
    ],
    [filterSet, updateFilterSet]
  );

  return (
    <div className="flex flex-col w-full flex-1">
      <div>フィルター編集画面</div>
      {content}
      <BottomNavigation list={navigationList} zIndex={1001} />
    </div>
  );
}
