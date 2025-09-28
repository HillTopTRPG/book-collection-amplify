import type { SelectBoxOption } from '@/components/SelectBox.tsx';
import type { FilterSet, Sign } from '@/store/subscriptionDataSlice.ts';
import type { BookData, Isbn13 } from '@/types/book.ts';
import { useMemo } from 'react';
import ComboInput from '@/components/ComboInput.tsx';
import SelectBox from '@/components/SelectBox.tsx';
import { useAppDispatch, useAppSelector } from '@/store/hooks.ts';
import { selectFetchedAllBooks } from '@/store/ndlSearchSlice.ts';
import { updateFetchedFilterAnywhere } from '@/store/scannerSlice.ts';
import { removeNumberText, unique } from '@/utils/primitive.ts';
import { getKeys } from '@/utils/type.ts';

const SIGN_LABELS: Record<Sign, string> = {
  ['==']: '一致',
  ['*=']: '含む',
  ['!=']: '不一致',
  ['!*']: '除く',
} as const;

const setAllTag = <Property extends keyof Pick<BookData, 'title' | 'volume' | 'volumeTitle' | 'edition'>>(
  obj: Record<Property, string[]>,
  book: BookData,
  property: Property
) => {
  const value = removeNumberText(book[property]);
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

const setKeywords = (obj: KeywordInfo, book: BookData) => {
  setAllTag(obj, book, 'volume');
  setAllTag(obj, book, 'volumeTitle');
  setAllTag(obj, book, 'edition');
  if (book.seriesTitle) {
    obj.seriesTitle.push(
      ...unique(
        book.seriesTitle.split(';').flatMap(v => {
          const after = removeNumberText(v);
          if (!after || obj.seriesTitle.includes(after)) return [];

          return [after];
        })
      )
    );
  }
  obj.ndcLabels.push(...book.ndcLabels.filter(ndcLabel => !obj.ndcLabels.includes(ndcLabel)));
  if (book.ndc && !obj.ndc.includes(book.ndc)) obj.ndc.push(book.ndc);
  return obj;
};

type Props = {
  isbn: Isbn13;
  filterSet: FilterSet;
  orIndex: number;
  andIndex: number;
  fetchedBooks: BookData[];
};

export default function SearchConditionItem({ isbn, filterSet, orIndex, andIndex, fetchedBooks }: Props) {
  const dispatch = useAppDispatch();
  const allBooks = useAppSelector(selectFetchedAllBooks);

  const primaryBook = allBooks.find(book => book.isbn === filterSet.primary) ?? null;
  const condition = filterSet.filters[orIndex].list[andIndex];

  const isPrimeFirst = !orIndex && !andIndex;

  const selectOptions: Record<Sign, SelectBoxOption> = {
    '==': { label: SIGN_LABELS['=='], disabled: false },
    '*=': { label: SIGN_LABELS['*='], disabled: false },
    '!=': { label: SIGN_LABELS['!='], disabled: isPrimeFirst },
    '!*': { label: SIGN_LABELS['!*'], disabled: isPrimeFirst },
  };

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

      if (primaryBook && isPrimeFirst) {
        return setKeywords(obj, primaryBook);
      }

      return fetchedBooks.reduce<KeywordInfo>(setKeywords, obj);
    })();

    return unique(
      getKeys(obj).reduce<string[]>((acc, cur) => {
        acc.push(...obj[cur]);
        return acc;
      }, [])
    );
  }, [fetchedBooks, isPrimeFirst, primaryBook]);

  const updateSign = (sign: Sign) => {
    const newFilters = structuredClone(filterSet.filters);
    newFilters[orIndex].list[andIndex].sign = sign;
    dispatch(updateFetchedFilterAnywhere({ key: isbn, filterSetId: filterSet.id, filters: newFilters }));
  };

  const updateAnywhere = (keyword: string) => {
    const newFilters = structuredClone(filterSet.filters);

    // ANDブロックのための処理
    if (!keyword && andIndex < newFilters[orIndex].list.length - 1) {
      const res = newFilters[orIndex].list.splice(andIndex, 1);
      if (!newFilters[orIndex].list[andIndex].keyword.trim()) {
        newFilters[orIndex].list[andIndex].sign = res[0].sign;
      }
    } else {
      if (keyword && andIndex === newFilters[orIndex].list.length - 1) {
        newFilters[orIndex].list.push({ keyword: '', sign: '*=' });
      }
      newFilters[orIndex].list[andIndex].keyword = keyword.trim();
    }

    if (orIndex === 0) {
      // プライマリブロックのための処理
      if (newFilters.length === 1 && newFilters[orIndex].list[0]) {
        newFilters.push({ list: [{ keyword: '', sign: '*=' }], grouping: 'date' });
      }
    } else {
      // ORブロックのための処理
      if (orIndex < newFilters.length - 1 && !newFilters[orIndex].list[0]) {
        newFilters.splice(orIndex, 1);
      } else {
        if (orIndex === newFilters.length - 1 && newFilters[orIndex].list[0]) {
          newFilters.push({ list: [{ keyword: '', sign: '*=' }], grouping: 'date' });
        }
      }
    }
    dispatch(updateFetchedFilterAnywhere({ key: isbn, filterSetId: filterSet.id, filters: newFilters }));
  };

  return (
    <div className="flex items-center">
      <div className="text-xs min-w-[2rem] text-right pr-1">{andIndex ? 'AND' : ''}</div>
      <ComboInput
        label="キーワード検索"
        className="flex-1"
        list={options.map(o => ({ label: o, value: o }))}
        value={condition?.keyword || ''}
        setValue={updateAnywhere}
      />
      <SelectBox
        options={selectOptions}
        value={condition?.sign || '*='}
        onChange={updateSign}
        className="w-[5rem] text-xs"
      />
    </div>
  );
}
