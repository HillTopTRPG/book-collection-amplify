import type { BookDetail } from '@/types/book.ts';
import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks.ts';
import { selectScanResultList } from '@/store/scannerSlice.ts';
import { getIsbn13, getIsbnCode } from '@/utils/isbn.ts';
import BookDetailEdits from './BookDetailEdits.tsx';

export default function ScannedBookPage() {
  const { maybeIsbn: raw } = useParams<{ maybeIsbn: string }>();
  const maybeIsbn = getIsbnCode(raw);
  const scanResultList = useAppSelector(selectScanResultList);

  const { type, bookDetail } = useMemo((): {
    type: 'invalid-isbn' | 'no-scanned-isbn' | 'loading' | 'done';
    bookDetail: BookDetail | null;
  } => {
    if (!maybeIsbn) {
      return { type: 'invalid-isbn', bookDetail: null };
    }
    const isbn = getIsbn13(maybeIsbn);
    const selected = scanResultList.find(item => item.isbn === isbn);
    if (!selected) {
      return { type: 'no-scanned-isbn', bookDetail: null };
    }
    if (selected.status !== 'done' || !selected.result?.bookDetail) {
      return { type: 'loading', bookDetail: null };
    }
    return { type: 'done', bookDetail: selected.result.bookDetail };
  }, [maybeIsbn, scanResultList]);

  const content = useMemo(() => {
    console.log('####################', type, bookDetail?.book.isbn);
    switch (type) {
      case 'invalid-isbn':
        return <div>ISBNコードを指定してください。</div>;
      case 'no-scanned-isbn':
        return <div>ISBNコードを指定してください。</div>;
      case 'loading':
        return <div>読み込み中...</div>;
      case 'done':
        if (!bookDetail) return null;
        return <BookDetailEdits bookDetail={bookDetail} />;
    }
  }, [bookDetail, type]);

  return <div className="flex flex-col w-full flex-1 gap-4">{content}</div>;
}
