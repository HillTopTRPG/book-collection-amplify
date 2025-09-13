import { useCallback } from 'react';

import { generateClient } from 'aws-amplify/data';
import { CircleChevronLeft, Trash } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';

import { Button } from '@/components/ui/button';
import { useDrawerAnimation } from '@/hooks/useDrawerAnimation';
import { closeDrawer, selectSelectedBook } from '@/store/bookDetailSlice';
import { selectBooks, selectCollections } from '@/store/subscriptionDataSlice.ts';

import type { Schema } from '$/amplify/data/resource.ts';

const userPoolClient = generateClient<Schema>({
  authMode: 'userPool'
});

const apiKeyClient = generateClient<Schema>({
  authMode: 'apiKey'
});

export default function BookDetailDrawer() {
  const dispatch = useDispatch();
  const book = useSelector(selectSelectedBook);
  const books = useSelector(selectBooks);
  const collections = useSelector(selectCollections);

  const onClose = useCallback(() => {
    dispatch(closeDrawer());
  }, [dispatch]);

  const handleDelete = useCallback(() => {
    if (!book) return;
    const b = books.find(c => c.isbn === book.isbn);
    const collection = collections.find(c => c.isbn === book.isbn);
    if (!collection || !b) {
      return;
    }
    apiKeyClient.models.Book.delete({ id: b.id });
    userPoolClient.models.Collection.delete({ id: collection.id });
  }, [book, books, collections]);

  const {
    shouldRender,
    handleClose,
    overlayClassName,
    drawerClassName
  } = useDrawerAnimation({
    isOpen: !!book,
    onClose,
    animationDuration: 300
  });

  if (!book || !shouldRender) return null;

  const drawerContent = (
    <>
      <div className={overlayClassName} onClick={handleClose} />
      <div className={drawerClassName}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="border-b p-4">
            <Button onClick={handleClose} size="icon" variant="ghost" className="size-8">
              <CircleChevronLeft />
            </Button>
            <h2 className="text-lg font-semibold leading-none tracking-tight text-left">
              {book.title}
            </h2>
            {book.subtitle ? (
              <p className="text-sm text-muted-foreground text-left mt-1">
                {book.subtitle}
              </p>
            ) : null}
            <Button onClick={handleDelete} size="icon" variant="ghost" className="size-8">
              <Trash />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-6">
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
            </div>
          </div>

          {/* Footer */}
          <div className="border-t p-4">
            <Button variant="outline" onClick={handleClose} className="w-full">
              閉じる
            </Button>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(drawerContent, document.body);
}