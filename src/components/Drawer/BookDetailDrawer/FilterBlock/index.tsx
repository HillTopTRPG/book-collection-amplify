import { Fragment, useCallback, useMemo } from 'react';
import NdlCardList from '@/components/Drawer/BookDetailDrawer/FilterBlock/NdlCardList.tsx';
import SearchConditionItem from '@/components/Drawer/BookDetailDrawer/FilterBlock/SearchConditionItem.tsx';
import { Checkbox } from '@/components/ui/checkbox.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import useDOMSize from '@/hooks/useDOMSize.ts';
import { useAppDispatch } from '@/store/hooks.ts';
import { updateFetchedFilterAnywhere } from '@/store/scannerSlice.ts';
import type { FilterSet } from '@/store/subscriptionDataSlice.ts';
import type { BookData, Isbn13 } from '@/types/book.ts';
import { getFilteredItems, grouping } from '@/utils/data.ts';

type Props = {
  isbn: Isbn13;
  filterSet: FilterSet;
  orIndex: number;
  fetchedBooks: BookData[];
  selectedIsbn: string | null;
  setSelectedIsbn: (isbn: string | null) => void;
  setDetailIsbn: (isbn: string | null) => void;
};

export default function FilterBlock({
  isbn,
  filterSet,
  orIndex,
  fetchedBooks,
  selectedIsbn,
  setSelectedIsbn,
  setDetailIsbn,
}: Props) {
  const dispatch = useAppDispatch();
  const { ref, size } = useDOMSize();
  const filteredResults = useMemo(
    (): BookData[] => getFilteredItems(fetchedBooks, filterSet, orIndex),
    [fetchedBooks, filterSet, orIndex]
  );

  const updateGroupingType = useCallback(
    (value: boolean) => {
      const newFilters = structuredClone(filterSet.filters);
      newFilters[orIndex].grouping = value ? 'date' : null;
      dispatch(updateFetchedFilterAnywhere({ key: isbn, filterSetId: filterSet.id, filters: newFilters }));
    },
    [dispatch, filterSet.filters, filterSet.id, isbn, orIndex]
  );

  const groupedBooks = useMemo(() => grouping(filteredResults), [filteredResults]);

  return (
    <>
      <Separator />

      {/* 検索条件入力欄 */}
      <div
        ref={ref}
        className="sticky top-0 flex flex-col z-50 items-stretch gap-1 bg-background py-1 px-2 border-b shadow-md"
      >
        <div className="text-sm min-w-[4rem] flex items-center justify-between">
          <span>{!orIndex ? '必須条件' : `OR条件${orIndex}`}</span>
          <span>{filteredResults.length}件</span>
          <div className="flex items-center gap-1">
            <Checkbox
              id="terms"
              checked={filterSet.filters[orIndex].grouping === 'date'}
              onCheckedChange={updateGroupingType}
            />
            <Label htmlFor="terms">連載グルーピング</Label>
          </div>
        </div>
        {fetchedBooks?.length
          ? filterSet.filters[orIndex].list.map((_, andIndex) => (
              <SearchConditionItem key={andIndex} {...{ isbn, filterSet, orIndex, fetchedBooks, andIndex }} />
            ))
          : null}
      </div>

      {/* 書籍一覧 */}
      <div>
        {!filterSet.filters[orIndex].grouping ? (
          <NdlCardList
            books={filteredResults}
            {...{ filterSet, orIndex, selectedIsbn, setSelectedIsbn, setDetailIsbn }}
          />
        ) : (
          groupedBooks.map(({ list, next, first }, idx) => (
            <Fragment key={idx}>
              {idx ? <Separator /> : null}
              <div className="sticky z-[100] dark:bg-green-800 px-2 py-1" style={{ top: size.height }}>
                {idx === groupedBooks.length - 1
                  ? 'グループなし'
                  : `group${idx + 1} (${first}~${next - 1}) ${list.length}件`}
              </div>
              <div className="flex">
                <div className="dark:bg-green-800 w-4"></div>
                <div className="flex flex-col flex-1">
                  <NdlCardList books={list} {...{ filterSet, orIndex, selectedIsbn, setSelectedIsbn, setDetailIsbn }} />
                  <div className="px-2 py-1">{list.length}件</div>
                </div>
              </div>
            </Fragment>
          ))
        )}
      </div>

      {/* 最後のブロックなら下に余白を入れる */}
      {orIndex === filterSet.filters.length - 1 ? (
        <div style={{ minHeight: filteredResults.length ? '2rem' : 'calc(100vh - 7rem + 2px)' }}></div>
      ) : null}
    </>
  );
}
