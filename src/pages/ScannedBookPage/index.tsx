import type { BookDetail } from '@/types/book.ts';
import { useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks.ts';
import { clearNdlSearchGlobalCache, selectAllNdlSearchResults } from '@/store/ndlSearchSlice.ts';
import { selectScanResultList } from '@/store/scannerSlice.ts';
import { clearTempData, selectTempCollections, selectTempFilterSets } from '@/store/subscriptionDataSlice.ts';
import { getIsbn13, getIsbnCode } from '@/utils/isbn.ts';
import { getNgramCacheSize } from '@/utils/stringSimilarity.ts';
import BookDetailEdits from './BookDetailEdits.tsx';

export default function ScannedBookPage() {
  const dispatch = useAppDispatch();
  const { maybeIsbn: raw } = useParams<{ maybeIsbn: string }>();
  const maybeIsbn = getIsbnCode(raw);
  const scanResultList = useAppSelector(selectScanResultList);
  const ndlSearchResults = useAppSelector(selectAllNdlSearchResults);
  const tempCollections = useAppSelector(selectTempCollections);
  const tempFilterSets = useAppSelector(selectTempFilterSets);

  // パフォーマンス計測用
  const mountTimeRef = useRef(performance.now());
  const renderCountRef = useRef(0);

  useEffect(() => {
    renderCountRef.current += 1;
    const renderTime = performance.now() - mountTimeRef.current;

    // メモリ使用量を計測（Chrome/Edge のみ）
    const memory = (performance as { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
    const memoryInfo = memory
      ? `Memory: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB / ${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`
      : 'Memory: N/A';

    // キャッシュサイズを計測
    const ngramCacheSize = getNgramCacheSize();
    const ndlSearchResultsCount = Object.keys(ndlSearchResults).length;

    console.log(
      `[ScannedBookPage] Render #${renderCountRef.current} completed in ${renderTime.toFixed(2)}ms (ISBN: ${maybeIsbn || 'N/A'}) | ${memoryInfo} | N-gram cache: ${ngramCacheSize} | NDL results keys: ${ndlSearchResultsCount} | Temp collections: ${tempCollections.length} | Temp filterSets: ${tempFilterSets.length}`
    );

    // 初回レンダリングの場合、詳細ログを出力
    if (renderCountRef.current < 5) {
      console.log(`[ScannedBookPage] Initial mount completed in ${renderTime.toFixed(2)}ms | ${memoryInfo}`);
    }
  });

  // アンマウント時の計測とクリーンアップ
  useEffect(() => {
    const mountTime = mountTimeRef.current;

    return () => {
      const totalTime = performance.now() - mountTime;
      console.log(
        `[ScannedBookPage] Unmounted after ${totalTime.toFixed(2)}ms, ${renderCountRef.current} renders (avg: ${(totalTime / renderCountRef.current).toFixed(2)}ms/render)`
      );

      // グローバルキャッシュと一時データをクリアしてメモリリークを防止
      clearNdlSearchGlobalCache();
      dispatch(clearTempData());
      console.log('[ScannedBookPage] Global cache and temp data cleared');
    };
  }, [dispatch]);

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
