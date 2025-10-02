import type { BookDetail } from '@/types/book.ts';
import { useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks.ts';
import { selectScanResultList } from '@/store/scannerSlice.ts';
import { getIsbn13, getIsbnCode } from '@/utils/isbn.ts';
import BookDetailEdits from './BookDetailEdits.tsx';

export default function ScannedBookPage() {
  const { maybeIsbn: raw } = useParams<{ maybeIsbn: string }>();
  const maybeIsbn = getIsbnCode(raw);
  const scanResultList = useAppSelector(selectScanResultList);

  // パフォーマンス計測用
  const mountTimeRef = useRef(performance.now());
  const renderCountRef = useRef(0);

  useEffect(() => {
    renderCountRef.current += 1;
    const renderTime = performance.now() - mountTimeRef.current;

    console.log(
      `[ScannedBookPage] Render #${renderCountRef.current} completed in ${renderTime.toFixed(2)}ms (ISBN: ${maybeIsbn || 'N/A'})`
    );

    // 初回レンダリングの場合、詳細ログを出力
    if (renderCountRef.current < 5) {
      console.log(`[ScannedBookPage] Initial mount completed in ${renderTime.toFixed(2)}ms`);
    }
  });

  // アンマウント時の計測
  useEffect(() => {
    const mountTime = mountTimeRef.current;

    return () => {
      const totalTime = performance.now() - mountTime;
      console.log(
        `[ScannedBookPage] Unmounted after ${totalTime.toFixed(2)}ms, ${renderCountRef.current} renders (avg: ${(totalTime / renderCountRef.current).toFixed(2)}ms/render)`
      );
    };
  }, []);

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
