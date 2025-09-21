import { useMemo } from 'react';
import { useDispatch } from 'react-redux';
import ComboInput from '@/components/ComboInput.tsx';
import type { ScannedItemMapValue } from '@/store/scannerSlice.ts';
import { updateFetchedFilterAnywhere } from '@/store/scannerSlice.ts';
import type { BookData } from '@/types/book.ts';
import type { PickRequired } from '@/utils/type.ts';

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
  scannedItemMapValue: PickRequired<ScannedItemMapValue, 'bookDetail'>;
  fetchedResults: BookData[];
};

export default function SearchConditionsForm({ scannedItemMapValue, fetchedResults }: Props) {
  const dispatch = useDispatch();

  const options: string[] = useMemo(
    () =>
      fetchedResults.reduce<string[]>((acc, cur) => {
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
    [fetchedResults]
  );

  const anywhere = useMemo(
    () => scannedItemMapValue.filterSets.at(0)?.filters.at(0)?.at(0)?.anywhere,
    [scannedItemMapValue]
  );

  const filteredResults = useMemo((): BookData[] => {
    if (!fetchedResults?.length) return [];
    if (!anywhere) return fetchedResults;

    return fetchedResults.filter(book => JSON.stringify(book).includes(anywhere));
  }, [anywhere, fetchedResults]);

  const condition = scannedItemMapValue.filterSets.at(0)?.filters.at(0)?.at(0);
  const updateAnywhere = (anywhere: string) => {
    dispatch(updateFetchedFilterAnywhere({ key: scannedItemMapValue.isbn, index: 0, anywhere }));
  };

  return (
    <div className="sticky top-0 flex z-50 items-center gap-2 bg-background">
      <ComboInput
        label="キーワード検索"
        list={options.map(o => ({ label: o, value: o }))}
        value={condition?.anywhere || ''}
        setValue={updateAnywhere}
      />
      <span>{filteredResults?.length ?? 0}件</span>
    </div>
  );
}
