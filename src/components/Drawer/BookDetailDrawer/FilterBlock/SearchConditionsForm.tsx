import { useMemo } from 'react';
import { selectFetchedAllBooks } from '@/store/fetchNdlSearchSlice.ts';
import { useAppSelector } from '@/store/hooks.ts';
import type { FilterSet } from '@/store/subscriptionDataSlice.ts';
import type { BookData, Isbn13 } from '@/types/book.ts';
import { getFilteredItems } from '@/utils/data.ts';
import { unique } from '@/utils/primitive.ts';
import { getKeys } from '@/utils/type.ts';
import SearchConditionItem from './SearchConditionItem.tsx';

const convert = (v: string | null | undefined) =>
  v
    ?.trim()
    .replace(/^[0-9()[\]a-zA-Z-.]+$/, '')
    .replace(/^[0-9[(. ]+/, '')
    .replace(/[0-9.)\] ]+$/, '')
    .trim() ?? '';

const setAllTag = <Property extends keyof Pick<BookData, 'title' | 'volume' | 'volumeTitle' | 'edition'>>(
  obj: Record<Property, string[]>,
  book: BookData,
  property: Property
) => {
  const value = convert(book[property]);
  if (value && !obj[property].includes(value)) {
    obj[property].push(value);
  }
};

type KeywordInfo = {
  volume: string[];
  volumeTitle: string[];
  edition: string[];
  ndcLabels: string[];
  ndc: string[];
  seriesTitle: string[];
};

type Props = {
  isbn: Isbn13;
  filterSet: FilterSet;
  filterIndex: number;
  fetchedBooks: BookData[];
};

const setKeywords = (obj: KeywordInfo, cur: BookData) => {
  setAllTag(obj, cur, 'volume');
  setAllTag(obj, cur, 'volumeTitle');
  setAllTag(obj, cur, 'edition');
  if (cur.seriesTitle) {
    obj.seriesTitle.push(
      ...unique(
        cur.seriesTitle.split(';').flatMap(v => {
          const after = convert(v);
          if (!after || obj.seriesTitle.includes(after)) return [];

          return [after];
        })
      )
    );
  }
  obj.ndcLabels.push(...cur.ndcLabels.filter(ndcLabel => !obj.ndcLabels.includes(ndcLabel)));
  if (cur.ndc && !obj.ndc.includes(cur.ndc)) obj.ndc.push(cur.ndc);
};

export default function SearchConditionsForm({ isbn, filterSet, filterIndex, fetchedBooks }: Props) {
  const allBooks = useAppSelector(selectFetchedAllBooks);

  const primaryBook = allBooks.find(book => book.isbn === filterSet.primary) ?? null;

  const options: string[] = useMemo(() => {
    const obj: KeywordInfo = (() => {
      const obj = {
        seriesTitle: [],
        volume: [],
        volumeTitle: [],
        edition: [],
        ndcLabels: [],
        ndc: [],
      };

      if (!filterIndex && primaryBook) {
        setKeywords(obj, primaryBook);
        return obj;
      }

      return fetchedBooks.reduce<KeywordInfo>((acc, cur) => {
        setKeywords(acc, cur);
        return acc;
      }, obj);
    })();

    return unique(
      getKeys(obj).reduce<string[]>((acc, cur) => {
        acc.push(...obj[cur]);
        return acc;
      }, [])
    );
  }, [fetchedBooks, filterIndex, primaryBook]);

  const anywhereList = useMemo(
    () => filterSet?.filters[filterIndex].flatMap(({ anywhere }) => (anywhere.trim() ? [anywhere.trim()] : [])) ?? [],
    [filterIndex, filterSet?.filters]
  );

  const filteredResults = useMemo(
    (): BookData[] => getFilteredItems(fetchedBooks, anywhereList, !filterIndex),
    [fetchedBooks, anywhereList, filterIndex]
  );

  return (
    <div className="sticky top-0 flex z-50 items-end gap-2 bg-background py-1 px-2 border-b shadow-md">
      <div className="flex flex-col items-stretch flex-1 gap-1">
        {filterSet.filters[filterIndex].map((_, idx) => (
          <SearchConditionItem
            key={idx}
            isbn={isbn}
            filterSetId={filterSet.id}
            filters={filterSet?.filters}
            options={options}
            idx1={filterIndex}
            idx2={idx}
          />
        ))}
      </div>
      <span className="h-9 flex items-center">{filteredResults.length}件</span>
    </div>
  );
}
