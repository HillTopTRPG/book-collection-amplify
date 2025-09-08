import { Spinner } from '@/components/ui/shadcn-io/spinner';
import {BookData} from '@/types/book.ts';

type Props = {
  book: BookData | null;
};

export default function BookCard({ book }: Props) {
  return (
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
  );
}
