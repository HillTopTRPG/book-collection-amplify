import CollectionsList from '../CollectionsList';
import {useEffect, useState} from 'react';
import type {Schema} from '../../amplify/data/resource.ts';
import {generateClient} from 'aws-amplify/api';
import FilterUI, {FilterData} from '@/components/FilterUI.tsx';

const sortString = (a: string | null | undefined, b: string | null | undefined, sortOrder: 'asc' | 'desc') => {
  if (a === b) return 0;
  return ((a ?? '') > (b ?? '') ? 1 : -1) * (sortOrder === 'asc' ? 1 : -1);
};

const convertPubdate = (pubdate: string | null | undefined) => {
  if (!pubdate) return '';
  return (new Date(pubdate)).toLocaleDateString('sv-SE');
};

const userPoolClient = generateClient<Schema>({
  authMode: 'userPool'
});

const apiKeyClient = generateClient<Schema>({
  authMode: 'apiKey'
});

export default function CollectionPage() {
  const [collections, setCollections] = useState<Array<Schema['Collection']['type']>>([]);
  const [books, setBooks] = useState<Array<Schema['Book']['type']>>([]);
  const [filters, setFilters] = useState<FilterData[]>([]);

  useEffect(() => {
    userPoolClient.models.Collection.observeQuery().subscribe({
      next: (data) => setCollections([...data.items]),
    });
    apiKeyClient.models.Book.observeQuery().subscribe({
      next: (data) => setBooks([...data.items]),
    });
  }, []);

  const viewBooks = books
    .filter(book => {
      // 蔵書かどうか
      if (!collections.some(c => c.isbn === book.isbn)) return false;
      // フィルターにマッチするかどうか
      return filters
        .flatMap(filter => {
          if (!filter.value) return [true];
          switch (filter.type) {
            case 'title':
            case 'author':
            case 'publisher':
            case 'pubdate':
              return [book[filter.type]?.includes(filter.value) ?? false];
            default:
              return [true];
          }
        })
        .every(Boolean);
    })
    .sort((a, b) => {
      return filters.reduce((prev, filter) => {
        if (prev !== 0) return prev;
        if (filter.value) return prev;
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
      }, 0);
    });

  return (
    <div className="flex flex-col w-full flex-1 gap-2 p-3">
      <FilterUI books={books} list={filters} onChange={setFilters} />
      <CollectionsList books={viewBooks} />
    </div>
  );
}