import { useMemo } from 'react';

import ComboInput from '@/components/ComboInput.tsx';
import type { NdlResponse } from '@/utils/fetch.ts';

const convert = (v: string | null) => v?.trim().replace(/^[0-9()[\]a-zA-Z-.]+$/, '').replace(/^[0-9[(. ]+/, '').replace(/[0-9.)\] ]+$/, '').trim() ?? '';

const setAllTag = (acc: string[], cur: NdlResponse, property: keyof Pick<NdlResponse, 'title' | 'volume' | 'volumeTitle' | 'edition'>) => {
  const value = convert(cur[property]);
  if (value && !acc.some(v => v === value)) {
    acc.push(value);
  }
};

type Props = {
  ndlResponse: NdlResponse[];
  anywhere: string;
  setAnywhere: (value: string) => void;
}

export default function SearchConditionsForm({ ndlResponse, anywhere, setAnywhere }: Props) {
  const options: string[] = useMemo(() => ndlResponse.reduce<string[]>((acc, cur) => {
    setAllTag(acc, cur, 'volume');
    setAllTag(acc, cur, 'volumeTitle');
    setAllTag(acc, cur, 'edition');
    if (cur.ndc && !acc.includes(cur.ndc)) {
      acc.push(cur.ndc);
    }
    if (cur.seriesTitle) {
      acc.push(...cur.seriesTitle
        .split(';')
        .flatMap((v) => {
          const after = convert(v);

          return after ? [after] : [];
        })
        .filter((v, idx, self) => self.findIndex(s => s === v) === idx && !acc.includes(v)));
    }
    return acc;
  }, []), [ndlResponse]);

  return (
    <ComboInput label="キーワード検索" list={options.map(o => ({ label: o, value: o }))} value={anywhere} setValue={setAnywhere} />
  );
}
