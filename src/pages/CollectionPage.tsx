import CollectionsList from '../CollectionsList';
import {useEffect, useState} from 'react';
import type {Schema} from '../../amplify/data/resource.ts';
import {generateClient} from 'aws-amplify/api';
import FilterUI from '@/components/FilterUI.tsx';

const userPoolClient = generateClient<Schema>({
  authMode: 'userPool'
});

const apiKeyClient = generateClient<Schema>({
  authMode: 'apiKey'
});

export default function CollectionPage() {
  const [collections, setCollections] = useState<Array<Schema['Collection']['type']>>([]);
  const [books, setBooks] = useState<Array<Schema['Book']['type']>>([]);
  const [isAddSearch, setIsAddSearch] = useState(false);

  useEffect(() => {
    userPoolClient.models.Collection.observeQuery().subscribe({
      next: (data) => setCollections([...data.items]),
    });
    apiKeyClient.models.Book.observeQuery().subscribe({
      next: (data) => setBooks([...data.items]),
    });
  }, []);

  // 蔵書リスト
  const myBooks = books.filter(book => {
    return collections.some(c => c.isbn === book.isbn);
  });

  return (
    <div className="flex flex-col w-full flex-1 gap-2 p-3">
      <FilterUI books={books} {...{isAddSearch, setIsAddSearch}} />
      <CollectionsList myBooks={myBooks} isAddSearch={isAddSearch} />
    </div>
  );
}