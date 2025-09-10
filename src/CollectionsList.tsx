import {Fragment} from 'react';
import type {Schema} from '../amplify/data/resource.ts';
import {Separator} from '@/components/ui/separator.tsx';
import BookCard from '@/components/BookCard';

type Props = {
  books: Array<Schema['Book']['type']>;
}

export default function CollectionsList({ books }: Props) {
  return (
    <div className="flex flex-col bg-background rounded-xl p-2 w-full flex-1 overflow-clip">
      {books.map((book, index) => (
        <Fragment key={book.isbn}>
          {index > 0 && <Separator className="my-1" />}
          <BookCard book={book} />
        </Fragment>
      ))}
      {!books.length && '蔵書はまだありません。'}
    </div>
  );
}
