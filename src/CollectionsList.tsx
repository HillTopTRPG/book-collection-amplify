import {Fragment, useEffect, useState} from 'react';
import type {Schema} from '../amplify/data/resource.ts';
import {generateClient} from 'aws-amplify/data';
import {ScrollArea} from '@radix-ui/react-scroll-area';
import {Separator} from '@/components/ui/separator.tsx';
import BookCard from '@/components/BookCard';

const userPoolClient = generateClient<Schema>({
  authMode: 'userPool'
});

const apiKeyClient = generateClient<Schema>({
  authMode: 'apiKey'
});

export default function CollectionsList() {
  const [collection, setCollection] = useState<Array<Schema['Collection']['type']>>([]);
  const [books, setBooks] = useState<Array<Schema['Book']['type']>>([]);

  const bookCollections = books.filter(book => collection.some(c => c.isbn === book.isbn));

  useEffect(() => {
    userPoolClient.models.Collection.observeQuery().subscribe({
      next: (data) => setCollection([...data.items]),
    });
    apiKeyClient.models.Book.observeQuery().subscribe({
      next: (data) => setBooks([...data.items]),
    });
  }, []);

  return (
    <div className="flex flex-col flex-1 gap-3 w-full bg-background rounded-lg shadow-lg p-4">
      <ScrollArea className="w-full rounded-md">
        <div className="p-1">
          {bookCollections.map((book, index) => (
            <Fragment key={book.isbn}>
              {index > 0 && <Separator className="my-2" />}
              <BookCard book={book} />
            </Fragment>
          ))}
          {bookCollections.map((book, index) => (
            <Fragment key={book.isbn}>
              {index > 0 && <Separator className="my-2" />}
              <BookCard book={book} />
            </Fragment>
          ))}
          {!bookCollections.length && '蔵書はまだありません。'}
        </div>
      </ScrollArea>
    </div>
  );
}
