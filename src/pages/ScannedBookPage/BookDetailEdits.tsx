import type { FilterSet } from '@/store/subscriptionDataSlice.ts';
import type { BookDetail } from '@/types/book.ts';
import type { CSSProperties, ReactNode } from 'react';
import { ListFilterPlus, MessageCircleQuestionMark, Pencil } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BookCardNavi from '@/components/BookCardNavi.tsx';
import BookDetailView from '@/components/BookDetailView.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Checkbox } from '@/components/ui/checkbox.tsx';
import { Label } from '@/components/ui/label.tsx';
import { IconButton } from '@/components/ui/shadcn-io/icon-button';
import { Spinner } from '@/components/ui/shadcn-io/spinner';
import { useAwsAccess } from '@/hooks/useAwsAccess.ts';
import useDOMSize from '@/hooks/useDOMSize.ts';
import { enqueueNdlSearch } from '@/store/fetchNdlSearchSlice.ts';
import { useAppDispatch, useAppSelector } from '@/store/hooks.ts';
import {
  selectBookDetailsByKey,
  selectFilterResultsByCollectionId,
  selectFilterResultsByIsbn,
} from '@/store/ndlSearchSlice.ts';
import { BookStatusEnum } from '@/store/subscriptionDataSlice.ts';
import { makeNdlOptionsStringByNdlFullOptions } from '@/utils/data.ts';

const BOTTOM_NAVIGATION_HEIGHT = 65;

type Props = {
  bookDetail: BookDetail;
};

