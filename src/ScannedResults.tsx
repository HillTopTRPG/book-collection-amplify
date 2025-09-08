import {useAppSelector} from './store/hooks.ts';
import {clearScannedItems, selectScannedItems} from './store/scannerSlice.ts';
import {useDispatch} from 'react-redux';
import {AppDispatch} from './store';
import {generateClient} from 'aws-amplify/data';
import type {Schema} from '../amplify/data/resource.ts';
import {Fragment, useEffect, useState} from 'react';
import {useToast} from '@/hooks/use-toast.ts';
import BookCard from '@/BookCard.tsx';
import {ScrollArea} from '@radix-ui/react-scroll-area';
import {Button} from '@aws-amplify/ui-react';
import {Separator} from '@/components/ui/separator.tsx';

const userPoolClient = generateClient<Schema>({
  authMode: 'userPool'
});

const apiKeyClient = generateClient<Schema>({
  authMode: 'apiKey'
});

export default function ScannedResults() {
  const dispatch = useDispatch<AppDispatch>();
  const scannedDataList = useAppSelector(selectScannedItems);
  const { toast } = useToast();

  const [collections, setCollections] = useState<Array<Schema['Collection']['type']>>([]);
  const [books, setBooks] = useState<Array<Schema['Book']['type']>>([]);

  useEffect(() => {
    const collectionSubscription = userPoolClient.models.Collection.observeQuery().subscribe({
      next: (data) => setCollections([...data.items]),
    });
    const bookSubscription = apiKeyClient.models.Book.observeQuery().subscribe({
      next: (data) => setBooks([...data.items]),
    });
    return () => {
      collectionSubscription.unsubscribe();
      bookSubscription.unsubscribe();
    };
  }, []);

  const clearDisable = !scannedDataList.length;
  const registerDisable = clearDisable || scannedDataList.some(({ data }) => !data);

  const onClear = () => {
    dispatch(clearScannedItems());
  };

  const onRegister = () => {
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
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-3 w-full max-h-max bg-white rounded-lg shadow-lg p-2">
        <ScrollArea className="w-full max-h-max">
          <div className="p-1">
            {scannedDataList.map(({ data: book }, index) => (
              <Fragment>
                {index > 0 && <Separator className="my-2" />}
                <BookCard key={index} book={book} />
              </Fragment>
            ))}
          </div>
        </ScrollArea>
        <div className="flex gap-3 justify-end border-t pt-2">
          <Button size="small" variation="destructive" onClick={onClear} disabled={clearDisable}>
          クリア
          </Button>
        </div>
      </div>
      <Button variation="primary" className="rounded-full" onClick={onRegister} disabled={registerDisable}>
        登録
      </Button>
    </div>
  );
}
