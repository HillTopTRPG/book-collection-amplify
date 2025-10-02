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
import { selectAllBookDetails, selectAllFilterResults } from '@/store/ndlSearchSlice.ts';
import { BookStatusEnum } from '@/store/subscriptionDataSlice.ts';
import { makeNdlOptionsStringByNdlFullOptions } from '@/utils/data.ts';

const BOTTOM_NAVIGATION_HEIGHT = 65;

type Props = {
  bookDetail: BookDetail;
};

export default function BookDetailEdits({ bookDetail }: Props) {
  const dispatch = useAppDispatch();
  const allBookDetails = useAppSelector(selectAllBookDetails);
  const allFilterResults = useAppSelector(selectAllFilterResults);
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

  const primeFilterSet: { filterSet: FilterSet; books: BookDetail[] } | null = useMemo(
    () => allFilterResults?.find(({ filterSet }) => filterSet.collectionId === bookDetail.collection.id) ?? null,
    [allFilterResults, bookDetail.collection.id]
  );
  const otherFilterSets: { filterSet: FilterSet; books: BookDetail[] }[] = useMemo(
    () =>
      allFilterResults?.filter(
        ({ filterSet, books }) =>
          filterSet.collectionId !== bookDetail.collection.id &&
          books.some(({ book }) => book.isbn === bookDetail.book.isbn)
      ) ?? [],
    [allFilterResults, bookDetail.book.isbn, bookDetail.collection.id]
  );

  const [selectedFilterSet, setSelectedFilterSet] = useState<string | null>(
    primeFilterSet?.filterSet.id ?? otherFilterSets.at(0)?.filterSet.id ?? null
  );

  useEffect(() => {
    console.log(`'${selectedFilterSet}'`);
    if (selectedFilterSet) return;
    const primeFilterSetId = primeFilterSet?.filterSet.id;
    console.log(primeFilterSetId);
    if (primeFilterSetId) {
      setSelectedFilterSet(primeFilterSetId);
      return;
    }
    const otherFilterSetId = otherFilterSets.at(0)?.filterSet.id;
    console.log(otherFilterSetId);
    if (otherFilterSetId) setSelectedFilterSet(otherFilterSetId);
  }, [otherFilterSets, primeFilterSet?.filterSet.id, selectedFilterSet]);

  const filterSet = useMemo(() => {
    if (!selectedFilterSet) return null;
    if (primeFilterSet?.filterSet.id === selectedFilterSet) return primeFilterSet.filterSet;
    return otherFilterSets.find(({ filterSet }) => filterSet.id === selectedFilterSet)?.filterSet ?? null;
  }, [otherFilterSets, primeFilterSet?.filterSet, selectedFilterSet]);

  const stringifyFetchOptions = useMemo(
    () => (filterSet?.fetch ? makeNdlOptionsStringByNdlFullOptions(filterSet.fetch) : ''),
    [filterSet?.fetch]
  );

  const bookDetails: BookDetail[] = useMemo(() => {
    const result = stringifyFetchOptions in allBookDetails ? allBookDetails[stringifyFetchOptions] : [];
    if (typeof result === 'string') return [];
    return result;
  }, [allBookDetails, stringifyFetchOptions]);

  useEffect(() => {
    if (!stringifyFetchOptions) return;
    dispatch(enqueueNdlSearch({ type: 'priority', list: [stringifyFetchOptions] }));
  }, [dispatch, stringifyFetchOptions]);
  const navigate = useNavigate();
  const { createFilterSet, createCollections } = useAwsAccess();

  const options = useMemo((): Record<string, { label: ReactNode; disabled: boolean }> | null => {
    if (!allFilterResults) return null;
    return [primeFilterSet, ...otherFilterSets].reduce<Record<string, { label: ReactNode; disabled: boolean }>>(
      (acc, info) => {
        if (info) {
          acc[info.filterSet.id] = { label: info.filterSet.name, disabled: false };
        }
        return acc;
      },
      {}
    );
  }, [allFilterResults, otherFilterSets, primeFilterSet]);

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

  return (
    <div className="flex flex-col w-full flex-1">
      <div className="flex flex-col gap-3 pt-3">
        <div className="bg-background">
          <BookCardNavi bookDetail={bookDetail} />
        </div>
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

        {filterSet ? (
          <BookDetailView
            stickyTop={searchConditionsSize.height}
            setContentHeight={setContentHeight}
            {...{ scrollParentRef, bookDetails, filterSet, groupByType }}
          />
        ) : null}
      </div>

      <div className="min-h-viewport-with-offset" style={minHeightStyle} />
    </div>
  );
}
