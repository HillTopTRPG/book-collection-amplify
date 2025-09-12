import { Fragment, useCallback } from 'react';

import { Button } from '@aws-amplify/ui-react';
import { ScrollArea } from '@radix-ui/react-scroll-area';
import { generateClient } from 'aws-amplify/data';
import { useDispatch } from 'react-redux';

import BookCard from '@/components/BookCard';
import { Separator } from '@/components/ui/separator.tsx';
import { useToast } from '@/hooks/use-toast.ts';
import type { AppDispatch } from '@/store';
import { useAppSelector } from '@/store/hooks.ts';
import { clearScannedItems, selectScannedItems } from '@/store/scannerSlice.ts';
import { selectBooks, selectCollections } from '@/store/subscriptionDataSlice.ts';

import type { Schema } from '$/amplify/data/resource.ts';

const userPoolClient = generateClient<Schema>({
  authMode: 'userPool'
});

const apiKeyClient = generateClient<Schema>({
  authMode: 'apiKey'
});

export default function ScannedResults() {
  const dispatch = useDispatch<AppDispatch>();
  const scannedDataList = useAppSelector(selectScannedItems);
  const collections = useAppSelector(selectCollections);
  const books = useAppSelector(selectBooks);
  const { toast } = useToast();

  const clearDisable = !scannedDataList.length;
  const registerDisable = clearDisable || scannedDataList.some(({ data }) => !data);

  const onClear = useCallback(() => {
    dispatch(clearScannedItems());
  }, [dispatch]);

  const onRegister = useCallback(() => {
    const scannedBooks = scannedDataList.flatMap(({ data }) => data ? [data] : []);
    scannedBooks
      .filter(({ isbn })  => !books.some(book => book.isbn === isbn))
      .forEach((bookData) => {
        apiKeyClient.models.Book.create(bookData);
      });
    scannedBooks
      .forEach(({ isbn, title }) => {
        if (!collections.some(book => book.isbn === isbn)) {
          userPoolClient.models.Collection.create({ isbn, meta: '', memo: '' });
          toast({
            title: '登録',
            description: `${title}`,
            duration: 2000,
          });
        } else {
          toast({
            title: '登録スキップ',
            description: `${title}`,
            duration: 2000,
          });
        }
      });
    onClear();
  }, [books, collections, onClear, scannedDataList, toast]);

  return (
    <div className="flex-1 flex flex-col gap-3 w-full bg-background rounded-lg shadow-lg p-2">
      {scannedDataList.length > 0 && (
        <Fragment>
          <div className="flex gap-3 justify-end">
            <Button variation="primary" className="rounded-full flex-1" onClick={onRegister} disabled={registerDisable}>
            登録
            </Button>
            <Button size="small" variation="destructive" className="rounded-full" onClick={onClear} disabled={clearDisable}>
            クリア
            </Button>
          </div>
          <Separator />
        </Fragment>
      )}
      <ScrollArea className="w-full max-h-max px-1">
        {scannedDataList.map(({ data: book }, index) => (
          <Fragment key={index}>
            {index > 0 && <Separator className="my-2" />}
            <BookCard
              book={book}
              isAlreadyHave={collections.some(({ isbn }) => book?.isbn === isbn)}
            />
          </Fragment>
        ))}
        {!scannedDataList.length && <p className="w-full text-center text-xs">まだ１冊も読み込まれていません。</p>}
      </ScrollArea>
    </div>
  );
}
