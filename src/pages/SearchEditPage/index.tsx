import type { BottomNavigationItem } from '@/pages/MainLayout/BottomNavigation.tsx';
import type { FilterSet } from '@/types/book.ts';
import { Save, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Spinner } from '@/components/ui/shadcn-io/spinner';
import { useAwsAccess } from '@/hooks/useAwsAccess.ts';
import { useLogs } from '@/hooks/useLogs.ts';
import BottomNavigation from '@/pages/MainLayout/BottomNavigation.tsx';
import FilterSetEdit from '@/pages/SearchEditPage/FilterSetEdit.tsx';
import { useAppSelector } from '@/store/hooks.ts';
import { selectAllFilterResults } from '@/store/ndlSearchSlice.ts';

export default function SearchEditPage() {
  const { filterSetId } = useParams<{ filterSetId: string }>();
  const allFilterResults = useAppSelector(selectAllFilterResults);
  const [filterSet, setFilterSet] = useState<FilterSet | null>(null);
  const { updateFilterSet } = useAwsAccess();

  useLogs({
    componentName: 'SearchEditPage',
    additionalInfo: `filterSetId: ${filterSetId || 'N/A'}`,
  });

  // ロードが終わるまで待つ
  useEffect(() => {
    if (filterSet) return;
    const filterSetResult = allFilterResults?.find(({ filterSet }) => filterSet.id === filterSetId) ?? null;
    if (!filterSetResult) return;
    setFilterSet(structuredClone(filterSetResult.filterSet));
  }, [allFilterResults, filterSet, filterSetId]);

  const content = useMemo(() => {
    if (!allFilterResults) return <Spinner variant="bars" />;
    if (!filterSet) return '存在しないフィルターです。';

    return <FilterSetEdit filterSet={filterSet} onFilterSetUpdate={setFilterSet} />;
  }, [allFilterResults, filterSet]);

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
