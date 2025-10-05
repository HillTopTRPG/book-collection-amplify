import type { BookStatus, CollectionBook } from '@/types/book.ts';
import type { RefObject } from 'react';
import { ListFilterPlus, Pencil } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import BookStatusChecks from '@/components/BookStatusChecks';
import FilterResultSetComponent from '@/components/FilterResultSetComponent.tsx';
import FilterSetCollapsibleHeader from '@/components/FilterSetCollapsibleHeader.tsx';
import GroupByTypeCheck from '@/components/GroupByTypeCheck.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Spinner } from '@/components/ui/shadcn-io/spinner';
import { useAwsAccess } from '@/hooks/useAwsAccess.ts';
import useDOMSize from '@/hooks/useDOMSize.ts';
import { useNavigateWithLoading } from '@/hooks/useNavigateWithLoading';
import { useAppDispatch, useAppSelector } from '@/store/hooks.ts';
import { enqueueAllNdlSearch, selectFilterResultSetsByApiId } from '@/store/ndlSearchSlice.ts';
import { selectCheckBookStatusList, updateCheckBookStatusList } from '@/store/scannerSlice.ts';

type Props = {
  collectionBook: CollectionBook;
  scrollParentRef: RefObject<HTMLDivElement | null>;
  setContentHeight: (height: number) => void;
};

export default function CollectionBooksFilterResultView({ collectionBook, scrollParentRef, setContentHeight }: Props) {
  const dispatch = useAppDispatch();
  const [searchConditionsRef, searchConditionsSize] = useDOMSize();
  const checkBookStatusList = useAppSelector(selectCheckBookStatusList);
  const [groupByType, setGroupByType] = useState<'volume' | null>('volume');
  const navigate = useNavigateWithLoading();
  const { createFilterSet } = useAwsAccess();

  const { hasPrime, priorityFetchList, filterResultSets } = useAppSelector(state =>
    selectFilterResultSetsByApiId(state, collectionBook.apiId)
  );

  const handleListHeightChange = useCallback(
    (height: number) => {
      setContentHeight(height + searchConditionsSize.height);
    },
    [searchConditionsSize.height, setContentHeight]
  );

  useEffect(() => {
    if (!priorityFetchList.length) return;
    dispatch(enqueueAllNdlSearch({ type: 'priority', list: priorityFetchList }));
  }, [dispatch, priorityFetchList]);

  const handleFilterSetCreate = useCallback(async () => {
    const { apiId } = collectionBook;

    void createFilterSet({
      apiId,
      name: collectionBook.title || '無名のフィルター',
      fetch: {
        title: collectionBook.title || '無名',
        publisher: collectionBook.publisher ?? '',
        creator: collectionBook.creator?.at(0) ?? '',
        usePublisher: true,
        useCreator: true,
      },
      filters: [{ list: [{ keyword: '', sign: '*=' }], groupByType: 'volume' }],
    });
  }, [createFilterSet, collectionBook]);

  const handleFilterSetEdit = useCallback(
    (id: string) => {
      navigate(`/search/${id}`);
    },
    [navigate]
  );

  const bookDetailView = useMemo(() => {
    if (!filterResultSets) return null;
    return (
      <>
        {filterResultSets.map(({ filterSet, collectionBooks }, idx) => (
          <FilterResultSetComponent
            key={filterSet.id}
            stickyTop={searchConditionsSize.height}
            setContentHeight={idx === filterResultSets.length - 1 ? handleListHeightChange : () => {}}
            viewBookStatusList={checkBookStatusList}
            {...{ scrollParentRef, collectionBooks, filterSet, groupByType }}
          />
        ))}
      </>
    );
  }, [
    filterResultSets,
    searchConditionsSize.height,
    handleListHeightChange,
    checkBookStatusList,
    scrollParentRef,
    groupByType,
  ]);

  const handleCheckBookStatusListUpdate = useCallback(
    (type: 'add' | 'delete', status: BookStatus) => {
      dispatch(updateCheckBookStatusList({ type, status }));
    },
    [dispatch]
  );

  return (
    <>
      <div className="flex flex-col bg-background px-2 py-1">
        <div className="text-xs">関連フィルター一覧</div>
        {!filterResultSets ? (
          <Spinner variant="bars" />
        ) : (
          <div className="flex flex-col gap-1 pt-1">
            {filterResultSets.map(({ filterSet }) => (
              <div
                key={filterSet.id}
                className="flex items-center justify-between ml-4 px-2 border rounded-md box-border gap-1"
                onClick={() => handleFilterSetEdit(filterSet.id)}
              >
                <FilterSetCollapsibleHeader filterSet={filterSet} />
                <Pencil />
              </div>
            ))}
          </div>
        )}
        {!hasPrime ? (
          <Button
            className="box-border h-8.5 gap-1"
            size="sm"
            onClick={handleFilterSetCreate}
            disabled={!filterResultSets}
          >
            <ListFilterPlus />
            新規追加
          </Button>
        ) : null}
      </div>
      <div ref={searchConditionsRef} className="sticky top-0 z-[110] flex flex-col bg-background px-2 pb-1">
        <GroupByTypeCheck groupByType={groupByType} onUpdateGroupByType={setGroupByType} />
        <div className="flex flex-wrap gap-3">
          <BookStatusChecks statusList={checkBookStatusList} onUpdate={handleCheckBookStatusListUpdate} />
        </div>
      </div>

      {bookDetailView}
    </>
  );
}
