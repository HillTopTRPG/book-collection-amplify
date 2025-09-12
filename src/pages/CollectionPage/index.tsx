import { useState } from 'react';

import FilterUI from '@/components/FilterUI';
import { useAppSelector } from '@/store/hooks.ts';
import { selectBooks, selectCollections } from '@/store/subscriptionDataSlice.ts';

import CollectionsList from './CollectionsList';

export default function CollectionPage() {
  const collections = useAppSelector(selectCollections);
  const books = useAppSelector(selectBooks);
  const [isAddSearch, setIsAddSearch] = useState(false);

  // 蔵書リスト
  const myBooks = books.filter(book => collections.some(c => c.isbn === book.isbn));

  return (
    <div className="flex flex-col w-full flex-1 gap-2 p-3">
      <FilterUI books={books} {...{ isAddSearch, setIsAddSearch }} />
      <CollectionsList myBooks={myBooks} isAddSearch={isAddSearch} />
    </div>
  );
}