import type { BookData } from '@/types/book.ts';
import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useLogs } from '@/hooks/useLogs.ts';
import { useAppDispatch, useAppSelector } from '@/store/hooks.ts';
import { selectScanResultList } from '@/store/scannerSlice.ts';
import { clearTempData } from '@/store/subscriptionDataSlice.ts';
import { getIsbn13, getIsbnCode } from '@/utils/isbn.ts';
import ScannedBookView from './ScannedBookView.tsx';

export default function ScannedBookPage() {
  const dispatch = useAppDispatch();
  const { maybeIsbn: raw } = useParams<{ maybeIsbn: string }>();
  const maybeIsbn = getIsbnCode(raw);
  const scanResultList = useAppSelector(selectScanResultList);

  // パフォーマンスログ
  useLogs({
    componentName: 'ScannedBookPage',
    additionalInfo: `ISBN: ${maybeIsbn || 'N/A'}`,
    includeDetailedMetrics: true,
    onUnmount: () => {
      dispatch(clearTempData());
      console.log('[ScannedBookPage] Global cache and temp data cleared');
    },
  });

  const { type, book } = useMemo((): {
    type: 'invalid-isbn' | 'no-scanned-isbn' | 'loading' | 'done';
    book: BookData | null;
  } => {
    if (!maybeIsbn) {
      return { type: 'invalid-isbn', book: null };
    }
    const isbn = getIsbn13(maybeIsbn);
    const selected = scanResultList.find(item => item.isbn === isbn);
    if (!selected) {
      return { type: 'no-scanned-isbn', book: null };
    }
    if (selected.status !== 'done' || !selected.book) {
      return { type: 'loading', book: null };
    }
    return { type: 'done', book: selected.book };
  }, [maybeIsbn, scanResultList]);

  const content = useMemo(() => {
    switch (type) {
      case 'invalid-isbn':
        return <div>ISBNコードを指定してください。</div>;
      case 'no-scanned-isbn':
        return <div>ISBNコードを指定してください。</div>;
      case 'loading':
        return <div>読み込み中...</div>;
      case 'done':
        if (!book) return null;
        return <ScannedBookView book={book} />;
    }
  }, [book, type]);

  return <div className="flex flex-col w-full flex-1 gap-4">{content}</div>;
}
