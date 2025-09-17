import { useMemo } from 'react';

import type { SearchTags } from '@/components/Drawer/BookDetailDrawer/DrawerContent.tsx';
import SearchTag from '@/components/Drawer/BookDetailDrawer/SearchTag.tsx';
import type { NdlResponse } from '@/utils/fetch.ts';
import { getKeys } from '@/utils/type.ts';

const convert = (v: string | null) => v?.trim().replace(/^[0-9()[\]a-zA-Z-.]+$/, '').replace(/^[([0-9]+/, '').replace(/[0-9)\]]+$/, '').trim() ?? '';

const setAllTag = (acc: SearchTags, cur: NdlResponse, property: keyof Pick<NdlResponse, 'title' | 'volume' | 'volumeTitle' | 'edition'>) => {
  const value = convert(cur[property]);
  if (value) {
    if (!acc[property]) acc[property] = [];
    if (!acc[property].some(v => v === value)) acc[property].push(value);
  }
};

type Props = {
  ndlResponse: NdlResponse[];
  searchTags: SearchTags;
  switchSearchTags: (type: keyof SearchTags, value: string) => void;
}

export default function SearchTagsSelect({ ndlResponse, switchSearchTags, searchTags }: Props) {
  const allTags: SearchTags = useMemo(() => ndlResponse.reduce<Record<string, string[]>>((acc, cur) => {
    setAllTag(acc, cur, 'volume');
    setAllTag(acc, cur, 'volumeTitle');
    setAllTag(acc, cur, 'edition');
    if (cur.seriesTitle) {
      if (!acc.seriesTitle) acc.seriesTitle = [];
      acc.seriesTitle.push(...cur.seriesTitle
        .split(';')
        .flatMap((v) => {
          const after = convert(v);

          return after ? [after] : [];
        })
        .filter((v, idx, self) => self.findIndex(s => s === v) === idx && !acc.seriesTitle.includes(v)));
    }
    return acc;
  }, {}), [ndlResponse]);

  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1">
      { getKeys(allTags).flatMap(tagType => allTags[tagType]?.map(value => (
        <SearchTag
          key={`${tagType}-${value}`}
          onClick={() => switchSearchTags(tagType, value)}
          {...{ tagType, value, searchTags }}
        />
      )) ?? []) }
    </div>
  );
}
