import {useAppSelector} from './store/hooks.ts'
import {clearScannedItems, selectScannedItems} from './store/scannerSlice.ts'
import {useDispatch} from 'react-redux'
import {AppDispatch} from './store'
import { Spinner } from '@/components/ui/shadcn-io/spinner';
import {generateClient} from 'aws-amplify/data'
import type {Schema} from '../amplify/data/resource.ts'
import {useEffect, useState} from 'react'
import {useToast} from '@/hooks/use-toast.ts'

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

  const [collections, setCollections] = useState<Array<Schema["Collection"]["type"]>>([]);
  const [books, setBooks] = useState<Array<Schema["Book"]["type"]>>([]);

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
    }
  }, []);

  const registerDisable = scannedDataList.some(item => !item.data);

  const registerCollection = () => {
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
            title: "登録",
            description: `${title}`,
            duration: 2000,
          });
        } else {
          toast({
            title: "登録スキップ",
            description: `${title}`,
            duration: 2000,
          });
        }
      });
  }

  return (
    <div style={{
      marginTop: '20px',
      padding: '15px',
      backgroundColor: '#f8f9fa',
      border: '1px solid #dee2e6',
      borderRadius: '8px'
    }}>
      <h4>📚 スキャン履歴 (最新{scannedDataList.length}件)</h4>
      <div style={{ margin: '10px 0' }}>
        {scannedDataList.map(({ data: book }, index) => (
          <div key={index} style={{
            padding: '10px',
            margin: '8px 0',
            backgroundColor: index === 0 ? '#e8f5e8' : '#ffffff',
            border: '1px solid #dee2e6',
            borderRadius: '6px'
          }}>
            <div className="flex gap-3 items-center justify-center">
              { !book && <Spinner variant="bars" /> }
              {
                book && (
                  <>
                    {book?.cover && (
                      <img
                        src={book.cover}
                        alt="表紙"
                        style={{
                          width: '50px',
                          height: '75px',
                          objectFit: 'cover',
                          borderRadius: '3px',
                          border: '1px solid #ddd'
                        }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <h5 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#333' }}>
                        {book.title}
                      </h5>
                      <h5 style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#333' }}>
                        {book.subtitle}
                      </h5>
                      <p style={{ margin: '2px 0', fontSize: '12px', color: '#666' }}>
                        {book.author} / {book.publisher}
                      </p>
                      <p style={{ fontFamily: 'monospace', fontSize: '10px', color: '#999', margin: '4px 0 0 0' }}>
                        {book.isbn} / {book.pubdate}
                      </p>
                    </div>
                  </>
                )
              }
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={() => {
          dispatch(clearScannedItems());
        }}
        className="text-white border-none rounded text-xs px-2 py-3"
        style={{ backgroundColor: '#6c757d' }}
      >
        履歴クリア
      </button>
      <button
        onClick={registerCollection}
        disabled={registerDisable}
        className="text-white border-none rounded text-xs px-2 py-3 bg-amber-200"
      >
        登録
      </button>
    </div>
  );
}
