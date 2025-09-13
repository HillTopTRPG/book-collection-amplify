import { Fragment, useCallback, useEffect, useState } from 'react';

import BookCard from '@/components/BookCard';
import { Button } from '@/components/ui/button.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { selectFilterSet } from '@/store/filterSlice.ts';
import { useAppSelector } from '@/store/hooks.ts';
import { selectMyBooks } from '@/store/subscriptionDataSlice.ts';
import type { BookData } from '@/types/book.ts';
import type { RakutenApiOption } from '@/utils/fetch.ts';
import { fetchRakutenBooksApi } from '@/utils/fetch.ts';
import { convertPubdate, sortString } from '@/utils/primitive.ts';

type Props = {
  isAddSearch: boolean;
}

export default function CollectionsList({ isAddSearch }: Props) {
  const filterSet = useAppSelector(selectFilterSet);
  const myBooks = useAppSelector(selectMyBooks);
  const [searchResult, setSearchResult] = useState<BookData[]>([]);

  // フィルター済み蔵書リスト
  const filteredMyBooks = myBooks
    .filter(book =>
      filterSet
        ?.flatMap(filter => !filter.value ? [true] : [book[filter.type]?.includes(filter.value) ?? false])
        .every(Boolean)
    )
    .sort((a, b) => filterSet?.reduce((prev, filter) => {
      if (prev !== 0) return prev;
      switch (filter.type) {
        case 'title':
        case 'author':
        case 'publisher':
          return sortString(a[filter.type], b[filter.type], filter.sortOrder);
        case 'pubdate':
          return sortString(convertPubdate(a[filter.type]), convertPubdate(b[filter.type]), filter.sortOrder);
        default:
          return prev;
      }
    }, 0) ?? 0);

  const viewBooks = isAddSearch && searchResult
    ? [...searchResult, ...filteredMyBooks].filter((item, idx, self) => self.findIndex(s => s.isbn === item.isbn) === idx)
    : filteredMyBooks;

  useEffect(() => {
    if (!isAddSearch) {
      setSearchResult([]);
    }
  }, [isAddSearch]);

  const refreshSearch = useCallback(async () => {
    const request: RakutenApiOption = {};
    filterSet.forEach((filter) => {
      if (!filter.value) return;
      switch (filter.type) {
        case 'author':
          request.author = filter.value;
          break;
        case 'title':
          request.title = filter.value;
          break;
        case 'publisher':
          request.publisherName = filter.value;
          break;
        default:
      }
    });
    const pubdateFilter = filterSet.find(filter => filter.type === 'pubdate');
    request.sort = pubdateFilter?.sortOrder === 'desc' ? '-releaseDate' : '+releaseDate';
    const result = await fetchRakutenBooksApi(request);
    setSearchResult(result);
  }, [filterSet]);

  return (
    <div className="flex flex-col bg-background rounded-xl p-2 w-full flex-1 overflow-clip relative">
      {viewBooks.map((book, index) => (
        <Fragment key={index}>
          {index > 0 && <Separator className="my-1" />}
          <BookCard book={book} isNoHave={!myBooks.some(b => b.isbn === book.isbn)} />
        </Fragment>
      ))}
      {!viewBooks.length && '表示する書籍がありません。'}
      {isAddSearch && filterSet.some(filter => filter.value) ? <Button
        className="rounded-full fixed right-3 bottom-[5.5rem] z-40"
        onClick={refreshSearch}
      >未所持検索更新</Button> : null}
    </div>
  );
}
