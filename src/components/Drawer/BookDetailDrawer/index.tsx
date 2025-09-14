import { useCallback, useEffect, useState } from 'react';

import { generateClient } from 'aws-amplify/data';
import { CircleChevronLeft, Trash } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';

import DrawerFrame from '@/components/Drawer/DrawerFrame.tsx';
import { Button } from '@/components/ui/button';
import { useDrawerAnimation } from '@/hooks/useDrawerAnimation';
import { closeDrawer, selectSelectedBook } from '@/store/bookDetailDrawerSlice.ts';
import { selectBooks, selectCollections } from '@/store/subscriptionDataSlice.ts';
import type { BookData } from '@/types/book.ts';

import DrawerContent from './DrawerContent.tsx';

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

  const onDeleteBook = useCallback(() => {
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
    isVisible,
    shouldRender,
    handleClose,
  } = useDrawerAnimation({
    isOpen: Boolean(book),
    onClose: () => { dispatch(closeDrawer()); },
    animationDuration: 300
  });

  const [bufferedBook, setBufferedBook] = useState<BookData | null>(null);
  useEffect(() => {
    if (book) {
      setBufferedBook(structuredClone(book));
    } else if (!shouldRender) {
      setBufferedBook(null);
    }
  }, [book, shouldRender]);

  if (!shouldRender || !bufferedBook) return null;

  const header = (
    <>
      <Button onClick={handleClose} size="icon" variant="ghost" className="size-8">
        <CircleChevronLeft />
      </Button>
      <h2 className="text-lg font-semibold leading-none tracking-tight text-left">
        {bufferedBook.title}
      </h2>
      {bufferedBook.subtitle ? (
        <p className="text-sm text-muted-foreground text-left mt-1">
          {bufferedBook.subtitle}
        </p>
      ) : null}
      <Button onClick={onDeleteBook} size="icon" variant="ghost" className="size-8">
        <Trash />
      </Button>
    </>
  );

  const drawerContent = (
    <DrawerFrame isVisible={isVisible} header={header} onClose={handleClose}>
      <DrawerContent book={bufferedBook} />
    </DrawerFrame>
  );

  return createPortal(drawerContent, document.body);
}