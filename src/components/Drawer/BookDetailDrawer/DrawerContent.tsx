import { Fragment, useCallback, useEffect, useRef, useState } from 'react';

import BookCard from '@/components/Card/BookCard.tsx';
import NdlCard from '@/components/Card/NdlCard';
import NdlOptionsForm from '@/components/Drawer/BookDetailDrawer/NdlOptionsForm.tsx';
import SearchTagsSelect from '@/components/Drawer/BookDetailDrawer/SearchTagsSelect.tsx';
import type { BookData } from '@/types/book.ts';
import type { NdlOptions, NdlResponse } from '@/utils/fetch.ts';
import { fetchNdlSearch } from '@/utils/fetch.ts';
import { getKeys } from '@/utils/type.ts';

export type SearchTags = {
  title?: string[];
  edition?: string[];
  seriesTitle?: string[];
  volume?: string[];
  volumeTitle?: string[];
};

const getResultByTags = (ndlResponse: NdlResponse[] | null, tags: SearchTags): Partial<NdlResponse>[] => ndlResponse?.filter(r => {
  const tagTypes = getKeys(tags);

  return tagTypes.every(tagType => {
    const resultValue = r[tagType];
    if (!resultValue) return false;
    switch (tagType) {
      case 'title':
        return tags[tagType]?.some(tv => resultValue?.includes(tv));
      case 'edition':
      case 'volume':
      case 'volumeTitle':
        return tags[tagType]?.some(tv => resultValue.includes(tv));
      case 'seriesTitle':
        return (r.seriesTitle?.split(';').map(v => v.trim()) ?? []).some(rv => tags[tagType]?.some(v => rv.includes(v)));
    }
  });
}) ?? [];

type Props = {
  book: BookData;
};

export default function DrawerContent({ book }: Props) {
  const [initState, setInitState] = useState<'yet' | 'ready' | 'done'>('yet');
  const [ndlResponse, setNdlResponse] = useState<NdlResponse[]>([]);
  const [ndlOptions, setNdlOptions] = useState<NdlOptions>({});
  const [searchTags, setSearchTags] = useState<SearchTags>({});
  const [filteredNdl, setFilteredNdl] = useState<Partial<NdlResponse>[]>([]);
  const bufferNdlResult = useRef<NdlResponse | null>(null);

  const switchSearchTags = useCallback((tagType: keyof SearchTags, value: string) => {
    const next = structuredClone(searchTags);
    const idx = next[tagType]?.findIndex(v => v === value) ?? -1;
    if (idx < 0) {
      if (!next[tagType]) next[tagType] = [];
      next[tagType].push(value);
    } else {
      next[tagType]?.splice(idx, 1);
      if (!next[tagType]?.length) delete next[tagType];
    }
    setSearchTags(next);
  }, [searchTags]);

  // book が変わるたびに APIの条件をリセット
  useEffect(() => {
    fetchNdlSearch({ isbn: book.isbn }).then(results => {
      const result = results.find(result => result.isbn?.replaceAll('-', '') === book.isbn);
      if (!result) return;
      bufferNdlResult.current = result;
      setNdlOptions({
        title: result.title || undefined,
        creator: result.creator.at(0) || undefined,
        publisher: result.publisher || undefined,
      });
      if (initState === 'yet') {
        setInitState(('ready'));
      }
    });
  }, [book.isbn, initState]);

  useEffect(() => {
    if (!ndlOptions.title) return;
    fetchNdlSearch(ndlOptions).then(results => {
      // 検索完了 -> 候補を表示させる
      setNdlResponse(results);
    });
  }, [initState, ndlOptions]);

  // APIを叩き終わったり、検索条件が変わったら表示する内容を反映する
  useEffect(() => {
    const filteredNdl = getResultByTags(ndlResponse, searchTags);

    setFilteredNdl(filteredNdl);
  }, [ndlResponse, searchTags]);

  return (
    <Fragment>
      <div className="flex justify-center">
        <BookCard bookDetail={{ book, isWant: false, isHave: false }} />
      </div>
      {initState === 'ready' ? (
        <>
          <NdlOptionsForm
            defaultValues={{
              title: ndlOptions.title ?? '',
              useCreator: Boolean(ndlOptions.creator),
              usePublisher: Boolean(ndlOptions.publisher)
            }}
            onChange={(values) => {
              setNdlOptions({
                title: values.title,
                publisher: values.usePublisher ? bufferNdlResult.current?.publisher || undefined : undefined,
                creator: values.useCreator ? bufferNdlResult.current?.creator.at(0) || undefined : undefined,
              });
            }}
          />
          <SearchTagsSelect {...{ ndlResponse, searchTags, switchSearchTags }} />
        </>
      ) : null}
      <div className="flex flex-col justify-center">
        {filteredNdl.map((ndl, idx) => <NdlCard ndl={ndl} options={ndlOptions} key={idx} />)}
      </div>
    </Fragment>
  );
}