export default function BookDetailEdits({ bookDetail }: Props) {
  const dispatch = useAppDispatch();
  const [groupByType, setGroupByType] = useState<'volume' | null>('volume');
  const [searchConditionsRef, searchConditionsSize] = useDOMSize();
  const [contentHeight, setContentHeight] = useState(0);
  const scrollParentRef = useRef<HTMLDivElement>(document.getElementById('root') as HTMLDivElement);

  const minHeightStyle = useMemo(
    () =>
      ({
        '--content-end-y': `${searchConditionsSize.height + contentHeight + BOTTOM_NAVIGATION_HEIGHT}px`,
      }) as CSSProperties,
    [searchConditionsSize.height, contentHeight]
  );

  // 特定のコレクションIDに対応するフィルターセットのみを取得
  const primeFilterSet: { filterSet: FilterSet; books: BookDetail[] } | null = useAppSelector(state =>
    selectFilterResultsByCollectionId(state, bookDetail.collection.id)
  );

  // 特定のISBNに関連するフィルターセットのみを取得（primeを除外）
  const otherFilterSets: { filterSet: FilterSet; books: BookDetail[] }[] = useAppSelector(state =>
    selectFilterResultsByIsbn(state, bookDetail.book.isbn, bookDetail.collection.id)
  );

  const filterSet = useMemo(
    () => primeFilterSet?.filterSet ?? otherFilterSets.at(0)?.filterSet ?? null,
    [otherFilterSets, primeFilterSet?.filterSet]
  );

  const stringifyFetchOptions = useMemo(
    () => (filterSet?.fetch ? makeNdlOptionsStringByNdlFullOptions(filterSet.fetch) : ''),
    [filterSet?.fetch]
  );

  // 特定のキーに対応するBookDetailsのみを取得
  const bookDetails: BookDetail[] = useAppSelector(state => selectBookDetailsByKey(state, stringifyFetchOptions));

  useEffect(() => {
    if (!stringifyFetchOptions) return;
    dispatch(enqueueNdlSearch({ type: 'priority', list: [stringifyFetchOptions] }));
  }, [dispatch, stringifyFetchOptions]);
  const navigate = useNavigate();
  const { createFilterSet, createCollections } = useAwsAccess();

  const options = useMemo((): Record<string, { label: ReactNode; disabled: boolean }> | null => {
    const hasAllData = primeFilterSet !== null || otherFilterSets.length > 0;
    if (!hasAllData) return null;
    return [primeFilterSet, ...otherFilterSets].reduce<Record<string, { label: ReactNode; disabled: boolean }>>(
      (acc, info) => {
        if (info) {
          acc[info.filterSet.id] = { label: info.filterSet.name, disabled: false };
        }
        return acc;
      },
      {}
    );
  }, [otherFilterSets, primeFilterSet]);

  const filterSets: FilterSet[] = useMemo(
    () =>
      [primeFilterSet, ...otherFilterSets].flatMap(item => {
        if (!item) return [];
        return [item.filterSet];
      }),
    [otherFilterSets, primeFilterSet]
  );

  const handleFilterSetCreate = useCallback(async () => {
    const { book, collection } = bookDetail;

    let collectionId = collection.id;

    console.log('collectionId', collectionId);

    if (collection.type !== 'db') {
      const collection = await createCollections({ isbn: book.isbn, status: BookStatusEnum.Unregistered });
      if (!collection) return;
      collectionId = collection.id;
    }
    console.log('collectionId', collectionId);
    void createFilterSet({
      name: book.title || '無名のフィルター',
      fetch: {
        title: book.title || '無名',
        publisher: book.publisher ?? '',
        creator: book.creator?.at(0) ?? '',
        usePublisher: true,
        useCreator: true,
      },
      collectionId,
      filters: [{ list: [{ keyword: '', sign: '*=' }], groupByType: 'volume' }],
    });
  }, [createCollections, createFilterSet, bookDetail]);

  const handleFilterSetEdit = useCallback(
    (id: string) => {
      navigate(`/search/${id}`);
    },
    [navigate]
  );

  const bookCardNavi = useMemo(() => <BookCardNavi bookDetail={bookDetail} />, [bookDetail]);
  const bookDetailView = useMemo(() => {
    console.log('render bookDetailView', bookDetails.length, !!filterSet, groupByType, searchConditionsSize.height);
    if (!filterSet) return null;
    return (
      <BookDetailView
        stickyTop={searchConditionsSize.height}
        setContentHeight={setContentHeight}
        {...{ scrollParentRef, bookDetails, filterSet, groupByType }}
      />
    );
  }, [bookDetails, filterSet, groupByType, searchConditionsSize.height]);

  return (
    <div className="flex flex-col w-full flex-1">
      <div className="flex flex-col gap-3 pt-3">
        <div className="bg-background">{bookCardNavi}</div>
        <div ref={searchConditionsRef} className="sticky top-0 z-[110] flex flex-col bg-background px-2 pt-2">
          <div className="text-xs">関連フィルター一覧</div>
          {!options ? <Spinner variant="bars" /> : null}
          <div className="flex flex-col gap-1 pt-1 pb-3">
            {filterSets.map(({ id, name }) => (
              <Button
                key={id}
                className="ml-4 box-border gap-1"
                variant="outline"
                onClick={() => handleFilterSetEdit(id)}
                disabled={!options}
              >
                <span className="flex-1 flex justify-start text-sm">{name}</span>
                <Pencil />
              </Button>
            ))}
          </div>
          {!primeFilterSet ? (
            <Button className="box-border h-8.5 gap-1" size="sm" onClick={handleFilterSetCreate} disabled={!options}>
              <ListFilterPlus />
              新規追加
            </Button>
          ) : null}
          <div className="flex items-center gap-1">
            <Checkbox
              id="use-group-by-volume"
              checked={groupByType === 'volume'}
              onCheckedChange={v => setGroupByType(v ? 'volume' : null)}
            />
            <Label htmlFor="use-group-by-volume">連載グルーピング</Label>
            <IconButton icon={MessageCircleQuestionMark} className="border-0" />
          </div>
        </div>

        {bookDetailView}
      </div>

      <div className="min-h-viewport-with-offset" style={minHeightStyle} />
    </div>
  );
}
