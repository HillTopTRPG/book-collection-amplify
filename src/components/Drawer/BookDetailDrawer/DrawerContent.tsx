import { Fragment } from 'react';

import type { BookData } from '@/types/book.ts';

type Props = {
  book: BookData;
};

export default function DrawerContent({ book }: Props) {
  return (
    <Fragment>
      <div className="flex justify-center">
        <img
          src={book.cover || `https://ndlsearch.ndl.go.jp/thumbnail/${book.isbn}.jpg`}
          alt="書籍の表紙"
          className="w-32 h-48 rounded border object-cover shadow-md"
        />
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="font-medium text-sm text-gray-600 dark:text-gray-400 mb-1">著者</h4>
          <p className="text-sm">{book.author || '不明'}</p>
        </div>

        <div>
          <h4 className="font-medium text-sm text-gray-600 dark:text-gray-400 mb-1">出版社</h4>
          <p className="text-sm">{book.publisher || '不明'}</p>
        </div>

        <div>
          <h4 className="font-medium text-sm text-gray-600 dark:text-gray-400 mb-1">出版日</h4>
          <p className="text-sm">{book.pubdate || '不明'}</p>
        </div>

        <div>
          <h4 className="font-medium text-sm text-gray-600 dark:text-gray-400 mb-1">ISBN</h4>
          <p className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
            {book.isbn}
          </p>
        </div>
      </div>
    </Fragment>
  );
}
