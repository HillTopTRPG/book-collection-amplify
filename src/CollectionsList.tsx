import {Fragment, useState} from 'react';
import type {Schema} from '../amplify/data/resource.ts';
import {Separator} from '@/components/ui/separator.tsx';
import BookCard from '@/components/BookCard';
import ComboBox from '@/components/ComboBox.tsx';

const TabMap = {
  title: 'タイトル',
  author: '著者',
  publisher: '出版社',
  pubdate: '出版日',
  series: 'シリーズ',
} as const;

const sortString = (a: string | null | undefined, b: string | null | undefined, sortOrder: 'asc' | 'desc') => {
  if (a === b) return 0;
  return ((a ?? '') > (b ?? '') ? 1 : -1) * (sortOrder === 'asc' ? 1 : -1);
};

const convertPubdate = (pubdate: string | null | undefined) => {
  if (!pubdate) return '';
  return (new Date(pubdate)).toLocaleDateString('sv-SE');
};

type Props = {
  collections: Array<Schema['Collection']['type']>;
  books: Array<Schema['Book']['type']>
  tab: keyof typeof TabMap;
  sortOrder: 'asc' | 'desc';
}

export default function CollectionsList({ collections, books, tab, sortOrder }: Props) {
  const [comboBoxValue, setComboBoxValue] = useState('');

  const bookCollections = books.filter(book => collections.some(c => c.isbn === book.isbn)).sort((a, b) => {
    switch (tab) {
      case 'title':
      case 'author':
      case 'publisher':
        return sortString(a[tab], b[tab], sortOrder);
      case 'pubdate':
        return sortString(convertPubdate(a[tab]), convertPubdate(b[tab]), sortOrder);
    }
    return 0;
  });

  const comboBoxList = bookCollections
    .flatMap(book => {
      switch (tab) {
        case 'title':
        case 'author':
        case 'publisher':
        case 'pubdate':
          return book[tab]?.split(',');
        case 'series':
          return [book.title];
      }
    })
    .filter((value, index, self): value is string => Boolean(value) && (self.findIndex(v => v === value) === index))
    .map(value => ({ label: value, value }));

  const viewBooks = bookCollections.filter(book => {
    if (!comboBoxValue) return true;
    switch (tab) {
      case 'title':
      case 'author':
      case 'publisher':
      case 'pubdate':
        return book[tab]?.includes(comboBoxValue) ?? false;
      case 'series':
        return book.title === comboBoxValue;
    }
  });

  return (
    <Fragment>
      <ComboBox label={TabMap[tab]} list={comboBoxList} value={comboBoxValue} setValue={setComboBoxValue} />
      {viewBooks.map((book, index) => (
        <Fragment key={book.isbn}>
          {index > 0 && <Separator className="my-2" />}
          <BookCard book={book} />
        </Fragment>
      ))}
      {!bookCollections.length && '蔵書はまだありません。'}
    </Fragment>
  );
}
