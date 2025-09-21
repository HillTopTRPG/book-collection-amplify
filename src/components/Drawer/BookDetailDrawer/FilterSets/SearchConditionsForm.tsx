import { useMemo } from 'react';
import { isNil } from 'es-toolkit/compat';
import SearchConditionItem from '@/components/Drawer/BookDetailDrawer/FilterSets/SearchConditionItem.tsx';
import type { FilterSet } from '@/store/subscriptionDataSlice.ts';
import type { BookData, Isbn13 } from '@/types/book.ts';
import { getKeys } from '@/utils/type.ts';

const convert = (v: string | null | undefined) =>
  v
    ?.trim()
    .replace(/^[0-9()[\]a-zA-Z-.]+$/, '')
    .replace(/^[0-9[(. ]+/, '')
    .replace(/[0-9.)\] ]+$/, '')
    .trim() ?? '';

const setAllTag = (
  acc: string[],
  cur: BookData,
  property: keyof Pick<BookData, 'title' | 'volume' | 'volumeTitle' | 'edition'>
) => {
  const value = convert(cur[property]);
  if (value && !acc.some(v => v === value)) {
    acc.push(value);
  }
};

type Props = {
  isbn: Isbn13;
  filterSet: FilterSet | null;
  fetchedBooks: BookData[];
};

export default function SearchConditionsForm({ isbn, filterSet, fetchedBooks }: Props) {
  const options: string[] = useMemo(
    () =>
      fetchedBooks.reduce<string[]>((acc, cur) => {
        setAllTag(acc, cur, 'volume');
        setAllTag(acc, cur, 'volumeTitle');
        setAllTag(acc, cur, 'edition');
        if (cur.ndcLabels.length) {
          if (!acc.some(v => cur.ndcLabels.includes(v))) acc.push(...cur.ndcLabels);
        } else if (cur.ndc) {
          if (!acc.includes(cur.ndc)) acc.push(cur.ndc);
        }
        if (cur.seriesTitle) {
          acc.push(
            ...cur.seriesTitle
              .split(';')
              .flatMap(v => {
                const after = convert(v);

                return after ? [after] : [];
              })
              .filter((v, idx, self) => self.findIndex(s => s === v) === idx && !acc.includes(v))
          );
        }
        return acc;
      }, []),
    [fetchedBooks]
  );

  const anywhereList = useMemo(() => filterSet?.filters.at(0)?.map(({ anywhere }) => anywhere) ?? [], [filterSet]);

  const filteredResults = useMemo((): BookData[] => {
    if (!fetchedBooks?.length) return [];
    if (!anywhereList.length) return fetchedBooks;

    return fetchedBooks.filter(book =>
      anywhereList.filter(Boolean).every(anywhere =>
        getKeys(book).some(property => {
          const value = book[property];
          if (isNil(value)) return false;
          if (typeof value === 'string') {
            return value.includes(anywhere);
          }
          return value.some(v => v.includes(anywhere));
        })
      )
    );
  }, [anywhereList, fetchedBooks]);

  return (
    <div className="sticky top-0 flex z-50 items-start gap-2 bg-background">
      <div className="flex flex-col items-stretch flex-1 gap-1">
        {filterSet?.filters[0].map((_, idx) => (
          <SearchConditionItem
            key={idx}
            isbn={isbn}
            filterSetId={filterSet.id}
            filters={filterSet?.filters}
            options={options}
            idx1={0}
            idx2={idx}
          />
        ))}
      </div>
      <span className="h-9 flex items-center">{filteredResults?.length ?? 0}件</span>
    </div>
  );
}
