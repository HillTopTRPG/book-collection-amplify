import type { BookData, BookStatus } from '@/types/book.ts';
import type { CSSProperties } from 'react';
import { ListFilterPlus, Pencil } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BookCardNavi from '@/components/BookCardNavi.tsx';
import BookDetailView from '@/components/BookDetailView.tsx';
import BookStatusChecks from '@/components/BookStatusChecks';
import GroupByTypeCheck from '@/components/GroupByTypeCheck.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Spinner } from '@/components/ui/shadcn-io/spinner';
import { useAwsAccess } from '@/hooks/useAwsAccess.ts';
import useDOMSize from '@/hooks/useDOMSize.ts';
import { useLogs } from '@/hooks/useLogs.ts';
import { enqueueNdlSearch } from '@/store/fetchNdlSearchSlice.ts';
import { useAppDispatch, useAppSelector } from '@/store/hooks.ts';
import { selectBooksByKeys, selectFilterResultsByApiId } from '@/store/ndlSearchSlice.ts';
import { selectCheckBookStatusList, updateCheckBookStatusList } from '@/store/scannerSlice.ts';
import { makeNdlOptionsStringByNdlFullOptions } from '@/utils/data.ts';

const BOTTOM_NAVIGATION_HEIGHT = 65;

type Props = {
  book: BookData;
};

export default function ScannedBookView({ book }: Props) {
  const dispatch = useAppDispatch();
  const checkBookStatusList = useAppSelector(selectCheckBookStatusList);
  const [groupByType, setGroupByType] = useState<'volume' | null>('volume');
  const [searchConditionsRef, searchConditionsSize] = useDOMSize();
  const [contentHeight, setContentHeight] = useState(0);

  // パフォーマンスログ
  useLogs({
    componentName: 'ScannedBookView',
    additionalInfo: `ISBN: ${book.isbn}`,
  });

  // scrollParentRef を useEffect で初期化（レンダリング時の DOM 検索を回避）
  const scrollParentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!scrollParentRef.current) {
      scrollParentRef.current = document.getElementById('root') as HTMLDivElement;
    }
  }, []);

  // setContentHeight を useCallback で安定化
  const handleSetContentHeight = useCallback((height: number) => {
    setContentHeight(height);
  }, []);

  const minHeightStyle = useMemo(
    () =>
      ({
        '--content-end-y': `${searchConditionsSize.height + contentHeight + BOTTOM_NAVIGATION_HEIGHT}px`,
      }) as CSSProperties,
    [searchConditionsSize.height, contentHeight]
  );

  // 特定のISBNに関連するフィルターセットのみを取得（primeを除外）
  const { hasPrime, list } = useAppSelector(state => selectFilterResultsByApiId(state, book.apiId));

  const stringifyFetchOptions = useMemo(
    () => list?.map(({ filterSet }) => makeNdlOptionsStringByNdlFullOptions(filterSet.fetch)) ?? [],
    [list]
  );

  useEffect(() => {
    if (!stringifyFetchOptions.length) return;
    dispatch(enqueueNdlSearch({ type: 'priority', list: stringifyFetchOptions }));
  }, [dispatch, stringifyFetchOptions]);

  const navigate = useNavigate();
  const { createFilterSet } = useAwsAccess();

  // 特定のキーに対応するBooksのみを取得
  const books: BookData[] = useAppSelector(state => selectBooksByKeys(state, stringifyFetchOptions));

  const handleFilterSetCreate = useCallback(async () => {
    const { apiId } = book;

    void createFilterSet({
      apiId,
      name: book.title || '無名のフィルター',
      fetch: {
        title: book.title || '無名',
        publisher: book.publisher ?? '',
        creator: book.creator?.at(0) ?? '',
        usePublisher: true,
        useCreator: true,
      },
      filters: [{ list: [{ keyword: '', sign: '*=' }], groupByType: 'volume' }],
    });
  }, [createFilterSet, book]);

  const handleFilterSetEdit = useCallback(
    (id: string) => {
      void navigate(`/search/${id}`);
    },
    [navigate]
  );

  const bookCardNavi = useMemo(() => <BookCardNavi book={book} />, [book]);

  const bookDetailView = useMemo(() => {
    if (!list) return null;
    return (
      <>
        {list.map(({ filterSet }) => (
          <BookDetailView
            key={filterSet.id}
            stickyTop={searchConditionsSize.height}
            setContentHeight={handleSetContentHeight}
            viewBookStatusList={checkBookStatusList}
            {...{ scrollParentRef, books, filterSet, groupByType }}
          />
        ))}
      </>
    );
  }, [books, groupByType, handleSetContentHeight, list, searchConditionsSize.height, checkBookStatusList]);

  const handleCheckBookStatusListUpdate = useCallback(
    (type: 'add' | 'delete', status: BookStatus) => {
      dispatch(updateCheckBookStatusList({ type, status }));
    },
    [dispatch]
  );

  return (
    <div className="flex flex-col w-full flex-1">
      <div className="flex flex-col gap-3 pt-3">
        <div className="bg-background">{bookCardNavi}</div>
        <div ref={searchConditionsRef} className="sticky top-0 z-[110] flex flex-col bg-background px-2 pt-2">
          <div className="text-xs">関連フィルター一覧</div>
          {!list ? (
            <Spinner variant="bars" />
          ) : (
            <div className="flex flex-col gap-1 pt-1 pb-3">
              {list.map(({ filterSet }) => (
                <Button
                  key={filterSet.id}
                  className="ml-4 box-border gap-1"
                  variant="outline"
                  onClick={() => handleFilterSetEdit(filterSet.id)}
                >
                  <span className="flex-1 flex justify-start text-sm">{filterSet.name}</span>
                  <Pencil />
                </Button>
              ))}
            </div>
          )}
          {!hasPrime ? (
            <Button className="box-border h-8.5 gap-1" size="sm" onClick={handleFilterSetCreate} disabled={!list}>
              <ListFilterPlus />
              新規追加
            </Button>
          ) : null}
          <GroupByTypeCheck groupByType={groupByType} onUpdateGroupByType={setGroupByType} />
          <div className="flex flex-wrap gap-1">
            <BookStatusChecks statusList={checkBookStatusList} onUpdate={handleCheckBookStatusListUpdate} />
          </div>
        </div>

        {bookDetailView}
      </div>

      <div className="min-h-viewport-with-offset" style={minHeightStyle} />
    </div>
  );
}
